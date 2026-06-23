'use client';

import { motion } from 'framer-motion';
import { User, LogOut, Film } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

import { useCartStore } from '@/store/useCartStore';

export default function HeaderStaff() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);

  const [profileHref, setProfileHref] = useState('/staff/selector');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/users/me');
        setUserProfile(res.data);
      } catch (e) {
        // Silencioso
      }
    };
    fetchUser();
    
    // Calcular el enlace del perfil basado en el rol o módulo seleccionado
    const rol = localStorage.getItem('rol');
    const module = localStorage.getItem('staff_module');
    
    if (rol === 'SUPER_ADMIN' || rol === 'ADMIN_SEDE') setProfileHref('/admin/dashboard');
    else if (rol === 'TAQUILLA' || module === 'TAQUILLA') setProfileHref('/taquilla');
    else if (rol === 'DULCERIA' || module === 'DULCERIA') setProfileHref('/staff/dulceria');
    else if (rol === 'PORTERO' || module === 'PORTERO') setProfileHref('/portero');
    else if (rol === 'VALIDADOR') setProfileHref('/staff/validador');
    else setProfileHref('/staff/selector');
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/users/me/module?module=NONE');
    } catch (e) {}
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    useCartStore.getState().clearCart();
    router.push('/');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border h-16 md:h-20 flex items-center">
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-xl flex items-center justify-center">
            <Film className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tight text-foreground">
            CINE<span className="text-primary">ZONE</span>
            <span className="ml-2 text-xs text-primary bg-primary/10 px-2 py-1 rounded-md uppercase tracking-wider">STAFF</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {userProfile && (
            <Link 
              href={profileHref}
              className="hidden md:flex items-center gap-2 text-sm font-semibold text-muted-foreground bg-secondary/50 hover:bg-secondary/80 transition-colors px-3 py-1.5 rounded-full cursor-pointer"
            >
              <User className="w-4 h-4" />
              {userProfile.nombre}
            </Link>
          )}
          <motion.button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 font-bold rounded-xl transition-colors text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Cerrar Sesión</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
