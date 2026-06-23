'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import Link from 'next/link';
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await api.post('/auth/password/forgot', { email });
      setSuccessMsg(response.data.message || 'Si el correo está registrado, recibirás un enlace.');
    } catch (error: any) {
      if (error.response?.data?.message) {
        setErrorMsg(error.response.data.message);
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
      <div className="pt-20 md:pt-32 pb-16 min-h-[calc(100vh-200px)] flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                <KeyRound className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-black text-foreground mb-2">
                Recupera tu contraseña
              </h1>
              <p className="text-muted-foreground">
                Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecerla.
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
                  <CheckCircle2 className="w-8 h-8" />
                  {successMsg}
                </div>
              )}

              {!successMsg && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-black rounded-xl transition-all shadow-lg shadow-primary/25"
                    whileHover={!loading ? { scale: 1.02 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                  >
                    {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
                  </motion.button>
                </form>
              )}

              <div className="mt-8 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-semibold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
