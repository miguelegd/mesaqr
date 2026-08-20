'use client';

import React from 'react';
import { useMesaQRStore } from '@/lib/store/useMesaQRStore';
import { RefreshCw } from 'lucide-react';

export default function IntegrationsPage() {
  const db = useMesaQRStore();

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-black text-white flex items-center space-x-3">
          <RefreshCw className="w-7 h-7 text-amber-400" />
          <span>Integración POS & Mapeo de Productos</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Capa de integración desacoplada con MockPOSAdapter para conectar sistemas administrativos externos
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-white">Estado del Adaptador POS</h3>
              <p className="text-xs text-slate-400">Mock POS Adapter de demostración</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
              CONECTADO 🟢
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Adaptador Activo</span>
              <span className="font-bold text-white">MockPOSAdapter</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Latencia Promedio</span>
              <span className="font-bold text-amber-400 font-mono">600 ms</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Auto-Reintento</span>
              <span className="font-bold text-emerald-400">Habilitado</span>
            </div>
          </div>
        </div>

        {/* Product Mappings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-white">Mapeo de Productos (MesaQR SKU ↔ External POS SKU)</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Producto MesaQR</th>
                  <th className="p-3">SKU MesaQR</th>
                  <th className="p-3">Adaptador POS</th>
                  <th className="p-3">External SKU POS</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {db.products.map((p) => {
                  const map = db.productMappings.find((m) => m.productId === p.id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">{p.name}</td>
                      <td className="p-3 font-mono text-amber-400">{p.sku}</td>
                      <td className="p-3">MockPOSAdapter</td>
                      <td className="p-3 font-mono text-emerald-400">{map?.externalSku || p.sku}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30 text-[10px]">
                          Mapeado 🟢
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
