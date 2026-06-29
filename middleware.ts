import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/recuperar');
  
  // Rutas que requieren autenticación
  const protectedPaths = ['/admin', '/staff', '/taquilla', '/portero', '/jefe-sala', '/kds', '/perfil'];
  
  // Si la ruta es pública y el usuario está logueado y va al login
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/perfil', request.url));
  }

  // Rutas de assets o nextjs internal
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.') || 
    request.nextUrl.pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // Si no hay token y quiere acceder a ruta protegida
  if (!token && protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
