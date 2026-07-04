'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Mail, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!emailParam) {
      router.push('/login');
    }
  }, [emailParam, router]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      setErrorMsg('Por favor ingresa el código completo de 6 dígitos.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-email', {
        email: emailParam,
        code: fullCode,
      });

      setSuccessMsg(response.data.message || 'Cuenta verificada exitosamente.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      if (error.response && error.response.data) {
        setErrorMsg(error.response.data.message || error.response.data || 'Código incorrecto');
      } else {
        setErrorMsg('Error de conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setResending(true);

    try {
      const response = await api.post('/auth/resend-verification', {
        email: emailParam,
      });
      setSuccessMsg(response.data.message || 'Nuevo código enviado.');
      setTimeLeft(600);
      setCode(['', '', '', '', '', '']);
    } catch (error: any) {
      if (error.response && error.response.data) {
        setErrorMsg(error.response.data.message || 'No se pudo reenviar');
      } else {
        setErrorMsg('Error al reenviar.');
      }
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
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
              <ShieldCheck className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-black text-foreground mb-2">Verifica tu correo</h1>
            <p className="text-muted-foreground">
              Hemos enviado un código de 6 dígitos a <br />
              <strong className="text-primary">{emailParam}</strong>
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-2 mb-6">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    ref={(el) => {
                        inputRefs.current[idx] = el;
                    }}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-secondary rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                ))}
              </div>

              <div className="text-center text-sm text-muted-foreground mb-4">
                El código expira en: <strong className="text-foreground">{formatTime(timeLeft)}</strong>
              </div>

              <motion.button
                type="submit"
                disabled={loading || timeLeft <= 0}
                className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? 'Verificando...' : 'Verificar Cuenta'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-primary hover:text-primary/80 font-semibold transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Reenviando...' : 'Reenviar código'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
        <VerifyContent />
      </Suspense>
      <Footer />
    </main>
  );
}
