'use client';

import React from 'react';
import { useMesaQRStore } from '@/lib/store/useMesaQRStore';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OrdersPage() {
  const db = useMesaQRStore();

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-3">
            <RefreshCw className="w-7 h-7 text-amber-400" />
            <span>Historial de Comandas y Sincronización POS</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro unificado de órdenes operativas y su estado de envío al sistema administrativo externo
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {db.orders.map((o) => (
          <div key={o.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-white text-lg">{o.tableNumber}</span>
                  <span className="text-xs text-slate-400 font-mono">({o.id})</span>
                </div>
                <span className="text-xs text-slate-400">Camarero: {o.waiterName} • Fecha: {new Date(o.createdAt).toLocaleTimeString()}</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Comanda</span>
                  <span className="text-lg font-extrabold text-amber-400 font-mono">${o.total.toFixed(2)}</span>
                </div>

                {/* Sync Badge */}
                <div>
                  {o.syncStatus === 'SYNCED' && (
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sincronizado POS ({o.posOrderId})</span>
                    </span>
                  )}
                  {o.syncStatus === 'SYNC_ERROR' && (
                    <button
                      onClick={() => db.triggerPOSSync(o.id)}
                      className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded-xl flex items-center space-x-1 shadow"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Error POS (Reintentar)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
              {o.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-slate-300">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-amber-400">{item.quantity}x</span>
                    <span>{item.productNameSnapshot}</span>
                    <span className="text-[10px] text-slate-500 font-mono">(SKU: {item.skuSnapshot})</span>
                  </div>
                  <span className="font-mono text-slate-400">${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
