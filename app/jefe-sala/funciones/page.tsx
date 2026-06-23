'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Clock, MapPin, Search, Ticket } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useSedeStore } from '@/store/useSedeStore';

interface Funcion {
  id: number;
  pelicula: { id: number; titulo: string; duracion: number };
  sala: { id: number; nombre: string; capacidad: number };
  horario: string;
  precio: number;
}

export default function JefeSalaFunciones() {
  const [funciones, setFunciones] = useState<Funcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { activeSedeId: sedeId } = useSedeStore();

  const fetchFunciones = async () => {
    if (!sedeId || sedeId === 'all') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/jefe-sala/funciones', { params: { sedeId } });
      const data = res.data?.data || res.data || [];
      setFunciones(data);
    } catch (error: any) {
      toast.error('Error al cargar la cartelera');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunciones();
    const interval = setInterval(fetchFunciones, 60000); // Polling cada 1 minuto
    return () => clearInterval(interval);
  }, [sedeId]);

  const filteredFunciones = funciones.filter(f => 
    f.pelicula?.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.sala?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cartelera</h1>
          <p className="text-muted-foreground mt-2">Monitorea los horarios para coordinar la limpieza de las salas.</p>
        </div>
      </div>

      <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-sm overflow-hidden ring-1 ring-white/5">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row items-center gap-4 justify-between bg-muted/10">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por película o sala..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background/50 border border-border/50 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm backdrop-blur-sm"
            />
          </div>
        </div>

        <div className="p-6">
          {loading && funciones.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="font-medium">Cargando cartelera...</p>
            </div>
          ) : filteredFunciones.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <CalendarDays className="w-12 h-12 opacity-20" />
              <p className="font-medium">No hay funciones programadas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredFunciones.map((funcion) => {
                const inicio = new Date(funcion.horario);
                const fin = new Date(inicio.getTime() + (funcion.pelicula?.duracion || 120) * 60000);
                
                const ahora = new Date();
                let estadoTexto = "Próxima";
                let estadoClase = "bg-blue-500/10 text-blue-500 border-blue-500/20";
                
                if (ahora >= inicio && ahora <= fin) {
                  estadoTexto = "En proyección";
                  estadoClase = "bg-green-500/10 text-green-500 border-green-500/20";
                } else if (ahora > fin) {
                  estadoTexto = "Finalizada";
                  estadoClase = "bg-muted text-muted-foreground border-border/50";
                }

                const minutosParaFin = (fin.getTime() - ahora.getTime()) / 60000;
                const alertaLimpieza = minutosParaFin <= 15 && minutosParaFin >= -30;

                return (
                  <div key={funcion.id} className={`bg-background/60 backdrop-blur-sm border rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg ${alertaLimpieza ? 'border-orange-500/50 shadow-[0_4px_20px_-10px_rgba(249,115,22,0.3)]' : 'border-border/50 hover:border-primary/30'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                          <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-foreground line-clamp-1">{funcion.pelicula?.titulo || 'Desconocida'}</h3>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md border ${estadoClase}`}>
                            {estadoTexto}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mt-5">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-xl">
                        <Clock className="w-4 h-4 text-primary/70" />
                        <div className="flex flex-col">
                          <span className="text-xs">Horario</span>
                          <span className="font-medium text-foreground">
                            {inicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {fin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-xl">
                        <MapPin className="w-4 h-4 text-primary/70" />
                        <div className="flex flex-col">
                          <span className="text-xs">Sala</span>
                          <span className="font-medium text-foreground">{funcion.sala?.nombre || `Sala ${funcion.sala?.id}`}</span>
                        </div>
                      </div>
                    </div>

                    {alertaLimpieza && (
                      <div className="mt-4 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-xl p-3 text-sm font-semibold flex items-center justify-center gap-2 animate-pulse">
                        <Clock className="w-4 h-4" />
                        {minutosParaFin > 0 
                          ? `Preparar limpieza (${Math.ceil(minutosParaFin)} min)` 
                          : `Limpieza requerida (hace ${Math.abs(Math.ceil(minutosParaFin))} min)`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
