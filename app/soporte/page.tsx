'use client';

import { useState } from 'react';
import { Search, Wrench, FileText, DollarSign, Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import api from '@/lib/api';

export default function SoporteTecnicoPage() {
  const [supportId, setSupportId] = useState('');
  const [ticket, setTicket] = useState<any>(null);
  const [proposal, setProposal] = useState({ description: '', budgetAmount: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportId) return;
    setLoading(true);
    try {
      const res = await api.get(`/maintenance/support/${supportId}`);
      setTicket(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ticket no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const submitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal.description || !proposal.budgetAmount) {
      toast.error('Complete todos los campos');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/maintenance/support/${supportId}/proposal`, {
        description: proposal.description,
        budgetAmount: parseFloat(proposal.budgetAmount)
      });
      toast.success('Propuesta enviada exitosamente');
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al enviar propuesta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Portal de Soporte Técnico</h1>
        </div>

        {!ticket ? (
          <form onSubmit={fetchTicket} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                ID de Soporte
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Ej: SUP-123456789"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  value={supportId}
                  onChange={(e) => setSupportId(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !supportId}
              className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Buscar Ticket'}
            </button>
          </form>
        ) : submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
              <Send className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">¡Propuesta Enviada!</h2>
            <p className="text-muted-foreground">El administrador de la sede revisará su propuesta y se pondrá en contacto con usted.</p>
            <button
              onClick={() => { setTicket(null); setSupportId(''); setSubmitted(false); }}
              className="mt-6 text-primary hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Buscar otro ticket
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-4">
              <h2 className="text-xl font-bold text-white mb-2">Detalles del Reporte</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Equipo</p>
                  <p className="font-medium text-white">{ticket.equipo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado</p>
                  <p className="font-medium text-red-400">{ticket.estado}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Descripción Inicial</p>
                  <p className="text-white mt-1">{ticket.descripcion}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Motivo (Admin)</p>
                  <p className="text-white mt-1 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{ticket.motivoNoResuelto}</p>
                </div>
              </div>
            </div>

            <form onSubmit={submitProposal} className="space-y-4">
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Su Propuesta de Solución</h3>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Descripción del Trabajo
                </label>
                <textarea
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  placeholder="Detalle de repuestos y mano de obra..."
                  value={proposal.description}
                  onChange={(e) => setProposal({ ...proposal, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Presupuesto Total ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: 150.00"
                  value={proposal.budgetAmount}
                  onChange={(e) => setProposal({ ...proposal, budgetAmount: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 hover:bg-primary/90 transition-colors disabled:opacity-50 mt-4"
              >
                {loading ? 'Enviando...' : 'Enviar Propuesta'}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
