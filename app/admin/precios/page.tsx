'use client';

import { useState, useEffect } from 'react';
import { useSedeStore } from '@/store/useSedeStore';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Save, PlusCircle, Pencil, Trash, Ticket, ArrowRight, DollarSign, Activity, CheckCircle2, AlertCircle, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

function PriceRow({ base, sedePrices, isSuperAdmin, activeSedeId, handleSaveLocalPrice, onEditBase }: any) {
  const localPriceMatch = sedePrices.find((sp: any) => sp.ticketBasePrice?.id === base.id);
  const initialPrice = localPriceMatch ? localPriceMatch.localPrice : base.basePrice;
  const initialActive = localPriceMatch?.isActive !== false;
  
  const initialDailyPrices = {
    priceMonday: localPriceMatch?.priceMonday ?? '',
    priceTuesday: localPriceMatch?.priceTuesday ?? '',
    priceWednesday: localPriceMatch?.priceWednesday ?? '',
    priceThursday: localPriceMatch?.priceThursday ?? '',
    priceFriday: localPriceMatch?.priceFriday ?? '',
    priceSaturday: localPriceMatch?.priceSaturday ?? '',
    priceSunday: localPriceMatch?.priceSunday ?? ''
  };

  const [localPrice, setLocalPrice] = useState<number>(initialPrice);
  const [isActive, setIsActive] = useState<boolean>(initialActive);
  const [dailyPrices, setDailyPrices] = useState(initialDailyPrices);
  const [showDaily, setShowDaily] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalPrice(initialPrice);
    setIsActive(initialActive);
    setDailyPrices(initialDailyPrices);
  }, [initialPrice, initialActive, localPriceMatch]);

  const handleSave = async () => {
    setIsSaving(true);
    await handleSaveLocalPrice(base.id, localPrice, isActive, dailyPrices);
    setIsSaving(false);
  };

  const hasChanged = localPrice !== initialPrice || isActive !== initialActive || JSON.stringify(dailyPrices) !== JSON.stringify(initialDailyPrices);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
    >
      <div className={`p-6 rounded-3xl bg-black/40 backdrop-blur-xl border ${isActive ? 'border-primary/20 hover:border-primary/50' : 'border-zinc-800 hover:border-zinc-700 opacity-75'} flex flex-col md:flex-row gap-6 items-center shadow-2xl transition-all relative overflow-hidden group`}>
        {/* Glow effect */}
        <div className={`absolute -inset-10 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 blur-3xl transition-opacity pointer-events-none ${isActive ? 'block' : 'hidden'}`} />

        <div className="flex-1 z-10 w-full">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isActive ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className={`text-2xl font-black tracking-tight ${isActive ? 'text-white' : 'text-zinc-400'}`}>{base.name}</h3>
          </div>
          <div className="flex flex-wrap gap-3 mt-3 items-center">
            <span className={`px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase ${isActive ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-500'}`}>
              {base.ticketType}
            </span>
            <span className={`px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
              {base.formato || 'FORMAT_2D'}
            </span>
            <div className="flex items-center gap-1.5 text-sm text-zinc-400 font-medium bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800/50">
              <span>Base Referencial:</span>
              <span className="text-white font-bold">S/ {Number(base.basePrice).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {(!isSuperAdmin || activeSedeId !== 'all') && (
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800/80 shadow-inner w-full md:w-auto z-10">
              
              <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto px-2 border-b sm:border-b-0 sm:border-r border-zinc-800 pb-4 sm:pb-0 sm:pr-6">
                <span className="text-sm font-bold text-zinc-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Estado
                </span>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${isActive ? 'bg-green-500' : 'bg-zinc-700'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md ${isActive ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative group/input">
                  <DollarSign className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within/input:text-primary transition-colors" />
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={localPrice}
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      setLocalPrice(val);
                    }}
                    className={`w-32 bg-black border-2 rounded-xl pl-9 pr-4 py-2 font-black text-lg focus:outline-none transition-all ${
                      hasChanged ? 'border-primary/50 text-primary' : 'border-zinc-800 text-white focus:border-primary/30'
                    }`}
                    disabled={!isActive}
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={!hasChanged || isSaving}
                  className={`px-5 py-2.5 font-bold rounded-xl flex items-center gap-2 transition-all ${
                    hasChanged 
                      ? 'bg-primary text-black hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20' 
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{hasChanged ? 'Guardar' : 'Actualizado'}</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setShowDaily(!showDaily)}
                className={`ml-2 p-2.5 rounded-xl border transition-colors ${showDaily ? 'bg-primary/20 border-primary/50 text-primary' : 'border-zinc-700 hover:border-zinc-500 text-zinc-400'}`}
                title="Precios por Día"
              >
                <CalendarDays className="w-5 h-5" />
              </button>
            </div>
        )}
        
        {isSuperAdmin && (
          <button 
            onClick={() => onEditBase(base)}
            className="p-4 bg-zinc-900/50 hover:bg-primary text-zinc-500 hover:text-black rounded-2xl transition-all border border-zinc-800 hover:border-primary z-10"
            title="Editar Precio Base"
          >
            <Pencil className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Expanded Daily Prices */}
      <AnimatePresence>
        {showDaily && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2"
          >
            <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/80 shadow-inner grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { key: 'priceMonday', label: 'Lunes' },
                { key: 'priceTuesday', label: 'Martes' },
                { key: 'priceWednesday', label: 'Miércoles' },
                { key: 'priceThursday', label: 'Jueves' },
                { key: 'priceFriday', label: 'Viernes' },
                { key: 'priceSaturday', label: 'Sábado' },
                { key: 'priceSunday', label: 'Domingo' }
              ].map(day => (
                <div key={day.key} className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase">{day.label}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Auto"
                    value={(dailyPrices as any)[day.key]}
                    onChange={(e) => setDailyPrices({ ...dailyPrices, [day.key]: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-1.5 font-semibold text-sm focus:outline-none focus:border-primary/50 text-white transition-all placeholder:text-zinc-700"
                    disabled={!isActive}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PreciosAdminPage() {
  const { activeSedeId } = useSedeStore();
  const [rol, setRol] = useState('');
  
  const [basePrices, setBasePrices] = useState<any[]>([]);
  const [sedePrices, setSedePrices] = useState<any[]>([]);
  
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Form states for base prices (SuperAdmin)
  const [showBaseForm, setShowBaseForm] = useState(false);
  const [editingBase, setEditingBase] = useState<any>(null);
  const [baseForm, setBaseForm] = useState({ name: '', ticketType: 'NORMAL', formato: 'FORMAT_2D', basePrice: '' });

  useEffect(() => {
    const userRole = localStorage.getItem('rol');
    setRol(userRole || '');
    if (userRole === 'SUPER_ADMIN') {
      setIsSuperAdmin(true);
    }
  }, []);

  const fetchBasePrices = async () => {
    try {
      const res = await api.get('/admin/catalogo/tipos-entrada');
      setBasePrices(res.data);
    } catch (e) {
      console.error(e);
      // Fallback si endpoint de catalogo falla (AdminSede)
      try {
        const res2 = await api.get('/public/tipos-entrada'); // if we made one, or just let it fail silently
        setBasePrices(res2.data);
      } catch (e2) {}
    }
  };

  const fetchSedePrices = async () => {
    if (!activeSedeId || activeSedeId === 'all') return;
    try {
      const res = await api.get(`/jefe-sala/precios-entradas?sedeId=${activeSedeId}`);
      setSedePrices(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchBasePrices();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (activeSedeId && activeSedeId !== 'all') {
      fetchBasePrices();
      fetchSedePrices();
    }
  }, [activeSedeId]);

  const handleSaveBasePrice = async () => {
    try {
      const payload = {
        id: editingBase ? editingBase.id : null,
        name: baseForm.name,
        ticketType: baseForm.ticketType,
        formato: baseForm.formato,
        basePrice: parseFloat(baseForm.basePrice),
        isActive: true
      };
      await api.post('/admin/catalogo/tipos-entrada', payload);
      toast.success('Precio base guardado correctamente', { icon: <CheckCircle2 className="text-green-500" /> });
      setShowBaseForm(false);
      setEditingBase(null);
      setBaseForm({ name: '', ticketType: 'NORMAL', formato: 'FORMAT_2D', basePrice: '' });
      fetchBasePrices();
    } catch (e) {
      toast.error('Error al guardar precio base');
    }
  };

  const handleSaveLocalPrice = async (basePriceId: number, localPrice: number, isActive: boolean = true, dailyPrices: any = null) => {
    if (!activeSedeId || activeSedeId === 'all') {
      toast.error('Debe seleccionar una sede');
      return;
    }
    try {
      const payload = {
        sedeId: parseInt(activeSedeId),
        basePriceId: basePriceId,
        localPrice,
        isActive,
        priceMonday: dailyPrices?.priceMonday ? parseFloat(dailyPrices.priceMonday) : null,
        priceTuesday: dailyPrices?.priceTuesday ? parseFloat(dailyPrices.priceTuesday) : null,
        priceWednesday: dailyPrices?.priceWednesday ? parseFloat(dailyPrices.priceWednesday) : null,
        priceThursday: dailyPrices?.priceThursday ? parseFloat(dailyPrices.priceThursday) : null,
        priceFriday: dailyPrices?.priceFriday ? parseFloat(dailyPrices.priceFriday) : null,
        priceSaturday: dailyPrices?.priceSaturday ? parseFloat(dailyPrices.priceSaturday) : null,
        priceSunday: dailyPrices?.priceSunday ? parseFloat(dailyPrices.priceSunday) : null
      };
      await api.post('/jefe-sala/precios-entradas', payload);
      toast.success('Precio local actualizado', { icon: <CheckCircle2 className="text-green-500" /> });
      await fetchSedePrices();
    } catch (e) {
      toast.error('Error al actualizar precio local');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="p-8 max-w-7xl mx-auto space-y-10 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-r from-zinc-900/80 to-transparent p-8 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md"
        >
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold tracking-wider mb-4 border border-primary/20">
              <Ticket className="w-4 h-4" /> BOLETERÍA
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
              Precios de Entradas
            </h1>
            <p className="text-lg text-zinc-400 font-medium">
              Configura los tipos de boletos y ajusta los precios locales para maximizar los ingresos por sede.
            </p>
          </div>
          
          {isSuperAdmin && (
            <button 
              onClick={() => {
                setEditingBase(null);
                setBaseForm({ name: '', ticketType: 'NORMAL', basePrice: '' });
                setShowBaseForm(true);
              }}
              className="bg-white text-black hover:bg-zinc-200 px-6 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-white/10 flex items-center gap-3 hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-6 h-6" /> 
              <span>Nuevo Boleto Base</span>
            </button>
          )}
        </motion.div>

        <AnimatePresence>
          {showBaseForm && isSuperAdmin && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="overflow-hidden"
            >
              <div className="p-8 bg-zinc-900/80 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/10 rounded-3xl relative">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Ticket className="w-32 h-32" />
                </div>
                <h2 className="text-2xl font-black mb-6 text-white flex items-center gap-3">
                  {editingBase ? 'Editar Boleto Base' : 'Nuevo Boleto Base'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Nombre Comercial</label>
                    <input 
                      type="text" 
                      className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-lg font-bold text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-zinc-600"
                      value={baseForm.name}
                      onChange={e => setBaseForm({...baseForm, name: e.target.value})}
                      placeholder="Ej. General 2D"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Tipo (Lógica)</label>
                    <select 
                      className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-lg font-bold text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                      value={baseForm.ticketType}
                      onChange={e => setBaseForm({...baseForm, ticketType: e.target.value})}
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="NINO">NIÑO</option>
                      <option value="TERCERA_EDAD">TERCERA EDAD</option>
                      <option value="DISCAPACIDAD">DISCAPACIDAD (CONADIS)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Formato (Tipo de Sala)</label>
                    <select 
                      className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-lg font-bold text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                      value={baseForm.formato}
                      onChange={e => setBaseForm({...baseForm, formato: e.target.value})}
                    >
                      <option value="FORMAT_2D">ESTÁNDAR (2D)</option>
                      <option value="FORMAT_3D">3D</option>
                      <option value="VIP">VIP</option>
                      <option value="IMAX">IMAX</option>
                      <option value="FORMAT_4DX">4DX</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Precio Referencial (S/)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        className="w-full bg-black border border-zinc-800 rounded-2xl pl-12 pr-5 py-4 text-lg font-black text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-zinc-600"
                        value={baseForm.basePrice}
                        onChange={e => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setBaseForm({...baseForm, basePrice: val.toString()})
                        }}
                        placeholder="25.00"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex gap-4 justify-end relative z-10">
                  <button 
                    onClick={() => setShowBaseForm(false)} 
                    className="px-6 py-3 rounded-2xl border border-zinc-700 hover:bg-zinc-800 font-bold text-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveBasePrice} 
                    className="px-8 py-3 bg-primary hover:bg-primary/90 text-black rounded-2xl font-black flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                  >
                    <Save className="w-5 h-5" /> Guardar Boleto
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-5 mt-8">
          {(!activeSedeId || activeSedeId === 'all') && !isSuperAdmin ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center p-12 bg-zinc-900/50 rounded-3xl border border-zinc-800 border-dashed"
            >
              <AlertCircle className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Selecciona una Sede</h3>
              <p className="text-zinc-400 font-medium">Debes seleccionar una sede específica en el selector superior para configurar sus precios.</p>
            </motion.div>
          ) : basePrices.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center p-12 bg-zinc-900/50 rounded-3xl border border-zinc-800 border-dashed"
            >
              <Ticket className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No hay boletos configurados</h3>
              <p className="text-zinc-400 font-medium">Aún no se han creado tipos de boletos base en el sistema.</p>
            </motion.div>
          ) : (
            <>
              {/* Entradas Normales */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <Ticket className="w-5 h-5 text-primary" /> Entradas Normales
                </h2>
                <div className="flex flex-col gap-5">
                  <AnimatePresence>
                    {basePrices.filter(b => b.ticketType !== 'BENEFICIO').map(base => (
                      <PriceRow 
                        key={base.id} 
                        base={base} 
                        sedePrices={sedePrices} 
                        isSuperAdmin={isSuperAdmin} 
                        activeSedeId={activeSedeId} 
                        handleSaveLocalPrice={handleSaveLocalPrice} 
                        onEditBase={(base: any) => {
                          setEditingBase(base);
                          setBaseForm({ name: base.name, ticketType: base.ticketType, formato: base.formato || 'FORMAT_2D', basePrice: base.basePrice });
                          setShowBaseForm(true);
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Entradas Beneficio */}
              <div className="mt-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <Activity className="w-5 h-5 text-amber-500" /> Entradas de Beneficio / Promoción
                </h2>
                <div className="flex flex-col gap-5">
                  <AnimatePresence>
                    {basePrices.filter(b => b.ticketType === 'BENEFICIO').length > 0 ? (
                      basePrices.filter(b => b.ticketType === 'BENEFICIO').map(base => (
                        <PriceRow 
                          key={base.id} 
                          base={base} 
                          sedePrices={sedePrices} 
                          isSuperAdmin={isSuperAdmin} 
                          activeSedeId={activeSedeId} 
                          handleSaveLocalPrice={handleSaveLocalPrice} 
                          onEditBase={(base: any) => {
                            setEditingBase(base);
                            setBaseForm({ name: base.name, ticketType: base.ticketType, formato: base.formato || 'FORMAT_2D', basePrice: base.basePrice });
                            setShowBaseForm(true);
                          }}
                        />
                      ))
                    ) : (
                      <div className="text-center p-8 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                        <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-500 font-medium">Aún no hay entradas de Beneficio configuradas.</p>
                        {isSuperAdmin && <p className="text-zinc-400 text-sm mt-1">Crea una nueva desde el panel de Beneficios.</p>}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
