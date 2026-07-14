"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Ticket, AlertTriangle, PackageOpen, AlertOctagon, MonitorPlay, ShieldAlert, KeyRound, Clock, Activity, X, History } from "lucide-react";
import { useSedeStore } from "@/store/useSedeStore";

const glassTooltipStyle = {
  backgroundColor: 'rgba(9, 9, 11, 0.85)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: '#fff',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
};

const cardVariants: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function AdminSedeDashboard() {
  const { activeSedeId } = useSedeStore();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [totp, setTotp] = useState<{ code: string; expires: number } | null>(null);
  
  // Removed Anulaciones History State since it is now in its own page

  useEffect(() => {
    if (activeSedeId && activeSedeId !== "all") {
      fetchDashboardData();
    }
  }, [activeSedeId]);

  useEffect(() => {
    fetchTotp();
    
    // Smooth countdown local
    const localTick = setInterval(() => {
      setTotp(prev => {
        if (!prev) return prev;
        const nextSecs = prev.expires - 1;
        if (nextSecs <= 0) {
          fetchTotp(); // Force refresh if we hit 0 locally
          return { ...prev, expires: 60 };
        }
        return { ...prev, expires: nextSecs };
      });
    }, 1000);
    
    // Remote Sync every 15s to correct drift
    const remoteSync = setInterval(fetchTotp, 15000);
    
    return () => {
      clearInterval(localTick);
      clearInterval(remoteSync);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/dashboard/admin-sede/${activeSedeId}`);
      setDashboardData(res.data);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotp = async () => {
    try {
      const res = await api.get("/admin/dashboard/admin-sede/codigo-autorizacion");
      setTotp({ code: res.data.codigo, expires: res.data.segundosRestantes });
    } catch (error) {
      console.error("Error fetching TOTP", error);
    }
  };

  // Removed fetchAnulaciones and openAnulacionesModal

  if (!activeSedeId || activeSedeId === "all") {
    return <div className="p-8 text-center text-muted-foreground">Seleccione una sede específica para ver su panel táctico.</div>;
  }

  if (loading || !dashboardData) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando panel de sede...</div>;
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 bg-[#09090b] min-h-screen text-foreground">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white drop-shadow-sm">Panel Táctico Admin Sede</h1>
          <p className="text-muted-foreground/80 mt-2 text-md font-medium">1. Panel Control Diario | 2. Monitor Ocupación | 3. Control Dulcería | 4. Auditoría</p>
        </div>
      </motion.div>

      {/* 1. Panel de Control Diario */}
      <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-2">1. Panel de Control Diario</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 shadow-[0_0_40px_-15px_rgba(16,185,129,0.2)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-emerald-400 uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Ingresos Hoy vs Meta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">S/ {dashboardData.ingresosHoy || "0.00"}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 shadow-[0_0_40px_-15px_rgba(59,130,246,0.2)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-blue-400 uppercase flex items-center gap-2">
                <Activity className="w-4 h-4" /> Ocupación Promedio Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{dashboardData.ocupacionPromedioDia || 0}%</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border-purple-500/20 shadow-[0_0_40px_-15px_rgba(168,85,247,0.2)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-purple-400 uppercase flex items-center gap-2">
                <MonitorPlay className="w-4 h-4" /> Estado de Cajas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white">Abiertas: {dashboardData.estadoCajas?.abiertas || 0} / Totales: {dashboardData.estadoCajas?.total || 0}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20 shadow-[0_0_40px_-15px_rgba(239,68,68,0.2)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-red-400 uppercase flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" /> Alertas Críticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{dashboardData.alertasCriticas?.total || (dashboardData.alertasCriticas?.mantenimiento + dashboardData.alertasCriticas?.reclamos + dashboardData.alertasCriticas?.sistemas) || 0}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 2. Monitor Ocupacion */}
      <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-2">2. Monitor Ocupación</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/50 border-border/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Curva de Afluencia (Hoy)</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={dashboardData.curvaAfluencia || []}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                 <XAxis dataKey="hora" stroke="#888" fontSize={12} />
                 <YAxis stroke="#888" fontSize={12} />
                 <Tooltip contentStyle={glassTooltipStyle} />
                 <Area type="monotone" dataKey="tickets" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
               </AreaChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 backdrop-blur-md overflow-y-auto max-h-[350px] custom-scrollbar">
          <CardHeader>
            <CardTitle>Heatmap de Funciones (Ocupación)</CardTitle>
          </CardHeader>
          <CardContent>
             {dashboardData.heatmapFunciones?.map((h: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 border-b border-white/5">
                   <span className="font-medium text-white">{h.funcion}</span>
                   <span className={`font-bold ${h.ocupacion >= 80 ? 'text-emerald-400' : h.ocupacion >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{h.ocupacion}%</span>
                </div>
             ))}
          </CardContent>
        </Card>
      </div>

      {/* 3. Control Dulceria */}
      <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-2">3. Control Dulcería</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/50 border-border/50 backdrop-blur-md overflow-y-auto max-h-[350px] custom-scrollbar">
          <CardHeader className="bg-orange-500/5">
            <CardTitle className="text-orange-500 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Semáforo Stock Crítico</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {dashboardData.stockCritico?.map((s: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5">
                   <span className="font-bold text-white">{s.producto}</span>
                   <span className="font-black text-orange-500">{s.stock} und</span>
                </div>
             ))}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50 backdrop-blur-md overflow-y-auto max-h-[350px] custom-scrollbar">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PackageOpen className="w-5 h-5"/> Últimos Movimientos de Inventario</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {dashboardData.ultimosMovimientos?.map((m: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5">
                   <div>
                     <p className="font-bold text-white">{m.producto}</p>
                     <p className="text-xs text-muted-foreground">{m.tipo}</p>
                   </div>
                   <span className="font-bold text-white">{m.cantidad}</span>
                </div>
             ))}
          </CardContent>
        </Card>
      </div>

      {/* 4. Auditoria */}
      <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-2">4. Auditoría, Personal y Mantenimiento</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/50 border-border/50 backdrop-blur-md overflow-y-auto max-h-[350px] custom-scrollbar">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Revisión de Arqueos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {dashboardData.revisionArqueos?.map((r: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/5">
                   <span className="font-bold text-white">{r.cajero}</span>
                   <span className={`font-bold ${Math.abs(parseFloat(r.descuadre)) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>Descuadre: S/{r.descuadre}</span>
                </div>
             ))}
          </CardContent>
        </Card>

        {/* TOTP Widget */}
        <Card className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-500/20 shadow-xl relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <KeyRound size={160} />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="flex items-center gap-2 text-indigo-400"><KeyRound className="w-5 h-5"/> Código Autorización de Cancelación</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="text-6xl font-black font-mono tracking-widest text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                {totp ? (
                  <motion.span
                    key={totp.code}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    {totp.code.match(/.{1,3}/g)?.join(' ')}
                  </motion.span>
                ) : (
                  "------"
                )}
              </div>
              <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" /> 
                  Expira en: 
                  <span className={`font-bold w-6 text-center inline-block ${totp?.expires && totp.expires <= 10 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                    {totp ? `${totp.expires}s` : "--s"}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground/60 max-w-[250px] text-center leading-tight mt-2">
                Proporcione este código al personal de taquilla o dulcería para autorizar anulaciones. Válido por 60 segundos.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
