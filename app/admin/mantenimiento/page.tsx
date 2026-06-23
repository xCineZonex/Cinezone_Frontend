'use client';

import { useState, useEffect } from 'react';
import { Wrench, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useSedeStore } from '@/store/useSedeStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminMantenimientoPage() {
  const { activeSedeId } = useSedeStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal estado
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [nuevoEstado, setNuevoEstado] = useState('PROCEDE');
  const [motivo, setMotivo] = useState('');
  const [updating, setUpdating] = useState(false);

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

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await api.put(`/maintenance/${selectedTicket.id}/status`, {
        estado: nuevoEstado,
        motivoNoResuelto: nuevoEstado === 'NO_RESUELTO' ? motivo : null
      });
      toast.success('Estado actualizado');
      setSelectedTicket(null);
      setMotivo('');
      fetchTickets();
    } catch (err: any) {
      toast.error('Error al actualizar');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> PENDIENTE</span>;
      case 'PROCEDE':
        return <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> RESUELTO/PROCEDE</span>;
      case 'NO_RESUELTO':
        return <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> EXTERNO (TÉCNICO)</span>;
      default:
        return null;
    }
  };

  if (!activeSedeId || activeSedeId === 'all') {
    return <div className="p-8 text-center text-muted-foreground">Seleccione una sede específica para administrar el mantenimiento.</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Wrench className="w-8 h-8 text-primary" />
          Gestión de Mantenimiento
        </h1>
        <p className="text-muted-foreground mt-2">
          Revise los reportes del Jefe de Sala y decida si se resuelven internamente o requieren un técnico externo.
        </p>
      </div>

      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Cargando reportes...</div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No hay reportes de mantenimiento.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-sm uppercase text-muted-foreground tracking-wider">
                  <th className="p-4 font-bold">Fecha</th>
                  <th className="p-4 font-bold">Equipo</th>
                  <th className="p-4 font-bold">Descripción</th>
                  <th className="p-4 font-bold">Estado</th>
                  <th className="p-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                      {format(
                        Array.isArray(ticket.createdAt) 
                          ? new Date(ticket.createdAt[0], ticket.createdAt[1] - 1, ticket.createdAt[2], ticket.createdAt[3] || 0, ticket.createdAt[4] || 0)
                          : new Date(ticket.createdAt), 
                        "d MMM, yy HH:mm", { locale: es }
                      )}
                    </td>
                    <td className="p-4 font-bold text-white whitespace-nowrap">{ticket.equipo}</td>
                    <td className="p-4 text-sm text-muted-foreground max-w-xs truncate" title={ticket.descripcion}>
                      {ticket.descripcion}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(ticket.estado)}
                    </td>
                    <td className="p-4 text-right">
                      {ticket.estado === 'PENDIENTE' && (
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="bg-primary/20 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                          Evaluar
                        </button>
                      )}
                      {ticket.estado === 'NO_RESUELTO' && ticket.supportId && (
                        <div className="text-xs font-mono bg-zinc-900 px-2 py-1 rounded inline-block text-muted-foreground">
                          {ticket.supportId}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Evaluación */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Evaluar Reporte</h2>
            
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 mb-6 text-sm">
              <p className="text-muted-foreground">Equipo: <span className="font-bold text-white">{selectedTicket.equipo}</span></p>
              <p className="text-muted-foreground mt-2">Problema:</p>
              <p className="text-white mt-1 italic">"{selectedTicket.descripcion}"</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Decisión</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNuevoEstado('PROCEDE')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-sm font-bold transition-all ${
                      nuevoEstado === 'PROCEDE' 
                        ? 'bg-green-500/20 border-green-500 text-green-500' 
                        : 'bg-zinc-900 border-white/10 text-muted-foreground hover:bg-white/5'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    Resuelto / Procede
                  </button>
                  <button
                    onClick={() => setNuevoEstado('NO_RESUELTO')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-sm font-bold transition-all ${
                      nuevoEstado === 'NO_RESUELTO' 
                        ? 'bg-red-500/20 border-red-500 text-red-500' 
                        : 'bg-zinc-900 border-white/10 text-muted-foreground hover:bg-white/5'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Técnico Externo
                  </button>
                </div>
              </div>

              {nuevoEstado === 'NO_RESUELTO' && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Motivo / Descripción para el Técnico
                  </label>
                  <textarea
                    placeholder="Necesita cambio de repuesto..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                  <p className="text-xs text-red-400 mt-2">
                    Se generará un ID de Soporte para que el técnico externo pueda enviar su presupuesto.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updating || (nuevoEstado === 'NO_RESUELTO' && !motivo)}
                  className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {updating ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
