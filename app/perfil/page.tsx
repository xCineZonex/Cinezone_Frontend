'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import api from '@/lib/api';
import { Award, Star, Clock, User as UserIcon, Ticket, Save, Edit3, X, Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';

export default function UserProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'datos' | 'entradas' | 'historial'>('datos');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    celular: '',
    genero: ''
  });
  const [saving, setSaving] = useState(false);

  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleViewReceipt = async (bookingId: string) => {
    try {
      const res = await api.get(`/compras/${bookingId}/recibo`);
      useCartStore.getState().setLastPurchaseResponse(res.data);
      router.push('/checkout/boleta');
    } catch (e) {
      toast.error('No se pudo cargar el detalle de la boleta');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Profile
        const profileRes = await api.get('/users/me');
        setProfile(profileRes.data);
        setFormData({
          nombre: profileRes.data.nombre || '',
          apellido: profileRes.data.apellido || '',
          dni: profileRes.data.dni || '',
          celular: profileRes.data.celular || '',
          genero: profileRes.data.genero || ''
        });

        // Fetch History
        try {
          const historyRes = await api.get('/users/me/history');
          setHistory(historyRes.data);
        } catch (e) {
          console.error("Error cargando historial", e);
        }

        // Fetch Bookings
        try {
          const bookingsRes = await api.get('/users/me/bookings');
          setBookings(bookingsRes.data);
        } catch (e) {
          console.error("Error cargando reservas (¿Actualizaste el backend?)", e);
        }
      } catch (error) {
        toast.error('Error al cargar tu perfil. Asegúrate de haber iniciado sesión.');
        // Si el perfil falla, removemos el rol por seguridad y cerramos sesion para limpiar cookie
        localStorage.removeItem('rol');
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {}
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Usamos PATCH para actualizar datos parciales
      const response = await api.patch('/users/me', formData);
      setProfile(response.data);
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error: any) {
      console.error('Error actualizando perfil', error);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Ocurrió un error al actualizar los datos');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    if (passForm.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    setPassLoading(true);
    try {
      await api.put('/auth/password/update', { 
        currentPassword: passForm.currentPassword, 
        newPassword: passForm.newPassword 
      });
      toast.success('Contraseña actualizada exitosamente');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar contraseña');
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="pt-24 flex justify-center"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Error al cargar el perfil</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            No se pudo cargar la información de tu cuenta. Es posible que el servidor backend no esté actualizado o tu sesión haya expirado.
          </p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-xl"
          >
            Volver a iniciar sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 min-h-[calc(100vh-200px)]">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black mb-2">Mi <span className="text-primary">Perfil</span></h1>
              <p className="text-muted-foreground">Administra tus datos, revisa tus entradas y nivel de beneficios.</p>
            </div>
            {/* Tabs */}
            <div className="flex bg-secondary/50 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
              <button 
                onClick={() => setActiveTab('datos')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${activeTab === 'datos' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Mis Datos
              </button>
              <button 
                onClick={() => setActiveTab('entradas')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${activeTab === 'entradas' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Mis Entradas
              </button>

            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Tarjeta de Fidelidad (Left Column) */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="md:col-span-1">
              {(() => {
                const nivel = (profile.nivelActual || '').toUpperCase();
                // Definir colores según el nivel
                let bgGradient = "from-primary/80 to-primary"; // Por defecto
                if (nivel === 'AZUL') bgGradient = "from-blue-600 to-blue-800";
                if (nivel === 'DORADO') bgGradient = "from-yellow-500 to-yellow-700";
                if (nivel === 'NEGRO') bgGradient = "from-gray-800 to-black";

                return (
                  <div className={`bg-gradient-to-br ${bgGradient} p-6 rounded-2xl shadow-xl text-white relative overflow-hidden`}>
                    <div className="absolute -top-10 -right-10 opacity-20">
                      <Star className="w-32 h-32" />
                    </div>
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <UserIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm opacity-90 font-medium">Nivel Actual</p>
                        <p className="text-2xl font-black uppercase tracking-wide drop-shadow-md">{profile.nivelActual || 'Sin Nivel'}</p>
                      </div>
                    </div>
                    <div className="mb-2 border-b border-white/20 pb-4 relative z-10">
                      <p className="text-sm opacity-90 font-medium">Puntos Acumulados</p>
                      <p className="text-4xl font-black drop-shadow-md">{profile.puntos || 0}</p>
                    </div>
                
                {/* Progreso de Visitas (Velocímetro sin flecha) */}
                <div className="mt-6 flex flex-col items-center">
                  {(() => {
                    const visitas = profile.visitasAnuales || 0;
                    const nivel = (profile.nivelActual || '').toUpperCase();
                    let meta = 7;
                    let sig = 'DORADO';
                    if (nivel === 'DORADO') {
                      meta = 16;
                      sig = 'NEGRO';
                    } else if (nivel === 'NEGRO') {
                      meta = Math.max(visitas, 1);
                    }
                    
                    const faltantes = Math.max(0, meta - visitas);
                    const porcentaje = Math.min(100, Math.round((visitas / meta) * 100));
                    
                    // Calculo para el SVG Arc (radio 40, semicircunferencia = PI * 40 = 125.66)
                    const circ = 125.66;
                    const offset = circ - (circ * porcentaje / 100);
                    
                    return (
                      <div className="w-full flex flex-col items-center">
                        <div className="relative w-full max-w-[180px]">
                          <svg viewBox="0 0 100 55" className="w-full drop-shadow-md overflow-visible">
                            {/* Track Base (Fondo) */}
                            <path 
                              d="M 10 50 A 40 40 0 0 1 90 50" 
                              fill="none" 
                              stroke="rgba(0,0,0,0.2)" 
                              strokeWidth="8" 
                              strokeLinecap="round" 
                            />
                            {/* Track Progress (Blanco) */}
                            <path 
                              d="M 10 50 A 40 40 0 0 1 90 50" 
                              fill="none" 
                              stroke="#ffffff" 
                              strokeWidth="8" 
                              strokeLinecap="round" 
                              strokeDasharray={circ} 
                              strokeDashoffset={offset} 
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                        </div>
                        
                        {/* Información AFUERA del velocímetro */}
                        <div className="text-center mt-3">
                          <p className="text-3xl font-black leading-none drop-shadow-sm">{visitas} <span className="text-sm font-semibold opacity-70">/ {meta}</span></p>
                          <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">Visitas del Año</p>
                        </div>
                        
                        {nivel === 'NEGRO' ? (
                          <p className="text-xs opacity-90 mt-4 bg-white/20 px-3 py-1.5 rounded-full font-semibold">
                            ¡Has alcanzado el nivel máximo!
                          </p>
                        ) : (
                          <p className="text-xs opacity-90 mt-4 bg-black/20 px-4 py-1.5 rounded-full font-medium">
                            Faltan <span className="font-bold text-white text-sm">{faltantes}</span> para ser <span className="font-bold text-white">{sig}</span>
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/20 flex justify-between text-sm">
                  <span>Socio VIP</span>
                  <span className="font-semibold">CINEZONE</span>
                </div>
              </div>
              );
              })()}
            </motion.div>

            {/* Right Column (Dynamic Content) */}
            <div className="md:col-span-2 space-y-6">
              
              {/* TAB: DATOS PERSONALES */}
              {activeTab === 'datos' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary"/> Información Personal
                    </h2>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-semibold transition-colors">
                        <Edit3 className="w-4 h-4" /> Editar
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-sm font-semibold transition-colors">
                          <X className="w-4 h-4" /> Cancelar
                        </button>
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                          <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Nombre Completo</p>
                        <p className="font-semibold">{profile.nombre} {profile.apellido}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Correo Electrónico</p>
                        <p className="font-semibold">{profile.correo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">DNI</p>
                        <p className="font-semibold">{profile.dni}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Celular</p>
                        <p className="font-semibold">{profile.celular || 'No registrado'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Sexo</p>
                        <p className="font-semibold">{profile.genero || 'No registrado'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Nombres</label>
                        <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Apellidos</label>
                        <input type="text" value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">DNI</label>
                        <input 
                          type="text" 
                          value={formData.dni} 
                          onChange={(e) => setFormData({...formData, dni: e.target.value.replace(/[^0-9]/g, '')})} 
                          maxLength={8}
                          pattern="[0-9]{8}"
                          title="Debe contener 8 dígitos"
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Celular</label>
                        <input 
                          type="text" 
                          value={formData.celular} 
                          onChange={(e) => setFormData({...formData, celular: e.target.value.replace(/[^0-9]/g, '')})} 
                          maxLength={9}
                          pattern="[0-9]{9}"
                          title="Debe contener 9 dígitos"
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Sexo</label>
                        <select value={formData.genero} onChange={(e) => setFormData({...formData, genero: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary">
                          <option value="">Seleccione...</option>
                          <option value="MASCULINO">Masculino</option>
                          <option value="FEMENINO">Femenino</option>
                          <option value="OTRO">Otro</option>
                        </select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-semibold text-muted-foreground">Correo (No editable)</label>
                        <input type="text" value={profile.correo} disabled className="w-full px-3 py-2 bg-secondary border border-border rounded-lg opacity-50 cursor-not-allowed" />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              {activeTab === 'datos' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Lock className="w-5 h-5 text-primary"/> Seguridad y Contraseña
                    </h2>
                  </div>
                  <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold">Contraseña Actual</label>
                      <div className="relative">
                        <input 
                          type={showPass ? "text" : "password"} 
                          value={passForm.currentPassword} 
                          onChange={(e) => setPassForm({...passForm, currentPassword: e.target.value})} 
                          required 
                          className="w-full pl-3 pr-10 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary" 
                          placeholder="••••••••" 
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Nueva Contraseña</label>
                      <input 
                        type={showPass ? "text" : "password"} 
                        value={passForm.newPassword} 
                        onChange={(e) => setPassForm({...passForm, newPassword: e.target.value})} 
                        required 
                        minLength={6}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary" 
                        placeholder="••••••••" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Confirmar Nueva Contraseña</label>
                      <input 
                        type={showPass ? "text" : "password"} 
                        value={passForm.confirmPassword} 
                        onChange={(e) => setPassForm({...passForm, confirmPassword: e.target.value})} 
                        required 
                        minLength={6}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary" 
                        placeholder="••••••••" 
                      />
                    </div>
                    <div className="md:col-span-2 mt-2">
                      <button 
                        type="submit" 
                        disabled={passLoading || !passForm.currentPassword || !passForm.newPassword || !passForm.confirmPassword} 
                        className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {passLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* TAB: MIS ENTRADAS */}
              {activeTab === 'entradas' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Ticket className="w-5 h-5 text-primary"/> Mis Compras Recientes</h2>
                  {bookings.length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                      No has comprado entradas recientemente.
                    </div>
                  ) : (
                    bookings.map((booking) => {
                      const fecha = new Date(booking.fechaFuncion);
                      return (
                        <div key={booking.id} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:border-primary/30 transition-colors">
                          {/* Left Poster (hidden on very small screens) */}
                          <div className="w-full sm:w-32 h-40 sm:h-auto bg-secondary relative flex-shrink-0">
                             <img src={booking.posterUrl || '/images/placeholder.jpg'} alt={booking.peliculaTitulo} className="absolute inset-0 w-full h-full object-cover" />
                          </div>
                          
                          {/* Details */}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-lg leading-tight">{booking.peliculaTitulo}</h3>
                                <span className={`text-xs px-2 py-1 rounded-md font-bold ${booking.estado === 'USADA' ? 'bg-secondary text-muted-foreground' : 'bg-primary/20 text-primary'}`}>{booking.estado}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{booking.sedeNombre} • {booking.salaNombre}</p>
                            </div>
                            
                            <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                              <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Fecha y Hora</p>
                                <p className="font-bold">{fecha.toLocaleDateString()} - {fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Total</p>
                                <p className="font-black text-primary mb-2">S/ {booking.montoTotal.toFixed(2)}</p>
                                <button 
                                  onClick={() => handleViewReceipt(booking.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-border text-foreground text-xs font-bold rounded-xl transition-all"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Visualizar Boleta
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </motion.div>
              )}


            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
