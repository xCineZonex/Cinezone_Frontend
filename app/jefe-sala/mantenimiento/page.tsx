'use client';

import { useState, useEffect } from 'react';
import { Wrench, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useSedeStore } from '@/store/useSedeStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function JefeSalaMantenimientoPage() {
  const { activeSedeId } = useSedeStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Nuevo ticket
  const [equipo, setEquipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeSedeId && activeSedeId !== 'all') {
      fetchTickets();
    }
  }, [activeSedeId]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/maintenance/sede/${activeSedeId}`);
      setTickets(res.data?.data || res.data || []);
    } catch (err: any) {
      toast.error('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipo || !descripcion) {
      toast.error('Complete todos los campos');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/maintenance/report', {
        equipo,
        descripcion,
        sedeId: parseInt(activeSedeId as string)
      });
      toast.success('Incidencia reportada correctamente');
      setEquipo('');
      setDescripcion('');
      fetchTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al reportar');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> PENDIENTE</span>;
      case 'PROCEDE':
        return <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> RESUELTO/PROCEDE</span>;
      case 'NO_RESUELTO':
        return <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> EXTERNO</span>;
      default:
        return null;
    }
  };

  if (!activeSedeId || activeSedeId === 'all') {
    return <div className="p-8 text-center text-muted-foreground">Seleccione una sede específica para ver mantenimiento.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Wrench className="w-8 h-8 text-primary" />
          Mantenimiento de Equipos
        </h1>
        <p className="text-muted-foreground mt-2">
          Reporte fallas en proyectores, máquinas de popcorn o cualquier otro equipo de la sala.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de reporte */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-white/5 p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Nuevo Reporte
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Equipo / Máquina</label>
                <input
                  type="text"
                  placeholder="Ej: Máquina de Popcorn #2"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  value={equipo}
                  onChange={(e) => setEquipo(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Descripción de la falla</label>
                <textarea
                  placeholder="La máquina no calienta..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary h-32 resize-none"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Reportar Falla'}
              </button>
            </form>
          </div>
        </div>

        {/* Lista de tickets */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-white/5 p-6 rounded-2xl min-h-[400px]">
            <h2 className="text-xl font-bold text-white mb-6">Historial de Reportes</h2>
            
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Cargando...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No hay reportes de mantenimiento en esta sede.</div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-zinc-900/50 border border-white/5 p-5 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-white">{ticket.equipo}</h3>
                        {getStatusBadge(ticket.estado)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{ticket.descripcion}</p>
                      
                      {ticket.supportId && (
                        <div className="inline-block bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-lg text-xs font-mono font-bold mt-2">
                          ID Técnico: {ticket.supportId}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {format(
                        Array.isArray(ticket.createdAt) 
                          ? new Date(ticket.createdAt[0], ticket.createdAt[1] - 1, ticket.createdAt[2], ticket.createdAt[3] || 0, ticket.createdAt[4] || 0)
                          : new Date(ticket.createdAt), 
                        "d MMM, yyyy 'a las' HH:mm", { locale: es }
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
