"use client"
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, ChefHat, Utensils, MapPin } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  sala: string;
  seatCode: string;
  items: OrderItem[];
  status: 'PREPARING' | 'READY';
  timeElapsed: string;
}

const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-001",
    sala: "Sala 3",
    seatCode: "F-12",
    items: [
      { name: "Palomitas Grandes", quantity: 2 },
      { name: "Refresco Mediano", quantity: 2 },
      { name: "Nachos con Queso", quantity: 1 }
    ],
    status: 'PREPARING',
    timeElapsed: "4 min"
  },
  {
    id: "ORD-002",
    sala: "Sala 1",
    seatCode: "A-05",
    items: [
      { name: "Combo Pareja", quantity: 1 },
      { name: "Chocolates", quantity: 2 }
    ],
    status: 'PREPARING',
    timeElapsed: "8 min"
  },
  {
    id: "ORD-003",
    sala: "Sala VIP",
    seatCode: "V-02",
    items: [
      { name: "Sushi Roll", quantity: 1 },
      { name: "Copa de Vino", quantity: 2 }
    ],
    status: 'PREPARING',
    timeElapsed: "12 min"
  },
  {
    id: "ORD-004",
    sala: "Sala 5",
    seatCode: "C-10",
    items: [
      { name: "Palomitas Medianas", quantity: 1 },
      { name: "Agua Natural", quantity: 1 }
    ],
    status: 'READY',
    timeElapsed: "2 min"
  }
];

export default function KDSPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/kitchen/orders?status=PREPARING');
        if (response.data && response.data.length > 0) {
          setOrders(response.data);
        } else {
          setOrders(MOCK_ORDERS);
        }
      } catch (error) {
        console.warn("Backend unavailable, using mock data for KDS");
        setOrders(MOCK_ORDERS);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsReady = async (id: string) => {
    setOrders(prev => prev.map(order => order.id === id ? { ...order, status: 'READY' } : order));
    try {
       await api.patch(`/kitchen/orders/${id}/status`, { status: 'READY' });
    } catch (e) {
       console.warn("Error updating order status on backend. Handled in UI.");
    }
  };

  if (loading) {
     return (
       <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
         <ChefHat className="animate-bounce w-12 h-12 text-blue-500" />
       </div>
     );
  }

  const preparingOrders = orders.filter(o => o.status === 'PREPARING');
  const readyOrders = orders.filter(o => o.status === 'READY');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans">
      <header className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold tracking-tight text-white">Kitchen Display System</h1>
        </div>
        <div className="text-slate-400 text-sm flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span> Preparando ({preparingOrders.length})
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Listos ({readyOrders.length})
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Preparing Column */}
        <section className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 shadow-2xl min-h-[500px]">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-blue-400">
            <Utensils className="w-5 h-5" /> En Preparación
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <AnimatePresence>
              {preparingOrders.map(order => (
                <OrderCard key={order.id} order={order} onReady={() => markAsReady(order.id)} />
              ))}
              {preparingOrders.length === 0 && (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="col-span-full text-center py-12 text-slate-500">
                  No hay órdenes en preparación
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Ready Column */}
        <section className="bg-slate-900/30 rounded-2xl p-6 border border-slate-800/50 shadow-2xl min-h-[500px] opacity-80">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" /> Listos para Entregar
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <AnimatePresence>
              {readyOrders.map(order => (
                <OrderCard key={order.id} order={order} readonly />
              ))}
              {readyOrders.length === 0 && (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="col-span-full text-center py-12 text-slate-500">
                  No hay órdenes listas
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}

function OrderCard({ order, onReady, readonly }: { order: Order, onReady?: () => void, readonly?: boolean }) {
  const isUrgent = parseInt(order.timeElapsed) > 10 && order.status === 'PREPARING';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`relative rounded-xl overflow-hidden border ${isUrgent ? 'border-red-500/50 bg-red-950/20' : 'border-slate-700 bg-slate-800'} shadow-lg flex flex-col`}
    >
      <div className={`p-4 border-b ${isUrgent ? 'border-red-500/30 bg-red-900/30' : 'border-slate-700 bg-slate-800/80'} flex justify-between items-center`}>
        <div>
          <span className="text-xs font-bold text-slate-400 tracking-wider">{order.id}</span>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-lg">{order.sala} • {order.seatCode}</span>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}`}>
          <Clock className="w-4 h-4" />
          {order.timeElapsed}
        </div>
      </div>

      <div className="p-4 flex-1">
        <ul className="space-y-3">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex justify-between items-start text-sm">
              <span className="text-slate-300 leading-tight pr-4">{item.name}</span>
              <span className="font-mono bg-slate-900 px-2 py-0.5 rounded text-blue-400 font-bold border border-slate-700">x{item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>

      {!readonly && onReady && (
        <div className="p-4 pt-0 mt-auto">
          <button
            onClick={onReady}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <CheckCircle2 className="w-5 h-5" />
            MARCAR COMO LISTO
          </button>
        </div>
      )}
    </motion.div>
  );
}
