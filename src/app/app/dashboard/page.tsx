'use client';

import React from 'react';
import Link from 'next/link';
import { useMesaQRStore } from '@/lib/store/useMesaQRStore';
import {
  LayoutDashboard,
  Layers,
  FileCheck,
  RefreshCw,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export default function DashboardPage() {
  const db = useMesaQRStore();

  const occupiedTablesCount = db.tables.filter((t) => t.status === 'OCCUPIED' || t.status === 'PAYMENT_PENDING').length;
  const pendingPayments = db.payments.filter((p) => p.status === 'PROCESSING' || p.status === 'PENDING');
  const activeOrders = db.orders.filter((o) => o.status !== 'CLOSED' && o.status !== 'CANCELLED');
  const totalSalesToday = db.orders.filter((o) => o.status === 'CLOSED').reduce((sum, o) => sum + o.total, 0);

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-3">
            <LayoutDashboard className="w-7 h-7 text-amber-400" />
            <span>Dashboard Operativo — Caracas Grill</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoreo en tiempo real de mesas, comandas y pagos para administradores y camareros
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/app/waiter"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/20"
          >
            <span>App Camarero</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Mesas Ocupadas</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-400">{occupiedTablesCount}</span>
            <span className="text-xs text-slate-500 font-medium">/ {db.tables.length} Total</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Pagos por Revisar</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-rose-400">{pendingPayments.length}</span>
            <span className="text-xs text-slate-500 font-medium">Comprobantes</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Órdenes Activas</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-400">{activeOrders.length}</span>
            <span className="text-xs text-slate-500 font-medium">En proceso</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Ventas Cerradas Hoy</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white font-mono">${totalSalesToday.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Grid of Main Management Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {/* Module 1: Tables */}
        <Link
          href="/app/tables"
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-6 rounded-3xl shadow-xl space-y-3 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 transition-colors" />
          </div>
          <h3 className="font-extrabold text-lg text-white">Gestión de Mesas y QRs</h3>
          <p className="text-xs text-slate-400">
            Monitoreo en vivo de estados de mesa (Libre, Ocupada, Pago Pendiente) y generación de tokens QR.
          </p>
        </Link>

        {/* Module 2: Cashier Payments */}
        <Link
          href="/app/payments"
          className="bg-slate-900 border border-slate-800 hover:border-rose-500/50 p-6 rounded-3xl shadow-xl space-y-3 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <FileCheck className="w-6 h-6" />
            </div>
            {pendingPayments.length > 0 && (
              <span className="bg-rose-600 text-white text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                {pendingPayments.length} pendientes
              </span>
            )}
          </div>
          <h3 className="font-extrabold text-lg text-white">Aprobación de Pagos & Comprobantes</h3>
          <p className="text-xs text-slate-400">
            Verificación de transferencias, Pago Móvil y aprobación por el cajero para cierre de cuentas.
          </p>
        </Link>

        {/* Module 3: POS Integrations */}
        <Link
          href="/app/integrations"
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-3xl shadow-xl space-y-3 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              MockPOS ONLINE
            </span>
          </div>
          <h3 className="font-extrabold text-lg text-white">Integración POS & Mapeo SKU</h3>
          <p className="text-xs text-slate-400">
            Sincronización con el sistema administrativo externo y mapeo de productos MesaQR ↔ POS.
          </p>
        </Link>
      </div>
    </main>
  );
}
