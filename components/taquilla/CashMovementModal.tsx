'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownUp, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface CashMovementModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CashMovementModal({ onClose, onSuccess }: CashMovementModalProps) {
  const [type, setType] = useState('EGRESO');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      toast.error('Ingrese un motivo descriptivo');
      return;
    }

    setLoading(true);
    try {
      await api.post('/taquilla/caja/movimiento', {
        type,
        amount: Number(amount),
        reason
      });
      toast.success('Movimiento registrado correctamente');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card w-full max-w-md rounded-3xl p-8 shadow-2xl border border-border relative overflow-hidden"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ArrowDownUp className="w-8 h-8 text-blue-500" />
        </div>
        
        <h2 className="text-2xl font-black text-center mb-8">Movimiento de Caja</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('INGRESO')}
                className={`py-3 rounded-xl font-bold transition-colors ${type === 'INGRESO' ? 'bg-green-500 text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
              >
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => setType('EGRESO')}
                className={`py-3 rounded-xl font-bold transition-colors ${type === 'EGRESO' ? 'bg-red-500 text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
              >
                Egreso
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              Monto (S/)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              className="w-full bg-secondary text-foreground p-4 rounded-xl outline-none focus:ring-2 ring-primary transition-all font-mono text-xl"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              Motivo
            </label>
            <input
              type="text"
              required
              className="w-full bg-secondary text-foreground p-4 rounded-xl outline-none focus:ring-2 ring-primary transition-all"
              placeholder={type === 'EGRESO' ? "Ej: Compra de insumos" : "Ej: Sencillo adicional"}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl text-lg hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar Movimiento'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
