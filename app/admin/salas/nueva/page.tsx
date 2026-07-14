'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useSedeStore } from '@/store/useSedeStore';
import {
  ArrowLeft, Save, Trash2, Monitor,
  ChevronDown, ChevronUp, Settings
} from 'lucide-react';
import Link from 'next/link';

// ── TIPOS ─────────────────────────────────────────────────────────────────────
type CellType = 'EMPTY' | 'ESTANDAR' | 'VIP' | 'DISCAPACIDAD' | 'SCREEN';
type Tool = CellType | 'ERASER';

interface GridCell {
  type: CellType;
}

const TOOL_CONFIG: Record<Tool, { label: string; color: string; icon: string; bg: string; border: string }> = {
  ESTANDAR:    { label: 'Estándar',     color: 'text-blue-400',   icon: '🪑', bg: 'bg-blue-500/20',   border: 'border-blue-500' },
  VIP:         { label: 'VIP',          color: 'text-yellow-400', icon: '🌟', bg: 'bg-yellow-500/20', border: 'border-yellow-500' },
  DISCAPACIDAD:{ label: 'Discapacidad', color: 'text-green-400',  icon: '♿', bg: 'bg-green-500/20',  border: 'border-green-500' },
  SCREEN:      { label: 'Pantalla',     color: 'text-purple-400', icon: '🎬', bg: 'bg-purple-500/20', border: 'border-purple-500' },
  ERASER:      { label: 'Borrador',     color: 'text-red-400',    icon: '🧹', bg: 'bg-red-500/20',    border: 'border-red-500' },
  EMPTY:       { label: 'Vacío',        color: 'text-gray-500',   icon: ' ',  bg: 'bg-transparent',   border: 'border-transparent' },
};

const CELL_COLORS: Record<CellType, string> = {
  EMPTY:        'bg-transparent border-border/30',
  ESTANDAR:     'bg-blue-500/70 border-blue-400 shadow-sm shadow-blue-500/30',
  VIP:          'bg-yellow-500/70 border-yellow-400 shadow-sm shadow-yellow-500/30',
  DISCAPACIDAD: 'bg-green-500/70 border-green-400 shadow-sm shadow-green-500/30',
  SCREEN:       'bg-purple-600/80 border-purple-400 shadow-sm shadow-purple-500/30',
};

