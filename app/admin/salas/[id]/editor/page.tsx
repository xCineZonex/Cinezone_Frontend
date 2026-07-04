'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import { ArrowLeft, Save, Trash2, Monitor } from 'lucide-react';
import Link from 'next/link';

// ── TIPOS ─────────────────────────────────────────────────────────────────────
type CellType = 'EMPTY' | 'ESTANDAR' | 'VIP' | 'DISCAPACIDAD' | 'SCREEN';
type Tool = CellType | 'ERASER' | 'MANTENIMIENTO';

interface GridCell { type: CellType; enMantenimiento?: boolean; }

const TOOL_CONFIG: Record<Tool, { label: string; color: string; icon: string; bg: string; border: string }> = {
  ESTANDAR:     { label: 'Estándar',     color: 'text-blue-400',   icon: '🪑', bg: 'bg-blue-500/20',  border: 'border-blue-500' },
  VIP:          { label: 'VIP',          color: 'text-yellow-400', icon: '🌟', bg: 'bg-yellow-500/20', border: 'border-yellow-500' },
  DISCAPACIDAD: { label: 'Discapacidad', color: 'text-green-400',  icon: '♿', bg: 'bg-green-500/20', border: 'border-green-500' },
  SCREEN:       { label: 'Pantalla',     color: 'text-purple-400', icon: '🎬', bg: 'bg-purple-500/20',border: 'border-purple-500' },
  ERASER:       { label: 'Borrador',     color: 'text-red-400',    icon: '🧹', bg: 'bg-red-500/20',   border: 'border-red-500' },
  MANTENIMIENTO:{ label: 'Mantenimiento',color: 'text-gray-400',   icon: '🔧', bg: 'bg-gray-800',     border: 'border-gray-600' },
  EMPTY:        { label: 'Vacío',        color: 'text-gray-500',   icon: ' ',  bg: 'bg-transparent',  border: 'border-transparent' },
};

const CELL_COLORS: Record<CellType, string> = {
  EMPTY:        'bg-transparent border-border/30',
  ESTANDAR:     'bg-blue-500/70 border-blue-400 shadow-sm shadow-blue-500/30',
  VIP:          'bg-yellow-500/70 border-yellow-400 shadow-sm shadow-yellow-500/30',
  DISCAPACIDAD: 'bg-green-500/70 border-green-400 shadow-sm shadow-green-500/30',
  SCREEN:       'bg-purple-600/80 border-purple-400 shadow-sm shadow-purple-500/30',
};

