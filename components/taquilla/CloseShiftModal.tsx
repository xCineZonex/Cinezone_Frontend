'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface CloseShiftModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CloseShiftModal({ onClose, onSuccess }: CloseShiftModalProps) {
  const router = useRouter();
  const [declaredBalance, setDeclaredBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaredBalance || isNaN(Number(declaredBalance)) || Number(declaredBalance) < 0) {
      toast.error('Ingrese un monto físico válido');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/taquilla/caja/cerrar', { montoDeclarado: Number(declaredBalance) });
      setResult(res.data);
      toast.success('Caja cerrada correctamente');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cerrar la caja');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalLogout = async () => {
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card w-full max-w-md rounded-3xl p-8 shadow-2xl border border-border relative overflow-hidden"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
          disabled={loading || result != null}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <LogOut className="w-8 h-8 text-destructive" />
        </div>
        
        <h2 className="text-2xl font-black text-center mb-2">Cierre de Caja</h2>
        
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <p className="text-muted-foreground text-center mb-8">
                Ingresa el efectivo total físico que hay en la caja (Monto Base + Ventas).
              </p>

              <form onSubmit={handleCloseShift} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-2">
                    Efectivo Declarado (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full bg-secondary text-foreground p-4 rounded-xl outline-none focus:ring-2 ring-primary transition-all font-mono text-xl text-center"
                    placeholder="0.00"
                    value={declaredBalance}
                    onChange={(e) => setDeclaredBalance(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-destructive text-destructive-foreground font-bold rounded-xl text-lg hover:bg-destructive/90 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Procesando Arqueo...' : 'Realizar Arqueo'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="p-6 bg-secondary rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fondo Inicial</span>
                  <span className="font-mono">S/ {result.montoApertura?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-green-500">
                  <span>+ Ventas Efectivo</span>
                  <span className="font-mono">S/ {result.ventasEfectivo?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground text-sm">
                  <span>(Ventas Otros Métodos)</span>
                  <span className="font-mono">S/ {result.ventasOtros?.toFixed(2)}</span>
                </div>
                {result.ingresosAdicionales > 0 && (
                  <div className="flex justify-between items-center text-blue-500">
                    <span>+ Ingresos Adicionales</span>
                    <span className="font-mono">S/ {result.ingresosAdicionales?.toFixed(2)}</span>
                  </div>
                )}
                {result.egresos > 0 && (
                  <div className="flex justify-between items-center text-red-500">
                    <span>- Egresos de Caja</span>
                    <span className="font-mono">S/ {result.egresos?.toFixed(2)}</span>
                  </div>
                )}
                {result.anulaciones > 0 && (
                  <div className="flex justify-between items-center text-red-500">
                    <span>- Anulaciones</span>
                    <span className="font-mono">S/ {result.anulaciones?.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="h-px bg-border my-2" />
                
                <div className="flex justify-between items-center font-bold">
                  <span>Efectivo Esperado</span>
                  <span className="font-mono">S/ {result.montoEsperado?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-bold">
                  <span>Efectivo Declarado (Físico)</span>
                  <span className="font-mono">S/ {result.montoDeclarado?.toFixed(2)}</span>
                </div>

                <div className="h-px bg-border my-2" />

                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold">Descuadre</span>
                  <span className={`font-mono font-black ${
                    result.descuadre === 0 ? 'text-green-500' :
                    result.descuadre > 0 ? 'text-blue-500' : 'text-red-500'
                  }`}>
                    {result.descuadre > 0 ? '+' : ''}S/ {result.descuadre?.toFixed(2)}
                  </span>
                </div>
              </div>

              {result.descuadre < 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 text-red-500 rounded-xl text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>
                    Tienes un faltante de <strong>S/ {Math.abs(result.descuadre).toFixed(2)}</strong>. 
                    Este incidente quedará registrado en el sistema.
                  </p>
                </div>
              )}

              <button
                onClick={handleFinalLogout}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl text-lg hover:bg-primary/90 transition-all active:scale-95"
              >
                Cerrar Sesión de Taquilla
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
