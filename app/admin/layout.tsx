'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Film, MapPin, CalendarDays, Users, LogOut, Sofa, Popcorn, Settings, BookOpen, Star, Package, Bell, Check, AlertCircle, DollarSign, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useSedeStore } from '@/store/useSedeStore';
import { toast } from 'sonner';
import { useCartStore } from '@/store/useCartStore';

const sidebarLinks = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Películas', href: '/admin/peliculas', icon: Film },
  { name: 'Dulcería', href: '/admin/dulceria', icon: Popcorn },
  { name: 'Inventario', href: '/admin/inventario', icon: Package },
  { name: 'Sedes', href: '/admin/sedes', icon: MapPin },
  { name: 'Salas', href: '/admin/salas', icon: Sofa },
  { name: 'Funciones', href: '/admin/funciones', icon: CalendarDays },
  { name: 'Usuarios', href: '/admin/usuarios', icon: Users },
  { name: 'Beneficios', href: '/admin/beneficios', icon: Star },
  { name: 'Reclamaciones', href: '/admin/reclamos', icon: BookOpen },
  { name: 'Precios Base', href: '/admin/precios', icon: DollarSign },
  { name: 'Anulaciones', href: '/admin/anulaciones', icon: AlertCircle },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [rol, setRol] = useState<string>('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const { activeSedeId, setActiveSedeId, assignedSedes, setAssignedSedes } = useSedeStore();

  useEffect(() => {
    const userRole = localStorage.getItem('rol') || '';
    setRol(userRole);
    
    // Fetch context data
    const fetchContextData = async () => {
      try {
        const [meRes, sedesRes] = await Promise.all([
          api.get('/users/me').catch(() => ({ data: { sedesIds: [] } })),
          api.get('/public/sedes')
        ]);
        
        let availableSedes = sedesRes.data || [];
        const currentUserRole = userRole || meRes.data?.rol;
        
        if (currentUserRole === 'ADMIN_SEDE' || currentUserRole === 'JEFE_SALA') {
          const userSedesIds = meRes.data?.sedesIds || [];
          availableSedes = availableSedes.filter((s: any) => userSedesIds.some((id: any) => id.toString() === s.id.toString()));
        }
        
        setAssignedSedes(availableSedes);
        if (availableSedes.length > 0) {
          // Si el usuario acaba de loguearse y no tiene sede activa, le asignamos la primera
          if (!useSedeStore.getState().activeSedeId || useSedeStore.getState().activeSedeId === 'all') {
             // Si es SUPER_ADMIN puede ver "Todas las sedes"
             if (userRole === 'SUPER_ADMIN') {
               setActiveSedeId('all');
               setAssignedSedes([{ id: 'all', nombre: 'Todas las sedes' }, ...availableSedes]);
             } else {
               setActiveSedeId(availableSedes[0].id.toString());
             }
          }
        }
      } catch (error) {
        console.error('Error fetching context', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    fetchContextData();

    if (userRole === 'ADMIN_SEDE') {
      fetchAlertas();
      const interval = setInterval(fetchAlertas, 60000);
      return () => clearInterval(interval);
    }
  }, []);

  const fetchAlertas = async () => {
    try {
      const res = await api.get('/alertas');
      const data = res.data?.data || res.data || [];
      setAlertas(data.filter((a: any) => !a.leida && !a.leido));
    } catch (error) {
      console.error('Error al obtener alertas', error);
    }
  };

  const marcarLeida = async (id: number) => {
    try {
      await api.put(`/alertas/${id}/leido`);
      setAlertas(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error al marcar leida', error);
    }
  };

  const updateReplacementStatus = async (replacementId: number, alertaId: number, status: string) => {
    try {
      await api.put(`/alertas/replacements/${replacementId}/status`, { status });
      setAlertas(prev => prev.filter(a => a.id !== alertaId));
      toast.success(status === 'EN_PROCESO' ? 'Marcado en proceso' : 'Solicitud denegada');
    } catch (error) {
      console.error('Error al actualizar estado', error);
      toast.error('Error al actualizar estado');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowAlerts(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await api.get('/taquilla/caja/estado');
      if (res.data.estado === 'ABIERTA') {
        toast.error('Debes cerrar caja antes de cerrar sesión');
        return;
      }
    } catch (err) {
      console.error('Error verificando caja', err);
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Error al hacer logout', e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    useCartStore.getState().clearCart();
    window.location.href = '/';
  };

  const filteredLinks = sidebarLinks.filter(link => {
    if (rol === 'SUPER_ADMIN') return true;
    if (rol === 'ADMIN_SEDE') {
      // Ocultar Catálogo Maestro (Películas), Sedes a nivel configuración y Beneficios
      // Se habilitó Dulcería para que el ADMIN_SEDE arme sus combos
      if (['Sedes', 'Beneficios'].includes(link.name)) return false;
      return true;
    }
    return true; // Por defecto
  });

  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-transparent overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card/60 backdrop-blur-2xl border-r border-white/5 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-50 relative">
        <div className="p-6 border-b border-white/5 flex items-start justify-between relative">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Film className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-black">CINE<span className="text-primary">ZONE</span></span>
            </Link>
            <div className="mt-1 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Admin Panel
            </div>
          </div>

          {rol === 'ADMIN_SEDE' && (
            <div className="relative" ref={panelRef}>
              <button 
                onClick={() => setShowAlerts(!showAlerts)}
                className="relative p-2 -mr-2 rounded-xl hover:bg-white/5 transition-colors text-muted-foreground hover:text-white"
              >
                <Bell className="w-5 h-5" />
                {alertas.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {showAlerts && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-72 bg-card border border-white/10 shadow-2xl rounded-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/5 bg-muted/10">
                      <h3 className="font-bold text-sm">Notificaciones</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                      {alertas.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                          <Bell className="w-8 h-8 opacity-20" />
                          <span className="text-xs">No hay alertas nuevas</span>
                        </div>
                      ) : (
                        alertas.map(alerta => (
                          <div key={alerta.id} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl mb-2 transition-colors flex gap-3 group">
                            <div className="mt-0.5">
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-foreground/90 leading-relaxed">
                                {alerta.mensaje || `Se necesita restock de producto: ${alerta.producto?.nombre || alerta.productoId || 'Desconocido'}`}
                              </p>
                            </div>
                            {alerta.tipo === 'RESTOCK' && alerta.replacementRequestId ? (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => updateReplacementStatus(alerta.replacementRequestId, alerta.id, 'EN_PROCESO')}
                                  className="w-7 h-7 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white flex items-center justify-center transition-colors"
                                  title="En Proceso"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => updateReplacementStatus(alerta.replacementRequestId, alerta.id, 'DENEGADO')}
                                  className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                                  title="Denegado"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => marcarLeida(alerta.id)}
                                className="w-7 h-7 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                title="Marcar como leída"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Global Sede Selector */}
        {(rol === 'ADMIN_SEDE' || rol === 'JEFE_SALA' || rol === 'SUPER_ADMIN') && assignedSedes.length > 0 && (
          <div className="px-6 py-4 border-b border-white/5 bg-black/20">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Contexto de Trabajo
            </label>
            <select
              className="w-full bg-zinc-900/80 text-white rounded-xl px-3 py-2.5 text-sm font-semibold border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all"
              value={activeSedeId}
              onChange={(e) => setActiveSedeId(e.target.value)}
              disabled={assignedSedes.length <= 1 && rol !== 'SUPER_ADMIN'}
            >
              {assignedSedes.map((sede) => (
                <option key={sede.id} value={sede.id} className="bg-zinc-900">
                  {sede.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link key={link.name} href={link.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground font-medium'
                }`}>
                  <link.icon className="w-5 h-5" />
                  {link.name}
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          <Link href="/admin/perfil">
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium ${
              pathname === '/admin/perfil' 
                ? 'bg-primary/10 text-primary font-bold' 
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}>
              <Settings className="w-5 h-5" /> Mi Perfil
            </div>
          </Link>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors font-medium">
            <LogOut className="w-5 h-5" /> Salir
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