export default function EditSalaEditorPage() {
  const router = useRouter();
  const params = useParams();
  const auditoriumId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [salaInfo, setSalaInfo] = useState<any>(null);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [gridRows, setGridRows] = useState(10);
  const [gridCols, setGridCols] = useState(15);
  const [activeTool, setActiveTool] = useState<Tool>('ESTANDAR');
  const [isPainting, setIsPainting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSalaData(); }, [auditoriumId]);

  const buildEmptyGrid = (rows: number, cols: number): GridCell[][] =>
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ type: 'EMPTY' as CellType }))
    );

  const loadSalaData = async () => {
    setLoading(true);
    try {
      const seatsRes = await api.get(`/admin/catalogo/salas/${auditoriumId}/asientos`);
      const seats: any[] = seatsRes.data;

      let maxRow = 10, maxCol = 15;
      for (const s of seats) {
        if (s.gridRow && s.gridRow > maxRow) maxRow = s.gridRow;
        if (s.gridCol && s.gridCol > maxCol) maxCol = s.gridCol;
      }

      const rows = Math.max(maxRow, 10);
      const cols = Math.max(maxCol, 15);
      setGridRows(rows);
      setGridCols(cols);

      const newGrid = buildEmptyGrid(rows, cols);

      for (const seat of seats) {
        const r = seat.gridRow ? seat.gridRow - 1 : 0;
        const c = seat.gridCol ? seat.gridCol - 1 : 0;
        if (r < rows && c < cols) {
          newGrid[r][c] = { type: (seat.tipo || 'ESTANDAR') as CellType, enMantenimiento: seat.enMantenimiento };
        }
      }

      setGrid(newGrid);

      if (seats.length > 0 && seats[0].auditorium) {
        setSalaInfo(seats[0].auditorium);
      } else {
        const res = await api.get(`/admin/catalogo/sedes/0/salas`); // Fallback fetch? No, the seats should have it.
        // Actually we don't have a direct "get sala info" endpoint based on the controller research.
        // But the seat object contains the auditorium.
        setSalaInfo({ nombre: `Sala #${auditoriumId}` });
      }
    } catch {
      toast.error('Error al cargar los datos de la sala');
      setGrid(buildEmptyGrid(10, 15));
      setSalaInfo({ nombre: `Sala #${auditoriumId}` });
    } finally {
      setLoading(false);
    }
  };

  const paintCell = useCallback((row: number, col: number) => {
    setGrid(prev => {
      const next = prev.map(r => [...r]);
      const cell = next[row][col];
      if (activeTool === 'MANTENIMIENTO') {
        if (cell.type !== 'EMPTY' && cell.type !== 'SCREEN') {
          cell.enMantenimiento = !cell.enMantenimiento;
        }
      } else {
        const newType: CellType = activeTool === 'ERASER' ? 'EMPTY' : activeTool as CellType;
        next[row][col] = { type: newType, enMantenimiento: newType === 'EMPTY' ? false : cell.enMantenimiento };
      }
      return next;
    });
  }, [activeTool]);

  const handleMouseDown = (row: number, col: number) => { setIsPainting(true); paintCell(row, col); };
  const handleMouseEnter = (row: number, col: number) => { if (isPainting) paintCell(row, col); };
  const handleMouseUp = () => setIsPainting(false);

  const clearGrid = () => {
    setGrid(buildEmptyGrid(gridRows, gridCols));
    toast.info('Lienzo limpiado');
  };

  const countByType = (type: CellType) => grid.flat().filter(c => c.type === type).length;

  const handleSave = async () => {
    const asientos = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c];
        if (cell.type !== 'EMPTY' && cell.type !== 'SCREEN') {
          asientos.push({ gridRow: r + 1, gridCol: c + 1, tipo: cell.type, enMantenimiento: cell.enMantenimiento || false });
        }
      }
    }

    if (asientos.length === 0) {
      toast.error('Debes tener al menos un asiento en el mapa.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: salaInfo?.nombre || '',
        cinemaId: salaInfo?.cinema?.id || salaInfo?.cinemaId || null,
        gridRows,
        gridCols,
        asientos,
      };
      console.log('[SAVE] Enviando payload:', JSON.stringify(payload));
      const res = await api.put(`/admin/catalogo/salas/${auditoriumId}/layout`, payload);
      console.log('[SAVE] Respuesta exitosa:', res.status);
      toast.success('¡Sala actualizada exitosamente!');
      setTimeout(() => {
        window.location.href = '/admin/salas';
      }, 800);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Error al guardar los cambios';
      console.error('[SAVE] Error completo:', err.response?.status, err.response?.data, err);
      toast.error(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const getToolsForSala = (tipo?: string): Tool[] => {
    const t = tipo?.toUpperCase() || 'FORMAT_2D';
    const baseTools: Tool[] = ['ESTANDAR', 'DISCAPACIDAD'];
    const extraTools: Tool[] = ['ERASER', 'MANTENIMIENTO'];
    
    const hasVipSeats = grid.some(row => row.some(cell => cell.type === 'VIP'));

    if (t === 'VIP') return ['VIP', ...extraTools];
    if (t === 'IMAX' || hasVipSeats) return [...baseTools, 'VIP', ...extraTools];
    return [...baseTools, ...extraTools];
  };

  const tools: Tool[] = getToolsForSala(salaInfo?.tipo || salaInfo?.formato);

  useEffect(() => {
    if (salaInfo) {
      const validTools = getToolsForSala(salaInfo?.tipo);
      if (!validTools.includes(activeTool) && activeTool !== 'MANTENIMIENTO' && activeTool !== 'ERASER') {
        setActiveTool(validTools[0]);
      }
    }
  }, [salaInfo]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Cargando mapa de la sala...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" onMouseUp={handleMouseUp}>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/admin/salas">
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="font-black text-lg leading-tight">
              Editando: <span className="text-primary">{salaInfo?.nombre}</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              {gridRows} filas × {gridCols} columnas ·{' '}
              <span className="text-blue-400">{countByType('ESTANDAR')} est.</span> ·{' '}
              <span className="text-yellow-400">{countByType('VIP')} VIP</span> ·{' '}
              <span className="text-green-400">{countByType('DISCAPACIDAD')} disc.</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearGrid}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Limpiar
          </button>
          <motion.button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold rounded-lg text-sm transition-colors"
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : <Save className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </motion.button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Paleta lateral */}
        <div className="shrink-0 w-44 bg-card border-r border-border flex flex-col gap-1 p-3 overflow-y-auto">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Herramientas</p>
          {tools.map(tool => {
            const cfg = TOOL_CONFIG[tool];
            const isActive = activeTool === tool;
            return (
              <button
                key={tool}
                onClick={() => setActiveTool(tool)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  isActive
                    ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                    : 'border-transparent hover:bg-secondary text-muted-foreground'
                }`}
              >
                <span className="text-lg">{cfg.icon}</span>
                <span>{cfg.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current" />}
              </button>
            );
          })}

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Conteo</p>
            {(['ESTANDAR', 'VIP', 'DISCAPACIDAD'] as CellType[]).map(t => (
              <div key={t} className="flex items-center justify-between py-1 text-xs">
                <span className={TOOL_CONFIG[t].color}>{TOOL_CONFIG[t].icon} {TOOL_CONFIG[t].label}</span>
                <span className="font-bold text-foreground">{countByType(t)}</span>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Total</span>
              <span className="font-black text-primary text-sm">
                {countByType('ESTANDAR') + countByType('VIP') + countByType('DISCAPACIDAD')}
              </span>
            </div>
          </div>
        </div>

        {/* Área del lienzo */}
        <div className="flex-1 overflow-auto bg-background/50 flex flex-col items-center justify-start p-6 gap-4">
          <div className="shrink-0 flex items-center gap-3 mb-4">
            <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent rounded-full" />
            <div className="flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full">
              <Monitor className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">PANTALLA</span>
            </div>
            <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent rounded-full" />
          </div>

          <div
            className="shrink-0 select-none"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`, gap: '3px' }}
            onMouseLeave={() => setIsPainting(false)}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`relative rounded border transition-all duration-75 cursor-crosshair flex items-center justify-center text-xs select-none
                    ${CELL_COLORS[cell.type]}
                    ${cell.type === 'EMPTY' ? 'hover:bg-border/20' : 'hover:brightness-110'}
                  `}
                  style={{ width: 28, height: 28 }}
                  onMouseDown={() => handleMouseDown(r, c)}
                  onMouseEnter={() => handleMouseEnter(r, c)}
                  title={`${String.fromCharCode(65 + r)}${c + 1}${cell.type !== 'EMPTY' ? ' · ' + cell.type : ''}${cell.enMantenimiento ? ' (MANTENIMIENTO)' : ''}`}
                >
                  {cell.enMantenimiento ? (
                    <span className="text-[10px] text-gray-800">🔧</span>
                  ) : (
                    <>
                      {cell.type === 'SCREEN' && <span className="text-[10px]">🎬</span>}
                      {cell.type === 'VIP' && <span className="text-[8px] font-black text-yellow-200">VIP</span>}
                      {cell.type === 'DISCAPACIDAD' && <span className="text-[10px]">♿</span>}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
