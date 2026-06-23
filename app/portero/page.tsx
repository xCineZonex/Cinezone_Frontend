"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Ticket, CheckCircle2, Film, MonitorPlay, Calendar, Info, ShieldCheck, QrCode, ChevronLeft, CreditCard, LogOut, History } from "lucide-react";
import { toast } from "sonner";
import api from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";

interface TicketData {
  id: number;
  estado: "PENDIENTE" | "USADA" | string;
  asientoNombre?: string;
  tipo?: string;
  precio?: number;
  [key: string]: any;
}

interface BookingData {
  id: number;
  codigoUnico: string;
  estado: string;
  observaciones?: string;
  pelicula?: string;
  sala?: string;
  fecha?: string;
  funcion?: {
    pelicula?: { titulo: string };
    sala?: { nombre: string };
    horarioInicio: string;
  };
  tickets: TicketData[];
}

export default function PorteroPage() {
  const [codigoUnico, setCodigoUnico] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [booking, setBooking] = useState<BookingData | null>(null);
  
  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const router = useRouter();

  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [booking, isScanning]);

  const startScanner = () => {
    setIsScanning(true);
    const tryInitScanner = async (attempts = 0) => {
      try {
        if (!document.getElementById("qr-reader")) {
          if (attempts < 5) {
            setTimeout(() => tryInitScanner(attempts + 1), 200);
            return;
          }
          throw new Error("HTML Element with id=qr-reader not found");
        }
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("qr-reader");
        }
        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setCodigoUnico(decodedText);
            handleSearchScanner(decodedText);
            stopScanner();
          },
          () => {} // ignore scan errors
        );
      } catch (err) {
        console.error(err);
        toast.error("No se pudo iniciar la cámara. Verifica los permisos.");
        setIsScanning(false);
      }
    };
    setTimeout(tryInitScanner, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error(err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleSearchScanner = async (code: string) => {
    if (!code.trim()) return;
    setIsLoading(true);
    setBooking(null);
    setSelectedTickets([]);
    setObservaciones("");
    setErrorMessage("");

    try {
      let cleanCode = code.trim();
      // Si el código viene como JSON desde el escáner, extraer el ID o code aquí para evitar 404 por Firewall
      if (cleanCode.startsWith("{")) {
        try {
          const parsed = JSON.parse(cleanCode);
          cleanCode = parsed.code || parsed.id || cleanCode;
        } catch (e) {
          // Ignorar y seguir con el raw
        }
      }
      
      const res = await api.get(`/portero/scan/${cleanCode}`);
      if (res.data) {
        setBooking(res.data);
        setObservaciones(res.data.observaciones || "");
        toast.success("Reserva encontrada");
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.response?.data?.message || "No se encontró la reserva o el código es inválido.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!codigoUnico.trim()) return;
    await handleSearchScanner(codigoUnico);
  };

  const handleClear = () => {
    setBooking(null);
    setCodigoUnico("");
    setSelectedTickets([]);
    setObservaciones("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const toggleTicket = (id: number) => {
    setSelectedTickets(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const selectAllPendientes = () => {
    if (!booking) return;
    const pendientes = booking.tickets.filter(t => t.estado === "PENDIENTE").map(t => t.id);
    if (selectedTickets.length === pendientes.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(pendientes);
    }
  };

  const handleSubmit = async () => {
    if (!booking) return;
    if (selectedTickets.length === 0) {
      toast.error("Debes seleccionar al menos un ticket para autorizar el ingreso.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/portero/scan/${booking.codigoUnico}/ingreso`, {
        ticketIdsToMarkAsUsed: selectedTickets,
        observaciones: observaciones.trim()
      });
      
      toast.success("Ingreso autorizado correctamente", {
        icon: <ShieldCheck className="w-5 h-5 text-green-500" />
      });
      
      handleClear();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Ocurrió un error al autorizar el ingreso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePagarDiferencia = () => {
    if (booking) {
      toast.info("Por favor, indique al cliente que debe dirigirse a Taquilla para pagar la diferencia.");
    }
  };

  const getMovieTitle = () => booking?.funcion?.pelicula?.titulo || booking?.movieTitle || booking?.pelicula || "Película Desconocida";
  const getRoomName = () => booking?.funcion?.sala?.nombre || booking?.auditoriumName || booking?.sala || "Sala Desconocida";
  const getDateStr = () => {
    const rawDate = booking?.funcion?.horarioInicio || booking?.showtimeDate || booking?.fechaHora;
    if (!rawDate) return "Fecha no disponible";
    try {
      if (rawDate.includes("/")) return rawDate; // ya formateado desde el backend
      return new Date(rawDate).toLocaleString('es-ES', { 
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
    } catch {
      return rawDate;
    }
  };
  const getSeatName = (t: TicketData) => t.asientoName || t.asientoNombre || (t.asiento ? `${t.asiento.fila || ''}${t.asiento.numero || ''}` : `ID: ${t.id}`);

  // Check if any ticket is CONADIS or PREFERENCIAL
  const hasConadisTickets = booking?.tickets.some(t => {
      const tipo = t.tipoEntrada || t.tipo;
      return tipo === "CONADIS" || tipo === "PREFERENCIAL";
  });

  const handleLogout = async () => {
    try {
      await api.post('/users/me/module?module=NONE');
    } catch (e) {}
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    useCartStore.getState().clearCart();
    router.push('/');
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      <AnimatePresence mode="wait">
        {!booking ? (
          <motion.div 
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center p-6 w-full relative"
          >
            <div className="absolute top-6 right-6 flex items-center gap-3">
              <button 
                onClick={() => router.push('/staff/ventas')}
                className="p-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-2xl transition-colors"
                title="Historial de Ingresos"
              >
                <History className="w-6 h-6" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>

            <div className="w-32 h-32 mb-8 bg-zinc-900 rounded-3xl flex items-center justify-center shadow-2xl border border-zinc-800 relative overflow-hidden">
              <div className="absolute inset-0 bg-purple-500/10 animate-pulse"></div>
              <QrCode className="w-16 h-16 text-purple-500 relative z-10" />
            </div>
            
            <h2 className="text-3xl font-bold mb-2 text-center">Escanear Entrada</h2>
            <p className="text-zinc-400 text-center mb-8 text-lg">
              Escanea el código QR o ingresa el código único.
            </p>

            {isScanning ? (
              <div className="w-full max-w-sm mb-6 rounded-2xl overflow-hidden bg-black border-2 border-purple-500 shadow-xl shadow-purple-900/20">
                <div id="qr-reader" className="w-full" />
                <button
                  onClick={stopScanner}
                  className="w-full py-4 text-center text-white bg-red-600 font-bold hover:bg-red-700 transition-colors"
                >
                  Cancelar Escáner
                </button>
              </div>
            ) : (
              <button
                onClick={startScanner}
                className="w-full max-w-sm flex items-center justify-center gap-2 mb-6 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-900 font-bold rounded-2xl text-xl px-5 py-5 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
              >
                <QrCode className="w-6 h-6" />
                Abrir Cámara
              </button>
            )}

            <div className="w-full max-w-sm flex items-center gap-4 mb-6">
              <div className="h-px bg-zinc-800 flex-1"></div>
              <span className="text-zinc-500 font-bold text-sm">O INGRESAR MANUAL</span>
              <div className="h-px bg-zinc-800 flex-1"></div>
            </div>

            <form onSubmit={handleSearch} className="w-full max-w-sm flex flex-col gap-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Search className="w-6 h-6 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={codigoUnico}
                  onChange={(e) => setCodigoUnico(e.target.value)}
                  placeholder="Ej. VIP-12345"
                  className="w-full bg-zinc-900/80 border-2 border-zinc-800 text-white text-xl rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 block pl-14 p-5 transition-all uppercase placeholder:normal-case placeholder:text-zinc-600 outline-none shadow-inner"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !codigoUnico.trim()}
                className="w-full text-white bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-800 disabled:text-zinc-500 focus:ring-4 focus:ring-purple-900 font-bold rounded-2xl text-xl px-5 py-5 text-center transition-all active:scale-95 shadow-lg shadow-purple-900/20"
              >
                {isLoading ? "Buscando..." : "Buscar Reserva"}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col w-full pb-32"
          >
            <div className="p-4 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/30">
              <button onClick={handleClear} className="flex items-center gap-2 text-zinc-400 hover:text-white px-2 py-2 rounded-xl active:bg-zinc-800 transition-colors">
                <ChevronLeft className="w-6 h-6" />
                <span className="text-lg font-medium">Volver</span>
              </button>
              <div className="px-3 py-1 bg-zinc-800 rounded-full text-sm font-bold tracking-wide text-zinc-300">
                {booking.codigoUnico}
              </div>
            </div>

            <div className="p-5 space-y-6 flex-1 overflow-y-auto">
              
              <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Film className="w-32 h-32" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4 pr-12 leading-tight">
                  {getMovieTitle()}
                </h3>
                
                <div className="space-y-3 relative z-10">
                  <div className={`px-4 py-2 rounded-xl font-bold inline-block ${
                    (booking.bookingStatus || booking.estado) === "USADA" ? "bg-green-500/20 text-green-400" :
                    (booking.bookingStatus || booking.estado) === "CANCELADA" ? "bg-red-500/20 text-red-400" :
                    "bg-blue-500/20 text-blue-400"
                  }`}>
                    {(booking.bookingStatus || booking.estado) || 'PENDIENTE'}
                  </div>
                  <div className="flex items-center gap-3 text-zinc-300">
                    <MonitorPlay className="w-5 h-5 text-purple-400" />
                    <span className="text-lg font-medium">{getRoomName()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-300">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className="text-lg">{getDateStr()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-300 pt-1">
                    <Info className="w-5 h-5 text-zinc-400" />
                    <span className="px-3 py-1 bg-zinc-800 text-zinc-200 rounded-lg text-sm font-bold uppercase tracking-wider">
                      Estado: {(booking.bookingStatus || booking.estado)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de Pagar Diferencia para tickets CONADIS */}
              {hasConadisTickets && (
                <div className="bg-orange-500/10 border border-orange-500/50 p-4 rounded-2xl flex flex-col items-center gap-3">
                  <p className="text-orange-400 font-semibold text-center text-sm">
                    Esta reserva contiene entradas con tarifa especial (CONADIS). Si el cliente no presenta el carné, debe pagar la diferencia.
                  </p>
                  <button 
                    onClick={handlePagarDiferencia}
                    className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    <CreditCard className="w-5 h-5" />
                    Pagar Diferencia
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-zinc-400 font-medium ml-2">
                  Observaciones de Reserva
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Agrega una nota, ej. cliente llegó tarde..."
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-4 text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none min-h-[120px] transition-all"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between ml-2">
                  <h4 className="text-xl font-bold flex items-center gap-2">
                    <Ticket className="w-6 h-6 text-purple-500" />
                    Entradas ({booking.tickets.length})
                  </h4>
                  {booking.tickets.some(t => t.estado === "PENDIENTE") && (
                    <button 
                      onClick={selectAllPendientes}
                      className="text-purple-400 text-sm font-bold px-3 py-1.5 rounded-lg bg-purple-500/10 active:bg-purple-500/20"
                    >
                      Seleccionar Todo
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {booking.tickets.map((ticket) => {
                    const isUsada = ticket.estado === "USADA";
                    const isSelected = selectedTickets.includes(ticket.id);
                    
                    return (
                      <div 
                        key={ticket.id}
                        onClick={() => !isUsada && toggleTicket(ticket.id)}
                        className={`
                          p-4 rounded-2xl border-2 flex items-center justify-between transition-all select-none
                          ${isUsada 
                            ? "bg-green-950/20 border-green-900/50 opacity-80 cursor-not-allowed" 
                            : isSelected
                              ? "bg-purple-900/20 border-purple-500 cursor-pointer shadow-lg shadow-purple-900/10"
                              : "bg-zinc-900 border-zinc-800 cursor-pointer active:scale-[0.98]"
                          }
                        `}
                      >
                        <div className="flex flex-col">
                          <span className={`text-xl font-bold ${isUsada ? 'text-green-400' : 'text-white'}`}>
                            {getSeatName(ticket)}
                          </span>
                          <span className="text-sm text-zinc-400 uppercase tracking-wider font-semibold mt-1">
                            {ticket.tipo || 'General'} • {ticket.estado}
                          </span>
                        </div>
                        
                        <div>
                          {isUsada ? (
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                          ) : (
                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected ? "bg-purple-500 border-purple-500 text-white" : "border-zinc-600"
                            }`}>
                              {isSelected && <CheckCircle2 className="w-6 h-6" />}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-zinc-800/80 z-30 pb-safe">
              <div className="max-w-md mx-auto">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || selectedTickets.length === 0}
                  className="w-full flex items-center justify-center gap-3 text-white bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-500 font-bold rounded-2xl text-xl px-5 py-5 transition-all active:scale-[0.98] shadow-lg shadow-green-900/20"
                >
                  <ShieldCheck className="w-7 h-7" />
                  {isSubmitting ? "Autorizando..." : `Autorizar Ingreso (${selectedTickets.length})`}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
