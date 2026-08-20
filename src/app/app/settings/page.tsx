'use client';

import React from 'react';
import { useMesaQRStore } from '@/lib/store/useMesaQRStore';
import { Settings, Building2, Coins } from 'lucide-react';

export default function SettingsPage() {
  const db = useMesaQRStore();
  const restaurant = db.restaurants[0];

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-black text-white flex items-center space-x-3">
          <Settings className="w-7 h-7 text-amber-400" />
          <span>Configuración del Restaurante & Métodos de Pago</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Ajuste de datos bancarios, RIF, teléfono de Pago Móvil e identificación fiscal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bank & Pago Móvil Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-extrabold text-base text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span>Datos Bancarios (Transferencia / Pago Móvil)</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Banco Destino</label>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-white font-semibold">
                {restaurant?.bankDetails?.bankName}
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Titular de la Cuenta</label>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-white font-semibold">
                {restaurant?.bankDetails?.accountHolder}
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-400 mb-1">RIF / Identificación Fiscal</label>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-white font-semibold font-mono">
                {restaurant?.bankDetails?.taxId}
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Número de Cuenta (20 dígitos)</label>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-white font-semibold font-mono">
                {restaurant?.bankDetails?.accountNumber}
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Teléfono Pago Móvil</label>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-amber-400 font-bold font-mono">
                {restaurant?.bankDetails?.phone}
              </div>
            </div>
          </div>
        </div>

        {/* Binance Pay Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-extrabold text-base text-white flex items-center space-x-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span>Configuración Binance Pay (Mock)</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Merchant PayID</label>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-yellow-400 font-bold font-mono">
                {restaurant?.binanceDetails?.payId}
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Nombre Comercial Registrado</label>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-white font-semibold">
                {restaurant?.binanceDetails?.merchantName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
