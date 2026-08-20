'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  Smartphone,
  FileCheck,
  ShoppingBag,
  RefreshCw,
  Settings,
  AlertTriangle,
  ShieldCheck,
  LogOut,
  QrCode
} from 'lucide-react';
import { mockPOSAdapter } from '@/lib/pos/mockAdapter';

export const RestaurantNavbar: React.FC = () => {
  const pathname = usePathname();
  const [posSimulateErrors, setPosSimulateErrors] = React.useState(false);

  const togglePosErrorSimulation = () => {
    const next = !posSimulateErrors;
    setPosSimulateErrors(next);
    mockPOSAdapter.setSimulateErrors(next);
  };

  const navItems = [
    { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Mesas', href: '/app/tables', icon: Layers },
    { label: 'Comandas', href: '/app/orders', icon: RefreshCw },
    { label: 'Camarero', href: '/app/waiter', icon: Smartphone },
    { label: 'Pagos & Caja', href: '/app/payments', icon: FileCheck },
    { label: 'Productos', href: '/app/products', icon: ShoppingBag },
    { label: 'POS Mapeo', href: '/app/integrations', icon: RefreshCw },
    { label: 'Ajustes', href: '/app/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/app/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 font-bold text-xl text-white">
                M
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg tracking-tight text-white">MesaQR</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    RESTAURANT APP
                  </span>
                </div>
                <span className="text-xs text-slate-400 block -mt-1 font-medium">Caracas Grill & Bar</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links for Admin & Waiters */}
          <nav className="hidden lg:flex items-center space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* POS Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePosErrorSimulation}
              title="Simular errores aleatorios en POS"
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition-all ${
                posSimulateErrors
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Error POS:</span>
              <span className="font-bold">{posSimulateErrors ? 'ON (25%)' : 'OFF'}</span>
            </button>

            <Link
              href="/m/token-demo-mesa-2"
              target="_blank"
              className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 hidden sm:flex"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simular Cliente (Mesa 2)</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation bar for smaller screens */}
        <div className="lg:hidden flex items-center space-x-1 py-2 overflow-x-auto border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};
