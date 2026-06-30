'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, MapPin, Calendar, Film, X as CloseIcon, Plus, Minus, Tag, Globe, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function CheckoutEntradasPage() {
  const router = useRouter();
  const { funcionId, pelicula, asientos, setTickets, bookingExpiresAt } = useCartStore();
  const seatsCount = asientos.length;

  const [generalTickets, setGeneralTickets] = useState<any[]>([]);
  const [dynamicBenefits, setDynamicBenefits] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Local state for quantities
  const [selectedTickets, setSelectedTickets] = useState<{ [key: string]: number }>({});
  const [selectedBenefits, setSelectedBenefits] = useState<{ [key: string]: number }>({});
  
  const [rol, setRol] = useState('');

  const [timeLeft, setTimeLeft] = useState('05:00');

  useEffect(() => {
    setRol(localStorage.getItem('rol') || '');
    if (!funcionId || seatsCount === 0) {
      toast.error('No has seleccionado asientos válidos.');
      router.push('/');
      return;
    }
    fetchData();
  }, [funcionId]);

  useEffect(() => {
    if (!bookingExpiresAt) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = bookingExpiresAt - now;
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft('00:00');
        toast.error('Tiempo expirado');
        
        // Unlock all seats on backend
        const unlockPromises = asientos.map(a => 
          api.delete('/reservas/asientos/unlock', {
            params: { funcionId, asientoId: a.asientoId }
          }).catch(console.error)
        );
        
        Promise.all(unlockPromises).finally(() => {
          useCartStore.getState().clearCart();
          router.push('/');
        });
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [bookingExpiresAt, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Usamos los endpoints correctos (agregando /public cuando aplique)
      const [ticketsRes, profileRes, benefitsRes] = await Promise.allSettled([
        api.get(`/public/funciones/${funcionId}/tipos-entrada`),
        api.get('/users/me'),
        api.get('/public/beneficios')
      ]);

      if (ticketsRes.status === 'fulfilled') {
        const apiTickets = ticketsRes.value.data.map((t: any) => ({
          id: t.tipo, 
          name: t.nombre || t.tipo,
          description: t.tipo === 'NORMAL' ? 'Entrada General' : t.tipo === 'TERCERA_EDAD' ? 'Mayores 60 años' : t.tipo === 'BENEFICIO' ? 'Entrada Promocional / Beneficio' : 'Conadis/Niños',
          price: t.precio,
          fee: 0.00, // Sin servicio extra
          isLowest: t.tipo === 'TERCERA_EDAD' || t.tipo === 'NINO'
        }));
        setGeneralTickets(apiTickets);
      }

      let userLevel = null;
      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data);
        userLevel = profileRes.value.data.nivelActual?.toUpperCase();
      }

      if (benefitsRes.status === 'fulfilled') {
        // Filtrar los beneficios según el nivel del usuario
        // Lógica de niveles: Azul = 1, Dorado = 2, Negro = 3
        const levelMap: Record<string, number> = {
          'AZUL': 1,
          'DORADO': 2,
          'NEGRO': 3
        };
        const userLevelScore = userLevel ? levelMap[userLevel] || 0 : 0;
        
        const validBenefits = benefitsRes.value.data.filter((b: any) => {
           const requiredScore = levelMap[b.tierName?.toUpperCase()] || 0;
           return userLevelScore >= requiredScore;
        });
        setDynamicBenefits(validBenefits);
      }

    } catch (e: any) {
      toast.error(e.response?.data?.message || e.response?.data?.error || 'Error cargando información de la función');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralChange = (id: string, delta: number) => {
    setSelectedTickets(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleBenefitChange = (id: string, delta: number) => {
    setSelectedBenefits(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const totalSelected = 
    Object.values(selectedTickets).reduce((a, b) => a + b, 0) + 
    dynamicBenefits.reduce((acc, b) => acc + (selectedBenefits[String(b.id)] || 0) * (b.ticketCount || 1), 0);

  const isMatched = totalSelected === seatsCount;

  useEffect(() => {
    const finalTickets: any[] = [];
    
    generalTickets.forEach(t => {
      const qty = selectedTickets[t.id] || 0;
      if (qty > 0) {
        finalTickets.push({
          label: t.name,
          cantidad: qty,
          precio: t.price + t.fee,
          typeKey: t.id
        });
      }
    });

    dynamicBenefits.forEach(b => {
      const bId = String(b.id);
      const qty = selectedBenefits[bId] || 0;
      if (qty > 0) {
        const tCount = b.ticketCount || 1;
        finalTickets.push({
          label: b.name,
          cantidad: qty * tCount,
          precio: b.price / tCount,
          typeKey: 'BENEFICIO',
          benefitId: b.id
        });
      }
    });

    setTickets(finalTickets);
  }, [selectedTickets, selectedBenefits, generalTickets, dynamicBenefits, setTickets]);

  const handleContinue = () => {
    if (!isMatched) {
      toast.error(`Debes seleccionar exactamente ${seatsCount} entrada(s). Has seleccionado ${totalSelected}.`);
      return;
    }
    
    if (rol === 'STAFF') {
      router.push('/checkout/pago');
    } else {
      router.push('/dulceria');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  const nivel = profile ? (profile.nivelActual || '').toUpperCase() : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium">
            <ArrowLeft className="w-5 h-5" /> Atrás
          </button>
          
          <h1 className="text-xl font-bold">2. Entradas</h1>
          
          <div className="flex items-center gap-4">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <Globe className="w-4 h-4" />
            </button>
            <button onClick={() => { useCartStore.getState().clearCart(); router.push('/'); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Progress Bar & Timer */}
        <div className="bg-secondary/30 border-b border-border py-2 px-4">
          <div className="container mx-auto flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="flex-1 h-2 bg-primary rounded-full" />
              <div className="flex-1 h-2 bg-primary rounded-full" />
              <div className="flex-1 h-2 bg-secondary rounded-full" />
              <div className="flex-1 h-2 bg-secondary rounded-full" />
            </div>
            <div className="flex items-center gap-2 text-destructive font-bold bg-destructive/10 px-3 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" /> {timeLeft}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Panel - Fixed */}
        <div className="w-full lg:w-1/3">
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-36">
            <div className="flex gap-4 mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-secondary flex-shrink-0 relative">
                <img src={pelicula.posterUrl || '/images/placeholder.jpg'} alt="Poster" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-xl font-black leading-tight mb-1">{pelicula.titulo || 'Película'}</h2>
                <div className="flex flex-wrap gap-2 text-xs font-bold mb-2">
                  <span className="bg-secondary px-2 py-0.5 rounded text-muted-foreground">{pelicula.formato || '2D'}</span>
                  <span className="bg-secondary px-2 py-0.5 rounded text-muted-foreground">{pelicula.idioma || 'SUB'}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 text-sm mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="font-bold">{pelicula.sedeNombre || 'Cinezone Center'}</p>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="font-semibold text-muted-foreground">{pelicula.fechaHora || 'Hoy, 20:00'}</p>
              </div>
              <div className="flex items-start gap-3">
                <Film className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="font-semibold text-muted-foreground">{pelicula.salaNombre || 'Sala 1'}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center text-lg font-black">
                <span>Butacas seleccionadas:</span>
                <span className="text-primary text-2xl">{seatsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Two Columns */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 sticky bottom-0 z-30 flex justify-between items-center shadow-2xl">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Seleccionadas: <span className={`font-black text-lg ${isMatched ? 'text-green-500' : 'text-primary'}`}>{totalSelected} / {seatsCount}</span></p>
              {!isMatched && <p className="text-xs text-destructive mt-1">Faltan {Math.max(0, seatsCount - totalSelected)} entradas</p>}
            </div>
            <button 
              onClick={handleContinue}
              disabled={!isMatched}
              className={`px-8 py-3 font-bold rounded-xl transition-all ${isMatched ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90' : 'bg-secondary text-muted-foreground cursor-not-allowed'}`}
            >
              {rol === 'STAFF' ? 'Continuar al Pago' : 'Continuar a Dulcería'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Column 1: Entradas generales */}
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" /> Entradas Generales
              </h3>
              <div className="space-y-4">
                {generalTickets.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No hay tipos de entradas disponibles.</p>
                ) : (
                  generalTickets.map(t => (
                    <div key={t.id} className="bg-secondary/30 border border-border p-4 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold flex items-center gap-2 text-foreground">
                            {t.name}
                            {t.isLowest && <span className="bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Precio más bajo</span>}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <div>
                          <p className="font-black text-xl text-primary">S/ {t.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-background rounded-lg p-1 border border-border">
                          <button onClick={() => handleGeneralChange(t.id, -1)} disabled={(selectedTickets[t.id] || 0) <= 0} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary disabled:opacity-50 transition-colors">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold w-4 text-center">{selectedTickets[t.id] || 0}</span>
                          <button onClick={() => handleGeneralChange(t.id, 1)} disabled={totalSelected + 1 > seatsCount} className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: Tus Beneficios */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-accent" /> Tus Beneficios
                </h3>
              </div>
              
              {!profile ? (
                <div className="bg-accent/10 border border-accent/20 p-6 rounded-xl text-center">
                  <h4 className="font-bold text-accent mb-2">Inicia sesión para ver tus beneficios</h4>
                  <p className="text-sm text-muted-foreground mb-4">Si eres socio Cinezone, podrías tener entradas a precio especial o gratis.</p>
                  <button onClick={() => router.push('/login')} className="px-4 py-2 bg-accent text-accent-foreground font-semibold rounded-lg text-sm w-full hover:bg-accent/90 transition-colors">Iniciar Sesión</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dynamicBenefits.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No tienes beneficios de entradas disponibles por el momento.</p>
                  ) : (
                    dynamicBenefits.map(b => {
                      const tCount = b.ticketCount || 1;
                      const currentSelected = selectedBenefits[String(b.id)] || 0;
                      const bMonthlyLimit = b.monthlyLimit || 0;
                      const usedThisMonth = profile?.monthlyBenefitUsage?.[String(b.id)] || 0;
                      const remainingInMonth = bMonthlyLimit > 0 ? (bMonthlyLimit - usedThisMonth - currentSelected * tCount) : Infinity;
                      
                      const hasEnoughLimit = remainingInMonth >= tCount;
                      const hasEnoughPoints = b.pointsRequired === 0 || (profile.puntos || 0) >= (currentSelected + 1) * b.pointsRequired;
                      const doesNotExceedSeats = totalSelected + tCount <= seatsCount;
                      
                      const showFmt = showtime?.formato || '2D';
                      const benFmt = b.formato || 'TODOS';
                      const hasValidFormat = benFmt === 'TODOS' || 
                                             benFmt === showFmt || 
                                             (benFmt === '2D' && showFmt === 'FORMAT_2D') || 
                                             (benFmt === 'FORMAT_2D' && showFmt === '2D') ||
                                             (benFmt === '3D' && showFmt === 'FORMAT_3D') ||
                                             (benFmt === 'FORMAT_3D' && showFmt === '3D');

                      const getTierColors = (tierName: string) => {
                        const t = (tierName || '').toLowerCase();
                        if (t.includes('negro') || t.includes('black')) return {
                          bg: 'from-zinc-800/40 to-background border-zinc-500/30',
                          blob: 'bg-zinc-500/10',
                          title: 'text-zinc-300',
                          badgeBg: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
                          btnBg: 'bg-zinc-500/20 text-zinc-400 hover:bg-zinc-600 hover:text-white',
                          btnHoverText: 'hover:text-zinc-400',
                          border: 'border-zinc-500/30'
                        };
                        if (t.includes('oro') || t.includes('gold')) return {
                          bg: 'from-amber-900/40 to-background border-amber-500/30',
                          blob: 'bg-amber-500/10',
                          title: 'text-amber-400',
                          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                          btnBg: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white',
                          btnHoverText: 'hover:text-amber-400',
                          border: 'border-amber-500/30'
                        };
                        if (t.includes('plata') || t.includes('silver')) return {
                          bg: 'from-slate-700/40 to-background border-slate-400/30',
                          blob: 'bg-slate-400/10',
                          title: 'text-slate-300',
                          badgeBg: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
                          btnBg: 'bg-slate-400/10 text-slate-400 hover:bg-slate-400 hover:text-white',
                          btnHoverText: 'hover:text-slate-300',
                          border: 'border-slate-400/30'
                        };
                        // Default to blue
                        return {
                          bg: 'from-blue-900/40 to-background border-blue-500/30',
                          blob: 'bg-blue-500/10',
                          title: 'text-blue-400',
                          badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                          btnBg: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white',
                          btnHoverText: 'hover:text-blue-400',
                          border: 'border-blue-500/30'
                        };
                      };

                      const colors = getTierColors(b.tierName);

                      return (
                        <div key={b.id} className={`bg-gradient-to-br ${colors.bg} p-4 rounded-xl relative overflow-hidden transition-colors`}>
                          <div className={`absolute top-0 right-0 w-16 h-16 ${colors.blob} rounded-bl-full transition-colors`} />
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`font-bold ${colors.title}`}>{b.name}</h4>
                            {bMonthlyLimit > 0 && (
                              <span className={`text-[10px] font-bold ${colors.badgeBg} px-2 py-0.5 rounded-full border`}>
                                Quedan {remainingInMonth + (currentSelected * tCount)}/{bMonthlyLimit}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                            Entrada especial para nivel {b.tierName}. {b.pointsRequired > 0 ? `Canjéala por ${b.pointsRequired} puntos.` : ''}
                            <br/><span className="text-foreground font-semibold">{profile.puntos || 0} pts disponibles</span>
                          </p>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="font-black text-xl text-foreground">
                                {b.price === 0 ? <span className="text-yellow-500">GRATIS</span> : `S/ ${b.price.toFixed(2)}`}
                              </p>
                              {b.price !== 0 && <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider mt-1 inline-block ${colors.badgeBg}`}>Precio Socio</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              {!hasValidFormat && (
                                <div className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30 text-center max-w-[100px] leading-tight font-bold">
                                  Solo para {benFmt}
                                </div>
                              )}
                              <div className={`flex items-center bg-background/50 rounded-lg p-1 border ${colors.border}`}>
                                <button 
                                  onClick={() => handleBenefitChange(String(b.id), -1)}
                                  disabled={currentSelected === 0}
                                  className={`w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/10 text-muted-foreground ${colors.btnHoverText} disabled:opacity-30 transition-colors`}
                                ><Minus className={`w-4 h-4 ${colors.title}`} /></button>
                                <span className="w-6 text-center font-bold text-foreground text-sm">{currentSelected}</span>
                                <button 
                                  onClick={() => handleBenefitChange(String(b.id), 1)}
                                  disabled={!doesNotExceedSeats || !hasEnoughLimit || !hasEnoughPoints || !hasValidFormat}
                                  title={!hasValidFormat ? `Este beneficio solo aplica para funciones ${benFmt}` : (!hasEnoughPoints ? 'No tienes suficientes puntos' : (!hasEnoughLimit ? 'Alcanzaste el límite mensual' : ''))}
                                  className={`w-8 h-8 rounded-md flex items-center justify-center ${colors.btnBg} disabled:opacity-30 transition-colors disabled:cursor-not-allowed tooltip-trigger`}
                                ><Plus className="w-4 h-4"/></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
