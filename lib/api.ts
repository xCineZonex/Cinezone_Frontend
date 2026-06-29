import axios from 'axios';

const api = axios.create({
  // CONFIGURACIÓN DE SEGURIDAD (BFF PROXY)
  baseURL: '/api/proxy',
  withCredentials: true, // Importante para enviar las cookies HttpOnly al proxy
});

// Interceptor de respuesta para manejar errores comunes
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expirado, inválido o acceso denegado
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rol');
        try {
          // Limpiamos la cookie HttpOnly en el servidor
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {}
        import('@/store/useCartStore').then((m) => m.useCartStore.getState().clearCart());
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
