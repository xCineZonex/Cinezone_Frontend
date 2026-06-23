'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, CheckCircle2, History, Clock } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function VoidSaleModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [bookingId, setBookingId] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchHistory = async () => {
        try {
          const res = await api.get('/users/me/sales');
          setSalesHistory(res.data || []);
        } catch (e) {
          console.error("Error fetching sales history", e);
        }
      };
      fetchHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !authCode || !motivo) {
      toast.error('Complete todos los campos');
      return;
    }
    
    setLoading(true);
    try {
      await api.post(`/taquilla/ventas/${bookingId}/anular`, {
        authCode,
        motivo
      });
      setSuccess(true);
      toast.success('Venta anulada correctamente');
      setTimeout(() => {
        setSuccess(false);
        setBookingId('');
        setAuthCode('');
        setMotivo('');
        onClose();
      }, 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al autorizar anulación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={loading ? undefined : onClose}
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-card w-full max-w-4xl rounded-3xl p-6 shadow-2xl border border-border"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-secondary text-muted-foreground rounded-full hover:bg-secondary/80 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {!success ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[500px]">
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Anular Venta</h2>
                    <p className="text-sm text-muted-foreground">Requiere Autorización de Admin</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">ID de Venta (Boleta)</label>
                  <input
                    type="text"
                    value={bookingId}
                    onChange={e => setBookingId(e.target.value)}
                    placeholder="Ej. a1b2c3d4-..."
                    className="w-full mt-1 px-4 py-3 bg-secondary rounded-xl border border-transparent focus:border-primary focus:bg-background outline-none transition-all font-mono text-sm"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Motivo</label>
                  <input
                    type="text"
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    placeholder="Ej. Error de cobro, Cambio de decisión"
                    className="w-full mt-1 px-4 py-3 bg-secondary rounded-xl border border-transparent focus:border-primary focus:bg-background outline-none transition-all text-sm"
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <label className="text-xs font-bold text-destructive uppercase">Autorización (Jefe de Sala / Admin Sede)</label>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={authCode}
                      onChange={e => setAuthCode(e.target.value)}
                      placeholder="Código de Autorización (Ej. XXXXXX)"
                      className="w-full px-4 py-3 bg-secondary rounded-xl border border-destructive/20 focus:border-destructive outline-none text-sm font-mono tracking-wider text-center"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-6 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : 'Confirmar Anulación'}
                </button>
              </form>
              </div>

              <div className="flex flex-col border-l border-border pl-8 overflow-hidden">
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <History className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-bold text-foreground">Ventas Recientes</h3>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {salesHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm mt-10">No hay ventas recientes.</div>
                  ) : (
                    salesHistory.map((sale: any) => (
                      <div 
                        key={sale.id} 
                        onClick={() => {
                          if (sale.estado !== 'CANCELADA') setBookingId(sale.id);
                        }}
                        className={`p-3 rounded-xl border transition-all ${
                          sale.estado === 'CANCELADA' 
                            ? 'bg-secondary/50 border-transparent opacity-60 cursor-not-allowed' 
                            : bookingId === sale.id 
                              ? 'bg-orange-500/10 border-orange-500 cursor-pointer' 
                              : 'bg-secondary border-transparent cursor-pointer hover:border-orange-500/50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-mono font-bold text-muted-foreground break-all">{sale.codigoUnico}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            sale.estado === 'CANCELADA' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'
                          }`}>
                            {sale.estado}
                          </span>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(sale.fechaCompra).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <span className="font-black text-sm">S/ {sale.montoTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Venta Anulada</h2>
              <p className="text-muted-foreground">El stock ha sido devuelto.</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
