'use client';

import { motion } from 'framer-motion';
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

  const duracionStr = pelicula.duracionMinutos
    ? `${Math.floor(pelicula.duracionMinutos / 60)}h ${pelicula.duracionMinutos % 60}min`
    : '';

  const fechaStr = pelicula.fechaEstreno
    ? new Date(pelicula.fechaEstreno).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <motion.div
      className="group relative bg-card rounded-3xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-500 shadow-lg hover:shadow-[0_20px_40px_-15px_rgba(180,106,60,0.4)] flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
    >
      {/* Premium Glow effect behind the card */}
      <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary rounded-[2.5rem] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10" />

      {/* Image Container — fixed aspect ratio so all posters are identical height */}
      <div className="relative aspect-[2/3] overflow-hidden flex-shrink-0">
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
        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 text-[10px] font-bold rounded-full border backdrop-blur-md shadow-lg ${estadoColors[pelicula.estado]}`}
          >
            {estadoLabels[pelicula.estado]}
          </span>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
          <Star className="w-3 h-3 text-accent fill-accent" />
          <span className="text-xs font-bold text-white">{pelicula.calificacion || '5.0'}</span>
        </div>

        {/* Quick Actions (visible on hover) */}
        <motion.div
          className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0"
          initial={false}
        >
          <Link href={`/pelicula/${pelicula.id}`}>
            <motion.button
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {pelicula.estado === 'EN_CARTELERA' ? 'Comprar Entradas' : 'Ver Detalles'}
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Content — fixed height so all cards are the same total size */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title — always 2 lines max, never more */}
        <h3 className="text-sm font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug min-h-[2.5rem]">
          {pelicula.titulo}
        </h3>

        {/* Genre / Classification badges */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {pelicula.genero && (
            <span className="px-2 py-0.5 bg-secondary rounded-md text-xs text-muted-foreground truncate max-w-[90px]">
              {pelicula.genero}
            </span>
          )}
          {pelicula.clasificacion && (
            <span className="px-2 py-0.5 bg-secondary rounded-md text-xs text-muted-foreground">
              {pelicula.clasificacion}
            </span>
          )}
        </div>

        {/* Duration + Date — always at the bottom */}
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground gap-2">
          {duracionStr && (
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span>{duracionStr}</span>
            </div>
          )}
          {fechaStr && (
            <div className="flex items-center gap-1 min-w-0">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{fechaStr}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
