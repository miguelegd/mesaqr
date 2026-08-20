'use client';

import React from 'react';
import { useMesaQRStore } from '@/lib/store/useMesaQRStore';
import { ShoppingBag } from 'lucide-react';

export default function ProductsPage() {
  const db = useMesaQRStore();

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-black text-white flex items-center space-x-3">
          <ShoppingBag className="w-7 h-7 text-amber-400" />
          <span>Catálogo de Productos y Categorías</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Administración de carta, precios de lista, SKUs e impuestos configurables
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {db.products.map((p) => {
          const category = db.categories.find((c) => c.id === p.categoryId);
          return (
            <div key={p.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2 shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-amber-400 font-bold border border-slate-800">
                    {category?.name || 'Categoría'}
                  </span>
                  <h4 className="font-bold text-white text-sm mt-1">{p.name}</h4>
                </div>
                <span className="font-mono text-amber-400 font-extrabold text-base">${p.price.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
              <div className="pt-2 flex justify-between text-[11px] font-mono text-slate-500 border-t border-slate-800">
                <span>SKU: {p.sku}</span>
                <span>IVA: {(p.taxRate * 100).toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
