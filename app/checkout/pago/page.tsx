'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, CheckCircle, CreditCard, Lock, Popcorn, Ticket, AlertCircle, Clock } from 'lucide-react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { useCartStore } from '@/store/useCartStore';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function CheckoutPagoPage() {
  const router = useRouter();
  const { 
    funcionId, 
    pelicula, 
    asientos, 
    tickets, 
    snacks,
    getTotalTickets,
    getTotalSnacks,
    getGranTotal,
    bookingExpiresAt,
    clearCart,
    setLastPurchaseResponse,
    idempotencyKey
  } = useCartStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const [metodoPago, setMetodoPago] = useState('TARJETA');
  const [taquillaCliente, setTaquillaCliente] = useState<{id: string, nombre: string} | null>(null);

  const [rol, setRol] = useState('');
  const [dni, setDni] = useState('');
  const [isSearchingDni, setIsSearchingDni] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newClient, setNewClient] = useState({ nombre: '', apellido: '' });
  const [efectivoRecibido, setEfectivoRecibido] = useState('');

  useEffect(() => {
    const currentRol = localStorage.getItem('rol') || '';
    setRol(currentRol);
    if (['TAQUILLA', 'DULCERIA', 'ADMIN_SEDE', 'STAFF'].includes(currentRol)) {
      setMetodoPago('EFECTIVO');
    }
  }, []);

  const handleSearchDni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni || dni.length < 8) {
      toast.warning('Ingrese un DNI válido (8 dígitos)');
      return;
    }
    setIsSearchingDni(true);
    setTaquillaCliente(null);
    setShowRegisterForm(false);
    try {
      const response = await api.post('/taquilla/buscar-cliente', { dni });
      if (response.data.tipo === 'REGISTRADO') {
        setTaquillaCliente({ id: response.data.id, nombre: response.data.nombreCompleto });
        toast.success('Cliente encontrado');
      } else {
        toast.info('Cliente no encontrado. Ingrese nombre y apellido.');
        setShowRegisterForm(true);
      }
    } catch (error: any) {
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        toast.error('Error de comunicación con el servidor');
      }
    } finally {
      setIsSearchingDni(false);
    }
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchingDni(true);
    try {
      const response = await api.post('/taquilla/crear-temporal', {
        dni,
        nombre: newClient.nombre,
        apellido: newClient.apellido
      });
      setTaquillaCliente({ id: response.data.id, nombre: response.data.nombreCompleto });
      setShowRegisterForm(false);
      toast.success('Cliente registrado');
    } catch (error: any) {
      if (error.response?.status !== 403 && error.response?.status !== 401) {
          toast.error(error.response?.data?.message || error.response?.data?.error || 'Error al registrar cliente');
      }
    } finally {
      setIsSearchingDni(false);
    }
  };

  // Redirigir si el carrito está vacío
  useEffect(() => {
    const isTaquilla = ['TAQUILLA', 'DULCERIA', 'ADMIN_SEDE', 'STAFF'].includes(localStorage.getItem('rol') || '');
    const isDulceriaOnly = !funcionId && snacks.length > 0;

    if (!funcionId && asientos.length === 0) {
      if (isTaquilla && isDulceriaOnly) {
        // Permitir continuar (solo dulcería)
      } else {
        router.push('/cartelera');
      }
    }
  }, [funcionId, asientos.length, snacks.length, router]);

  // Temporizador
  useEffect(() => {
    if (bookingExpiresAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = bookingExpiresAt - now;
        if (remaining <= 0) {
          clearInterval(interval);
          setIsExpired(true);
          
          // Unlock all seats on backend
          const store = useCartStore.getState();
          if (store.funcionId) {
            const unlockPromises = store.asientos.map(a => 
              api.delete('/reservas/asientos/unlock', {
                params: { funcionId: store.funcionId, asientoId: a.asientoId }
              }).catch(console.error)
            );
            Promise.all(unlockPromises).finally(() => {
              store.clearCart();
            });
          } else {
            clearCart();
          }
        } else {
          setTimeLeft(Math.floor(remaining / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [bookingExpiresAt, clearCart]);

  // Heartbeat para renovar el lock en Redis cada 30 segundos
  useEffect(() => {
    if (!funcionId || asientos.length === 0) return;
    const heartbeatInterval = setInterval(() => {
      asientos.forEach(a => {
        api.post('/reservas/asientos/heartbeat', {
          funcionId,
          asientoId: a.asientoId
        }).catch(err => console.error("Error enviando heartbeat:", err));
      });
    }, 30000);
    return () => clearInterval(heartbeatInterval);
  }, [funcionId, asientos]);

  const handlePayment = async () => {
    if (metodoPago === 'EFECTIVO') {
      const efectivo = Number(efectivoRecibido);
      if (isNaN(efectivo) || efectivo < getGranTotal()) {
        toast.error(`El efectivo recibido debe ser mayor o igual al total a pagar (S/ ${getGranTotal().toFixed(2)})`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      // 1. Mapear tickets a asientos (distribución simple)
      // El backend espera una lista de asientos con su tipo de entrada.
      const ticketPool: {type: string, price: number, benefitId?: number}[] = [];
      tickets.forEach(t => {
        for (let i = 0; i < t.cantidad; i++) {
          let backendType = t.typeKey || 'NORMAL';
          if (!['NORMAL', 'TERCERA_EDAD', 'DISCAPACIDAD', 'NINO'].includes(backendType)) {
            backendType = 'NORMAL';
          }
          ticketPool.push({ type: backendType, price: t.precio, benefitId: t.benefitId });
        }
      });

      const asientosRequest = asientos.map((a, index) => ({
        asientoId: a.asientoId,
        tipoEntrada: ticketPool[index]?.type || 'NORMAL',
        precioCobrado: ticketPool[index]?.price || a.precioCobrado || 0,
        beneficioId: ticketPool[index]?.benefitId || null
      }));

      const payload: any = {
        funcionId: funcionId || null,
        asientos: asientosRequest,
        snacks: snacks.map(s => ({ productoId: s.productoId, cantidad: s.cantidad })),
        montoTotalPago: Number(getGranTotal()),
        numeroTarjeta: "4557 **** **** 0012",
        titularTarjeta: (!funcionId && snacks.length > 0) ? newClient.nombre : "CLIENTE CINEZONE",
        metodoPago: metodoPago,
        idempotencyKey: idempotencyKey
      };

      if (funcionId && taquillaCliente) {
        payload.clienteId = taquillaCliente.id;
      }

      console.log('Final Purchase Payload:', payload);

      // 2. Crear la reserva (POST /compras/confirmar)
      const res = await api.post('/compras/confirmar', payload);
      const purchaseData = res.data;

      // 3. Simular el pago exitoso (POST /compras/{id}/simular-pago)
      // En producción esto lo haría el Webhook de Mercado Pago
      await api.post(`/compras/${purchaseData.boletaId}/simular-pago`);
      
      // 4. Guardar respuesta para la boleta
      setLastPurchaseResponse(purchaseData);
      
      // 5. Limpiar carrito manteniendo el recibo (para que BoletaPage lo vea)
      clearCart(true);
      
      // 6. Limpiar cliente de taquilla
      if (taquillaCliente) {
        localStorage.removeItem('taquillaClienteId');
        localStorage.removeItem('taquillaClienteNombre');
      }

      toast.success('¡Compra realizada con éxito!');
      
      // Pequeña espera para asegurar que Zustand persistió el cambio antes de navegar
      setTimeout(() => {
        router.push('/checkout/boleta');
      }, 100);
      
    } catch (error: any) {
      console.error('Error in payment flow:', error);
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        toast.error(error.response?.data?.error || 'Hubo un error al procesar el pago.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isDulceriaOnly = !funcionId && snacks.length > 0;
  if (!funcionId && !isDulceriaOnly) return null;

  return (
    <main className="min-h-screen bg-background pb-32">
      <Navbar />

      <AnimatePresence>
        {isExpired && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-6 text-center"
          >
            <div className="bg-card border border-border p-8 rounded-3xl shadow-2xl max-w-sm w-full">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-2">¡Tiempo Expirado!</h2>
              <p className="text-muted-foreground mb-8">Lo sentimos, el tiempo de tu reserva ha terminado.</p>
              <button onClick={() => router.push('/cartelera')} className="w-full py-4 bg-primary text-primary-foreground font-black rounded-xl">
                Volver a Cartelera
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-24 pb-12 container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 bg-secondary rounded-xl hover:bg-secondary/80 transition-all">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-black text-foreground">Finalizar Pago</h1>
                <p className="text-muted-foreground">Revisa tu pedido y elige tu medio de pago</p>
                {taquillaCliente && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-bold">
                    Venta en Taquilla para: {taquillaCliente.nombre}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-6 py-3 bg-primary/10 border border-primary/20 rounded-2xl">
              <Clock className="w-5 h-5 text-primary animate-pulse" />
              <span className="font-black text-primary tabular-nums">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {tickets.length > 0 && (
                <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" /> Resumen de Entradas
                  </h2>
                  <div className="space-y-4">
                    {tickets.filter(t => t.cantidad > 0).map(t => (
                      <div key={t.label} className="flex justify-between items-center text-foreground">
                        <span className="font-medium">{t.cantidad}x {t.label}</span>
                        <span className="font-bold">S/ {(t.precio * t.cantidad).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                      {asientos.map(a => (
                        <span key={a.asientoId} className="px-2 py-1 bg-secondary text-xs font-black rounded-lg">{a.codigo}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {snacks.length > 0 && (
                <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                    <Popcorn className="w-5 h-5 text-primary" /> Dulcería & Snacks
                  </h2>
                  <div className="space-y-4">
                    {snacks.map(s => (
                      <div key={s.productoId} className="flex justify-between items-center text-foreground">
                        <span className="font-medium">{s.cantidad}x {s.nombre}</span>
                        <span className="font-bold">S/ {(s.precio * s.cantidad).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card border border-primary/20 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <CreditCard className="w-24 h-24 rotate-12" />
                </div>
                
                <h2 className="text-xl font-black mb-8 relative z-10">Total a Pagar</h2>
                
                <div className="space-y-3 mb-8 relative z-10">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Entradas</span>
                    <span>S/ {getTotalTickets().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Snacks</span>
                    <span>S/ {getTotalSnacks().toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-border flex justify-between items-end">
                    <span className="font-bold text-foreground">Monto Total</span>
                    <span className="text-4xl font-black text-primary">S/ {getGranTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  {['TAQUILLA', 'DULCERIA', 'ADMIN_SEDE', 'STAFF'].includes(rol) ? (
                    <div className="space-y-4">
                      {isDulceriaOnly ? (
                        <div className="space-y-2">
                           <p className="text-sm font-bold">Nombre del Comprador</p>
                           <input
                             type="text"
                             placeholder="Ej. Juan Pérez"
                             required
                             value={newClient.nombre}
                             onChange={(e) => setNewClient({...newClient, nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})}
                             className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary outline-none"
                           />
                        </div>
                      ) : !taquillaCliente ? (
                        <>
                          <form onSubmit={handleSearchDni} className="flex gap-2 h-12">
                            <input
                              type="text"
                              placeholder="DNI del cliente..."
                              required
                              maxLength={8}
                              value={dni}
                              onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                              className="flex-1 px-4 h-full bg-background border border-border rounded-xl focus:border-primary outline-none"
                            />
                            <button
                              type="submit"
                              disabled={isSearchingDni || dni.length < 8}
                              className="px-6 h-full bg-secondary text-foreground rounded-xl font-bold hover:bg-secondary/80 disabled:opacity-50 shrink-0 flex items-center justify-center"
                            >
                              Buscar
                            </button>
                          </form>
                          {showRegisterForm && (
                            <form onSubmit={handleRegisterClient} className="space-y-2 mt-2 p-4 bg-secondary/30 rounded-xl border border-border">
                              <p className="text-sm font-bold mb-2">Nuevo Cliente</p>
                              <input
                                type="text"
                                placeholder="Nombres"
                                required
                                value={newClient.nombre}
                                onChange={(e) => setNewClient({...newClient, nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})}
                                className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:border-primary outline-none text-sm"
                              />
                              <input
                                type="text"
                                placeholder="Apellidos"
                                required
                                value={newClient.apellido}
                                onChange={(e) => setNewClient({...newClient, apellido: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})}
                                className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:border-primary outline-none text-sm"
                              />
                              <button
                                type="submit"
                                disabled={isSearchingDni}
                                className="w-full py-2 bg-primary text-primary-foreground font-bold rounded-xl text-sm"
                              >
                                Guardar
                              </button>
                            </form>
                          )}
                        </>
                      ) : (
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="text-xs text-primary font-bold uppercase">Cliente</p>
                            <p className="text-sm font-black">{taquillaCliente.nombre}</p>
                          </div>
                          <button onClick={() => setTaquillaCliente(null)} className="text-xs text-muted-foreground hover:text-destructive underline">
                            Cambiar
                          </button>
                        </div>
                      )}

                      <select 
                        value={metodoPago} 
                        onChange={(e) => setMetodoPago(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary outline-none font-bold"
                      >
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="TARJETA">Tarjeta (POS Físico)</option>
                        <option value="YAPE">Yape</option>
                        <option value="PLIN">Plin</option>
                      </select>

                      {metodoPago === 'EFECTIVO' && (
                        <div className="space-y-2 p-4 bg-background border border-border rounded-xl">
                          <p className="text-sm font-bold text-muted-foreground">Efectivo Recibido</p>
                          <input
                            type="number"
                            min={getGranTotal()}
                            step="0.01"
                            placeholder="0.00"
                            value={efectivoRecibido}
                            onChange={(e) => setEfectivoRecibido(e.target.value)}
                            className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg font-mono text-xl outline-none focus:ring-2 ring-primary transition-all"
                          />
                          {Number(efectivoRecibido) > 0 && (
                            <div className="flex justify-between items-center pt-2">
                              <span className="font-bold text-muted-foreground">Vuelto:</span>
                              <span className={`font-black text-xl ${Number(efectivoRecibido) >= getGranTotal() ? 'text-green-500' : 'text-red-500'}`}>
                                S/ {(Number(efectivoRecibido) - getGranTotal()).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handlePayment}
                        disabled={isProcessing || isExpired || (!isDulceriaOnly && !taquillaCliente) || (isDulceriaOnly && !newClient.nombre)}
                        className="w-full flex items-center justify-center gap-3 py-5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-black text-lg rounded-2xl transition-all shadow-lg"
                      >
                        {isProcessing ? 'Procesando...' : 'Confirmar Venta en Taquilla'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handlePayment}
                      disabled={isProcessing || isExpired}
                      className="w-full flex items-center justify-center gap-3 py-5 bg-[#009EE3] hover:bg-[#008ED2] disabled:opacity-50 text-white font-black text-lg rounded-2xl transition-all shadow-lg shadow-blue-500/20"
                    >
                      {isProcessing ? (
                        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>Pagar con Mercado Pago</>
                      )}
                    </button>
                  )}
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs font-medium">
                    <Lock className="w-3 h-3" /> Transacción 100% Segura
                  </div>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-2xl p-6 flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Al completar tu pago, recibirás una boleta digital con un código QR para ingresar directamente a tu sala.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
