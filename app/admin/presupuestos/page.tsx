'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, DollarSign, CheckCircle, XCircle, Search, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function PresupuestosPage() {
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sedes, setSedes] = useState<any[]>([]);
  const [filtroSede, setFiltroSede] = useState<string>('ALL');
  const [rol, setRol] = useState<string>('');
  
  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<'APPROVED' | 'REJECTED' | ''>('');
  const [responseMessage, setResponseMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRol(localStorage.getItem('rol') || '');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resPresupuestos, resSedes] = await Promise.all([
        api.get('/admin/presupuestos'),
        api.get('/public/sedes')
      ]);
      setPresupuestos(resPresupuestos.data);
      setSedes(resSedes.data);
    } catch (error) {
      toast.error('Error al cargar datos de presupuestos');
    } finally {
      setLoading(false);
    }
  };

  const getSedeName = (sedeId: number) => {
    const sede = sedes.find(s => s.id === sedeId);
    return sede ? sede.nombre : `Sede #${sedeId}`;
  };

  const filteredPresupuestos = filtroSede === 'ALL' 
    ? presupuestos 
    : presupuestos.filter(p => p.sedeId.toString() === filtroSede);

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !responseStatus || !responseMessage.trim()) {
      toast.error('Por favor selecciona un estado y escribe un motivo.');
      return;
    }
    
    setSaving(true);
    try {
      await api.put(`/admin/presupuestos/${selectedRequest.id}/responder`, {
        status: responseStatus,
        adminResponse: responseMessage
      });
      toast.success('Respuesta enviada exitosamente al Admin Sede');
      setSelectedRequest(null);
      setResponseStatus('');
      setResponseMessage('');
      fetchData();
    } catch (error) {
      toast.error('Error al procesar la respuesta');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold"><Clock className="w-3.5 h-3.5"/> Pendiente</span>;
      case 'APPROVED': return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold"><CheckCircle className="w-3.5 h-3.5"/> Aprobado</span>;
      case 'REJECTED': return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold"><XCircle className="w-3.5 h-3.5"/> Rechazado</span>;
      default: return null;
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse font-semibold">Cargando solicitudes de presupuesto...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Solicitudes de Presupuesto</h1>
          <p className="text-muted-foreground mt-1">Revisa y responde a las solicitudes de los administradores de sede.</p>
        </div>

        <div className="flex items-center gap-4">
          {rol === 'ADMIN_SEDE' && (
            <Link href="/admin/presupuestos/nueva">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors shadow-lg shadow-primary/20">
                <span className="text-lg leading-none">+</span> Nueva Solicitud
              </button>
            </Link>
          )}
          <div className="flex items-center gap-3 bg-zinc-900 border border-border rounded-xl p-2 shadow-sm">
            <div className="pl-3 text-muted-foreground"><Search className="w-4 h-4" /></div>
            <select
              value={filtroSede}
              onChange={(e) => setFiltroSede(e.target.value)}
              className="bg-zinc-900 border-none text-sm font-semibold text-white focus:ring-0 outline-none pr-4 cursor-pointer"
            >
              <option value="ALL" className="bg-zinc-900 text-white">Todas las Sedes</option>
              {sedes.map(sede => (
                <option key={sede.id} value={sede.id} className="bg-zinc-900 text-white">{sede.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredPresupuestos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed border-border rounded-2xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50" />
          <h3 className="text-xl font-bold text-foreground">No hay solicitudes</h3>
          <p className="text-muted-foreground text-sm max-w-sm">No se encontraron solicitudes de presupuesto para los filtros actuales.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPresupuestos.map(req => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary flex items-center justify-center rounded-xl text-primary border border-border">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground leading-tight">{getSedeName(req.sedeId)}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {getStatusBadge(req.status)}
              </div>

              <div className="bg-secondary/50 p-4 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 mb-2 text-foreground font-black text-xl">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  {req.amount}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {req.description}
                </p>
              </div>

              {req.status === 'PENDING' ? (
                rol === 'SUPER_ADMIN' ? (
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="mt-auto w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Responder Solicitud
                  </button>
                ) : (
                  <div className="mt-auto bg-background border border-border rounded-xl p-4 text-center">
                    <p className="text-sm text-muted-foreground font-semibold">Esperando respuesta del Super Admin...</p>
                  </div>
                )
              ) : (
                <div className="mt-auto bg-background border border-border rounded-xl p-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Respuesta del Super Admin:</h4>
                  <p className="text-sm text-foreground italic">"{req.adminResponse}"</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 md:p-8"
            >
              <h2 className="text-2xl font-black text-foreground mb-6">Responder Solicitud</h2>
              
              <div className="mb-6 p-4 bg-secondary rounded-xl border border-border flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">Sede: <strong className="text-foreground">{getSedeName(selectedRequest.sedeId)}</strong></p>
                <p className="text-sm text-muted-foreground">Monto: <strong className="text-foreground">${selectedRequest.amount}</strong></p>
              </div>

              <form onSubmit={handleRespond} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setResponseStatus('APPROVED')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all ${
                      responseStatus === 'APPROVED' 
                        ? 'border-green-500 bg-green-500/10 text-green-500' 
                        : 'border-border hover:border-green-500/50 text-muted-foreground'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" /> Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponseStatus('REJECTED')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all ${
                      responseStatus === 'REJECTED' 
                        ? 'border-red-500 bg-red-500/10 text-red-500' 
                        : 'border-border hover:border-red-500/50 text-muted-foreground'
                    }`}
                  >
                    <XCircle className="w-5 h-5" /> Rechazar
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Motivo / Respuesta (Requerido)</label>
                  <textarea
                    required
                    rows={4}
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Escribe la justificación de tu decisión..."
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequest(null);
                      setResponseStatus('');
                      setResponseMessage('');
                    }}
                    className="flex-1 py-3 font-semibold text-muted-foreground hover:text-foreground transition-colors bg-secondary rounded-xl hover:bg-secondary/80"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {saving ? 'Enviando...' : 'Enviar Respuesta'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
