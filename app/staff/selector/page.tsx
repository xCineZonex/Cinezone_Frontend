'use client';

import { motion } from 'framer-motion';
import { Ticket, Popcorn, UserCircle2, LogOut, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';

export default function StaffSelectorPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [rol, setRol] = useState('');

  useEffect(() => {
    // Aquí puedes cargar el nombre real del usuario desde el localStorage o token
    setUserName(localStorage.getItem('nombre_usuario') || 'Equipo');
    
    const userRol = localStorage.getItem('rol') || 'STAFF';
    setRol(userRol);

    // Auto-redirect if they have a specific role
    if (userRol === 'TAQUILLA') {
      router.replace('/taquilla');
    } else if (userRol === 'DULCERIA') {
      router.replace('/staff/dulceria');
    } else if (userRol === 'PORTERO') {
      router.replace('/portero');
    }
  }, [router]);

  const handleSelect = async (module: string) => {
    // Guardamos la decisión localmente (opcional)
    localStorage.setItem('staff_module', module);
    try {
      await api.post(`/users/me/module?module=${module}`);
    } catch (e) {
      console.error('Error reportando módulo al backend', e);
    }
    router.push(module === 'TAQUILLA' ? '/taquilla' : module === 'PORTERO' ? '/portero' : '/staff/dulceria');
  };

  const handleLogout = async () => {
    try {
      const res = await api.get('/taquilla/caja/estado');
      if (res.data.estado === 'ABIERTA') {
        toast.error('Debes cerrar caja antes de cerrar sesión');
        return;
      }
    } catch (err) {
      console.error('Error verificando estado de caja', err);
    }
    
    try {
      await api.post('/users/me/module?module=NONE');
    } catch (e) {}

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Error en logout', err);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('staff_module');
    useCartStore.getState().clearCart();
    window.location.href = '/login';
  };

  // Prevent showing the UI briefly before redirecting
  if (rol === 'TAQUILLA' || rol === 'DULCERIA') {
    return null; 
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[128px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 blur-[128px] rounded-full mix-blend-screen pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6 shadow-inner">
            <UserCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-3">
            ¡Hola, {userName}!
          </h1>
          <p className="text-xl text-muted-foreground">
            ¿En qué estación te ubicarás durante este turno?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(rol === 'STAFF' || rol === 'SUPER_ADMIN' || rol === 'JEFE_SALA') && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect('TAQUILLA')}
                className="group relative bg-card border border-border rounded-3xl p-8 flex flex-col items-center text-center overflow-hidden hover:border-primary/50 transition-all shadow-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <Ticket className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Taquilla</h2>
                <p className="text-muted-foreground text-sm">
                  Venta de boletos, asientos y registro de nuevos clientes.
                </p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect('DULCERIA')}
                className="group relative bg-card border border-border rounded-3xl p-8 flex flex-col items-center text-center overflow-hidden hover:border-primary/50 transition-all shadow-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <Popcorn className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Dulcería</h2>
                <p className="text-muted-foreground text-sm">
                  Venta de combos, snacks y control de inventario local.
                </p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect('PORTERO')}
                className="group relative bg-card border border-border rounded-3xl p-8 flex flex-col items-center text-center overflow-hidden hover:border-primary/50 transition-all shadow-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <QrCode className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Portero / Validador</h2>
                <p className="text-muted-foreground text-sm">
                  Validación de boletos y control de acceso a salas.
                </p>
              </motion.button>
            </>
          )}
        </div>

        <div className="mt-12 text-center">
          <button 
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-red-500 font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </motion.div>
    </div>
  );
}
