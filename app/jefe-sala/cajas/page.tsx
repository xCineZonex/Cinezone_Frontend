'use client';

import { useEffect, useState } from 'react';
import { Briefcase, Ticket, Popcorn, Shield, Clock, DollarSign } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useSedeStore } from '@/store/useSedeStore';
import { motion } from 'framer-motion';

interface Caja {
  id: number;
  usuario: string;
  horaApertura: string;
  montoApertura: number;
}

interface Portero {
  id: string;
  nombre: string;
}

export default function JefeSalaCajas() {
  const [taquilla, setTaquilla] = useState<Caja[]>([]);
  const [dulceria, setDulceria] = useState<Caja[]>([]);
  const [porteros, setPorteros] = useState<Portero[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { activeSedeId } = useSedeStore();

  const fetchCajasActivas = async () => {
    if (!activeSedeId || activeSedeId === 'all') return;
    
    try {
      setLoading(true);
      const res = await api.get(`/jefe-sala/cajas/activas?sedeId=${activeSedeId}`);
      const data = res.data;
      setTaquilla(data.taquilla || []);
      setDulceria(data.dulceria || []);
      setPorteros(data.porteros || []);
    } catch (error: any) {
      toast.error('Error al cargar cajas activas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCajasActivas();
  }, [activeSedeId]);

  const renderCajaCard = (caja: Caja, type: 'taquilla' | 'dulceria') => {
    const Icon = type === 'taquilla' ? Ticket : Popcorn;
    const colorClass = type === 'taquilla' ? 'text-blue-500' : 'text-orange-500';
    const bgClass = type === 'taquilla' ? 'bg-blue-500/10' : 'bg-orange-500/10';

    return (
      <motion.div 
        key={caja.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-sm ring-1 ring-white/5"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${bgClass}`}>
              <Icon className={`w-5 h-5 ${colorClass}`} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{caja.usuario}</h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                Turno Abierto
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Apertura</span>
            </div>
            <span className="font-medium">{new Date(caja.horaApertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>Monto Inicial</span>
            </div>
            <span className="font-medium text-green-400">S/ {caja.montoApertura?.toFixed(2)}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Operaciones y Cajas</h1>
        <p className="text-muted-foreground mt-2">Monitorea los turnos activos en tiempo real de la sede.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="font-medium">Cargando operaciones...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Taquilla Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Ticket className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold text-blue-100">Taquilla</h2>
              <span className="ml-auto bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full">
                {taquilla.length}
              </span>
            </div>
            {taquilla.length === 0 ? (
              <div className="p-8 text-center bg-card/20 rounded-2xl border border-border/30 border-dashed">
                <Ticket className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No hay cajas de taquilla abiertas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {taquilla.map(caja => renderCajaCard(caja, 'taquilla'))}
              </div>
            )}
          </div>

          {/* Dulcería Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Popcorn className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-orange-100">Dulcería</h2>
              <span className="ml-auto bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full">
                {dulceria.length}
              </span>
            </div>
            {dulceria.length === 0 ? (
              <div className="p-8 text-center bg-card/20 rounded-2xl border border-border/30 border-dashed">
                <Popcorn className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No hay cajas de dulcería abiertas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dulceria.map(caja => renderCajaCard(caja, 'dulceria'))}
              </div>
            )}
          </div>

          {/* Portero Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Shield className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-bold text-purple-100">Porteros</h2>
              <span className="ml-auto bg-purple-500/20 text-purple-400 text-xs font-bold px-2.5 py-1 rounded-full">
                {porteros.length}
              </span>
            </div>
            {porteros.length === 0 ? (
              <div className="p-8 text-center bg-card/20 rounded-2xl border border-border/30 border-dashed">
                <Shield className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No hay porteros asignados a esta sede</p>
              </div>
            ) : (
              <div className="space-y-4">
                {porteros.map((portero) => (
                  <motion.div 
                    key={portero.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-sm ring-1 ring-white/5 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center text-purple-400 font-bold shadow-inner ring-1 ring-purple-500/20">
                      {portero.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{portero.nombre}</h3>
                      <p className="text-xs text-muted-foreground">Personal de Puerta</p>
                    </div>
                    <div className="ml-auto">
                      <span className="flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
