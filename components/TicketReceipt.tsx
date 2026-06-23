'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface TicketReceiptProps {
  data: {
    pelicula: string;
    nroCompra: string;
    cliente: string;
    sede: string;
    fecha: string;
    hora: string;
    sala: string;
    butacas: string;
    entradas: { desc: string; cantidad: number; precio: number }[];
    dulceria: { desc: string; cantidad: number; precio: number }[];
    subtotalEntradas: number;
    subtotalDulceria: number;
    total: number;
    qrBase64?: string;
  };
  onClose: () => void;
  onSimulatePayment?: () => void;
}

export default function TicketReceipt({ data, onClose, onSimulatePayment }: TicketReceiptProps) {
  // Generar QR falso si no viene de backend aún (ya que el webhook lo hace asíncrono,
  // el frontend puede simularlo para la vista inmediata o recibirlo del response)
  const qrImage = data.qrBase64 
    ? `data:image/png;base64,${data.qrBase64}` 
    : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PHJlY3QgeD0iMiIgeT0iMiIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgc3Ryb2tlPSIjODg4IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48cmVjdCB4PSI3IiB5PSI3IiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjODg4Ii8+PHJlY3QgeD0iMzAiIHk9IjIiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHN0cm9rZT0iIzg4OCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+PHJlY3QgeD0iMzUiIHk9IjciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiM4ODgiLz48cmVjdCB4PSIyIiB5PSIzMCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgc3Ryb2tlPSIjODg4IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48cmVjdCB4PSI3IiB5PSIzNSIgd2lkdGg9IjgiIGZpbGw9IiM4ODgiLz48cmVjdCB4PSIzMCIgeT0iMzAiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiM4ODgiLz48cmVjdCB4PSIzNiIgeT0iMzAiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiM4ODgiLz48cmVjdCB4PSI0MiIgeT0iMzAiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiM4ODgiLz48cmVjdCB4PSIzMCIgeT0iMzYiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiM4ODgiLz48cmVjdCB4PSIzNiIgeT0iNDIiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiM4ODgiLz48cmVjdCB4PSI0MiIgeT0iMzYiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiM4ODgiLz48cmVjdCB4PSI0MiIgeT0iNDIiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiM4ODgiLz48L3N2Zz4=';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="absolute top-4 right-4 flex gap-4">
        {onSimulatePayment && (
          <button onClick={onSimulatePayment} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-full shadow-lg transition-colors flex items-center gap-2">
            ✅ Simular Pago Exitoso
          </button>
        )}
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[480px] bg-white rounded-lg overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)] my-8"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        {/* HEADER */}
        <div className="bg-[#111] py-5 px-7 text-center border-b-[3px] border-[#c8860a]">
          <div className="flex justify-center mb-3">
            <h2 className="text-2xl font-black text-[#c8860a] tracking-widest uppercase">CINEZONE</h2>
          </div>
          <div className="text-[22px] font-black text-white mb-1.5 tracking-[0.3px]">{data.pelicula || 'CINEZONE'}</div>
          <div className="text-[13px] text-[#aaa]">
            Nro. de Compra: <strong className="text-[#c8860a]">{data.nroCompra}</strong>
          </div>
        </div>

        {/* QR */}
        <div className="py-[22px] px-7 flex justify-center border-b border-[#e8e8e8] bg-[#fafafa]">
          <div className="w-[160px] h-[160px] border-2 border-dashed border-[#bbb] rounded-md flex items-center justify-center">
            <img src={qrImage} alt="QR Code" className="w-[140px] h-[140px] object-contain opacity-90" />
          </div>
        </div>

        {/* NOTICE */}
        <div className="pt-[14px] px-5">
          <div className="bg-[#fff8f0] border border-[#f0d090] rounded-md p-2.5 flex gap-2.5 items-start text-[12px] text-[#555] leading-[1.5]">
            <span className="text-[18px] shrink-0">📱</span>
            <span>Muestra el código QR desde tu celular para canjear tus combos e ingresar a la sala. No necesitas pasar por boletería.</span>
          </div>
        </div>

        {/* CLIENT */}
        <div className="py-[18px] px-7 text-center border-b border-[#e8e8e8]">
          <div className="text-[26px] text-[#c8860a] mb-1">👤</div>
          <div className="text-[11px] text-[#888]">Cliente:</div>
          <div className="text-[15px] font-bold text-[#111]">{data.cliente}</div>
        </div>

        {/* SESSION GRID */}
        <div className="grid grid-cols-2 py-[14px] px-7 gap-y-3 gap-x-2 border-b-[2px] border-[#e8e8e8] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <span className="text-[16px] text-[#c8860a] shrink-0">📍</span>
            <div>
              <span className="text-[10px] text-[#888] block uppercase tracking-[0.5px]">Sede</span>
              <span className="text-[13px] font-bold text-[#111]">{data.sede}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[16px] text-[#c8860a] shrink-0">📅</span>
            <div>
              <span className="text-[10px] text-[#888] block uppercase tracking-[0.5px]">Fecha</span>
              <span className="text-[13px] font-bold text-[#111]">{data.fecha}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[16px] text-[#c8860a] shrink-0">🕓</span>
            <div>
              <span className="text-[10px] text-[#888] block uppercase tracking-[0.5px]">Hora</span>
              <span className="text-[13px] font-bold text-[#111]">{data.hora}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[16px] text-[#c8860a] shrink-0">🖥️</span>
            <div>
              <span className="text-[10px] text-[#888] block uppercase tracking-[0.5px]">Sala</span>
              <span className="bg-[#111] text-[#c8860a] text-[11px] font-bold py-[2px] px-2.5 rounded-[3px] border border-[#c8860a] inline-block">{data.sala}</span>
            </div>
          </div>
        </div>

        {/* SEATS */}
        <div className="py-3 px-7 border-b border-[#e8e8e8] flex items-center gap-2.5">
          <span className="text-[18px] text-[#c8860a]">🪑</span>
          <div className="text-[13px] text-[#111]">
            <strong>Tus butacas:</strong> {data.butacas || 'Sin butacas'}
          </div>
        </div>

        {/* ITEMS */}
        <div className="px-7">
          {data.entradas.length > 0 && (
            <>
              <div className="py-3 flex items-center gap-2 border-b border-[#f0f0f0]">
                <span className="text-[17px]">🎟️</span>
                <span className="text-[14px] font-bold text-[#111]">Entradas</span>
              </div>
              {data.entradas.map((e, i) => (
                <div key={i} className="flex justify-between items-center py-2 text-[13px] text-[#333] border-b border-[#f5f5f5]">
                  <span className="flex-1">{e.desc}</span>
                  <span className="w-[60px] text-center text-[#666] text-[12px]">Cant. {e.cantidad}</span>
                  <span className="w-[70px] text-right font-semibold">S/ {e.precio.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-end py-2 text-[13px] font-bold text-[#111] border-b border-[#e8e8e8]">
                SubTotal : S/ {data.subtotalEntradas.toFixed(2)}
              </div>
            </>
          )}

          {data.dulceria.length > 0 && (
            <>
              <div className="py-3 flex items-center gap-2 border-b border-[#f0f0f0] mt-1">
                <span className="text-[17px]">🍿</span>
                <span className="text-[14px] font-bold text-[#111]">Dulcería</span>
              </div>
              {data.dulceria.map((d, i) => (
                <div key={i} className="flex justify-between items-center py-2 text-[13px] text-[#333] border-b border-[#f5f5f5]">
                  <span className="flex-1">{d.desc}</span>
                  <span className="w-[60px] text-center text-[#666] text-[12px]">Cant. {d.cantidad}</span>
                  <span className="w-[70px] text-right font-semibold">S/ {d.precio.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-end py-2 text-[13px] font-bold text-[#111] border-b border-[#e8e8e8]">
                SubTotal : S/ {data.subtotalDulceria.toFixed(2)}
              </div>
            </>
          )}
        </div>

        {/* TOTAL */}
        <div className="py-[14px] px-7 flex justify-end items-center gap-4 border-b-[2px] border-[#111]">
          <span className="text-[18px] font-black text-[#111]">Total :</span>
          <span className="text-[24px] font-black text-[#c8860a]">S/ {data.total.toFixed(2)}</span>
        </div>

        {/* REMINDERS */}
        <div className="bg-[#f9f9f9] border-t border-[#e8e8e8] py-4 px-7">
          <h3 className="text-[13px] font-bold text-[#111] mb-2.5">Recuerda</h3>
          <div className="flex gap-2.5 mb-2 text-[12px] text-[#444] leading-[1.4]">
            <span className="text-[14px] shrink-0">🚪</span>
            <span>¡Sin colas! Dirígete directamente a la sala o a la zona de despacho online en la Dulcería.</span>
          </div>
          <div className="flex gap-2.5 mb-2 text-[12px] text-[#444] leading-[1.4]">
            <span className="text-[14px] shrink-0">📱</span>
            <span>Muestra tu Orden de Compra directamente desde tu celular.</span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-[#111] border-t-[3px] border-[#c8860a] py-2.5 px-7 text-[11px] text-[#aaa] text-center">
          CineZone S.A · Av. Principal N° 100 · Lima · Perú
        </div>
      </motion.div>
    </div>
  );
}
