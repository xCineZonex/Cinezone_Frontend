'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import Link from 'next/link';
import { Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('El enlace de recuperación es inválido o no contiene un token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!token) {
      setErrorMsg('No se encontró el token de seguridad.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/password/reset', { token, newPassword: password });
      setSuccessMsg(response.data.message || 'Contraseña restablecida exitosamente.');
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      if (error.response?.data?.message) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg('Error al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
          <ShieldCheck className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-2">
          Nueva Contraseña
        </h1>
        <p className="text-muted-foreground">
          Crea una nueva contraseña segura para tu cuenta.
        </p>
      </motion.div>

      {/* Form Card */}
      <motion.div
        className="bg-card rounded-2xl p-8 border border-border shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm text-center font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-xl text-emerald-500 text-sm text-center flex flex-col items-center gap-2 font-medium">
            <ShieldCheck className="w-8 h-8" />
            {successMsg}
            <div className="mt-2 text-xs text-emerald-600/80">
              Redirigiendo al inicio de sesión...
            </div>
          </div>
        )}

        {!successMsg && token && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
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

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-black rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </motion.button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-semibold transition-colors"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-20 md:pt-32 pb-16 min-h-[calc(100vh-200px)] flex items-center">
        <div className="container mx-auto px-6">
          {/* Suspense es requerido por Next.js al usar useSearchParams */}
          <Suspense fallback={<div className="text-center p-8">Cargando verificación...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
      <Footer />
    </main>
  );
}
