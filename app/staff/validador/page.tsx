'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { QrCode, CheckCircle, XCircle, PackageCheck, Info } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/navbar';
import { Html5Qrcode } from 'html5-qrcode';

export default function ValidadorDulceriaPage() {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<any>(null);
  const [selectedSnacks, setSelectedSnacks] = useState<number[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = React.useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    try {
      setIsScanning(true);
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader-dulceria");
      }
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setCodigo(decodedText);
          handleValidarCode(decodedText);
          stopScanner();
        },
        () => {}
      );
    } catch (err) {
      console.error(err);
      setErrorMessage("No se pudo iniciar la cámara. Verifica los permisos.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error(err);
      }
    }
    setIsScanning(false);
  };

  React.useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleValidarCode = async (code: string) => {
    if (!code.trim()) return;

    setLoading(true);
    setErrorMessage("");
    try {
      const res = await api.post('/dulceria/validar-qr', { codigoBoleta: code.trim() });
      setResult(res.data);
      if (res.data.valido) {
        toast.success('Pase autorizado');
        setSelectedSnacks(res.data.snacks?.filter((s: any) => !s.entregado).map((s: any) => s.snackId) || []);
      } else {
        setErrorMessage('Código rechazado');
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Error al validar el código');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleValidar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await handleValidarCode(codigo);
  };

  const handleToggleSnack = (id: number) => {
    setSelectedSnacks(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleEntregar = async () => {
    if (selectedSnacks.length === 0) {
      setErrorMessage('Selecciona al menos un producto');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/dulceria/entregar/${codigo.trim()}`, { snackIds: selectedSnacks });
      setResult(res.data);
      toast.success('Productos entregados correctamente');
      setSelectedSnacks(res.data.snacks?.filter((s: any) => !s.entregado).map((s: any) => s.snackId) || []);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Error al entregar productos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 flex items-center justify-center">
        <div className="w-full max-w-md p-6 bg-card border border-border rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-black">Validador <span className="text-primary">Dulcería</span></h1>
            <p className="text-muted-foreground text-sm mt-2">Escanea el código QR del cliente para entregar productos</p>
          </div>

          <div className={`w-full mb-6 rounded-2xl overflow-hidden bg-black border-2 border-primary shadow-xl ${isScanning ? 'block' : 'hidden'}`}>
            <div id="qr-reader-dulceria" className="w-full" />
            <button
              onClick={stopScanner}
              className="w-full py-3 text-center text-white bg-red-600 font-bold hover:bg-red-700 transition-colors"
            >
              Cancelar Escáner
            </button>
          </div>
          
          {!isScanning && (
            <button
              onClick={startScanner}
              className="w-full flex items-center justify-center gap-2 mb-6 text-white bg-primary hover:bg-primary/90 font-bold rounded-xl px-5 py-4 transition-all"
            >
              <QrCode className="w-6 h-6" />
              Escanear con Cámara
            </button>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-muted-foreground font-bold text-xs">O INGRESAR CÓDIGO</span>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <form onSubmit={handleValidar} className="space-y-4">
            <div>
              <input
                type="text"
                autoFocus
                placeholder="Ej. d066c973-fb1f..."
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.trim())}
                className="w-full p-4 text-center text-xl font-bold bg-secondary rounded-xl outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !codigo}
              className="w-full p-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'BUSCAR PRODUCTOS'}
            </button>
          </form>

          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center text-destructive font-medium"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* Resultado de Validación */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-8 p-6 rounded-xl border ${result.valido ? 'bg-primary/5 border-primary/20' : 'bg-red-500/10 border-red-500/30'}`}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                {result.valido ? <PackageCheck className="w-8 h-8 text-primary" /> : <XCircle className="w-8 h-8 text-red-500" />}
                <h2 className={`text-xl font-black ${result.valido ? 'text-primary' : 'text-red-500'}`}>
                  {result.mensaje}
                </h2>
              </div>
              
              {result.valido && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm bg-background/50 p-3 rounded-lg">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="font-bold">{result.nombreCliente}</span>
                  </div>

                  <div className="space-y-2 mt-4">
                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">Productos</h3>
                    {result.snacks?.map((snack: any) => (
                      <div 
                        key={snack.snackId} 
                        className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${snack.entregado ? 'bg-secondary/50 border-transparent opacity-60' : 'bg-card border-border hover:border-primary/50 cursor-pointer'}`}
                        onClick={() => !snack.entregado && handleToggleSnack(snack.snackId)}
                      >
                        <div className="flex items-center gap-3">
                          {!snack.entregado && (
                            <input 
                              type="checkbox" 
                              checked={selectedSnacks.includes(snack.snackId)}
                              onChange={() => {}}
                              className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                            />
                          )}
                          {snack.entregado && <CheckCircle className="w-5 h-5 text-green-500" />}
                          <span className="font-semibold">{snack.nombre}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-lg">x{snack.cantidad}</span>
                          {snack.entregado && <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">Entregado</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!result.snacks?.every((s: any) => s.entregado) && (
                    <button
                      onClick={handleEntregar}
                      disabled={loading || selectedSnacks.length === 0}
                      className="w-full mt-6 p-4 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      <PackageCheck className="w-5 h-5" />
                      ENTREGAR SELECCIONADOS ({selectedSnacks.length})
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
