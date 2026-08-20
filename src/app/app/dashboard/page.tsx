'use client';

import React from 'react';
import Link from 'next/link';
import { useMesaQRStore } from '@/lib/store/useMesaQRStore';
import {
  LayoutDashboard,
  Layers,
  FileCheck,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const db = useMesaQRStore();

  const occupiedTablesCount = db.tables.filter((t) => t.status === 'OCCUPIED' || t.status === 'PAYMENT_PENDING').length;
  const pendingPayments = db.payments.filter((p) => p.status === 'PROCESSING' || p.status === 'PENDING');
  const activeOrders = db.orders.filter((o) => o.status !== 'CLOSED' && o.status !== 'CANCELLED');
  const totalSalesToday = db.orders.filter((o) => o.status === 'CLOSED').reduce((sum, o) => sum + o.total, 0);

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-[#111113] text-stone-100 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800/90 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-50 font-serif flex items-center space-x-3">
            <LayoutDashboard className="w-6 h-6 text-amber-500" />
            <span>Dashboard Operativo — Caracas Grill</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Monitoreo en tiempo real de mesas, comandas y pagos para administradores y camareros
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/app/waiter"
            className="bg-[#ca8a04] hover:bg-[#eab308] text-stone-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow border border-amber-600 transition-all"
          >
            <span>App Camarero</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#18181c] border border-stone-800/90 p-5 rounded-2xl shadow-md space-y-1">
          <span className="text-xs text-stone-400 font-bold uppercase tracking-wider block">Mesas Ocupadas</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-amber-400 font-mono">{occupiedTablesCount}</span>
            <span className="text-xs text-stone-500 font-medium">/ {db.tables.length} Total</span>
          </div>
        </div>

        <div className="bg-[#18181c] border border-stone-800/90 p-5 rounded-2xl shadow-md space-y-1">
          <span className="text-xs text-stone-400 font-bold uppercase tracking-wider block">Comandas Activas</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-stone-100 font-mono">{activeOrders.length}</span>
            <span className="text-xs text-emerald-400 font-medium">En servicio</span>
          </div>
        </div>

        <div className="bg-[#18181c] border border-stone-800/90 p-5 rounded-2xl shadow-md space-y-1">
          <span className="text-xs text-stone-400 font-bold uppercase tracking-wider block">Pagos por Revisar</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-amber-500 font-mono">{pendingPayments.length}</span>
            <span className="text-xs text-stone-400 font-medium">Comprobantes</span>
          </div>
        </div>

        <div className="bg-[#18181c] border border-stone-800/90 p-5 rounded-2xl shadow-md space-y-1">
          <span className="text-xs text-stone-400 font-bold uppercase tracking-wider block">Ventas Cerradas Hoy</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-emerald-400 font-mono">${totalSalesToday.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Tables & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Tables Overview */}
        <div className="lg:col-span-8 bg-[#18181c] border border-stone-800/90 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-4">
            <h2 className="font-bold text-lg text-stone-50 font-serif flex items-center space-x-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>Estado de Mesas en Vivo</span>
            </h2>
            <Link href="/app/tables" className="text-xs text-amber-400 font-bold hover:underline">
              Ver todas →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {db.tables.map((t) => {
              const session = db.tableSessions.find(
                (s) => s.tableId === t.id && (s.status === 'OPEN' || s.status === 'PAYMENT_PENDING' || s.status === 'PAYMENT_PROCESSING')
              );
              const order = session ? db.orders.find((o) => o.tableSessionId === session.id) : undefined;

              return (
                <div
                  key={t.id}
                  className="bg-[#111113] border border-stone-800 rounded-xl p-4 flex items-center justify-between text-xs"
                >
                  <div>
                    <h3 className="font-bold text-stone-100 text-base font-serif">{t.number}</h3>
                    <span className="text-stone-400 text-[11px]">{t.zone}</span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="font-bold text-amber-400 font-mono text-sm block">
                      ${order ? order.total.toFixed(2) : '0.00'}
                    </span>
                    {t.status === 'FREE' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                        Libre
                      </span>
                    )}
                    {t.status === 'OCCUPIED' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-bold">
                        Ocupada
                      </span>
                    )}
                    {t.status === 'PAYMENT_PENDING' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold">
                        Pago Pend.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links / Operations Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#18181c] border border-stone-800/90 rounded-2xl p-5 shadow-md space-y-3">
            <h3 className="font-bold text-sm text-stone-200 uppercase tracking-wider">Acceso Rápido</h3>

            <Link
              href="/app/tables"
              className="w-full bg-[#111113] hover:bg-stone-800 border border-stone-800 p-3.5 rounded-xl flex items-center justify-between text-xs text-stone-200 font-bold transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Gestión de QRs por Mesa</span>
              </div>
              <span>→</span>
            </Link>

            <Link
              href="/app/payments"
              className="w-full bg-[#111113] hover:bg-stone-800 border border-stone-800 p-3.5 rounded-xl flex items-center justify-between text-xs text-stone-200 font-bold transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>Revisión de Pagos & Caja</span>
              </div>
              <span>→</span>
            </Link>

            <Link
              href="/app/orders"
              className="w-full bg-[#111113] hover:bg-stone-800 border border-stone-800 p-3.5 rounded-xl flex items-center justify-between text-xs text-stone-200 font-bold transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <RefreshCw className="w-4 h-4 text-sky-400" />
                <span>Historial de Comandas & POS</span>
              </div>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
