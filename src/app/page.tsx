'use client';

import React from 'react';
import Link from 'next/link';
import {
  Smartphone,
  QrCode,
  LayoutDashboard,
  Zap,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  FileCheck
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-lg text-slate-950">
              M
            </div>
            <span className="font-black text-xl tracking-tight text-white">MesaQR</span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/app/dashboard"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/20"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Acceder a Restaurant App</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-12">
        <section className="text-center space-y-4 pt-8 pb-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>MesaQR SaaS — Arquitectura de Separación Estricta</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Plataforma de Gestión de Comandas, Cuentas y Pagos para Restaurantes
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Una sola comanda registrada por el camarero. Dos experiencias de usuario 100% aisladas compartiendo el mismo backend y Order Engine.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link
              href="/app/dashboard"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center space-x-2 transition-all active:scale-95 text-sm"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>1. RESTAURANT APP (/app/*)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/m/token-demo-mesa-2"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold px-6 py-3.5 rounded-2xl flex items-center space-x-2 transition-all active:scale-95 shadow-lg text-sm"
            >
              <QrCode className="w-5 h-5 text-emerald-400" />
              <span>2. CUSTOMER PORTAL (/m/:token)</span>
            </Link>
          </div>
        </section>

        {/* The Two Distinct Experiences */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-white">1. RESTAURANT APP (`/app/*`)</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Exclusiva para Administradores y Camareros. Requiere autenticación y contiene todas las funciones de gestión operacional:
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside font-medium">
              <li>Dashboard & Monitoreo de Mesas en Vivo (`/app/tables`)</li>
              <li>App PWA de Camarero táctil rápida (`/app/waiter`)</li>
              <li>Modulo de Caja y Aprobación de Comprobantes (`/app/payments`)</li>
              <li>Catálogo de Productos & Precios (`/app/products`)</li>
              <li>Mapeo SKU & Integración POS (`/app/integrations`)</li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-white">2. CUSTOMER PORTAL (`/m/:publicToken`)</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Exclusivo para el cliente final sentado en la mesa. 100% minimalista, sin login, sin registro y totalmente aislado de las herramientas de administración:
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside font-medium">
              <li>Consulta inmediata de consumo vía QR Token impredecible</li>
              <li>Actualizaciones automáticas en vivo (WebSockets) al agregar bebidas/platos</li>
              <li>Solicitud de Cierre de Cuenta (`PAYMENT_PENDING`)</li>
              <li>Flujos de Pago: Efectivo, Tarjeta, Pago Móvil / Transferencia y Binance Pay</li>
              <li>Filtro DTO de seguridad que oculta IDs y datos internos</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
