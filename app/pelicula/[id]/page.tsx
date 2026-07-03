'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Clock, Calendar, MapPin, Film, PlayCircle, Star, Info } from 'lucide-react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import api from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';

export default function PeliculaPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [movie, setMovie] = useState<any>(null);
  const [sedes, setSedes] = useState<any[]>([]);
  const [funciones, setFunciones] = useState<any[]>([]);
  
  const [selectedSede, setSelectedSede] = useState<number | null>(null);
  const [selectedCiudad, setSelectedCiudad] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingFunciones, setLoadingFunciones] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  // Agrupar sedes por ciudad
  const sedesPorCiudad = sedes.reduce((acc: Record<string, any[]>, sede: any) => {
    const ciudad = sede.ciudad || 'Otras Ciudades';
    if (!acc[ciudad]) acc[ciudad] = [];
    acc[ciudad].push(sede);
    return acc;
  }, {});

  // Funciones helper para fechas locales
  const getLocalDateStr = (dateRaw: string) => {
    const d = new Date(dateRaw);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const funcionesPorFecha = funciones.reduce((acc: Record<string, any[]>, funcion: any) => {
    const fechaRaw = funcion.fechaHora || funcion.horaInicio;
    if (!fechaRaw) return acc;
    const dateStr = getLocalDateStr(fechaRaw);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(funcion);
    return acc;
  }, {});

  const fechasDisponibles = Object.keys(funcionesPorFecha).sort();

  useEffect(() => {
    if (fechasDisponibles.length > 0 && (!selectedDate || !fechasDisponibles.includes(selectedDate))) {
      setSelectedDate(fechasDisponibles[0]);
    }
  }, [funciones, selectedDate]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [movieRes, sedesRes] = await Promise.all([
          api.get(`/peliculas/${params.id}`),
          api.get('/public/sedes')
        ]);
        setMovie(movieRes.data);
        setSedes(sedesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [params.id]);

  useEffect(() => {
    const fetchSedeStaff = async () => {
      const rol = localStorage.getItem('rol');
      if (['TAQUILLA', 'DULCERIA', 'ADMIN_SEDE', 'VALIDADOR', 'STAFF'].includes(rol || '')) {
        setIsStaff(true);
        try {
          const userRes = await api.get('/users/me');
          if (userRes.data.sedesIds && userRes.data.sedesIds.length > 0) {
            const sId = userRes.data.sedesIds[0];
            setSelectedSede(sId);
            localStorage.setItem('selectedSede', sId.toString());
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchSedeStaff();
  }, []);

  useEffect(() => {
    const fetchFunciones = async () => {
      if (!selectedSede) return;
      setLoadingFunciones(true);
      try {
        const response = await api.get(`/public/sedes/${selectedSede}/peliculas/${params.id}/funciones`);
        setFunciones(response.data);
      } catch (error) {
        console.error('Error fetching funciones:', error);
        setFunciones([]);
      } finally {
        setLoadingFunciones(false);
      }
    };

    fetchFunciones();
  }, [selectedSede, params.id]);

  const handleBuyTicket = (funcion: any) => {
    const store = useCartStore.getState();
    const targetFuncionId = funcion.funcionId || funcion.id;
    const isSameFuncion = store.funcionId === targetFuncionId;
    const hasActiveTimer = store.bookingExpiresAt && store.bookingExpiresAt > Date.now();

    if (!isSameFuncion) {
      // Diferente función: limpiamos asientos y empezamos de cero
      store.clearCart();
    }

    if (!isSameFuncion || !hasActiveTimer) {
      // Iniciamos el temporizador global de 5 minutos solo si es nueva o expiró
      store.startBookingTimer(5);
    }
    // Guardamos la info de la función y película para el checkout
    useCartStore.getState().setFuncion(funcion.funcionId || funcion.id, {
      id: movie.id,
      titulo: movie.titulo,
      posterUrl: movie.posterUrl,
      formato: funcion.formatoProyeccion || funcion.formato,
      idioma: funcion.idioma,
      fechaHora: funcion.fechaHora,
      sedeId: selectedSede,
      salaNombre: funcion.salaNombre || funcion.sala
    });

    router.push(`/reserva/${funcion.funcionId || funcion.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <h1 className="text-2xl font-bold">Película no encontrada</h1>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <Navbar />

      {/* Hero Section of Movie */}
      <div className="relative pt-24 md:pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src={movie.posterUrl} 
            alt={movie.titulo} 
            fill 
            className="object-cover opacity-20 blur-xl scale-110"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-[280px] md:w-[350px] aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl shrink-0 border border-white/10"
            >
              <Image 
                src={movie.posterUrl} 
                alt={movie.titulo} 
                fill 
                className="object-cover"
                priority
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 flex-1 text-center md:text-left"
            >
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground">
                  {movie.titulo}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-medium">
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full border border-primary/30">
                    {movie.clasificacion}
                  </span>
                  <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full">
                    {movie.genero}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-sm font-medium backdrop-blur-md border border-white/10">
                    <Clock className="w-4 h-4" /> {movie.duracionMinutos ? `${Math.floor(movie.duracionMinutos / 60)}h ${movie.duracionMinutos % 60}min` : ''}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Info className="w-4 h-4" /> {movie.idioma}
                  </span>
                </div>
              </div>

              <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mx-auto md:mx-0">
                {movie.sinopsis}
              </p>

              {movie.trailerUrl && (
                <div className="pt-4">
                  <a href={movie.trailerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl transition-colors">
                    <PlayCircle className="w-5 h-5" /> Ver Tráiler
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Booking Section */}
      <div className="container mx-auto px-6 py-12">
        <motion.div 
          className="bg-card border border-border rounded-3xl p-6 md:p-8 lg:p-12 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Left: Select Sede */}
            <div className="w-full lg:w-1/3 space-y-6">
              {isStaff ? (
                <div>
                  <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-primary" />
                    Sede Asignada
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Mostrando funciones exclusivamente para la sede en la que operas.
                  </p>
                  {selectedSede && sedes.length > 0 && (
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary font-bold">
                      {sedes.find(s => s.id === selectedSede)?.nombre || 'Sede'}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-2xl font-black mb-2">1. Elige tu Cine</h2>
                    <p className="text-muted-foreground text-sm">Selecciona la ciudad y luego tu sede preferida</p>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Dropdown de Ciudad */}
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-2">Ciudad</label>
                      <div className="relative">
                        <select 
                          className="w-full bg-secondary text-foreground p-4 rounded-xl border border-border appearance-none outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                          value={selectedCiudad || ''}
                          onChange={(e) => {
                             setSelectedCiudad(e.target.value);
                             setSelectedSede(null); // Resetear sede al cambiar ciudad
                          }}
                        >
                          <option value="" disabled>Selecciona una ciudad...</option>
                          {Object.keys(sedesPorCiudad).sort().map(ciudad => (
                            <option key={ciudad} value={ciudad}>{ciudad}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Sedes por Ciudad */}
                    {selectedCiudad && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3 pt-2"
                      >
                        <label className="block text-sm font-bold text-foreground mb-2">Sedes disponibles</label>
                        {sedesPorCiudad[selectedCiudad].map((sede: any) => (
                          <button
                            key={sede.id}
                            onClick={() => {
                              setSelectedSede(sede.id);
                              localStorage.setItem('selectedSede', sede.id.toString());
                            }}
                            className={`w-full text-left p-4 rounded-xl transition-all border flex items-center gap-3 ${
                              selectedSede === sede.id 
                              ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                              : 'bg-background border-border hover:border-primary/50 text-foreground'
                            }`}
                          >
                            <MapPin className={`w-5 h-5 shrink-0 ${selectedSede === sede.id ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div>
                              <div className="font-bold">{sede.nombre}</div>
                              <div className="text-xs opacity-70 mt-0.5">{sede.direccion}</div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </>
              )}
              {sedes.length === 0 && !loading && (
                <div className="text-sm text-muted-foreground italic p-4 bg-secondary/50 rounded-xl">No hay sedes disponibles.</div>
              )}
            </div>

            {/* Right: Select Showtime */}
            <div className="w-full lg:w-2/3 space-y-6">
              <div>
                <h2 className="text-2xl font-black mb-2">2. Horarios Disponibles</h2>
                <p className="text-muted-foreground text-sm">Selecciona la función que prefieras para reservar</p>
              </div>

              {loadingFunciones ? (
                <div key="loading-funciones" className="h-32 flex items-center justify-center border-2 border-dashed border-border rounded-xl">
                  <div className="animate-pulse text-muted-foreground">Buscando funciones...</div>
                </div>
              ) : !selectedSede ? (
                <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl text-center p-6 bg-secondary/10">
                  <MapPin className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-muted-foreground font-medium text-lg">Selecciona una sede</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Elige una ciudad y un cine para ver los horarios disponibles.</p>
                </div>
              ) : funciones.length > 0 ? (
                <div key="list-funciones" className="space-y-6">
                  {/* Selector de Fechas */}
                  {fechasDisponibles.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
                      {fechasDisponibles.map((fecha) => {
                        const dateObj = new Date(fecha + 'T12:00:00'); // Mediodía local para evitar desfases
                        const isSelected = selectedDate === fecha;
                        
                        const diaSemana = dateObj.toLocaleDateString('es-PE', { weekday: 'short' });
                        const diaNumero = dateObj.getDate();
                        const mes = dateObj.toLocaleDateString('es-PE', { month: 'short' });

                        return (
                          <button
                            key={fecha}
                            onClick={() => setSelectedDate(fecha)}
                            className={`flex flex-col items-center justify-center min-w-[5rem] py-3 rounded-2xl border transition-all ${
                              isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105'
                              : 'bg-background hover:bg-secondary border-border text-foreground'
                            }`}
                          >
                            <span className="text-xs uppercase font-bold opacity-80">{diaSemana}</span>
                            <span className="text-xl font-black">{diaNumero}</span>
                            <span className="text-xs font-semibold">{mes}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Grid de Funciones */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedDate && funcionesPorFecha[selectedDate]?.map((funcion: any, idx: number) => {
                      const fechaRaw = funcion.fechaHora || funcion.horaInicio;
                      const fecha = fechaRaw ? new Date(fechaRaw) : new Date();
                      const hora = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const dia = fecha.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' });

                      return (
                        <div key={funcion.funcionId || funcion.id || `func-${idx}`} className="bg-background border border-border p-4 rounded-xl flex flex-col justify-between gap-4 hover:border-primary/50 transition-colors">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-lg font-black text-primary">{hora}</div>
                              <div className="text-xs px-2 py-1 bg-secondary rounded-md font-semibold">{dia}</div>
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">
                              Sala: {funcion.auditoriumNombre || funcion.salaNombre || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {funcion.formatoProyeccion || funcion.formato} · {funcion.idioma}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleBuyTicket(funcion)}
                            className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold transition-all"
                          >
                            Comprar Entrada
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl text-center p-6 bg-secondary/20">
                  <Film className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-muted-foreground font-medium">No hay funciones programadas para esta película en la sede seleccionada.</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Intenta seleccionando otra sede.</p>
                </div>
              )}
            </div>

          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
