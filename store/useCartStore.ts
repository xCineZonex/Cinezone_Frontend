import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Asiento {
  asientoId: number;
  codigo: string;
  tipoEntrada: string; // ESTANDAR, VIP, DISCAPACIDAD
  precioCobrado: number;
}

interface TicketSelection {
  label: string;
  cantidad: number;
  precio: number;
  typeKey?: string;
  benefitId?: number;
}

interface Snack {
  productoId: number;
  cantidad: number;
  nombre: string;
  precio: number;
  imagen?: string;
}

interface CartState {
  funcionId: number | null;
  pelicula: {
    id?: number;
    titulo: string | null;
    posterUrl: string | null;
    formato: string | null;
    idioma: string | null;
    sedeNombre: string | null;
    salaNombre: string | null;
    fechaHora: string | null;
    sedeId?: number;
  };
  asientos: Asiento[];
  tickets: TicketSelection[];
  snacks: Snack[];
  bookingExpiresAt: number | null;
  lastPurchaseResponse: any | null;
  idempotencyKey: string | null;
  
  setFuncion: (id: number, movieData?: any) => void;
  startBookingTimer: (minutes: number) => void;
  toggleAsiento: (asiento: Asiento) => void;
  setTickets: (tickets: TicketSelection[]) => void;
  addSnack: (snack: Snack) => void;
  removeSnack: (productoId: number) => void;
  updateSnackQuantity: (productoId: number, cantidad: number) => void;
  clearCart: (keepReceipt?: boolean) => void;
  setLastPurchaseResponse: (response: any) => void;
  generateIdempotencyKey: () => void;
  
  getTotalAsientos: () => number;
  getTotalTickets: () => number;
  getTotalSnacks: () => number;
  getGranTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      funcionId: null,
      pelicula: {
        id: undefined,
        titulo: null,
        posterUrl: null,
        formato: null,
        idioma: null,
        sedeNombre: null,
        salaNombre: null,
        fechaHora: null,
        sedeId: undefined,
      },
      asientos: [],
      tickets: [],
      snacks: [],
      bookingExpiresAt: null,
      lastPurchaseResponse: null,
      idempotencyKey: null,

      setFuncion: (id, movieData) =>
        set((state) => ({
          funcionId: id,
          pelicula: {
            ...state.pelicula,
            ...movieData
          }
        })),

      startBookingTimer: (minutes) => {
        const expiresAt = Date.now() + minutes * 60 * 1000;
        set({ bookingExpiresAt: expiresAt });
      },

      toggleAsiento: (asiento) =>
        set((state) => {
          const existe = state.asientos.find((a) => a.asientoId === asiento.asientoId);
          if (existe) {
            return { asientos: state.asientos.filter((a) => a.asientoId !== asiento.asientoId) };
          }
          return { asientos: [...state.asientos, asiento] };
        }),

      setTickets: (tickets) => set({ tickets }),

      addSnack: (snack) =>
        set((state) => {
          const existe = state.snacks.find((s) => s.productoId === snack.productoId);
          if (existe) {
            return {
              snacks: state.snacks.map((s) =>
                s.productoId === snack.productoId ? { ...s, cantidad: s.cantidad + snack.cantidad } : s
              ),
            };
          }
          return { snacks: [...state.snacks, snack] };
        }),

      removeSnack: (productoId) =>
        set((state) => ({
          snacks: state.snacks.filter((s) => s.productoId !== productoId),
        })),

      updateSnackQuantity: (productoId, cantidad) =>
        set((state) => {
          if (cantidad <= 0) {
            return { snacks: state.snacks.filter((s) => s.productoId !== productoId) };
          }
          return {
            snacks: state.snacks.map((s) => (s.productoId === productoId ? { ...s, cantidad } : s)),
          };
        }),

      setLastPurchaseResponse: (response) => set({ lastPurchaseResponse: response }),

      generateIdempotencyKey: () => {
        if (!get().idempotencyKey) {
          set({ idempotencyKey: crypto.randomUUID() });
        }
      },

      clearCart: (keepReceipt = false) => {
        const currentResponse = get().lastPurchaseResponse;
        set({
          funcionId: null,
          pelicula: {
            titulo: null,
            posterUrl: null,
            formato: null,
            idioma: null,
            sedeNombre: null,
            salaNombre: null,
            fechaHora: null,
            sedeId: undefined,
          },
          asientos: [],
          tickets: [],
          snacks: [],
          bookingExpiresAt: null,
          lastPurchaseResponse: keepReceipt ? currentResponse : null,
          idempotencyKey: null,
        });
      },

      getTotalAsientos: () => get().asientos.reduce((acc, a) => acc + a.precioCobrado, 0),
      
      getTotalTickets: () => get().tickets.reduce((acc, t) => acc + (t.precio * t.cantidad), 0),

      getTotalSnacks: () => get().snacks.reduce((acc, s) => acc + s.precio * s.cantidad, 0),

      getGranTotal: () => get().getTotalTickets() + get().getTotalSnacks(),
    }),
    {
      name: 'cinezone-cart',
    }
  )
);
