'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Package, LogOut, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useSedeStore } from '@/store/useSedeStore';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'sonner';

const sidebarLinks = [
  { name: 'Dashboard', href: '/jefe-sala', icon: LayoutDashboard },
  { name: 'Cartelera', href: '/jefe-sala/funciones', icon: CalendarDays },
  { name: 'Inventario Local', href: '/jefe-sala/inventario', icon: Package },
  { name: 'Operaciones y Cajas', href: '/jefe-sala/cajas', icon: Users },
];

export default function JefeSalaLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [rol, setRol] = useState<string>('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const { activeSedeId, setActiveSedeId, assignedSedes, setAssignedSedes } = useSedeStore();

  useEffect(() => {
    const userRole = localStorage.getItem('rol');
    if (userRole !== 'JEFE_SALA') {
      window.location.href = '/';
    }
    setRol(userRole || '');

    const fetchContextData = async () => {
      try {
        const [meRes, sedesRes] = await Promise.all([
          api.get('/users/me').catch(() => ({ data: { sedesIds: [] } })),
          api.get('/public/sedes')
        ]);
        
        let availableSedes = sedesRes.data || [];
        const userSedesIds = meRes.data?.sedesIds || [];
        
        availableSedes = availableSedes.filter((s: any) => userSedesIds.includes(s.id));
        
        setAssignedSedes(availableSedes);
        if (availableSedes.length > 0) {
          if (!useSedeStore.getState().activeSedeId || useSedeStore.getState().activeSedeId === 'all') {
             setActiveSedeId(availableSedes[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Error fetching context', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    fetchContextData();
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

  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (rol !== 'JEFE_SALA') return null;

  return (
    <div className="flex h-screen bg-transparent overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card/60 backdrop-blur-2xl border-r border-white/5 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-10 relative">
        <div className="p-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary/50 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-xl font-bold text-white">C</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 tracking-tight">
                CineZone
              </h1>
              <span className="text-xs font-medium text-primary tracking-widest uppercase">Jefe de Sala</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');

            return (
              <Link key={link.name} href={link.href}>
                <div className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                  isActive 
                    ? 'text-white font-medium bg-primary/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}>
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav-jefe"
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 transition-transform duration-300 ${isActive ? 'text-primary scale-110' : 'group-hover:scale-110 group-hover:text-primary/70'}`} />
                  <span className="relative z-10">{link.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {assignedSedes.length > 0 && (
          <div className="px-4 pb-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
              Sede Asignada
            </label>
            <select
              className="w-full bg-black/50 text-white rounded-xl px-3 py-2.5 text-sm font-semibold border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all"
              value={activeSedeId}
              onChange={(e) => setActiveSedeId(e.target.value)}
              disabled={assignedSedes.length <= 1}
            >
              {assignedSedes.map((sede) => (
                <option key={sede.id} value={sede.id} className="bg-zinc-900">
                  {sede.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="p-4 border-t border-white/5 bg-black/20">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-4 py-3 rounded-xl transition-all w-full group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Cerrar Sesin</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background pointer-events-none -z-10" />
        <div className="flex-1 overflow-auto p-8 custom-scrollbar relative z-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
