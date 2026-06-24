'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DiferenciaPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);
  const [metodoPago, setMetodoPago] = useState('');
  const router = useRouter();

  const handlePreview = async () => {
    if (!code) return;
    setLoading(true);
    setMessage(null);
    try {
      const { default: api } = await import('@/lib/api');
      const res = await api.get(`/taquilla/pagar-diferencia/${code}`);
      setPreviewAmount(res.data.diferencia);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al obtener la diferencia.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const { default: api } = await import('@/lib/api');
      await api.post('/taquilla/pagar-diferencia', { codigoUnico: code });
      setMessage({ type: 'success', text: 'Diferencia pagada con éxito. Las entradas se han actualizado a NORMAL.' });
      setTimeout(() => router.push('/taquilla'), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al procesar el pago de diferencia.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/10 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card max-w-md w-full p-8 rounded-3xl shadow-xl border border-border/50 relative"
      >
        <button 
          onClick={() => router.push('/taquilla')}
          className="absolute left-4 top-4 p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 mt-4">
          <Ticket className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-2xl font-black text-center mb-2">Pagar Diferencia</h2>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          Ingrese el código único de la boleta para actualizar las entradas con descuento (CONADIS, Niños, Tercera Edad) a precio NORMAL.
        </p>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl flex items-center gap-3 mb-6 ${message.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <p className="text-sm font-medium">{message.text}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Código de Boleta</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setPreviewAmount(null); }}
                className="w-full p-4 bg-secondary rounded-xl text-center text-xl font-bold tracking-widest placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all uppercase"
                placeholder="EJ: ABC-123"
                required
              />
              <button 
                type="button"
                onClick={handlePreview}
                disabled={loading || !code}
                className="px-6 bg-secondary/80 text-foreground font-bold rounded-xl hover:bg-secondary disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                Buscar
              </button>
            </div>
          </div>

          {previewAmount !== null && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                <span className="block text-sm text-muted-foreground mb-1">Diferencia a Pagar</span>
                <span className="text-3xl font-black text-primary">S/ {previewAmount.toFixed(2)}</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Método de Pago</label>
                <div className="grid grid-cols-2 gap-3">
                  {['EFECTIVO', 'YAPE', 'PLIN', 'TARJETA_CREDITO'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setMetodoPago(method)}
                      className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${metodoPago === method ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground hover:border-primary/50'}`}
                    >
                      {method.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading || !metodoPago}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
}