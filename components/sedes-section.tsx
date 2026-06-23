'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, Star } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Sede {
  id: number;
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono?: string;
  horario?: string;
  salas?: number;
  calificacion?: number;
  imagen?: string;
  caracteristicas?: string[];
}

export default function SedesSection() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const rol = localStorage.getItem('rol');
    if (rol && ['TAQUILLA', 'DULCERIA', 'PORTERO', 'STAFF', 'ADMIN_SEDE', 'SUPER_ADMIN', 'VALIDADOR'].includes(rol)) {
      setIsStaff(true);
    }
    const fetchSedes = async () => {
      try {
        const response = await api.get('/public/sedes');
        // Solo tomamos las primeras 3 para el Home
        setSedes(response.data.slice(0, 3));
      } catch (error) {
        console.error('Error al obtener sedes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSedes();
  }, []);

  if (isStaff) return null;
  if (!loading && sedes.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-card/50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-4">
            Nuestras <span className="text-primary">Sedes</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Encuentra la sede más cercana y disfruta de la mejor experiencia cinematográfica
          </p>
        </motion.div>

        {/* Sedes Grid */}
        {loading ? (
           <div className="text-center py-16 text-muted-foreground">Cargando sedes destacadas...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sedes.map((sede, index) => (
              <motion.div
                key={sede.id}
                className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 20px 40px -20px rgba(180, 106, 60, 0.2)' }}
              >
                {/* Image */}
                <div
                  className="h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${sede?.imagen || '/placeholder.jpg'})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />

                  {/* Rating */}
                  {sede.calificacion && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-lg">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="text-sm font-bold text-foreground">{sede.calificacion.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Features */}
                  {sede.caracteristicas && (
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      {sede.caracteristicas.slice(0, 2).map((car: string) => (
                        <span
                          key={car}
                          className="px-2 py-1 text-xs font-semibold bg-primary/90 text-primary-foreground rounded-md"
                        >
                          {car}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {sede.nombre}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>{sede.direccion}</span>
                    </div>
                    {sede.horario && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 flex-shrink-0 text-primary" />
                        <span>{sede.horario}</span>
                      </div>
                    )}
                    {sede.telefono && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                        <span>{sede.telefono}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      <span className="text-accent font-bold">{sede?.salas || 'Varias'}</span> salas disponibles
                    </span>
                    <Link href={`/cartelera?sede=${sede.id}`}>
                      <motion.button
                        className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-semibold rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Ver Cartelera
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/sedes">
            <motion.button
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-lg transition-all shadow-lg shadow-primary/30"
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(180, 106, 60, 0.5)' }}
              whileTap={{ scale: 0.98 }}
            >
              Ver Todas las Sedes
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
