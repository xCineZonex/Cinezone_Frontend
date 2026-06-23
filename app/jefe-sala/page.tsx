'use client';

import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Line, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Area, ComposedChart
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Projector, Package, Clock, Wrench, AlertCircle, CheckCircle2,
  Clock3, Flame, ShieldCheck, RefreshCw
} from 'lucide-react';
import api from '@/lib/api';
import { useSedeStore } from '@/store/useSedeStore';

const glassTooltipStyle = {
  backgroundColor: 'rgba(9, 9, 11, 0.9)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};

// Removed mock data arrays

function SalaCard({ sala, pelicula, status, ocupacion }: any) {
  const colors: Record<string, { bg: string; border: string; dot: string; label: string }> = {
    OK:       { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.4)',  dot: '#10b981', label: 'En Función' },
    CREDITS:  { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.4)', dot: '#f59e0b', label: 'Créditos ⚠' },
    INCIDENT: { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.5)',  dot: '#ef4444', label: 'Incidencia 🚨' },
  };
  const c = colors[status] ?? colors.OK;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl p-5 flex flex-col gap-3 overflow-hidden"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      {status === 'INCIDENT' && (
        <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
      )}
      <div className="flex justify-between items-center">
        <span className="font-black text-white text-lg">{sala}</span>
        <span className="text-xs font-bold px-2 py-1 rounded-full"
          style={{ background: c.border, color: '#fff' }}>{c.label}</span>
      </div>
      <p className="text-zinc-400 text-sm truncate">{pelicula}</p>
      <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${ocupacion}%`, background: `linear-gradient(90deg, ${c.dot}99, ${c.dot})` }}
        />
      </div>
      <span className="text-xs text-zinc-400 font-semibold">{ocupacion}% ocupado</span>
    </motion.div>
  );
}

function UrgencyBadge({ urgencia }: { urgencia: string }) {
  const map: Record<string, string> = {
    alta:  'bg-red-500/20 text-red-400 border-red-500/40',
    media: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    baja:  'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${map[urgencia] ?? map.baja}`}>
      {urgencia}
    </span>
  );
}

