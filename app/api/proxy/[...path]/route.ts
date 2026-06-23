import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.API_URL || 'http://localhost:8080/api/v1';

export const dynamic = 'force-dynamic';

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    // Reconstruir el path que queremos consultar
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const searchParams = request.nextUrl.search;
    const targetUrl = `${BACKEND_URL}/${path}${searchParams}`;

    // Obtener cookies (para leer el token httpOnly)
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    // Clonar las cabeceras originales
    const headers = new Headers(request.headers);
    headers.delete('host'); // Dejar que fetch ponga el host del backend real
    headers.delete('connection'); // Evitar problemas de proxy
    
    // Si tenemos el token seguro, inyectarlo en las cabeceras hacia Spring Boot
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Configurar la petición al backend
    const options: RequestInit = {
      method: request.method,
      headers,
      redirect: 'manual',
      cache: 'no-store', // NUNCA CACHEAR peticiones al backend
    };

    // Agregar el body solo si no es GET o HEAD
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const rawBody = await request.arrayBuffer();
      options.body = rawBody;
    }

    // Realizar la petición a Spring Boot
    const backendResponse = await fetch(targetUrl, options);

    // Preparar la respuesta para el navegador (React)
    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.delete('content-encoding'); // Dejar que Next.js maneje la compresión

    // Leer el body de Spring Boot y retornarlo tal cual
    const data = await backendResponse.arrayBuffer();

    return new NextResponse(data, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Error en el Proxy BFF:', error);
    return new NextResponse(JSON.stringify({ message: 'Error interno de comunicación con el backend' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Next.js App Router requiere exportar explícitamente los métodos
export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