export default function SeatEditorPage() {
  const router = useRouter();
  const [step, setStep] = useState<'config' | 'draw'>('config');

  // Config step
  const { activeSedeId, assignedSedes } = useSedeStore();
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'FORMAT_2D',
    cinemaId: activeSedeId !== 'all' ? activeSedeId : '',
    gridRows: 10,
    gridCols: 15,
  });

  // Draw step
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [activeTool, setActiveTool] = useState<Tool>('ESTANDAR');
  const [isPainting, setIsPainting] = useState(false);
  const [saving, setSaving] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSedeId !== 'all') {
      setForm(prev => ({ ...prev, cinemaId: activeSedeId }));
    }
  }, [activeSedeId]);

  const initGrid = () => {
    if (!form.nombre || !form.cinemaId) {
      toast.error('Completa el nombre y la sede primero.');
      return;
    }
    const rows = Math.min(Math.max(form.gridRows, 2), 26);
    const cols = Math.min(Math.max(form.gridCols, 2), 30);
    const empty: GridCell[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ type: 'EMPTY' as CellType }))
    );
    setGrid(empty);
    setStep('draw');
  };

  const paintCell = useCallback((row: number, col: number) => {
    setGrid(prev => {
      const next = prev.map(r => [...r]);
      const newType: CellType = activeTool === 'ERASER' ? 'EMPTY' : activeTool as CellType;
      next[row][col] = { type: newType };
      return next;
    });
  }, [activeTool]);

  const handleMouseDown = (row: number, col: number) => {
    setIsPainting(true);
    paintCell(row, col);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (isPainting) paintCell(row, col);
  };

  const handleMouseUp = () => setIsPainting(false);

  const clearGrid = () => {
    setGrid(prev => prev.map(r => r.map(() => ({ type: 'EMPTY' as CellType }))));
    toast.info('Lienzo limpiado');
  };

  const countByType = (type: CellType) =>
    grid.flat().filter(c => c.type === type).length;

  const handleSave = async () => {
    const asientos = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c];
        if (cell.type !== 'EMPTY' && cell.type !== 'SCREEN') {
          asientos.push({ gridRow: r + 1, gridCol: c + 1, tipo: cell.type });
        }
      }
    }

    if (asientos.length === 0) {
      toast.error('Debes dibujar al menos un asiento antes de guardar.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin/catalogo/salas/layout', {
        nombre: form.nombre,
        tipo: form.tipo,
        cinemaId: Number(form.cinemaId),
        gridRows: form.gridRows,
        gridCols: form.gridCols,
        asientos,
      });
      toast.success(`¡Sala "${form.nombre}" creada con ${asientos.length} asientos!`);
      router.push('/admin/salas');
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar la sala');
    } finally {
      setSaving(false);
    }
  };

  const getToolsForSala = (tipo: string): Tool[] => {
    const t = tipo?.toUpperCase() || 'FORMAT_2D';
    const baseTools: Tool[] = ['ESTANDAR', 'DISCAPACIDAD'];
    if (t === 'VIP') return ['VIP', 'ERASER'];
    if (t === 'IMAX') return [...baseTools, 'ERASER'];
    return [...baseTools, 'ERASER'];
  };

  const tools: Tool[] = getToolsForSala(form.tipo);

  useEffect(() => {
    const validTools = getToolsForSala(form.tipo);
    if (!validTools.includes(activeTool)) {
      setActiveTool(validTools[0]);
    }
  }, [form.tipo, activeTool]);

  // ── PASO 1: CONFIGURACIÓN ──────────────────────────────────────────────────
  if (step === 'config') {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/salas">
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-foreground">Nueva Sala</h1>
            <p className="text-muted-foreground text-sm">Configura las dimensiones del lienzo</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
          {/* Configuración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Nombre de la Sala</label>
              <input
                type="text"
                placeholder="Ej. Sala Premium 1, IMAX Norte..."
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Tipo de Sala (Formato)</label>
              <select
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                value={form.tipo}
                onChange={e => setForm({ ...form, tipo: e.target.value })}
              >
                <option value="FORMAT_2D">REGULAR (2D)</option>
                <option value="FORMAT_3D">3D</option>
                <option value="VIP">VIP</option>
                <option value="IMAX">IMAX</option>
                <option value="FORMAT_4DX">4DX</option>
              </select>
            </div>
          </div>

          {/* Sede */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Sede</label>
            <select
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              value={form.cinemaId}
              onChange={e => setForm({ ...form, cinemaId: e.target.value })}
              disabled={activeSedeId !== 'all'}
            >
              <option value="">-- Selecciona una sede --</option>
              {assignedSedes.filter(s => s.id !== 'all').map(s => (
                <option key={s.id} value={s.id}>{s.nombre} · {s.ciudad}</option>
              ))}
            </select>
            {activeSedeId !== 'all' && (
              <p className="text-xs text-muted-foreground mt-2">La sede está fijada por tu Contexto de Trabajo actual.</p>
            )}
          </div>

          {/* Dimensiones */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Filas <span className="text-muted-foreground font-normal">(máx. 26)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setForm(f => ({ ...f, gridRows: Math.max(2, f.gridRows - 1) }))}
                  className="w-10 h-10 flex items-center justify-center bg-secondary rounded-lg hover:bg-border transition-colors font-bold text-lg"
                >−</button>
                <span className="flex-1 text-center text-2xl font-black text-primary">{form.gridRows}</span>
                <button
                  onClick={() => setForm(f => ({ ...f, gridRows: Math.min(26, f.gridRows + 1) }))}
                  className="w-10 h-10 flex items-center justify-center bg-secondary rounded-lg hover:bg-border transition-colors font-bold text-lg"
                >+</button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">Filas A → {String.fromCharCode(64 + form.gridRows)}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Columnas <span className="text-muted-foreground font-normal">(máx. 30)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setForm(f => ({ ...f, gridCols: Math.max(2, f.gridCols - 1) }))}
                  className="w-10 h-10 flex items-center justify-center bg-secondary rounded-lg hover:bg-border transition-colors font-bold text-lg"
                >−</button>
                <span className="flex-1 text-center text-2xl font-black text-primary">{form.gridCols}</span>
                <button
                  onClick={() => setForm(f => ({ ...f, gridCols: Math.min(30, f.gridCols + 1) }))}
                  className="w-10 h-10 flex items-center justify-center bg-secondary rounded-lg hover:bg-border transition-colors font-bold text-lg"
                >+</button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">Capacidad máx: {form.gridRows * form.gridCols}</p>
            </div>
          </div>

          {/* Preview mini-grid */}
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-3 font-medium">Vista previa del lienzo</p>
            <div
              className="inline-grid gap-0.5 mx-auto"
              style={{ gridTemplateColumns: `repeat(${Math.min(form.gridCols, 20)}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: Math.min(form.gridRows, 10) * Math.min(form.gridCols, 20) }).map((_, i) => (
                <div key={i} className="w-3 h-2 rounded-sm bg-border/50" />
              ))}
            </div>
            {form.gridRows > 10 || form.gridCols > 20 ? (
              <p className="text-xs text-muted-foreground mt-2 italic">Vista previa reducida</p>
            ) : null}
          </div>

          <motion.button
            onClick={initGrid}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Monitor className="w-5 h-5" />
            Abrir Editor de Sala
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" onMouseUp={handleMouseUp}>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep('config')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-black text-lg leading-tight">{form.nombre}</h1>
            <p className="text-xs text-muted-foreground">
              {form.gridRows} filas × {form.gridCols} columnas
              {' · '}
              <span className="text-blue-400">{countByType('ESTANDAR')} estándar</span>
              {' · '}
              <span className="text-yellow-400">{countByType('VIP')} VIP</span>
              {' · '}
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
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Guardando...' : 'Guardar Sala'}
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
              <span className="text-muted-foreground font-medium">Total asientos</span>
              <span className="font-black text-primary text-sm">
                {countByType('ESTANDAR') + countByType('VIP') + countByType('DISCAPACIDAD')}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              💡 <strong>Tip:</strong> Arrastra el mouse para pintar varias celdas a la vez.
            </p>
          </div>
        </div>

        {/* Área del lienzo */}
        <div className="flex-1 overflow-auto bg-background/50 flex flex-col items-center justify-start p-6 gap-4">
          {/* Indicador de pantalla */}
          <div className="shrink-0 flex items-center gap-3">
            <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent rounded-full" />
            <div className="flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full">
              <Monitor className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">PANTALLA / ESCENARIO</span>
            </div>
            <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent rounded-full" />
          </div>

          {/* Grid */}
          <div
            ref={gridRef}
            className="shrink-0 select-none"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${form.gridCols}, minmax(0, 1fr))`,
              gap: '3px',
            }}
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
                  title={cell.type !== 'EMPTY' ? `${String.fromCharCode(65 + r)}${c + 1} · ${cell.type}` : `${String.fromCharCode(65 + r)}${c + 1}`}
                >
                  {cell.type === 'SCREEN' && <span className="text-[10px]">🎬</span>}
                  {cell.type === 'VIP' && <span className="text-[8px] font-black text-yellow-200">VIP</span>}
                  {cell.type === 'DISCAPACIDAD' && <span className="text-[10px]">♿</span>}
                </div>
              ))
            )}
          </div>

          {/* Leyenda de filas */}
          <div className="shrink-0 flex gap-1 mt-2">
            {Array.from({ length: form.gridRows }, (_, i) => (
              <div key={i} style={{ width: 28 }} className="text-center text-[10px] text-muted-foreground font-bold">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
