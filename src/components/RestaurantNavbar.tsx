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
  AlertTriangle
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
    <header className="sticky top-0 z-50 bg-[#161619] border-b border-stone-800/90 text-stone-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/app/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#ca8a04] flex items-center justify-center font-bold text-xl text-stone-950 font-serif shadow">
                M
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg tracking-wide text-stone-100 font-serif">MesaQR</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 font-semibold border border-amber-800/80">
                    RESTAURANT APP
                  </span>
                </div>
                <span className="text-xs text-stone-400 block -mt-0.5 font-medium">Caracas Grill & Bar</span>
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
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#ca8a04] text-stone-950 font-extrabold shadow-sm'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
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
                  ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                  : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Error POS:</span>
              <span className="font-bold">{posSimulateErrors ? 'ON (25%)' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
