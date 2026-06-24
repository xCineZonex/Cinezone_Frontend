'use client';

import { motion } from 'framer-motion';
import { Popcorn, Clapperboard, LockOpen, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import CashShiftModal from '@/components/taquilla/CashShiftModal';
import CloseShiftModal from '@/components/taquilla/CloseShiftModal';
import VoidSaleModal from '@/components/taquilla/VoidSaleModal';
import StaffSidebar from '@/components/staff/StaffSidebar';
import { toast } from 'sonner';

export default function DulceriaStaffPage() {
  const router = useRouter();
  const [shiftStatus, setShiftStatus] = useState<'ABIERTA' | 'CERRADA' | 'LOADING'>('LOADING');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);

  const fetchShiftStatus = async () => {
    try {
      const res = await api.get('/taquilla/caja/estado');
      setShiftStatus(res.data.estado);
    } catch (err: any) {
      console.error('Error fetching shift status', err);
      if (err.response?.status !== 403 && err.response?.status !== 401) {
        toast.error('Error al obtener estado de caja');
      }
      setShiftStatus('CERRADA');
    }
  };

  useEffect(() => {
    fetchShiftStatus();
  }, []);

  const startSale = () => {
    router.push('/dulceria');
  };

  if (shiftStatus === 'LOADING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10 flex">
      {showOpenModal && (
        <CashShiftModal onOpenSuccess={() => { setShiftStatus('ABIERTA'); setShowOpenModal(false); }} />
      )}
        {showCloseModal && (
          <CloseShiftModal 
            onClose={() => setShowCloseModal(false)}
            onSuccess={() => setShiftStatus('CERRADA')}
          />
          )}
        
        <VoidSaleModal isOpen={showVoidModal} onClose={() => setShowVoidModal(false)} />

        {/* Sidebar / Menu rápido */}
      <StaffSidebar 
        icon={<Popcorn className="w-6 h-6" />} 
        tooltip="Venta de Dulcería" 
        shiftStatus={shiftStatus} 
        onRequestCloseShift={() => setShowCloseModal(true)} 
      />


      {/* Main Content */}
      <div className="flex-1 p-8 md:p-12 overflow-y-auto flex items-center justify-center">
        <div className="max-w-md mx-auto space-y-8 w-full text-center">
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Popcorn className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black text-foreground mb-2">Dulcería</h1>
            <p className="text-muted-foreground">Punto de Venta presencial Cinezone</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {shiftStatus === 'CERRADA' ? (
              <button 
                onClick={() => setShowOpenModal(true)}
                className="w-full py-6 bg-green-500 text-white font-black rounded-2xl text-xl flex items-center justify-center gap-3 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-95"
              >
                <LockOpen className="w-8 h-8" /> 
                Abrir Caja
              </button>
            ) : (
              <>
                <button 
                  onClick={startSale}
                  className="w-full py-6 bg-primary text-primary-foreground font-black rounded-2xl text-xl flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95"
                >
                  <Popcorn className="w-8 h-8" /> 
                  Iniciar Nueva Venta
                </button>
                
                <button 
                  onClick={() => router.push('/staff/validador')}
                  className="w-full py-6 bg-purple-600 text-white font-black rounded-2xl text-xl flex items-center justify-center gap-3 hover:bg-purple-700 transition-all shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-95"
                >
                  <QrCode className="w-8 h-8" /> 
                  Entregar Compras (QR)
                </button>
                
                <button 
                  onClick={() => setShowVoidModal(true)}
                  className="w-full py-4 bg-orange-500/10 text-orange-500 font-bold rounded-2xl text-lg flex items-center justify-center gap-3 hover:bg-orange-500 hover:text-white transition-all shadow-md active:scale-95 mt-4"
                >
                  <LockOpen className="w-6 h-6" />
                  Anular Venta (Supervisor)
                </button>
                
                <div className="h-px bg-border my-6"></div>

                <button 
                  onClick={() => setShowCloseModal(true)}
                  className="w-full py-4 border-2 border-destructive text-destructive font-bold rounded-2xl text-lg flex items-center justify-center gap-3 hover:bg-destructive hover:text-destructive-foreground transition-all active:scale-95"
                >
                  <LockOpen className="w-6 h-6" />
                  Cerrar Turno (Arqueo)
                </button>
              </>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}
