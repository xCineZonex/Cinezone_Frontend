"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { 
  KeyRound, 
  MonitorPlay, 
  PackageSearch, 
  Users, 
  RefreshCw,
  Clock,
  ArrowRightLeft
} from "lucide-react";
import { useSedeStore } from "@/store/useSedeStore";

export default function JefeSalaDashboard() {
  const { activeSedeId } = useSedeStore();
  const [loading, setLoading] = useState(false);
  const [totp, setTotp] = useState<{ codigoFormateado: string, segundosRestantes: number } | null>(null);
  const [semaforo, setSemaforo] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);

  // Fetch TOTP every 1 second or fetch from backend when it expires
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const fetchTotp = async () => {
      try {
        const res = await api.get('/admin/dashboard/jefe-sala/totp');
        setTotp(res.data);
      } catch (error) {
        console.error("Error fetching TOTP", error);
      }
    };

    fetchTotp();

    interval = setInterval(() => {
      setTotp(prev => {
        if (!prev) return prev;
        if (prev.segundosRestantes <= 1) {
          fetchTotp();
          return { ...prev, segundosRestantes: 60 };
        }
        return { ...prev, segundosRestantes: prev.segundosRestantes - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeSedeId && activeSedeId !== "all") {
      fetchDashboardData();
    }
  }, [activeSedeId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [semaforoRes, stockRes, turnosRes] = await Promise.all([
        api.get(`/admin/dashboard/jefe-sala/semaforo?sedeId=${activeSedeId}`),
        api.get(`/admin/dashboard/jefe-sala/stock?sedeId=${activeSedeId}`),
        api.get(`/admin/dashboard/jefe-sala/turnos-activos?sedeId=${activeSedeId}`)
      ]);
      setSemaforo(semaforoRes.data);
      setStock(stockRes.data);
      setTurnos(turnosRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  if (!activeSedeId || activeSedeId === "all") {
    return <div className="p-8 text-center text-muted-foreground">Seleccione su sede asignada.</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 bg-[#09090b] min-h-screen text-foreground">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Dashboard Jefe de Sala
          </h1>
          <p className="text-muted-foreground mt-1">Monitoreo en tiempo real para gestión de cine</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 text-sm text-white font-medium"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* 1. TOTP Gigante */}
        <Card className="col-span-1 xl:col-span-1 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-500/20 backdrop-blur-md shadow-xl flex flex-col justify-center items-center p-8 relative overflow-hidden">
          <div className="absolute top-4 left-4 text-indigo-400 flex items-center gap-2 font-semibold">
            <KeyRound className="w-5 h-5" /> Autorizaciones
          </div>
          <div className="absolute top-4 right-4 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
            <Clock className="w-3 h-3" /> {totp?.segundosRestantes || 0}s
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={totp?.codigoFormateado || 'loading'}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="text-6xl md:text-7xl font-black tracking-widest text-white mt-4"
            >
              {totp?.codigoFormateado || "------"}
            </motion.div>
          </AnimatePresence>
          <p className="text-muted-foreground mt-4 text-center text-sm max-w-xs">
            Código para aprobar anulaciones y reembolsos en Taquilla y Dulcería.
          </p>
          
          {/* Progress bar */}
          <div className="w-full h-1 bg-white/5 absolute bottom-0 left-0">
            <motion.div 
              className="h-full bg-indigo-500"
              initial={{ width: "100%" }}
              animate={{ width: `${((totp?.segundosRestantes || 60) / 60) * 100}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
        </Card>

        {/* 4. Turnos Activos */}
        <Card className="col-span-1 xl:col-span-2 bg-card/50 border-border/50 backdrop-blur-md shadow-xl h-[300px] overflow-hidden flex flex-col">
          <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10 py-4">
            <CardTitle className="text-lg text-emerald-500 flex items-center gap-2">
              <Users className="w-5 h-5" /> Turnos Activos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
            {turnos.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground p-6">
                No hay turnos de caja abiertos en este momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {turnos.map((turno, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-white font-bold">{turno.userName}</div>
                        <div className="text-xs text-muted-foreground mt-1">Turno ID: #{turno.shiftId}</div>
                      </div>
                      <div className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold">
                        ABIERTA
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t border-white/5 text-sm">
                      <span className="text-muted-foreground">Apertura:</span>
                      <span className="text-white font-medium">
                        {new Date(turno.openedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* 2. Semaforo de Salas */}
        <Card className="bg-card/50 border-border/50 backdrop-blur-md shadow-xl min-h-[400px] flex flex-col">
          <CardHeader className="bg-white/5 border-b border-white/10 py-4">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <MonitorPlay className="w-5 h-5 text-purple-400" /> Semáforo de Salas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1">
            {semaforo.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No hay funciones programadas para hoy.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {semaforo.map((sala, i) => {
                  let bgColor = "bg-green-500/20 border-green-500/30";
                  let textColor = "text-green-400";
                  
                  if (sala.status === "YELLOW") {
                    bgColor = "bg-yellow-500/20 border-yellow-500/30";
                    textColor = "text-yellow-400";
                  } else if (sala.status === "RED") {
                    bgColor = "bg-red-500/20 border-red-500/30";
                    textColor = "text-red-400";
                  }

                  return (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-xl border ${bgColor} flex flex-col justify-between aspect-square transition-all cursor-pointer`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-xl font-black ${textColor}`}>
                          {sala.auditoriumName}
                        </span>
                        <div className={`w-3 h-3 rounded-full ${sala.status === 'RED' ? 'bg-red-500 animate-pulse' : sala.status === 'YELLOW' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      </div>
                      
                      <div className="mt-2 flex-1 flex items-center justify-center text-center">
                        <p className="text-white font-medium text-sm line-clamp-2">
                          {sala.movieTitle}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">
                          {new Date(sala.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <span className="font-bold text-white">
                          {sala.occupancyPercentage.toFixed(0)}%
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Inventario de Piso */}
        <Card className="bg-card/50 border-border/50 backdrop-blur-md shadow-xl min-h-[400px] flex flex-col">
          <CardHeader className="bg-orange-500/5 border-b border-orange-500/10 py-4">
            <CardTitle className="text-lg text-orange-500 flex items-center gap-2">
              <PackageSearch className="w-5 h-5" /> Stock de Piso & Traspasos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
            {stock.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground p-6">
                No hay inventario registrado en esta sede.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {stock.map((item, i) => (
                  <div key={i} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                    <div>
                      <p className="font-bold text-white text-base">{item.productName}</p>
                      <p className="text-xs text-muted-foreground mt-1">ID: {item.productId}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`text-2xl font-black ${item.stock <= 20 ? 'text-red-500' : 'text-white'}`}>
                          {item.stock}
                        </span>
                        <p className="text-[10px] uppercase text-muted-foreground">Unds</p>
                      </div>
                      <button className="p-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded-lg transition-colors">
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
