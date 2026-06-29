'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { Menu, X, ShoppingCart, User, Film, MapPin, Popcorn, LogOut, Ticket, Info, QrCode, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import HeaderStaff from '@/components/HeaderStaff';

const defaultNavItems = [
  { name: 'Cartelera', href: '/cartelera', icon: Film },
  { name: 'Sedes', href: '/sedes', icon: MapPin },
  { name: 'Dulcería', href: '/dulceria', icon: Popcorn },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const { asientos, snacks, tickets, clearCart, updateSnackQuantity, removeSnack, getGranTotal, toggleAsiento, setTickets, bookingExpiresAt } = useCartStore();
  const cartItemsCount = asientos.length + snacks.reduce((acc, s) => acc + s.cantidad, 0);
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Global Cart Expiration Timer
  useEffect(() => {
    if (bookingExpiresAt) {
      const handleExpiration = async () => {
        const state = useCartStore.getState();
        const { asientos: currentAsientos, funcionId, pelicula } = state;
        
        // Liberar asientos en el backend
        if (funcionId && currentAsientos.length > 0) {
          try {
            await Promise.all(
              currentAsientos.map(a => api.delete('/reservas/asientos/unlock', { params: { funcionId, asientoId: a.asientoId } }).catch(() => {}))
            );
          } catch (e) {}
        }
        
        clearCart();
        toast.error("El tiempo de tu reserva ha expirado. Los asientos han sido liberados.");
        
        // Redirigir solo si está en el flujo de compra
        if (window.location.pathname.includes('/reserva') || window.location.pathname.includes('/checkout') || window.location.pathname.includes('/dulceria')) {
          if (pelicula?.id) {
            router.push(`/pelicula/${pelicula.id}`);
          } else {
            router.push('/cartelera');
          }
        }
      };

      // Check immediately
      const now = Date.now();
      const initialRemaining = Math.max(0, Math.floor((bookingExpiresAt - now) / 1000));
      setTimeLeft(initialRemaining);
      
      if (initialRemaining <= 0) {
        handleExpiration();
        return;
      }

      const interval = setInterval(() => {
        const currentNow = Date.now();
        const remaining = Math.max(0, Math.floor((bookingExpiresAt - currentNow) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          handleExpiration();
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [bookingExpiresAt, clearCart, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Close cart when clicking outside or navigating
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#cart-dropdown-container')) {
        setIsCartOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const rol = localStorage.getItem('rol');
    setUserRole(rol || '');
    // Solo cargamos el usuario si hay un rol guardado (lo que asume que hay cookie)
    if (rol) {
      api.get('/users/me')
        .then(res => {
          setUser(res.data);
          // Sincronizar el rol con el que devuelve el backend
          if (res.data.rol) {
            setUserRole(res.data.rol);
            localStorage.setItem('rol', res.data.rol);
          }
        })
        .catch((e: any) => {
          if (e.response?.status === 401 || e.response?.status === 403) {
            localStorage.removeItem('rol');
            setUser(null);
          }
        });
    }
  }, []);

  const handleLogout = async () => {
    try {
      const rol = localStorage.getItem('rol');
      if (rol && ['TAQUILLA', 'DULCERIA', 'ADMIN_SEDE', 'VALIDADOR', 'PORTERO', 'STAFF'].includes(rol)) {
        const res = await api.get('/taquilla/caja/estado');
        if (res.data && res.data.estado === 'ABIERTA') {
          toast.error('Debes cerrar caja antes de cerrar sesión');
          return;
        }
      }
    } catch (err: any) {
      if (err.response?.status !== 403 && err.response?.status !== 401) {
        console.error('Error verificando caja', err);
      }
    }
    localStorage.removeItem('rol');
    localStorage.removeItem('token');
    clearCart();
    setUser(null);
    setUserRole('');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    window.location.href = '/';
  };

  const profileHref = (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN_SEDE') ? '/admin/dashboard' : userRole === 'JEFE_SALA' ? '/jefe-sala' : userRole === 'TAQUILLA' ? '/taquilla' : userRole === 'DULCERIA' ? '/staff/dulceria' : userRole === 'STAFF' ? '/staff/selector' : '/perfil';

  let navItems = defaultNavItems;
  if (userRole === 'PORTERO') {
    navItems = [];
  } else if (userRole === 'DULCERIA') {
    navItems = [
      { name: 'Dulcería', href: '/dulceria', icon: Popcorn },
      { name: 'Mi Perfil', href: profileHref, icon: User },
      { name: 'Historial', href: '/staff/ventas', icon: Info },
    ];
  } else if (userRole === 'TAQUILLA') {
    navItems = [
      { name: 'Taquilla (Entradas)', href: '/cartelera', icon: Ticket },
      { name: 'Mi Perfil', href: profileHref, icon: User },
    ];
  } else if (userRole === 'ADMIN_SEDE' || userRole === 'SUPER_ADMIN') {
    navItems = [
      { name: 'Dashboard', href: profileHref, icon: User },
      { name: 'Cartelera', href: '/cartelera', icon: Film },
    ];
  }

  const isStaff = userRole && ['TAQUILLA', 'DULCERIA', 'PORTERO', 'VALIDADOR', 'ADMIN_SEDE', 'STAFF'].includes(userRole);
  if (isStaff) {
    return <HeaderStaff />;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Film className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl md:text-2xl font-black text-foreground">
                CINE<span className="text-primary">ZONE</span>
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <motion.span
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
                  whileHover={{ y: -2 }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </motion.span>
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            {(userRole === 'CLIENT' || !userRole || ['TAQUILLA', 'DULCERIA', 'ADMIN_SEDE', 'STAFF'].includes(userRole)) && (
              <div className="relative" id="cart-dropdown-container">
                <motion.div
                  className="relative p-2 rounded-xl bg-card hover:bg-secondary transition-colors cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCartOpen(!isCartOpen)}
                >
                  <ShoppingCart className="w-5 h-5 text-foreground" />
                  {cartItemsCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center"
                    >
                      {cartItemsCount}
                    </motion.span>
                  )}
                </motion.div>

                {/* Cart Dropdown */}
                <AnimatePresence>
                  {isCartOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-4 w-80 bg-card border border-border shadow-2xl rounded-3xl overflow-hidden z-[100]"
                    >
                      <div className="p-4 border-b border-border bg-secondary/30 flex justify-between items-center">
                        <h3 className="font-black text-foreground">Tu Carrito</h3>
                        {timeLeft !== null && timeLeft > 0 && (
                          <div className="flex items-center gap-1.5 bg-destructive/10 text-destructive px-2.5 py-1 rounded-full animate-pulse">
                            <span className="text-xs font-black tracking-widest">{formatTime(timeLeft)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {cartItemsCount === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">Tu carrito está vacío</p>
                          </div>
                        ) : (
                          <>
                            {/* Entradas */}
                            {tickets.length > 0 && tickets.some(t => t.cantidad > 0) && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Entradas</p>
                                {tickets.filter(t => t.cantidad > 0).map((t, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-foreground">{t.cantidad}x {t.label}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-foreground">S/ {(t.precio * t.cantidad).toFixed(2)}</span>
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          // 1. Set ticket quantity to 0
                                          const newTickets = tickets.map(ti => ti.label === t.label ? { ...ti, cantidad: 0 } : ti);
                                          setTickets(newTickets);
                                          
                                          // 2. Release N seats (remove from end)
                                          for (let i = 0; i < t.cantidad; i++) {
                                            const currentAsientos = useCartStore.getState().asientos;
                                            if (currentAsientos.length > 0) {
                                              toggleAsiento(currentAsientos[currentAsientos.length - 1]);
                                            }
                                          }
                                        }}
                                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors ml-1 shrink-0"
                                        title="Eliminar entradas y liberar asientos"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <p className="text-[10px] text-muted-foreground pt-1 leading-tight">
                                  * Se liberarán asientos automáticamente al eliminar entradas.
                                </p>
                              </div>
                            )}

                            {/* Snacks */}
                            {snacks.length > 0 && (
                              <div className="space-y-3 pt-4 mt-2 border-t border-border">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Dulcería</p>
                                {snacks.map((s) => (
                                  <div key={s.productoId} className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0 pr-2">
                                      <p className="text-sm font-bold text-foreground truncate">{s.nombre}</p>
                                      <p className="text-xs text-muted-foreground">S/ {(s.precio * s.cantidad).toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 shrink-0">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateSnackQuantity(s.productoId, s.cantidad - 1); }}
                                        className="w-7 h-7 flex items-center justify-center bg-background rounded-lg shadow-sm font-bold hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                      >
                                        -
                                      </button>
                                      <span className="text-xs font-black w-5 text-center text-foreground">{s.cantidad}</span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); updateSnackQuantity(s.productoId, s.cantidad + 1); }}
                                        className="w-7 h-7 flex items-center justify-center bg-background rounded-lg shadow-sm font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
                                      >
                                        +
                                      </button>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); removeSnack(s.productoId); }}
                                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors ml-1 shrink-0"
                                      title="Eliminar del carrito"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {cartItemsCount > 0 && (
                        <div className="p-4 border-t border-border bg-secondary/10">
                          {(() => {
                            const totalTicketsQty = tickets.reduce((acc, t) => acc + t.cantidad, 0);
                            const totalSeatsQty = asientos.length;
                            // Requerimos que coincidan entradas y butacas SI hay butacas o SI hay entradas en proceso.
                            // Si solo compran snacks (asientos=0, entradas=0), pueden pasar normal.
                            const needsTicketSelection = totalSeatsQty > 0 && totalTicketsQty !== totalSeatsQty;
                            
                            return needsTicketSelection ? (
                              <div className="text-center">
                                <p className="text-xs text-amber-500 font-bold mb-2">
                                  Debes seleccionar {totalSeatsQty} entrada(s) para continuar.
                                </p>
                                <button disabled className="w-full py-4 bg-zinc-800 text-zinc-500 font-black rounded-xl cursor-not-allowed">
                                  Ir a Pagar
                                </button>
                              </div>
                            ) : (
                              <Link href="/checkout/pago" onClick={() => setIsCartOpen(false)}>
                                <button className="w-full py-4 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90 transition-all shadow-md flex justify-between items-center px-5">
                                  <span>Ir a Pagar</span>
                                  <span className="bg-background/20 px-2 py-1 rounded-lg">S/ {getGranTotal().toFixed(2)}</span>
                                </button>
                              </Link>
                            );
                          })()}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* User */}
            {(user || userRole) ? (
              <div className="hidden md:flex items-center gap-3">
                {user && userRole !== 'PORTERO' && (
                  <Link href={profileHref}>
                    <motion.div
                      className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-xl transition-colors cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <User className="w-4 h-4 text-primary" />
                      {user.nombre}
                    </motion.div>
                  </Link>
                )}
                {userRole === 'PORTERO' && (
                  <span className="text-sm font-bold text-muted-foreground mr-2">Panel Portero</span>
                )}
                <motion.button
                  onClick={handleLogout}
                  className="p-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-xl transition-colors"
                  title="Cerrar sesión"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </div>
            ) : (
              <Link href="/login" className="hidden md:block">
                <motion.button
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <User className="w-4 h-4" />
                  Ingresar
                </motion.button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden p-2 rounded-xl bg-card hover:bg-secondary transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              whileTap={{ scale: 0.95 }}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-t border-border overflow-hidden"
          >
            <div className="container mx-auto px-6 py-4 flex flex-col gap-4">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">{item.name}</span>
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {(user || userRole) ? (
                  <div className="flex flex-col gap-3">
                    {userRole !== 'PORTERO' && user && (
                      <Link href={profileHref} onClick={() => setIsOpen(false)}>
                        <button className="w-full flex items-center justify-center gap-2 p-3 bg-secondary text-foreground font-semibold rounded-xl">
                          <User className="w-5 h-5 text-primary" />
                          Mi Perfil ({user.nombre})
                        </button>
                      </Link>
                    )}
                    <button onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full flex items-center justify-center gap-2 p-3 bg-destructive/10 text-destructive font-semibold rounded-xl">
                      <LogOut className="w-5 h-5" />
                      Cerrar Sesión
                    </button>
                  </div>
                ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <button className="w-full flex items-center justify-center gap-2 p-3 bg-primary text-primary-foreground font-semibold rounded-xl">
                      <User className="w-5 h-5" />
                      Ingresar
                    </button>
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
