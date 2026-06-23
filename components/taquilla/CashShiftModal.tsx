'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function CashShiftModal({ onOpenSuccess }: { onOpenSuccess: () => void }) {
  const router = useRouter();
  const [openingBalance, setOpeningBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openingBalance || isNaN(Number(openingBalance)) || Number(openingBalance) < 0) {
      toast.error('Ingrese un monto base válido');
      return;
    }

    setLoading(true);
    try {
      await api.post('/taquilla/caja/abrir', { montoApertura: Number(openingBalance) });
      toast.success('Caja abierta correctamente');
      onOpenSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al abrir la caja');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('rol');
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card w-full max-w-md rounded-3xl p-8 shadow-2xl border border-border"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-2xl font-black text-center mb-2">Apertura de Caja</h2>
        <p className="text-muted-foreground text-center mb-8">
          Debes declarar tu monto base en efectivo para comenzar tu turno en tu estación.
        </p>

        <form onSubmit={handleOpenShift} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              Monto Base Inicial (S/)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              className="w-full bg-secondary text-foreground p-4 rounded-xl outline-none focus:ring-2 ring-primary transition-all font-mono text-xl"
              placeholder="0.00"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-4 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-6 h-6" />
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-primary text-primary-foreground font-bold rounded-xl text-lg hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Abriendo...' : 'Abrir Caja'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
