import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${process.env.API_URL || 'http://localhost:8080/api/v1'}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

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
  } catch (error) {
    console.error('Error en API login:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}