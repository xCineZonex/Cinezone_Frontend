"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, Users, Ticket, Film, Building2, Popcorn, AlertTriangle, Award, Gift } from "lucide-react";

const glassTooltipStyle = {
  backgroundColor: 'rgba(9, 9, 11, 0.85)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: '#fff',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({
    ingresosBrutosDia: 0,
    margenDulceria: 0,
    usuariosActivos: 0,
    topPeliculas: [],
    ocupacionSedes: [],
    alertasSistemaCajas: 0,
    termometroQuejas: [],
    distribucionClientes: [],
    totalPuntosEmitidos: 0,
    beneficiosPendientes: 0
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/dashboard/super-admin");
      setData(res.data);
    } catch (error) {
      console.error("Error fetching super admin dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando métricas de Super Admin...</div>;
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-12 bg-[#09090b] min-h-screen text-foreground">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground/80 mt-3 text-lg font-medium">Control total y métricas en tiempo real</p>
        </div>
      </motion.div>

      {/* 1. Panel Financiero */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-2">1. Panel Financiero</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <Card className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20 shadow-[0_0_40px_-15px_rgba(139,92,246,0.2)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-500" /> Ingresos Brutos del Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-white">S/ {data.ingresosBrutosDia?.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20 shadow-[0_0_40px_-15px_rgba(236,72,153,0.2)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <Popcorn className="w-4 h-4 text-pink-500" /> Margen Dulcería (Strike Rate)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-white">{data.margenDulceria?.toFixed(2) || 0}%</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 shadow-[0_0_40px_-15px_rgba(59,130,246,0.2)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" /> Usuarios Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-white">{data.usuariosActivos?.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 2. Monitor Taquilla */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-2">2. Monitor Taquilla</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <Card className="bg-card/50 border-border/50 backdrop-blur-md shadow-xl h-full flex flex-col">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Film className="w-5 h-5 text-emerald-500" /> Top Películas
                </CardTitle>
                <CardDescription>Por recaudación</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topPeliculas} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="titulo" width={120} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={glassTooltipStyle} cursor={{ fill: '#ffffff0a' }} />
                    <Bar dataKey="recaudacion" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
            <Card className="bg-card/50 border-border/50 backdrop-blur-md shadow-xl h-full flex flex-col">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-500" /> Ocupación Nacional
                </CardTitle>
                <CardDescription>Por sede</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse mt-4">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="p-4 font-semibold text-muted-foreground text-sm">Sede</th>
                      <th className="p-4 font-semibold text-muted-foreground text-sm text-right">Ocupados</th>
                      <th className="p-4 font-semibold text-muted-foreground text-sm text-right">Capacidad</th>
                      <th className="p-4 font-semibold text-muted-foreground text-sm text-right">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {(!data.ocupacionSedes || data.ocupacionSedes.length === 0) ? (
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No hay datos disponibles</td></tr>
                    ) : (
                      data.ocupacionSedes.map((item: any, idx: number) => {
                        const pct = item.capacidad > 0 ? ((item.ocupados / item.capacidad) * 100).toFixed(1) : "0.0";
                        return (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-medium text-foreground">{item.sede}</td>
                            <td className="p-4 text-muted-foreground text-right">{item.ocupados}</td>
                            <td className="p-4 text-muted-foreground text-right">{item.capacidad}</td>
                            <td className="p-4 font-bold text-cyan-400 text-right">{pct}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 3. Centro Auditoria */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-2">3. Centro Auditoria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.6 }}>
            <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20 shadow-[0_0_40px_-15px_rgba(239,68,68,0.2)] h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Alertas de Cajas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-white">{data.alertasSistemaCajas || 0}</div>
                <p className="text-muted-foreground mt-2 text-sm">Descuadres y problemas de seguridad</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.7 }}>
            <Card className="bg-card/50 border-border/50 backdrop-blur-md shadow-xl h-full flex flex-col">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-yellow-500" /> Termómetro de Quejas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse mt-4">
                  <tbody className="divide-y divide-border/50">
                    {(!data.termometroQuejas || data.termometroQuejas.length === 0) ? (
                      <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">Sin quejas registradas</td></tr>
                    ) : (
                      data.termometroQuejas.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-medium text-foreground">{item.sede}</td>
                          <td className="p-4 font-bold text-red-400 text-right">{item.cantidad}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 4. Programa Lealtad */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-2">4. Programa Lealtad</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.8 }}>
            <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-500/20 shadow-[0_0_40px_-15px_rgba(99,102,241,0.2)] h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-500" /> Puntos Emitidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-white">{data.totalPuntosEmitidos?.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.9 }}>
            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 shadow-[0_0_40px_-15px_rgba(16,185,129,0.2)] h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-500" /> Beneficios Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-white">{data.beneficiosPendientes?.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 1.0 }}>
            <Card className="bg-card/50 border-border/50 backdrop-blur-md shadow-xl h-full flex flex-col">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" /> Distribución Clientes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse mt-4">
                  <tbody className="divide-y divide-border/50">
                    {(!data.distribucionClientes || data.distribucionClientes.length === 0) ? (
                      <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">Sin datos</td></tr>
                    ) : (
                      data.distribucionClientes.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-medium text-foreground">{item.nivel}</td>
                          <td className="p-4 font-bold text-indigo-400 text-right">{item.cantidad}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
