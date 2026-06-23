'use client';

import { useState, useEffect } from 'react';
import { useSedeStore } from '@/store/useSedeStore';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { History, Clock, AlertOctagon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AnulacionesPage() {
  const { activeSedeId } = useSedeStore();
  const [anulaciones, setAnulaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeSedeId && activeSedeId !== "all") {
      fetchAnulaciones();
    } else {
      setAnulaciones([]);
    }
  }, [activeSedeId]);

  const fetchAnulaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usamos el endpoint para listar las anulaciones (tipo de alerta de anulación de venta)
      const res = await api.get("/alertas/historial/anulaciones");
      setAnulaciones(res.data || []);
    } catch (err: any) {
      console.error("Error fetching anulaciones", err);
      setError("No se pudo cargar el historial. Asegúrate de que el backend esté actualizado.");
    } finally {
      setLoading(false);
    }
  };

  if (!activeSedeId || activeSedeId === "all") {
    return <div className="p-8 text-center text-muted-foreground">Seleccione una sede específica en el menú superior para ver su historial de anulaciones.</div>;
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8 bg-[#09090b] min-h-screen text-foreground">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white drop-shadow-sm flex items-center gap-3">
            <History className="w-8 h-8 text-indigo-400" />
            Historial de Anulaciones
          </h1>
          <p className="text-muted-foreground/80 mt-2 text-md font-medium">Registro de auditoría de ventas anuladas en la sede actual</p>
        </div>
      </motion.div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card className="bg-card/50 border-border/50 backdrop-blur-md">
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground animate-pulse">Cargando historial de auditoría...</div>
          ) : anulaciones.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No hay anulaciones registradas para esta sede.</div>
          ) : (
            <div className="space-y-4">
              {anulaciones.map((a: any) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={a.id} 
                  className="p-5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="text-base font-semibold text-white mb-1">{a.mensaje}</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md">
                        Autorizado por: {a.emisorEmail || 'Desconocido'}
                      </span>
                      {a.tipo && (
                        <span className="bg-white/10 px-2 py-1 rounded-md text-xs">{a.tipo}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0 bg-black/30 px-3 py-2 rounded-lg">
                    <Clock className="w-4 h-4" />
                    {new Date(a.fechaCreacion).toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
