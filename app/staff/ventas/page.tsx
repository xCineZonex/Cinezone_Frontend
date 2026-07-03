'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Ticket, Film, Clock, User as UserIcon, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import HeaderStaff from '@/components/HeaderStaff';

export default function HistorialVentasStaffPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const currentRole = localStorage.getItem('rol');
    const currentModule = localStorage.getItem('staff_module');
    
    const isActuallyPortero = currentRole === 'PORTERO' || currentModule === 'PORTERO';
    setRole(isActuallyPortero ? 'PORTERO' : currentRole);

    const fetchHistory = async () => {
      try {
        if (isActuallyPortero) {
          const res = await api.get('/users/me/validations');
          setItems(res.data);
        } else {
          const res = await api.get('/users/me/sales');
          let sales = res.data;
          
          if (currentModule === 'TAQUILLA') {
            sales = sales.filter((item: any) => item.peliculaTitulo !== 'Compra en Dulcería');
          } else if (currentModule === 'DULCERIA') {
            sales = sales.filter((item: any) => item.peliculaTitulo === 'Compra en Dulcería');
          }
          
          setItems(sales);
        }
      } catch (error) {
        console.error('Error fetching history', error);
        toast.error('Error al cargar el historial');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const isPortero = role === 'PORTERO';

  return (
    <main className="min-h-screen bg-background">
      <HeaderStaff />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-foreground">
                {isPortero ? 'Historial de Ingresos' : 'Historial de Ventas'}
              </h1>
              <p className="text-muted-foreground">
                {isPortero ? 'Revisa las entradas que has validado' : 'Revisa las boletas y ventas que has procesado'}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold">
            {isPortero ? <CheckCircle2 className="w-5 h-5" /> : <Ticket className="w-5 h-5" />}
            {items.length} {isPortero ? 'Validadas' : 'Ventas Totales'}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl">
            {isPortero ? <CheckCircle2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" /> : <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />}
            <h2 className="text-xl font-bold mb-2">No hay registros</h2>
            <p className="text-muted-foreground">Aún no has procesado nada en tu turno actual.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:border-primary/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shrink-0">
                    <Film className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{item.peliculaTitulo}</h3>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
                      <span className="flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" /> {item.sedeNombre} - {item.salaNombre}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(isPortero ? item.fechaValidacion : item.fechaCompra).toLocaleString('es-PE')}</span>
                      {isPortero && item.asiento && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="font-bold text-primary">Asiento {item.asiento}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-0 border-border pt-4 sm:pt-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.estado === 'VALIDA' || item.estado === 'USADA' ? 'bg-green-500/10 text-green-500' :
                    item.estado === 'ANULADA' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {item.estado}
                  </span>
                  {!isPortero && (
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">Total:</span>
                      <span className="font-black text-lg ml-2">S/ {Number(item.montoTotal).toFixed(2)}</span>
                    </div>
                  )}
                  {isPortero && (
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">{item.tipoEntrada}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
