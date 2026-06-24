'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Film, Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, BookOpen } from 'lucide-react';

const footerLinks = {
  empresa: [
    { name: 'Sobre Nosotros', href: '/nosotros' },
    { name: 'Términos y Condiciones', href: '/terminos' },
    { name: 'Política de Privacidad', href: '/privacidad' },
  ]
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Film className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-black text-foreground">
                CINE<span className="text-primary">ZONE</span>
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              La mejor experiencia cinematográfica con las salas más modernas y la tecnología de
              punta para que vivas cada película al máximo.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>(01) 615-8000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>contacto@cinezone.pe</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Lima, Perú</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4">Empresa</h4>
            <ul className="space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 mt-8 border-t border-border gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 Cinezone. Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-6">
            {/* Libro de Reclamaciones */}
            <Link href="/reclamaciones" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title="Libro de Reclamaciones">
              <div className="flex items-center gap-2 border border-border bg-background px-3 py-2 rounded-xl shadow-sm">
                <BookOpen className="h-6 w-6 text-primary" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] leading-tight font-bold uppercase tracking-wider text-muted-foreground">Libro de</span>
                  <span className="text-xs leading-tight font-bold text-foreground">Reclamaciones</span>
                </div>
              </div>
            </Link>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-secondary hover:bg-primary rounded-xl flex items-center justify-center transition-colors group"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