export default function JefeSalaDashboard() {
  const [salas, setSalas] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [colaDulceria, setColaDulceria] = useState<any[]>([]);
  const [colaTaquilla, setColaTaquilla] = useState<any[]>([]);
  const [kanban, setKanban] = useState<any>({ reportado: [], atendiendo: [], resuelto: [] });
  const [authCode, setAuthCode] = useState<{ codigo: string; segundosRestantes: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const { activeSedeId: sedeId } = useSedeStore();

  useEffect(() => {
    if (!sedeId || sedeId === 'all') return;
    
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/jefe-sala/dashboard`, { params: { sedeId } }).catch(() => ({ data: {} }));
        const data = res.data || {};

        setSalas(data.salas || []);
        
        const stockData = Array.isArray(data.stock) ? data.stock.map((item: any, i: number) => ({
          name: item.name || item.nombre || `Item ${i+1}`,
          value: item.value || item.cantidad || item.stock || 0,
          fill: item.fill || ['#ef4444', '#f59e0b', '#10b981'][i % 3]
        })) : [];
        setStock(stockData);
        
        setColaDulceria(data.colaDulceria || []);
        setColaTaquilla(data.colaTaquilla || []);
        setKanban(data.kanban || { reportado: [], atendiendo: [], resuelto: [] });
      } catch (error) {
        console.error("Error fetching data", error);
        setSalas([]);
        setStock([]);
        setColaDulceria([]);
        setColaTaquilla([]);
        setKanban({ reportado: [], atendiendo: [], resuelto: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [sedeId]);

  useEffect(() => {
    const fetchCode = async () => {
      try {
        const { data } = await api.get('/auth/cancellation-code');
        setAuthCode(data);
      } catch {
        setAuthCode(null);
      }
    };
    fetchCode();
    
    // Smooth countdown local
    const localTick = setInterval(() => {
      setAuthCode(prev => {
        if (!prev) return prev;
        const nextSecs = prev.segundosRestantes - 1;
        if (nextSecs <= 0) {
          fetchCode(); // Force refresh if we hit 0 locally
          return { ...prev, segundosRestantes: 60 };
        }
        return { ...prev, segundosRestantes: nextSecs };
      });
    }, 1000);
    
    // Remote Sync every 15s to correct drift
    const remoteSync = setInterval(fetchCode, 15000);
    
    return () => {
      clearInterval(localTick);
      clearInterval(remoteSync);
    };
  }, []);

  const codeProgress = authCode ? (authCode.segundosRestantes / 60) * 100 : 0;

  const stockTotal = stock.reduce((a, b) => a + b.value, 0);
  const criticos = stock.filter(s => s.value < 20).length;
  
  const salasActivas = salas.filter((s: any) => s.status === 'AVAILABLE' || s.estado === 'DISPONIBLE').length;
  const promOcupacion = salas.length > 0
    ? Math.round(salas.reduce((acc: number, s: any) => acc + (s.ocupacion || 0), 0) / salas.length)
    : 0;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 bg-[#09090b] min-h-screen">

      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-orange-400 via-rose-400 to-red-500 bg-clip-text text-transparent">
            Centro de Control Operativo
          </h1>
          <p className="text-zinc-400 mt-2 text-lg font-medium">
            Jefe de Sala — Monitoreo en tiempo real
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {salas.filter((s: any) => s.status === 'OK').length} Salas OK
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-bold text-sm">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
            {salas.filter((s: any) => s.status === 'CREDITS').length} En Créditos
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            {salas.filter((s: any) => s.status === 'INCIDENT').length} Incidencia
          </div>
        </div>
      </motion.div>

      {/* CÓDIGO DE AUTORIZACIÓN */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="relative rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-rose-500/5 to-transparent p-6 flex flex-col md:flex-row items-center gap-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-orange-500/20 border border-orange-500/30">
              <ShieldCheck className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Código de Autorización de Cancelación</p>
              <p className="text-zinc-400 text-sm">Muéstralo al cajero para aprobar la anulación de una venta. Cambia cada minuto.</p>
            </div>
          </div>
          <div className="flex items-center gap-6 ml-auto">
            <div className="text-center">
              <p className="text-6xl font-black tracking-[0.3em] text-white font-mono"
                style={{ textShadow: '0 0 30px rgba(251,146,60,0.6)' }}>
                {authCode?.codigo ?? '------'}
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-14 h-14">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                  <circle cx="28" cy="28" r="22" fill="none"
                    stroke={codeProgress > 30 ? '#f97316' : '#ef4444'}
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 22}`}
                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - codeProgress / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">
                  {authCode?.segundosRestantes ?? 0}s
                </span>
              </div>
              <span className="text-xs text-zinc-500 font-semibold">restantes</span>
            </div>
          </div>
        </div>
      </motion.div>

      {(!sedeId || sedeId === 'all') ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-zinc-400 text-lg font-medium">Seleccione una sede específica para ver el panel de control operativo.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Salas Activas', value: `${salasActivas} / ${salas.length || 0}`, icon: Projector, color: '#10b981', from: 'from-emerald-500/10' },
          { label: 'Insumos Críticos', value: `${criticos} items`, icon: Flame, color: '#ef4444', from: 'from-red-500/10' },
          { label: 'Incidentes Abiertos', value: `${kanban.reportado.length + kanban.atendiendo.length}`, icon: AlertCircle, color: '#8b5cf6', from: 'from-violet-500/10' }
        ].map((kpi, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative p-5 rounded-2xl border border-white/5 bg-gradient-to-br ${kpi.from} to-transparent`}>
            <kpi.icon className="w-7 h-7 mb-3" style={{ color: kpi.color }} />
            <p className="text-3xl font-black text-white">{kpi.value}</p>
            <p className="text-xs text-zinc-400 font-semibold mt-1 uppercase tracking-wider">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Semáforo de Salas */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="mb-4 flex items-center gap-2">
          <Projector className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-black text-white">Semáforo de Salas</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {salas.map((s, i) => <SalaCard key={i} {...s} />)}
        </div>
      </motion.div>

      {/* Stock + Colas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Donut Stock Crítico */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="relative rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-black text-white">Inventario Crítico</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-[200px] w-[200px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="glowStock">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <Pie data={stock} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                    paddingAngle={3} dataKey="value" stroke="none">
                    {stock.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} filter="url(#glowStock)" opacity={entry.value < 20 ? 1 : 0.5} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={glassTooltipStyle}
                    itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                    formatter={(v: any, name: string) => [
                      <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{`${v} unid.`}</span>,
                      <span style={{ color: '#a1a1aa' }}>{name}</span>
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {stock.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300 font-semibold">{s.name}</span>
                    <span className="font-black" style={{ color: s.fill }}>{s.value}%</span>
                  </div>
                  <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${s.value}%`, background: s.fill,
                        boxShadow: s.value < 20 ? `0 0 8px ${s.fill}` : 'none' }} />
                  </div>
                  {s.value < 20 && (
                    <p className="text-xs text-red-400 font-bold mt-0.5 animate-pulse">⚠ Stock crítico — solicitar restock</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Sparklines de Colas */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="relative rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl p-6 overflow-hidden space-y-6">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-white">Tiempos de Cola (últ. hora)</h2>
          </div>

          {[{ label: 'Taquilla', data: colaTaquilla, color: '#3b82f6', avg: colaTaquilla.length ? Math.round(colaTaquilla.reduce((a: any, b: any) => a + b.min, 0) / colaTaquilla.length) : 0 }].map((q, i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-zinc-300">{q.label}</span>
                <span className="text-2xl font-black" style={{ color: q.color }}>{q.avg} min</span>
              </div>
              <div className="h-[80px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={q.data} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`fill${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={q.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={q.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" tick={{ fill: '#ffffff', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#ffffff', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={glassTooltipStyle} formatter={(v: any) => [`${v} min`, 'Espera']} />
                    <Area type="monotone" dataKey="min" fill={`url(#fill${i})`} stroke="none" />
                    <Line type="monotone" dataKey="min" stroke={q.color} strokeWidth={3}
                      dot={{ r: 3, fill: '#09090b', strokeWidth: 2, stroke: q.color }}
                      activeDot={{ r: 6, fill: q.color }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Kanban */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-violet-400" />
          <h2 className="text-xl font-black text-white">Tablero Kanban — Incidencias Operativas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Reportado',   data: kanban.reportado,  icon: AlertCircle,   color: 'text-red-400',    border: 'border-red-500/30',     bg: 'bg-red-500/5' },
            { title: 'Atendiendo',  data: kanban.atendiendo, icon: Clock3,        color: 'text-yellow-400', border: 'border-yellow-500/30',  bg: 'bg-yellow-500/5' },
            { title: 'Resuelto',    data: kanban.resuelto,   icon: CheckCircle2,  color: 'text-emerald-400',border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
          ].map((col, i) => (
            <div key={i} className={`rounded-2xl border ${col.border} ${col.bg} p-5`}>
              <div className={`flex items-center gap-2 mb-4 ${col.color}`}>
                <col.icon className="w-5 h-5" />
                <span className="font-black text-white">{col.title}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold border ${col.border} ${col.color}`}>
                  {col.data.length}
                </span>
              </div>
              <div className="space-y-3">
                {col.data.length === 0 ? (
                  <p className="text-zinc-600 text-sm italic text-center py-4">Sin incidencias</p>
                ) : col.data.map((item: any) => (
                  <div key={item.id}
                    className="p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                    <p className="text-sm text-zinc-200 font-semibold mb-2">{item.texto}</p>
                    <UrgencyBadge urgencia={item.urgencia} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      </>
      )}

    </div>
  );
}
