'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function InteractiveMascot() {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const messages = [
    '¡Hola! ¿Listo para la película? 🍿',
    '¡Las mejores salas te esperan!',
    '¡No olvides tus snacks! 🥤',
    '¡Acción! 🎬',
    '¡Disfruta la función!',
  ];

  const handleClick = () => {
    setIsClicked(true);
    setClickCount((prev) => (prev + 1) % messages.length);
    setTimeout(() => setIsClicked(false), 500);
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow effect behind mascot */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-primary/20 blur-3xl"
        animate={{
          scale: isHovered ? 1.3 : 1,
          opacity: isHovered ? 0.5 : 0.3,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Speech bubble */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute -top-4 right-0 md:-right-8 z-20"
          >
            <div className="relative bg-card px-5 py-3 rounded-2xl shadow-xl border border-border">
              <p className="text-foreground font-semibold text-sm whitespace-nowrap">
                {messages[clickCount]}
              </p>
              {/* Speech bubble tail */}
              <div className="absolute -bottom-2 left-6 w-4 h-4 bg-card border-l border-b border-border rotate-[-45deg]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot Image */}
      <motion.div
        className="relative cursor-pointer select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        animate={{
          y: isHovered ? 0 : [0, -10, 0],
          rotate: isClicked ? [0, -5, 5, -5, 0] : 0,
          scale: isClicked ? 1.1 : isHovered ? 1.05 : 1,
        }}
        transition={{
          y: {
            duration: 3,
            repeat: isHovered ? 0 : Infinity,
            ease: 'easeInOut',
          },
          rotate: { duration: 0.4 },
          scale: { duration: 0.2 },
        }}
        whileHover={{ filter: 'drop-shadow(0 0 20px rgba(180, 106, 60, 0.5))' }}
      >
        <Image
          src="/images/caricatura.png"
          alt="Mascota Cinezone - Caricatura animada"
          width={450}
          height={450}
          className="w-72 h-72 md:w-96 md:h-96 lg:w-[450px] lg:h-[450px] object-contain drop-shadow-2xl"
          style={{ width: 'auto', height: 'auto' }}
          priority
        />

        {/* Hand wave animation overlay */}
        <motion.div
          className="absolute top-[15%] left-[-5%] w-12 h-12"
          animate={
            isHovered
              ? {
                  rotate: [0, 15, -15, 15, 0],
                }
              : {}
          }
          transition={{
            duration: 0.6,
            repeat: isHovered ? Infinity : 0,
            repeatDelay: 1,
          }}
        />
      </motion.div>

      {/* Sparkles around mascot when hovered */}
      <AnimatePresence>
        {isHovered && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-accent rounded-full"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 6) * 150,
                  y: Math.sin((i * Math.PI * 2) / 6) * 150,
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  repeat: Infinity,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
