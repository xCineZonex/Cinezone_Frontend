'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, Film, ArrowRight, CreditCard } from 'lucide-react';
import api from '@/lib/api';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    tipoDocumento: 'DNI',
    dni: '',
    genero: 'MASCULINO',
    confirmarPassword: '',
    aceptaTerminos: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        // --- CONFIGURACIÓN DE SEGURIDAD (BFF PROXY) ---
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            correo: formData.email,
            contrasena: formData.password
          })
        });
        
        const data = await response.json();

        if (!response.ok) {
           throw new Error(data.message || 'Error al iniciar sesión');
        }
        const { rol } = data;
        
        // No guardamos el token en LocalStorage. La cookie HttpOnly ya lo tiene.
        localStorage.setItem('rol', rol || '');

        setSuccessMsg('Inicio de sesión exitoso. Redirigiendo...');
        
        // Redirigir según el rol
        setTimeout(() => {
          if (rol === 'SUPER_ADMIN' || rol === 'ADMIN_SEDE') {
            window.location.href = '/admin/dashboard';
          } else if (rol === 'JEFE_SALA') {
            window.location.href = '/jefe-sala';
          } else if (rol === 'STAFF') {
            window.location.href = '/staff/selector';
          } else {
            window.location.href = '/perfil';
          }
        }, 1500);
        
      } else {
        // REGISTRO
        if (!formData.aceptaTerminos) {
          setErrorMsg('Debes aceptar los Términos y Condiciones');
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmarPassword) {
          setErrorMsg('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }

        if (formData.tipoDocumento === 'DNI' && !/^\d{8}$/.test(formData.dni)) {
          setErrorMsg('El DNI debe tener exactamente 8 dígitos.');
          setLoading(false);
          return;
        }
        
        if (formData.tipoDocumento === 'PASAPORTE' && (formData.dni.length < 6 || formData.dni.length > 15)) {
          setErrorMsg('El Pasaporte debe tener entre 6 y 15 caracteres.');
          setLoading(false);
          return;
        }

        await api.post('/auth/register', {
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.email,
          contrasena: formData.password,
          tipoDocumento: formData.tipoDocumento,
          dni: formData.dni,
          genero: formData.genero
        });

        setSuccessMsg('¡Registro exitoso! Ahora puedes iniciar sesión.');
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMsg('');
        }, 2000);
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        setErrorMsg(error.response.data.message || error.response.data || 'Ocurrió un error');
      } else {
        setErrorMsg('Error de conexión con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-20 md:pt-24 pb-16 min-h-[calc(100vh-200px)] flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Film className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-black text-foreground mb-2">
                {isLogin ? 'Bienvenido de vuelta' : 'Únete a Cinezone'}
              </h1>
              <p className="text-muted-foreground">
                {isLogin
                  ? 'Ingresa tus credenciales para continuar'
                  : 'Crea tu cuenta y disfruta de beneficios exclusivos'}
              </p>
            </motion.div>

            {/* Form Card */}
            <motion.div
              className="bg-card rounded-2xl p-8 border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm text-center">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-xl text-green-500 text-sm text-center">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nombre y Apellido (solo registro) */}
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Nombre</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                          placeholder="Tu nombre"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Apellido</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formData.apellido}
                          onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                          className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                          placeholder="Tu apellido"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* DNI (solo registro) */}
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-foreground mb-2">Tipo Doc.</label>
                      <div className="relative">
                        <select
                          required
                          value={formData.tipoDocumento}
                          onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value })}
                          className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
                        >
                          <option value="DNI">DNI</option>
                          <option value="PASAPORTE">Pasaporte</option>
                        </select>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {formData.tipoDocumento === 'DNI' ? 'Número de DNI' : 'Número de Pasaporte'}
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          maxLength={formData.tipoDocumento === 'DNI' ? 8 : 15}
                          value={formData.dni}
                          onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                          placeholder={formData.tipoDocumento === 'DNI' ? "8 dígitos" : "6 a 15 caracteres"}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Genero */}
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-foreground mb-2">Sexo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <select
                        required
                        value={formData.genero}
                        onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
                      >
                        <option value="MASCULINO">Masculino</option>
                        <option value="FEMENINO">Femenino</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-12 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Password (solo registro) */}
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        value={formData.confirmarPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmarPassword: e.target.value })
                        }
                        className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Terminos y Condiciones (solo registro) */}
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 mt-2"
                  >
                    <input
                      type="checkbox"
                      id="terminos"
                      required
                      checked={formData.aceptaTerminos}
                      onChange={(e) => setFormData({ ...formData, aceptaTerminos: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="terminos" className="text-sm text-muted-foreground">
                      Acepto los{' '}
                      <Link href="/terminos" className="text-primary hover:underline" target="_blank">
                        Términos y Condiciones
                      </Link>
                    </label>
                  </motion.div>
                )}

                {/* Forgot Password */}
                {isLogin && (
                  <div className="text-right">
                    <Link
                      href="/recuperar"
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                >
                  {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </motion.button>
              </form>

              {/* Toggle Login/Register */}
              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    {isLogin ? 'Regístrate' : 'Inicia sesión'}
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
