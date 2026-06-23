'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { MapPin, Clock, Phone, Star, Navigation, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function SedesPage() {
  const [sedes, setSedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const response = await api.get('/public/sedes');
        setSedes(response.data);
      } catch (error) {
        console.error('Error al obtener sedes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSedes();
  }, []);

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 text-accent text-sm font-semibold rounded-full mb-4 border border-primary/30">
              <MapPin className="w-4 h-4" />
              Encuentra tu sede
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
              Nuestras <span className="text-primary">Sedes</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Descubre todas nuestras ubicaciones y encuentra la más cercana a ti
            </p>
          </motion.div>

          {/* Sedes List */}
          {loading ? (
             <div className="text-center py-16 text-muted-foreground">Cargando sedes...</div>
          ) : (
            <div className="space-y-6">
              {sedes.map((sede, index) => (
                <motion.div
                  key={sede.id}
                  className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ boxShadow: '0 20px 40px -20px rgba(180, 106, 60, 0.2)' }}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div
                      className="w-full md:w-80 h-48 md:h-auto bg-cover bg-center relative flex-shrink-0"
                      style={{ backgroundImage: `url(${sede.imagen || '/placeholder.jpg'})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/50 hidden md:block" />
                      {sede.calificacion && (
                        <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-lg">
                          <Star className="w-4 h-4 text-accent fill-accent" />
                          <span className="text-sm font-bold text-foreground">{sede.calificacion.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-foreground mb-2">{sede.nombre}</h2>
                          <p className="text-muted-foreground mb-4">{sede.direccion}</p>

                          {/* Features */}
                          {sede.caracteristicas && sede.caracteristicas.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {sede.caracteristicas.map((car: string) => (
                                <span
                                  key={car}
                                  className="px-3 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full border border-primary/20"
                                >
                                  {car}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Info */}
                          <div className="grid sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                              <span>{sede.ciudad || sede.direccion}</span>
                            </div>
                            {sede.horario && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4 flex-shrink-0 text-primary" />
                                <span>{sede.horario}</span>
                              </div>
                            )}
                            {sede.telefono && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                                <span>{sede.telefono}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Navigation className="w-4 h-4 flex-shrink-0 text-primary" />
                              <span>{sede.estado || 'Sede activa'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row md:flex-col gap-3">
                          <Link href={`/cartelera?sede=${sede.id}`} className="flex-1 md:flex-none">
                            <motion.button
                              className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              Ver Cartelera
                              <ChevronRight className="w-4 h-4" />
                            </motion.button>
                          </Link>

                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
