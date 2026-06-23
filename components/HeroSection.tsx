"use client"; 

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Popcorn, Ticket } from "lucide-react";

export default function HeroSection() {
  const containerRef = useRef(null);
  
  // Capturamos el scroll global en píxeles
  const { scrollY } = useScroll();
  
  // 1. Rotación hacia la izquierda (antihorario): de 0deg a -15deg en el rango [0, 300]px
  const rotation = useTransform(scrollY, [0, 300], [0, -15]);

  // 2. Secuencia de Opacidad (Stop-motion / Secuencial)
  const opacityOpen = useTransform(scrollY, [0, 100, 110], [1, 1, 0]);
  const opacityMid = useTransform(scrollY, [100, 110, 200, 210], [0, 1, 1, 0]);
  const opacityClosed = useTransform(scrollY, [200, 210, 300], [0, 1, 1]);

  return (
    <section ref={containerRef} className="relative w-full min-h-screen bg-[#111111] text-white flex items-center justify-center overflow-hidden px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
        
        {/* Lado Izquierdo: Textos y Botones */}
        <div className="flex flex-col gap-6 z-10">
          <div className="inline-block px-4 py-1 rounded-full bg-[#2a1b14] text-[#d68551] text-sm font-semibold w-max border border-[#3e261a]">
            ✨ La mejor experiencia cinematográfica
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            VIVE LA <br />
            <span className="text-[#d68551]">EXPERIENCIA</span> <br />
            <span className="text-gray-300">DEL CINE</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Disfruta de la mejor tecnología y comodidad en cada función.
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <Link href="/cartelera" className="px-6 py-3 bg-[#d68551] text-white font-bold rounded-xl hover:bg-[#b56b3e] transition-colors flex items-center gap-2">
              <Ticket className="w-5 h-5" /> Comprar Entradas
            </Link>
            <Link href="/dulceria" className="px-6 py-3 bg-[#2a1b14] text-[#d68551] font-bold rounded-xl border border-[#d68551] hover:bg-[#3e261a] transition-colors flex items-center gap-2">
              <Popcorn className="w-5 h-5" /> Ir a Dulcería
            </Link>
          </div>
        </div>

        {/* Lado Derecho: Contenedor para la nueva animación interactiva */}
        <div className="relative flex justify-center items-center w-full h-[600px]">
          
          {/* Piso de la caricatura alargado y sutil, saliendo desde la izquierda (Dolby) */}
          <div 
            className="absolute bottom-[-12%] left-[-40%] w-[200%] min-w-[1200px] z-0 pointer-events-none"
            style={{
              maskImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, black 10%, transparent 90%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, black 10%, transparent 90%)'
            }}
          >
            <Image 
              src="/images/piso de la caricatura.png" 
              alt="Suelo cinematográfico" 
              width={1600} 
              height={400}
              className="w-full h-auto object-contain opacity-60"
              priority
            />
          </div>

          {/* Contenedor de las Mascotas con Animación de Flotación y Rotación por Scroll */}
          <motion.div 
            className="relative w-full h-full flex justify-center items-center z-10"
            style={{ rotate: rotation }}
            animate={{ y: [0, -15, 0] }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            {/* 1. Claqueta TOTALMENTE ABIERTA */}
            <motion.div className="absolute" style={{ opacity: opacityOpen }}>
              <Image src="/images/caricatura.png" alt="Mascota Saludando" width={450} height={450} priority className="object-contain" style={{ width: 'auto', height: 'auto' }} />
            </motion.div>

            {/* 2. Claqueta EN TRANSICIÓN */}
            <motion.div className="absolute" style={{ opacity: opacityMid }}>
              <Image src="/images/caricatura 2.png" alt="Mascota Cerrando Claqueta" width={450} height={450} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
            </motion.div>

            {/* 3. Claqueta TOTALMENTE CERRADA */}
            <motion.div className="absolute" style={{ opacity: opacityClosed }}>
              <Image src="/images/caricatura cerrada.png" alt="Mascota Claqueta Cerrada" width={450} height={450} className="object-contain" style={{ width: 'auto', height: 'auto' }} />
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
