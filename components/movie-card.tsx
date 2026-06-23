'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, Calendar } from 'lucide-react';

interface Pelicula {
  id: number;
  titulo: string;
  genero: string;
  duracionMinutos: number;
  clasificacion: string;
  calificacion?: number;
  posterUrl: string;
  estado: 'EN_CARTELERA' | 'PROXIMAMENTE' | 'PRE_VENTA';
  fechaEstreno?: string;
  sinopsis?: string;
  idioma?: string;
  trailerUrl?: string;
}

interface MovieCardProps {
  pelicula: Pelicula;
}

export default function MovieCard({ pelicula }: MovieCardProps) {
  const estadoColors = {
    EN_CARTELERA: 'bg-green-500/20 text-green-400 border-green-500/30',
    PROXIMAMENTE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PRE_VENTA: 'bg-accent/20 text-accent border-accent/30',
  };

  const estadoLabels = {
    EN_CARTELERA: 'En Cartelera',
    PROXIMAMENTE: 'Próximamente',
    PRE_VENTA: 'Pre-Venta',
  };

  return (
    <motion.div
      className="group relative bg-card rounded-3xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-500 shadow-lg hover:shadow-[0_20px_40px_-15px_rgba(180,106,60,0.4)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
    >
      {/* Premium Glow effect behind the card */}
      <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary rounded-[2.5rem] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10" />

      {/* Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={pelicula.posterUrl || '/images/placeholder.jpg'}
          alt={pelicula.titulo}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder.jpg';
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />

        {/* Estado Badge */}
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1.5 text-xs font-bold rounded-full border backdrop-blur-md shadow-lg ${estadoColors[pelicula.estado]}`}
          >
            {estadoLabels[pelicula.estado]}
          </span>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
          <Star className="w-4 h-4 text-accent fill-accent" />
          <span className="text-sm font-bold text-white">{pelicula.calificacion || '5.0'}</span>
        </div>

        {/* Quick Actions (visible on hover) */}
        <motion.div
          className="absolute inset-x-0 bottom-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-8 group-hover:translate-y-0"
          initial={false}
        >
          <Link href={`/pelicula/${pelicula.id}`}>
            <motion.button
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {pelicula.estado === 'EN_CARTELERA' ? 'Comprar Entradas' : 'Ver Detalles'}
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {pelicula.titulo}
        </h3>

        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
          <span className="px-2 py-0.5 bg-secondary rounded-md">{pelicula.genero}</span>
          <span className="px-2 py-0.5 bg-secondary rounded-md">{pelicula.clasificacion}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{pelicula.duracionMinutos ? `${Math.floor(pelicula.duracionMinutos / 60)}h ${pelicula.duracionMinutos % 60}min` : ''}</span>
          </div>
          {pelicula.fechaEstreno && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{pelicula.fechaEstreno}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
