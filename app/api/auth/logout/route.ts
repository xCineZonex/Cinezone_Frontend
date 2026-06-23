import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('token');
    return NextResponse.json({ message: 'Logout exitoso' });
  } catch (error) {
    console.error('Error en API logout:', error);
    return NextResponse.json({ message: 'Error al cerrar sesión' }, { status: 500 });
  }
}