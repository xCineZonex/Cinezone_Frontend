import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Cinezone - Vive la Experiencia del Cine',
  description: 'Las mejores salas de cine con la mejor experiencia. Compra tus entradas y snacks online.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background scroll-smooth">
      <body className="font-sans antialiased flex flex-col min-h-screen text-foreground relative selection:bg-primary/30 selection:text-primary-foreground overflow-x-hidden">
        {/* Ambient Premium Glows */}
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-accent/5 blur-[100px] pointer-events-none -z-10" />
        
        <main className="flex-1 relative z-0">{children}</main>
        <Toaster richColors position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
