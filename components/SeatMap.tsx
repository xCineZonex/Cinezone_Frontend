'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Clock, MonitorPlay, AlertCircle, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useRouter } from 'next/navigation';

export interface Seat {
  id: number;
  fila: string;
  numero: number;
  tipo: string;
  estado: 'DISPONIBLE' | 'OCUPADO' | 'BLOQUEADO_TEMP';
  gridRow: number;
  gridCol: number;
  enMantenimiento?: boolean;
}

interface SeatMapProps {
  funcionId: number;
}

export default function SeatMap({ funcionId }: SeatMapProps) {
  const router = useRouter();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const { bookingExpiresAt, clearCart } = useCartStore();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    fetchSeats();
    
    const handleSeatUnlocked = () => {
      fetchSeats();
    };
    window.addEventListener('seat-unlocked', handleSeatUnlocked);
    return () => window.removeEventListener('seat-unlocked', handleSeatUnlocked);
  }, [funcionId]);

  useEffect(() => {
    // Usar el temporizador global si existe
    if (bookingExpiresAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((bookingExpiresAt - now) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          setIsExpired(true);
          clearCart(); // Limpiamos todo el carrito al expirar
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [bookingExpiresAt, clearCart]);

  const fetchSeats = async () => {
    if (!funcionId || isNaN(funcionId)) return;
    try {
      if (seats.length === 0) setLoading(true);
      const res = await api.get(`/reservas/funciones/${funcionId}/asientos`);
      setSeats(res.data);
    } catch (error: any) {
      console.error('Error fetching seats', error);
      if (error.response?.status === 401) {
        toast.error('Debes iniciar sesión para elegir tus asientos');
        router.push('/login');
      } else {
        toast.error('No se pudo cargar el mapa de butacas');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = async (seat: Seat) => {
    if (isExpired) return;

    if (seat.enMantenimiento) {
      toast.error('Este asiento se encuentra en mantenimiento.');
      return;
    }

    const isMine = useCartStore.getState().asientos.some(a => a.asientoId === seat.id);

    if (isMine) {
      try {
        await api.delete('/reservas/asientos/unlock', {
          params: { funcionId, asientoId: seat.id }
        });
        setSeats((prev) =>
          prev.map((s) => (s.id === seat.id ? { ...s, estado: 'DISPONIBLE' } : s))
        );
        useCartStore.getState().toggleAsiento({
          asientoId: seat.id,
          codigo: `${seat.fila}${seat.numero}`,
          tipoEntrada: seat.tipo || 'GENERAL',
          precioCobrado: 20.00 // Este valor no importa al quitar, toggleAsiento lo busca por asientoId
        });
        window.dispatchEvent(new Event('seat-unlocked'));
        toast.info(`Asiento ${seat.fila}${seat.numero} liberado.`);
      } catch (error) {
        console.error('Error unlocking seat', error);
        toast.error('No se pudo liberar el asiento');
      }
      return;
    }

    if (seat.estado !== 'DISPONIBLE') {
      if (seat.estado === 'OCUPADO') {
        toast.info('Este asiento ya ha sido vendido.');
      } else {
        toast.warning('Este asiento está siendo reservado por otra persona.');
      }
      return;
    }

    if (useCartStore.getState().asientos.length >= 10) {
      toast.error('No puedes seleccionar más de 10 asientos por transacción.');
      return;
    }

    try {
      await api.post('/reservas/asientos/lock', {
        funcionId,
        asientoId: seat.id,
      });

      setSeats((prev) =>
        prev.map((s) => (s.id === seat.id ? { ...s, estado: 'BLOQUEADO_TEMP' } : s))
      );
      
      useCartStore.getState().toggleAsiento({
        asientoId: seat.id,
        codigo: `${seat.fila}${seat.numero}`,
        tipoEntrada: seat.tipo || 'GENERAL',
        precioCobrado: 20.00
      });
      useCartStore.getState().setFuncion(funcionId);
      
      toast.success(`Asiento ${seat.fila}${seat.numero} seleccionado.`);
    } catch (error: any) {
      console.error('Error locking seat', error);
      if (error.response?.status === 401) {
        router.push('/login');
      } else {
        toast.error(error.response?.data?.message || 'Error al seleccionar asiento');
      }
      fetchSeats();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Cargando sala...</div>;
  }

  if (seats.length === 0) {
    return (
      <div className="p-12 text-center bg-card rounded-2xl border-2 border-dashed border-border">
        <MonitorPlay className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">No hay asientos configurados</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">Esta sala aún no tiene un diseño de asientos asignado.</p>
      </div>
    );
  }

  const safeSeats = seats.map(s => ({
    ...s,
    gridRow: s.gridRow || 1,
    gridCol: s.gridCol || 1
  }));

  const maxRow = Math.max(...safeSeats.map(s => s.gridRow));
  const maxCol = Math.max(...safeSeats.map(s => s.gridCol));

  return (
    <div className="relative flex flex-col items-center max-w-full mx-auto p-4 md:p-8 bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
      
      {/* Modal de Expiración */}
      <AnimatePresence>
        {isExpired && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border p-8 rounded-3xl shadow-2xl max-w-sm w-full"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-2">¡Tiempo Expirado!</h2>
              <p className="text-muted-foreground mb-8">
                Tu tiempo para completar la compra ha terminado. Los asientos han sido liberados.
              </p>
              <button
                onClick={() => router.push('/cartelera')}
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" /> Volver a Cartelera
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer Header */}
      <AnimatePresence>
        {timeLeft !== null && !isExpired && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary animate-pulse" />
              <div>
                <p className="font-bold text-foreground text-sm md:text-base">Tiempo de reserva</p>
                <p className="text-xs md:text-sm text-muted-foreground">Completa tu compra antes de que expire</p>
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-primary tabular-nums tracking-tighter">
              {formatTime(timeLeft)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-2xl mb-12 relative flex justify-center">
        <div className="absolute top-0 w-full h-8 border-t-4 border-muted-foreground rounded-t-[100%] opacity-50 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]" />
        <MonitorPlay className="w-6 h-6 text-muted-foreground mt-4" />
        <span className="absolute mt-10 text-xs font-semibold tracking-widest uppercase text-muted-foreground">PANTALLA</span>
      </div>

      <div className="w-full overflow-x-auto pb-8 custom-scrollbar">
        <div 
          className="mx-auto"
          style={{
            display: 'grid',
            gridTemplateColumns: `30px repeat(${maxCol}, 35px) 30px`, 
            gridTemplateRows: `repeat(${maxRow}, 35px)`,
            gap: '6px',
            justifyContent: 'center',
            minWidth: 'max-content'
          }}
        >
          {Array.from({ length: maxRow }).map((_, r) => (
             <div key={`label-l-${r}`} style={{ gridRow: r + 1, gridColumn: 1 }} className="flex items-center justify-center text-xs font-bold text-muted-foreground">
               {String.fromCharCode(65 + r)}
             </div>
          ))}

          {safeSeats.map((seat) => {
            const isAvailable = seat.estado === 'DISPONIBLE' && !seat.enMantenimiento;
            const isOccupied = seat.estado === 'OCUPADO';
            const isMine = useCartStore.getState().asientos.some(a => a.asientoId === seat.id);
            const isBlocked = seat.estado === 'BLOQUEADO_TEMP' && !isMine;
            const isMaintenance = seat.enMantenimiento;

            let bgClass = 'bg-secondary hover:bg-primary/40';
            let textClass = 'text-muted-foreground';
            
            if (isAvailable) {
               if (seat.tipo === 'DISCAPACIDAD') bgClass = 'bg-green-500/20 border border-green-500/50 hover:bg-green-500/40';
            }
            if (isMaintenance) bgClass = 'bg-gray-800 text-gray-500 border border-dashed border-gray-600 cursor-not-allowed opacity-60';
            else if (isOccupied) bgClass = 'bg-destructive/60 text-destructive-foreground cursor-not-allowed opacity-50';
            else if (isBlocked) bgClass = 'bg-orange-500/80 text-white cursor-not-allowed opacity-75';
            if (isMine) {
              bgClass = 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 ring-offset-background scale-105';
              textClass = 'text-primary-foreground';
            }

            return (
              <motion.button
                key={seat.id}
                style={{ gridRow: seat.gridRow, gridColumn: seat.gridCol + 1 }}
                whileHover={isAvailable && !isExpired ? { scale: 1.1 } : {}}
                whileTap={isAvailable && !isExpired ? { scale: 0.95 } : {}}
                onClick={() => handleSeatClick(seat as any)}
                className={`w-full h-full rounded-t-md rounded-b-[2px] text-[10px] font-bold flex items-center justify-center transition-all ${bgClass} ${textClass}`}
                disabled={isExpired}
              >
                {seat.numero}
              </motion.button>
            );
          })}

          {Array.from({ length: maxRow }).map((_, r) => (
             <div key={`label-r-${r}`} style={{ gridRow: r + 1, gridColumn: maxCol + 2 }} className="flex items-center justify-center text-xs font-bold text-muted-foreground">
               {String.fromCharCode(65 + r)}
             </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border w-full flex flex-wrap justify-center gap-x-8 gap-y-4 text-[13px] font-medium">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t bg-secondary" />
          <span className="text-muted-foreground">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t bg-green-500/20 border border-green-500/50" />
          <span className="text-muted-foreground">Discapacidad</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t bg-destructive/60 opacity-50" />
          <span className="text-muted-foreground">Ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t bg-primary ring-2 ring-primary ring-offset-1" />
          <span className="text-foreground">Tu selección</span>
        </div>
      </div>
    </div>
  );
}
