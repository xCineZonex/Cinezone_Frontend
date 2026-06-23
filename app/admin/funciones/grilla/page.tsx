'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, Clock } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// Helper for formatting time (HH:MM)
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// Helper for Gantt positions
const calculateLeft = (startTime: string, timelineStartHour = 10) => {
  const date = new Date(startTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  if (hours < timelineStartHour) return 0; // Starts before timeline
  
  const totalMinutesFromStart = ((hours - timelineStartHour) * 60) + minutes;
  // Let's say our timeline spans 14 hours (10:00 to 24:00), which is 840 minutes.
  // We map 840 minutes to 100%.
  return (totalMinutesFromStart / 840) * 100;
};

const calculateWidth = (durationMinutes: number) => {
  // duration includes cleanup (e.g. 30 mins)
  // 840 minutes = 100%
  return ((durationMinutes + 30) / 840) * 100;
};

export default function GrillaProgramacionPage() {
  const [loading, setLoading] = useState(true);
  const [funciones, setFunciones] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [selectedSede, setSelectedSede] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedSede) {
      fetchFunciones();
    }
  }, [selectedSede, selectedDate]);

  const fetchInitialData = async () => {
    try {
      const resSedes = await api.get('/public/sedes');
      setSedes(resSedes.data);
      if (resSedes.data.length > 0) {
        setSelectedSede(resSedes.data[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching sedes:', error);
    }
  };

  const fetchFunciones = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/catalogo/funciones');
      // Filter by selected Sede and Date
      const filtered = res.data.filter((f: any) => {
        if (!f.fechaHora) return false;
        const fDate = new Date(f.fechaHora).toISOString().split('T')[0];
        return f.cinema?.id.toString() === selectedSede && fDate === selectedDate;
      });
      setFunciones(filtered);
    } catch (error) {
      console.error('Error fetching funciones:', error);
      toast.error('Error al cargar la grilla');
    } finally {
      setLoading(false);
    }
  };

  // Agrupar funciones por Sala
  const groupedBySala: Record<string, any[]> = {};
  funciones.forEach(f => {
    const salaName = f.auditorium?.nombre || 'Desconocida';
    if (!groupedBySala[salaName]) groupedBySala[salaName] = [];
    groupedBySala[salaName].push(f);
  });

  // Timeline hours (10:00 to 23:00)
  const hours = Array.from({ length: 14 }, (_, i) => i + 10);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/funciones" className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-foreground">Grilla de Programación</h1>
            <p className="text-muted-foreground">Vista interactiva de horarios (Gantt)</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-card p-2 rounded-xl border border-border shadow-sm">
          <select
            value={selectedSede}
            onChange={(e) => setSelectedSede(e.target.value)}
            className="px-4 py-2 bg-transparent outline-none font-semibold border-r border-border"
          >
            {sedes.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 px-4">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent outline-none font-semibold text-sm cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Timeline Header */}
        <div className="flex border-b border-border bg-secondary/30 relative">
          <div className="w-[200px] shrink-0 border-r border-border p-4 flex items-center justify-center font-bold text-sm text-muted-foreground">
            SALA
          </div>
          <div className="flex-1 relative h-12 flex">
            {hours.map(hour => (
              <div key={hour} className="flex-1 border-r border-border/50 relative">
                <span className="absolute -left-3 top-3 text-xs font-semibold text-muted-foreground">
                  {hour}:00
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Body */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">Cargando grilla...</div>
        ) : Object.keys(groupedBySala).length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No hay funciones programadas para esta fecha y sede.</div>
        ) : (
          <div className="flex flex-col relative divide-y divide-border/50">
            {Object.keys(groupedBySala).sort().map((salaName) => (
              <div key={salaName} className="flex relative hover:bg-secondary/10 transition-colors group">
                {/* Sala Label */}
                <div className="w-[200px] shrink-0 border-r border-border p-4 flex flex-col justify-center bg-card z-10">
                  <span className="font-bold">{salaName}</span>
                </div>
                
                {/* Timeline Tracks */}
                <div className="flex-1 relative min-h-[80px]">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {hours.map(hour => (
                      <div key={hour} className="flex-1 border-r border-border/20"></div>
                    ))}
                  </div>

                  {/* Funciones Blocks */}
                  {groupedBySala[salaName].map((f) => {
                    const left = calculateLeft(f.fechaHora);
                    const width = calculateWidth(f.movie?.duracionMinutos || 120);
                    
                    // Don't render if it's completely out of the 10:00-24:00 range
                    if (left > 100 || left + width < 0) return null;

                    return (
                      <Link href={`/admin/funciones/${f.id}/editar`} key={f.id}>
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`absolute top-2 bottom-2 rounded-lg p-2 text-xs text-white shadow-sm transition-all hover:ring-2 hover:ring-white hover:z-20 cursor-pointer overflow-hidden ${
                            f.activa ? 'bg-primary' : 'bg-destructive opacity-80'
                          }`}
                          style={{
                            left: `${Math.max(0, left)}%`,
                            width: `${Math.min(100 - left, width)}%`,
                            minWidth: '60px' // Ensure visibility for short blocks
                          }}
                          title={`${f.movie?.titulo} (${formatTime(f.fechaHora)})`}
                        >
                          <div className="font-bold truncate leading-tight">{f.movie?.titulo}</div>
                          <div className="flex items-center gap-1 mt-1 opacity-80 text-[10px]">
                            <Clock className="w-3 h-3" />
                            {formatTime(f.fechaHora)}
                          </div>
                          <div className="mt-1 font-semibold truncate opacity-90">{f.formatoProyeccion?.replace('FORMATO_', '')} • {f.idioma}</div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground px-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary"></div>
          Función Activa
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-destructive opacity-80"></div>
          Función Cancelada
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-dashed border-muted-foreground"></div>
          El bloque incluye +30 min de limpieza
        </div>
      </div>
    </div>
  );
}
