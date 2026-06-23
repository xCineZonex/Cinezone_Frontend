import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('El backend no devolvió JSON:', text);
      return NextResponse.json({ message: `Respuesta inválida del backend (${response.status}): ${text.substring(0, 100)}` }, { status: 502 });
    }

    if (!response.ok) {
      return NextResponse.json({ message: data.message || 'Error de autenticación' }, { status: response.status });
    }

    const cookieStore = await cookies();
    cookieStore.set('token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });

    return NextResponse.json({ rol: data.rol, message: 'Login exitoso' });
  } catch (error: any) {
    console.error('Error en API login:', error);
    const targetUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    const errorMessage = error instanceof Error ? error.message : String(error);
    const cause = error.cause ? String(error.cause) : 'No cause';
    return NextResponse.json({ message: `Error interno del servidor: ${errorMessage}. Causa: ${cause}. URL destino: ${targetUrl}` }, { status: 500 });
  }
}