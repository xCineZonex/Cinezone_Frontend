'use client';

import { motion } from 'framer-motion';
import { Popcorn, Clapperboard, LockOpen, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import CashShiftModal from '@/components/taquilla/CashShiftModal';
import CloseShiftModal from '@/components/taquilla/CloseShiftModal';
import VoidSaleModal from '@/components/taquilla/VoidSaleModal';
import StaffSidebar from '@/components/staff/StaffSidebar';
import { toast } from 'sonner';

export default function DulceriaStaffPage() {
  const router = useRouter();
  const [shiftStatus, setShiftStatus] = useState<'ABIERTA' | 'CERRADA' | 'LOADING'>('LOADING');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);

  // Modal DNI
  const [showDniModal, setShowDniModal] = useState(false);
  const [dniInput, setDniInput] = useState('');
  const [dniSearching, setDniSearching] = useState(false);
  const [dniCliente, setDniCliente] = useState<{id: string, nombre: string} | null>(null);

  const fetchShiftStatus = async () => {
    try {
      const res = await api.get('/taquilla/caja/estado');
      setShiftStatus(res.data.estado);
    } catch (err: any) {
      console.error('Error fetching shift status', err);
      if (err.response?.status !== 403 && err.response?.status !== 401) {
        toast.error('Error al obtener estado de caja');
      }
      setShiftStatus('CERRADA');
    }
  };

  useEffect(() => {
    fetchShiftStatus();
  }, []);

  const startSale = () => {
    router.push('/dulceria');
  };

  const handleDniSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dniInput.length < 8) return;
    setDniSearching(true);
    try {
      const res = await api.post('/taquilla/buscar-cliente', { dni: dniInput });
      if (res.data.tipo === 'REGISTRADO') {
        setDniCliente({ id: res.data.id, nombre: res.data.nombreCompleto });
        toast.success(`Cliente encontrado: ${res.data.nombreCompleto}`);
      } else {
        setDniCliente(null);
        toast.info('Cliente no registrado. Puedes continuar como venta anónima.');
      }
    } catch (err: any) {
      if (err.response?.status !== 403) toast.error('Error al buscar cliente');
    } finally {
      setDniSearching(false);
    }
  };

  const proceedToSale = () => {
    if (dniCliente) {
      localStorage.setItem('taquillaClienteId', dniCliente.id);
      localStorage.setItem('taquillaClienteNombre', dniCliente.nombre);
    } else {
      localStorage.removeItem('taquillaClienteId');
      localStorage.removeItem('taquillaClienteNombre');
    }
    setShowDniModal(false);
    router.push('/dulceria');
  };

  if (shiftStatus === 'LOADING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 flex">
      {showOpenModal && (
        <CashShiftModal 
          moduleName="DULCERIA"
          onOpenSuccess={() => { setShiftStatus('ABIERTA'); setShowOpenModal(false); }} 
        />
      )}
        {showCloseModal && (
          <CloseShiftModal 
            onClose={() => setShowCloseModal(false)}
            onSuccess={() => setShiftStatus('CERRADA')}
          />
          )}
        
        <VoidSaleModal isOpen={showVoidModal} onClose={() => setShowVoidModal(false)} />

        {/* Modal DNI */}
        {showDniModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-2">Validar Cliente</h2>
              <p className="text-sm text-muted-foreground mb-6">Ingresa el DNI del cliente para asociar la venta (opcional).</p>

              {!dniCliente ? (
                <form onSubmit={handleDniSearch} className="space-y-4">
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="DNI del cliente..."
                    value={dniInput}
                    onChange={(e) => setDniInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={dniSearching || dniInput.length < 8}
                    className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50"
                  >
                    {dniSearching ? 'Buscando...' : 'Buscar Cliente'}
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl mb-4">
                  <p className="text-xs text-primary font-bold uppercase">Cliente Encontrado</p>
                  <p className="font-black text-lg">{dniCliente.nombre}</p>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setShowDniModal(false); setDniInput(''); setDniCliente(null); }}
                  className="flex-1 py-3 border border-border rounded-xl font-semibold hover:bg-secondary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={proceedToSale}
                  className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  {dniCliente ? 'Iniciar Venta' : 'Sin DNI'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Sidebar / Menu rápido */}
      <StaffSidebar 
        icon={<Popcorn className="w-6 h-6" />} 
        tooltip="Venta de Dulcería" 
        shiftStatus={shiftStatus} 
        onRequestCloseShift={() => setShowCloseModal(true)} 
      />


      {/* Main Content */}
      <div className="flex-1 p-8 md:p-12 overflow-y-auto flex items-center justify-center">
        <div className="max-w-md mx-auto space-y-8 w-full text-center">
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Popcorn className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black text-foreground mb-2">Dulcería</h1>
            <p className="text-muted-foreground">Punto de Venta presencial Cinezone</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {shiftStatus === 'CERRADA' ? (
              <button 
                onClick={() => setShowOpenModal(true)}
                className="w-full py-6 bg-green-500 text-white font-black rounded-2xl text-xl flex items-center justify-center gap-3 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-95"
              >
                <LockOpen className="w-8 h-8" /> 
                Abrir Caja
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setShowDniModal(true)}
                  className="w-full py-6 bg-primary text-primary-foreground font-black rounded-2xl text-xl flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95"
                >
                  <Popcorn className="w-8 h-8" /> 
                  Iniciar Nueva Venta
                </button>
                
                <button 
                  onClick={() => router.push('/staff/validador')}
                  className="w-full py-6 bg-purple-600 text-white font-black rounded-2xl text-xl flex items-center justify-center gap-3 hover:bg-purple-700 transition-all shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-95"
                >
                  <QrCode className="w-8 h-8" /> 
                  Entregar Compras (QR)
                </button>
                
                <button 
                  onClick={() => setShowVoidModal(true)}
                  className="w-full py-4 bg-orange-500/10 text-orange-500 font-bold rounded-2xl text-lg flex items-center justify-center gap-3 hover:bg-orange-500 hover:text-white transition-all shadow-md active:scale-95 mt-4"
                >
                  <LockOpen className="w-6 h-6" />
                  Anular Venta (Supervisor)
                </button>
                
                <div className="h-px bg-border my-6"></div>

                <button 
                  onClick={() => setShowCloseModal(true)}
                  className="w-full py-4 border-2 border-destructive text-destructive font-bold rounded-2xl text-lg flex items-center justify-center gap-3 hover:bg-destructive hover:text-destructive-foreground transition-all active:scale-95"
                >
                  <LockOpen className="w-6 h-6" />
                  Cerrar Turno (Arqueo)
                </button>
              </>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}
