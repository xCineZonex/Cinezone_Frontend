'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, Download, Home, Ticket, Popcorn, Calendar, 
  MapPin, Monitor, QrCode as QrIcon, User, Clock, Info, ShieldCheck, Loader2, Star, Printer
} from 'lucide-react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { useCartStore } from '@/store/useCartStore';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import api from '@/lib/api';

const COLORS = {
  GOLD: '#c8860a',
  BLACK_DEEP: '#111111',
  WHITE: '#ffffff',
  GRAY_LIGHT: '#fafafa',
  GRAY_BORDER: '#e8e8e8',
  GRAY_TEXT: '#888888',
  GRAY_TEXT_MUTED: '#aaaaaa',
  GREEN_BG: '#f0fdf4',
  GREEN_TEXT: '#15803d',
  AMBER_BG: '#fff8f0',
  AMBER_BORDER: '#f0d090',
  RED_TEXT: '#c0392b'
};

export default function CheckoutBoletaPage() {
  const router = useRouter();
  const ticketRef = useRef<HTMLDivElement>(null);
  const { lastPurchaseResponse, clearCart } = useCartStore();

  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
        try {
            const res = await api.get('/users/me');
            setUserProfile(res.data);
        } catch (e: any) { 
            if (e.response?.status !== 403 && e.response?.status !== 401) {
                console.error("Error al obtener perfil", e); 
            }
        }
    };
    fetchUser();

    if (lastPurchaseResponse) {
      const qrData = JSON.stringify({
        id: lastPurchaseResponse.boletaId,
        code: lastPurchaseResponse.codigoUnico,
        movie: lastPurchaseResponse.pelicula,
        seats: lastPurchaseResponse.asientos,
        total: lastPurchaseResponse.montoTotal
      });

      QRCode.toDataURL(qrData, {
        width: 512,
        margin: 2,
        color: { dark: '#111111', light: '#ffffff' }
      })
      .then(url => setQrImageUrl(url))
      .catch(err => console.error('Error generating QR:', err));

      const rol = localStorage.getItem('rol');
      if (rol === 'TAQUILLA' || rol === 'DULCERIA') {
        setTimeout(() => {
          window.print();
        }, 1000);
      }
    }
  }, [lastPurchaseResponse]);

  const downloadPDF = async () => {
    if (!ticketRef.current || !lastPurchaseResponse) return;
    setIsExporting(true);
    const toastId = toast.loading('Generando boleta PDF...');

    try {
      const element = ticketRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: COLORS.WHITE,
        logging: false,
        onclone: (clonedDoc) => {
           const ticket = clonedDoc.getElementById('pdf-ticket');
           if (ticket) ticket.style.fontFamily = 'Arial, sans-serif';
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [canvas.width * 0.264583, canvas.height * 0.264583]
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Boleta_CineZone_${lastPurchaseResponse.boletaId.toString().substring(0,8)}.pdf`);
      toast.success('Boleta descargada exitosamente', { id: toastId });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('No se pudo generar el PDF.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  if (!lastPurchaseResponse) {
    return (
        <main className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
            <div className="text-center space-y-4">
                <p className="text-white opacity-60">No se encontró información de la compra.</p>
                <button onClick={() => router.push('/')} className="px-6 py-2 bg-[#c8860a] text-white rounded-xl font-bold">Volver al Inicio</button>
            </div>
        </main>
    );
  }

  const handleFinish = () => {
    clearCart();
    const rol = localStorage.getItem('rol');
    const module = localStorage.getItem('staff_module');
    
    if (rol === 'TAQUILLA' || module === 'TAQUILLA') router.push('/taquilla');
    else if (rol === 'DULCERIA' || module === 'DULCERIA') router.push('/staff/dulceria');
    else router.push('/perfil');
  };

  const fechaCompra = new Date(lastPurchaseResponse.fechaCompra);
  
  const listEntradas = lastPurchaseResponse.entradas || [];
  const listSnacks = lastPurchaseResponse.snacks || [];
  const totalEntradas = listEntradas.reduce((acc: number, t: any) => acc + (t.precio * t.cantidad), 0);
  const totalDulceria = listSnacks.reduce((acc: number, s: any) => acc + (s.precio * s.cantidad), 0);

  return (
    <main className="min-h-screen bg-[#1a1a1a] pb-24">
      <Navbar />

      <div className="pt-28 pb-12 container mx-auto px-4 flex flex-col items-center">
        <div 
          id="pdf-ticket"
          ref={ticketRef}
          style={{ 
            backgroundColor: COLORS.WHITE, 
            width: '100%', 
            maxWidth: '500px', 
            borderRadius: '8px', 
            overflow: 'hidden',
            color: COLORS.BLACK_DEEP,
            border: `1px solid ${COLORS.GRAY_BORDER}`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* HEADER */}
          <div style={{ backgroundColor: COLORS.BLACK_DEEP, padding: '24px', textAlign: 'center', borderBottom: `3px solid ${COLORS.GOLD}` }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <div style={{ width: '32px', height: '32px', backgroundColor: COLORS.GOLD, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Monitor size={20} color="#000" />
                 </div>
                 <span style={{ color: COLORS.WHITE, fontWeight: 900, fontSize: '20px', letterSpacing: '-0.5px' }}>CINEZONE</span>
               </div>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: COLORS.WHITE, marginBottom: '4px', textTransform: 'uppercase' }}>
              {lastPurchaseResponse.pelicula || 'VENTA DE DULCERÍA'}
            </h1>
            <p style={{ color: COLORS.GRAY_TEXT_MUTED, fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Nro. de Compra: <span style={{ color: COLORS.GOLD, fontWeight: 700 }}>#{lastPurchaseResponse.boletaId.toString().substring(0,8).toUpperCase()}</span>
            </p>
          </div>

          {/* QR SECTION */}
          <div style={{ backgroundColor: COLORS.GRAY_LIGHT, padding: '32px', display: 'flex', justifyContent: 'center', borderBottom: `1px solid ${COLORS.GRAY_BORDER}` }}>
            <div style={{ backgroundColor: COLORS.WHITE, padding: '12px', borderRadius: '12px', border: `1px solid ${COLORS.GRAY_BORDER}` }}>
              {qrImageUrl ? (
                <img src={qrImageUrl} alt="Ticket QR" style={{ width: '176px', height: '176px' }} />
              ) : (
                <div style={{ width: '176px', height: '176px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
                  <QrIcon size={40} color="#ccc" />
                </div>
              )}
            </div>
          </div>

          {/* CLIENT */}
          <div style={{ padding: '24px', textAlign: 'center', borderBottom: `1px solid ${COLORS.GRAY_BORDER}` }}>
            <p style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '1px', marginBottom: '4px' }}>Cliente</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#111' }}>
              {lastPurchaseResponse.nombreCliente ? lastPurchaseResponse.nombreCliente.toUpperCase() : 'CLIENTE CINEZONE'}
            </p>
          </div>

          {/* SESSION GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: COLORS.GRAY_LIGHT, borderBottom: `2px solid ${COLORS.GRAY_BORDER}` }}>
            <div style={{ padding: '16px', borderRight: `1px solid ${COLORS.GRAY_BORDER}` }}>
               <span style={{ display: 'block', fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>Sede</span>
               <span style={{ fontSize: '12px', fontWeight: 700 }}>{lastPurchaseResponse.sedeNombre || 'Cinezone'}</span>
            </div>
            <div style={{ padding: '16px' }}>
               <span style={{ display: 'block', fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>Fecha / Hora</span>
               <span style={{ fontSize: '12px', fontWeight: 700 }}>{fechaCompra.toLocaleDateString()} {fechaCompra.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {lastPurchaseResponse.sala && (
              <>
                <div style={{ padding: '16px', borderTop: `1px solid ${COLORS.GRAY_BORDER}`, borderRight: `1px solid ${COLORS.GRAY_BORDER}` }}>
                   <span style={{ display: 'block', fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>Sala</span>
                   <span style={{ display: 'inline-block', padding: '2px 8px', backgroundColor: COLORS.BLACK_DEEP, color: COLORS.GOLD, fontSize: '10px', fontWeight: 900, borderRadius: '4px', border: `1px solid ${COLORS.GOLD}` }}>
                     {lastPurchaseResponse.sala.toUpperCase()}
                   </span>
                </div>
                <div style={{ padding: '16px', borderTop: `1px solid ${COLORS.GRAY_BORDER}` }}>
                   <span style={{ display: 'block', fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>Butacas</span>
                   <span style={{ fontSize: '12px', fontWeight: 700 }}>{lastPurchaseResponse.asientos}</span>
                </div>
              </>
            )}
          </div>

          {/* ITEMS BREAKDOWN */}
          <div style={{ padding: '24px' }}>
             {/* ENTRADAS */}
             {listEntradas.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px', marginBottom: '8px' }}>
                      <Ticket size={16} color="#888" />
                      <span style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase' }}>Entradas</span>
                   </div>
                   {listEntradas.map((t: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                         <span style={{ flex: 1 }}>{t.nombre}</span>
                         <span style={{ width: '60px', textAlign: 'center', color: '#666' }}>Cant. {t.cantidad}</span>
                         <span style={{ width: '70px', textAlign: 'right', fontWeight: 600 }}>S/ {(t.precio * t.cantidad).toFixed(2)}</span>
                      </div>
                   ))}
                   <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', fontSize: '13px', fontWeight: 700, borderBottom: `1px solid ${COLORS.GRAY_BORDER}`, paddingBottom: '8px' }}>
                      SubTotal : S/ {totalEntradas.toFixed(2)}
                   </div>
                </div>
             )}

             {/* DULCERIA */}
             {listSnacks.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px', marginBottom: '8px' }}>
                      <Popcorn size={16} color="#888" />
                      <span style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase' }}>Dulcería</span>
                   </div>
                   {listSnacks.map((s: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                         <span style={{ flex: 1 }}>{s.nombre}</span>
                         <span style={{ width: '60px', textAlign: 'center', color: '#666' }}>Cant. {s.cantidad}</span>
                         <span style={{ width: '70px', textAlign: 'right', fontWeight: 600 }}>S/ {(s.precio * s.cantidad).toFixed(2)}</span>
                      </div>
                   ))}
                   <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', fontSize: '13px', fontWeight: 700, borderBottom: `1px solid ${COLORS.GRAY_BORDER}`, paddingBottom: '8px' }}>
                      SubTotal : S/ {totalDulceria.toFixed(2)}
                   </div>
                </div>
             )}

             {/* FIDELIDAD */}
             <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <div style={{ width: '32px', height: '32px', backgroundColor: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Star size={16} color="#fff" fill="#fff" />
                   </div>
                   <span style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>¡Puntos CineZone ganados!</span>
                </div>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#15803d' }}>+{lastPurchaseResponse.puntosGanados}</span>
             </div>
          </div>

          {/* TOTAL */}
          <div style={{ backgroundColor: COLORS.BLACK_DEEP, padding: '24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', borderBottom: '2px solid #000' }}>
             <span style={{ fontSize: '18px', fontWeight: 900, color: COLORS.WHITE }}>Total :</span>
             <span style={{ fontSize: '28px', fontWeight: 900, color: COLORS.GOLD }}>S/ {lastPurchaseResponse.montoTotal.toFixed(2)}</span>
          </div>

          {/* RECUERDA SECTION */}
          <div style={{ padding: '24px', backgroundColor: '#f9f9f9', borderTop: `1px solid ${COLORS.GRAY_BORDER}` }}>
             <h3 style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', color: '#111', marginBottom: '10px' }}>Recuerda</h3>
             <div style={{ fontSize: '12px', color: '#444', lineHeight: '1.4' }}>
                <p style={{ marginBottom: '8px' }}>¡Sin colas! Dirígete directamente a la sala o a la zona de despacho online en la Dulcería para recoger tu combo. No necesitas pasar por boletería.</p>
                <p style={{ marginBottom: '8px' }}>Muestra tu Orden de Compra directamente desde tu celular, no es necesario imprimir.</p>
                <p>El horario de la función indica el inicio de proyección de publicidad y avances. Luego de éstos, iniciará la película.</p>
             </div>
          </div>

          {/* CONDITIONS */}
          <div style={{ padding: '24px', borderTop: `1px solid ${COLORS.GRAY_BORDER}` }}>
             <h3 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#111', marginBottom: '12px' }}>Condiciones de Compra</h3>
             <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '11px', color: '#555', lineHeight: '1.6' }}>
                <li style={{ marginBottom: '4px' }}>La compra y el canje de entradas y/o combos solo son válidos para el mismo día de la función.</li>
                <li style={{ marginBottom: '4px' }}>Si utilizaste códigos promocionales debes presentar los cupones físicos en el ingreso a sala.</li>
                <li style={{ marginBottom: '4px', color: COLORS.RED_TEXT, fontWeight: 700 }}>Esta compra no permite cambio de función, anulación y/o devolución de dinero.</li>
                <li>Respetar los protocolos vigentes en nuestras instalaciones. El establecimiento se reserva el derecho de retirar a la persona de sala en caso contrario.</li>
             </ul>
          </div>

          {/* ESTIMADO CLIENTE */}
          <div style={{ padding: '18px 24px', backgroundColor: COLORS.GRAY_LIGHT, borderTop: `1px solid ${COLORS.GRAY_BORDER}` }}>
             <h3 style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#111', marginBottom: '8px' }}>Estimado Cliente</h3>
             <p style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>Para un mejor servicio realiza los siguientes pasos:</p>
             <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '10px', color: '#666', lineHeight: '1.5' }}>
                <li style={{ marginBottom: '2px' }}>Presente este documento con el código QR en el ingreso a salas desde su smartphone.</li>
                <li style={{ marginBottom: '2px' }}>Si compraste en Dulcería, diríjase a la zona de despacho para recoger tu combo.</li>
                <li style={{ marginBottom: '2px' }}>Si solo compraste entradas, dirígete directamente al ingreso de tu sala.</li>
                <li>Cualquier duda respecto al pago, realícela con tu banco emisor.</li>
             </ul>
          </div>

          {/* SEDE INFO FINAL */}
          <div style={{ backgroundColor: COLORS.BLACK_DEEP, padding: '16px', textAlign: 'center', borderTop: `3px solid ${COLORS.GOLD}` }}>
             <p style={{ fontSize: '11px', color: COLORS.WHITE, fontWeight: 700, marginBottom: '2px' }}>
                {lastPurchaseResponse.sedeNombre} · {lastPurchaseResponse.sedeDireccion} · {lastPurchaseResponse.sedeCiudad} · PERÚ
             </p>
             <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
               CINEZONE S.A · Todos los derechos reservados
             </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="w-full max-w-[500px] grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <button onClick={downloadPDF} disabled={isExporting} className="flex items-center justify-center gap-2 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all text-sm border border-white/10 disabled:opacity-50">
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
                {isExporting ? 'GEN...' : 'PDF'}
            </button>
            <button onClick={() => window.print()} className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20 text-sm">
                <Printer size={16} /> IMPRIMIR
            </button>
            <button onClick={handleFinish} className="flex items-center justify-center gap-2 py-4 bg-[#c8860a] hover:bg-[#b07508] text-white font-black rounded-2xl transition-all shadow-lg shadow-[#c8860a]/20 text-sm">
                <Home size={16} /> FINALIZAR
            </button>
        </div>
      </div>
      <Footer />
    </main>
  );
}
