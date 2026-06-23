'use client';

import { use, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ArrowRight, X } from 'lucide-react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import SeatMap from '@/components/SeatMap';
import { useCartStore } from '@/store/useCartStore';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ReservaPage(props: { params: Promise<{ funcionId: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const funcionId = parseInt(params.funcionId);
  const { asientos } = useCartStore();

  useEffect(() => {
    if (isNaN(funcionId)) {
      router.push('/cartelera');
    }
  }, [funcionId, router]);

  if (isNaN(funcionId)) {
    return null;
  }

  const handleContinue = () => {
    if (asientos.length === 0) {
      return;
    }
    router.push('/checkout/entradas');
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <ChevronLeft className="w-5 h-5" /> Volver
            </button>
            <div className="text-center">
              <h1 className="text-3xl font-black text-foreground">Elige tus Butacas</h1>
              <p className="text-muted-foreground">Selecciona los asientos para tu función</p>
            </div>
            <div className="w-20" /> {/* Spacer */}
          </div>

          {/* Seat Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12"
          >
            {!isNaN(funcionId) && <SeatMap funcionId={funcionId} />}
          </motion.div>

          {/* Bottom Action Bar */}
          <motion.div 
            className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border z-40"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
          >
            <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium mb-2">Asientos seleccionados</p>
                {asientos.length === 0 ? (
                  <span className="text-muted-foreground italic text-sm">Ninguno</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {asientos.map((a) => (
                      <motion.span
                        key={a.asientoId}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 border border-primary/40 text-primary font-bold rounded-full text-sm"
                      >
                        {a.codigo}
                        <button
                          onClick={async () => {
                            try {
                              await api.delete('/reservas/asientos/unlock', {
                                params: { funcionId, asientoId: a.asientoId }
                              });
                              useCartStore.getState().toggleAsiento(a);
                              window.dispatchEvent(new Event('seat-unlocked'));
                              toast.info(`Asiento ${a.codigo} eliminado`);
                            } catch {
                              // Si falla el unlock igual lo quitamos del carrito visualmente
                              useCartStore.getState().toggleAsiento(a);
                              window.dispatchEvent(new Event('seat-unlocked'));
                            }
                          }}
                          className="ml-1 hover:text-destructive transition-colors"
                          title="Quitar asiento"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleContinue}
                disabled={asientos.length === 0}
                className="flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 shrink-0"
              >
                Continuar <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
