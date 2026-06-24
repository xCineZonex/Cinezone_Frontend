'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save, User, Mail, IdCard, Lock, Phone, Briefcase, KeyRound, Building } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useSedeStore } from '@/store/useSedeStore';

export default function NuevoStaffPage() {
  const router = useRouter();
  const { activeSedeId } = useSedeStore();
  const [loading, setLoading] = useState(false);
  const [sedes, setSedes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    tipoDocumento: 'DNI',
    dni: '',
    nombre: '',
    apellido: '',
    correo: '',
    celular: '',
    contrasena: '',
    rol: 'STAFF',
    sedesIds: [] as number[]
  });

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Si hay una sede activa específica, la preseleccionamos
    if (activeSedeId && activeSedeId !== 'all') {
      setFormData(prev => ({ ...prev, sedesIds: [Number(activeSedeId)] }));
    }

    const fetchSedesAndUser = async () => {
      try {
        const userRes = await api.get('/users/me');
        setCurrentUser(userRes.data);

        const res = await api.get('/public/sedes');
        let allSedes = res.data;
        if (userRes.data.rol === 'ADMIN_SEDE' && userRes.data.sedesIds) {
          allSedes = allSedes.filter((s: any) => userRes.data.sedesIds.includes(s.id));
        }
        setSedes(allSedes);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSedesAndUser();
  }, [activeSedeId]);

  const handleSedeToggle = (sedeId: number) => {
    // Si estamos en un contexto de sede específico, impedimos deseleccionar esa sede
    if (activeSedeId && activeSedeId !== 'all' && sedeId === Number(activeSedeId)) {
      toast.error('No puedes deseleccionar la sede de tu contexto de trabajo actual.');
      return;
    }

    setFormData(prev => {
      const isSelected = prev.sedesIds.includes(sedeId);
      if (!isSelected && currentUser?.rol === 'ADMIN_SEDE' && prev.sedesIds.length >= 1) {
        toast.error('Un Administrador de Sede solo puede asignar 1 sede por usuario.');
        return prev;
      }
      return {
        ...prev,
        sedesIds: isSelected 
          ? prev.sedesIds.filter(id => id !== sedeId)
          : [...prev.sedesIds, sedeId]
      };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.correo.trim() || !formData.dni.trim() || !formData.celular.trim() || !formData.contrasena.trim()) {
      toast.error('Por favor, completa todos los campos obligatorios');
      return;
    }

    if (formData.tipoDocumento === 'DNI' && !/^\d{8}$/.test(formData.dni)) {
      toast.error('El DNI debe tener exactamente 8 números');
      return;
    }
    if (formData.tipoDocumento === 'PASAPORTE' && formData.dni.length < 8) {
      toast.error('El Pasaporte debe tener al menos 8 caracteres');
      return;
    }
    if (!/^\d{9}$/.test(formData.celular)) {
      toast.error('El celular debe tener exactamente 9 números');
      return;
    }
    if (formData.contrasena.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        sedesIds: formData.rol === 'SUPER_ADMIN' ? [] : formData.sedesIds
      };
      // Usamos el campo dni para enviar el documento en el backend
      await api.post('/admin/users/staff', payload);
      toast.success('Cuenta de staff creada exitosamente');
      router.push('/admin/usuarios');
    } catch (error: any) {
      console.error('Error creating staff:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al registrar al usuario';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen pb-24">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-10"
      >
        <Link href="/admin/usuarios" className="p-3 bg-card border border-border hover:bg-secondary/80 rounded-2xl transition-all shadow-sm group">
          <ChevronLeft className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Registrar Staff
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Crea una nueva cuenta de empleado para el sistema</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Columna Izquierda: Info Personal */}
          <motion.div variants={itemVariants} className="bg-card border border-border rounded-3xl p-8 shadow-xl shadow-black/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <User className="w-6 h-6 text-primary" />
              Datos Personales
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Nombres *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                    <input
                      type="text"
                      name="nombre"
                      required
                      value={formData.nombre}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-secondary/30 border border-border rounded-2xl focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                      placeholder="Juan"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Apellidos *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                    <input
                      type="text"
                      name="apellido"
                      required
                      value={formData.apellido}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-secondary/30 border border-border rounded-2xl focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                      placeholder="Pérez"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-1">
                  <label className="text-sm font-semibold text-muted-foreground">Documento *</label>
                  <select
                    name="tipoDocumento"
                    value={formData.tipoDocumento}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-secondary/30 border border-border rounded-2xl focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-semibold cursor-pointer appearance-none"
                  >
                    <option value="DNI">DNI</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-semibold text-muted-foreground">Número *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <IdCard className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                    <input
                      type="text"
                      name="dni"
                      required
                      maxLength={formData.tipoDocumento === 'DNI' ? 8 : 15}
                      value={formData.dni}
                      onChange={(e) => {
                        if (formData.tipoDocumento === 'DNI') {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({...formData, dni: val});
                        } else {
                          handleChange(e);
                        }
                      }}
                      className="w-full pl-12 pr-4 py-3.5 bg-secondary/30 border border-border rounded-2xl focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono text-lg tracking-wider"
                      placeholder={formData.tipoDocumento === 'DNI' ? "70001234" : "Número"}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Celular *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <input
                    type="text"
                    name="celular"
                    required
                    maxLength={9}
                    value={formData.celular}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, celular: val});
                    }}
                    className="w-full pl-12 pr-4 py-3.5 bg-secondary/30 border border-border rounded-2xl focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono text-lg tracking-wider"
                    placeholder="987654321"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Columna Derecha: Credenciales */}
          <div className="space-y-8">
            <motion.div variants={itemVariants} className="bg-card border border-border rounded-3xl p-8 shadow-xl shadow-black/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full -z-10" />
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <KeyRound className="w-6 h-6 text-purple-500" />
                Cuenta y Accesos
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Correo Corporativo *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                    <input
                      type="email"
                      name="correo"
                      required
                      value={formData.correo}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-secondary/30 border border-border rounded-2xl focus:bg-background focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium"
                      placeholder="empleado@cinezone.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Contraseña Temporal *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                    <input
                      type="password"
                      name="contrasena"
                      required
                      value={formData.contrasena}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-secondary/30 border border-border rounded-2xl focus:bg-background focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-mono tracking-widest text-lg"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium pl-1">El sistema pedirá el cambio al iniciar sesión.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Rol Asignado *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Briefcase className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                    <select
                      name="rol"
                      required
                      value={formData.rol}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-secondary/30 border border-border rounded-2xl focus:bg-background focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-bold text-foreground cursor-pointer appearance-none"
                    >
                      <option value="STAFF">STAFF (Taquilla / Dulcería / Portero)</option>
                      <option value="JEFE_SALA">JEFE DE SALA</option>
                      {currentUser?.rol !== 'ADMIN_SEDE' && (
                        <>
                          <option value="ADMIN_SEDE">ADMINISTRADOR DE SEDE</option>
                          <option value="SUPER_ADMIN">SUPER ADMINISTRADOR</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </div>

          {/* Bloque Inferior: Sedes Asignadas */}
          {formData.rol !== 'SUPER_ADMIN' && (
            <motion.div variants={itemVariants} className="bg-card border border-border rounded-3xl p-8 shadow-xl shadow-black/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10" />
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Building className="w-6 h-6 text-blue-500" />
                Sedes Asignadas
              </h2>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Selecciona las sedes donde este usuario tendrá acceso o administración.</p>
                <div className="flex flex-wrap gap-3">
                  {sedes.map(s => {
                    const isLocked = activeSedeId && activeSedeId !== 'all' && s.id === Number(activeSedeId);
                    const isSelected = formData.sedesIds.includes(s.id);
                    return (
                    <label 
                      key={s.id} 
                      className={`flex items-center gap-2 px-5 py-3 rounded-full border transition-all ${
                        isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
                      } ${
                        isSelected 
                          ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20 scale-105' 
                          : 'bg-secondary/30 text-muted-foreground border-border hover:border-purple-500/50 hover:bg-secondary/50 hover:scale-105'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={isSelected}
                        onChange={() => handleSedeToggle(s.id)}
                        disabled={isLocked}
                      />
                      {isLocked && <Lock className="w-4 h-4" />}
                      <span className="font-bold text-sm tracking-wide">{s.nombre}</span>
                    </label>
                  )})}
                </div>
                {formData.sedesIds.length === 0 && (
                  <p className="text-sm font-semibold text-red-500 mt-2">Debe seleccionar al menos una sede.</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div variants={itemVariants} className="lg:col-span-2 pt-6 flex justify-end gap-4 border-t border-border mt-2">
            <Link href="/admin/usuarios">
              <button type="button" className="px-8 py-4 font-bold text-muted-foreground hover:bg-secondary rounded-2xl transition-all">
                Cancelar
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-3 px-10 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl transition-all shadow-xl shadow-primary/30 disabled:opacity-50 hover:-translate-y-1"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-6 h-6" />
              )}
              {loading ? 'Procesando...' : 'Guardar Empleado'}
            </button>
          </motion.div>

        </motion.div>
      </form>
    </div>
  );
}
