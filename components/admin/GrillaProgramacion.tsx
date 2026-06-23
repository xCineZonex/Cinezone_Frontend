'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const calculateLeft = (startTime: string, timelineStartHour = 10) => {
  const date = new Date(startTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours < timelineStartHour) return 0;
  const totalMinutesFromStart = ((hours - timelineStartHour) * 60) + minutes;
  return (totalMinutesFromStart / 840) * 100;
};

const calculateWidth = (durationMinutes: number) => {
  return ((durationMinutes + 30) / 840) * 100;
};

interface GrillaProps {
  sedeId: string;
  selectedDate: string; // YYYY-MM-DD
  previewFunction?: {
    auditoriumId: string;
    fechaHora: string;
    durationMinutes: number;
    title: string;
  } | null;
  excludeFunctionId?: string;
}

export default function GrillaProgramacion({ sedeId, selectedDate, previewFunction, excludeFunctionId }: GrillaProps) {
  const [loading, setLoading] = useState(false);
  const [funciones, setFunciones] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);

  useEffect(() => {
    if (sedeId && selectedDate) {
      fetchData();
    } else {
      setFunciones([]);
      setSalas([]);
    }
  }, [sedeId, selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resFunc, resSalas] = await Promise.all([
        api.get('/admin/catalogo/funciones'),
        api.get(`/admin/catalogo/sedes/${sedeId}/salas`)
      ]);
      const filtered = resFunc.data.filter((f: any) => {
        if (!f.fechaHora) return false;
        if (excludeFunctionId && f.id.toString() === excludeFunctionId) return false;
        const fDate = f.fechaHora.split('T')[0];
        return f.cinema?.id.toString() === sedeId && fDate === selectedDate;
      });
      setFunciones(filtered);
      setSalas(resSalas.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedBySala: Record<string, { nombre: string, funciones: any[] }> = {};
  salas.forEach(sala => {
    groupedBySala[sala.id.toString()] = {
      nombre: sala.nombre,
      funciones: []
    };
  });
  
  funciones.forEach(f => {
    const salaId = f.auditorium?.id?.toString();
    if (salaId && groupedBySala[salaId]) {
      groupedBySala[salaId].funciones.push(f);
    }
  });

  const hours = Array.from({ length: 14 }, (_, i) => i + 10);

  if (!sedeId || !selectedDate) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground shadow-sm h-full flex items-center justify-center">
        Selecciona una sede y una fecha para ver la grilla
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
      <div className="p-4 border-b border-border bg-secondary/20 flex justify-between items-center">
        <h3 className="font-bold">Ocupación de Salas</h3>
        <span className="text-xs text-muted-foreground">Incluye +30m de limpieza</span>
      </div>
      
      {/* Timeline Header */}
      <div className="flex border-b border-border bg-secondary/30 relative">
        <div className="w-[100px] shrink-0 border-r border-border p-3 flex items-center justify-center font-bold text-xs text-muted-foreground">
          SALA
        </div>
        <div className="flex-1 relative h-8 flex">
          {hours.map(hour => (
            <div key={hour} className="flex-1 border-r border-border/50 relative">
              <span className="absolute -left-2 top-2 text-[10px] font-semibold text-muted-foreground">
                {hour}:00
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Body */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">Cargando...</div>
      ) : Object.keys(groupedBySala).length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm flex-1 flex items-center justify-center">
          Salas disponibles todo el día.
        </div>
      ) : (
        <div className="flex flex-col relative divide-y divide-border/50 flex-1 overflow-y-auto">
          {Object.keys(groupedBySala).sort((a,b) => groupedBySala[a].nombre.localeCompare(groupedBySala[b].nombre)).map((salaId) => {
            const sala = groupedBySala[salaId];
            return (
            <div key={salaId} className="flex relative hover:bg-secondary/10 transition-colors group">
              <div className="w-[100px] shrink-0 border-r border-border p-3 flex flex-col justify-center bg-card z-10">
                <span className="font-bold text-xs truncate" title={sala.nombre}>{sala.nombre}</span>
              </div>
              <div className="flex-1 relative min-h-[60px]">
                <div className="absolute inset-0 flex pointer-events-none">
                  {hours.map(hour => (
                    <div key={hour} className="flex-1 border-r border-border/20"></div>
                  ))}
                </div>
                
                {/* Funciones Reales */}
                {sala.funciones.map((f: any) => {
                  const left = calculateLeft(f.fechaHora);
                  const width = calculateWidth(f.movie?.duracionMinutos || 120);
                  if (left > 100 || left + width < 0) return null;
                  return (
                    <motion.div
                      key={f.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`absolute top-2 bottom-2 rounded-md p-1.5 text-white shadow-sm transition-all hover:z-20 overflow-hidden ${
                        f.activa ? 'bg-primary' : 'bg-destructive opacity-80'
                      }`}
                      style={{
                        left: `${Math.max(0, left)}%`,
                        width: `${Math.min(100 - left, width)}%`,
                        minWidth: '40px'
                      }}
                      title={`${f.movie?.titulo} (${formatTime(f.fechaHora)})`}
                    >
                      <div className="font-bold text-[10px] truncate leading-tight">{f.movie?.titulo}</div>
                      <div className="flex items-center gap-1 mt-0.5 opacity-80 text-[9px]">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(f.fechaHora)}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Bloque Fantasma de Previsualización */}
                {previewFunction && previewFunction.auditoriumId === salaId && previewFunction.fechaHora.split('T')[0] === selectedDate && (
                  (() => {
                    const left = calculateLeft(previewFunction.fechaHora);
                    const width = calculateWidth(previewFunction.durationMinutes);
                    if (left > 100 || left + width < 0) return null;
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-2 bottom-2 rounded-md p-1.5 text-primary shadow-sm border-2 border-dashed border-primary bg-primary/20 z-30 overflow-hidden"
                        style={{
                          left: `${Math.max(0, left)}%`,
                          width: `${Math.min(100 - left, width)}%`,
                          minWidth: '40px'
                        }}
                      >
                        <div className="font-bold text-[10px] truncate leading-tight">PREVIEW: {previewFunction.title}</div>
                        <div className="flex items-center gap-1 mt-0.5 opacity-80 text-[9px] font-semibold">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTime(previewFunction.fechaHora)}
                        </div>
                      </motion.div>
                    );
                  })()
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
