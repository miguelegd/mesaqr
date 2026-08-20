'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QrCode, Smartphone, LayoutDashboard, Settings, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { mockPOSAdapter } from '@/lib/pos/mockAdapter';

interface NavbarProps {
  currentRole: 'ADMIN' | 'WAITER' | 'CLIENT';
  onRoleChange?: (role: 'ADMIN' | 'WAITER' | 'CLIENT') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, onRoleChange }) => {
  const pathname = usePathname();
  const [posSimulateErrors, setPosSimulateErrors] = React.useState(false);

  const togglePosErrorSimulation = () => {
    const next = !posSimulateErrors;
    setPosSimulateErrors(next);
    mockPOSAdapter.setSimulateErrors(next);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 font-bold text-xl text-white">
              M
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">MesaQR</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  DEMO MVP
                </span>
              </div>
              <span className="text-xs text-slate-400 block -mt-1 font-medium">Caracas Grill & Bar</span>
            </div>
          </div>

          {/* Navigation Links according to view */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/waiter"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith('/waiter')
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Camarero</span>
            </Link>

            <Link
              href="/admin"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith('/admin')
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-orange-400" />
              <span>Dashboard Admin</span>
            </Link>

            <Link
              href="/m/token-demo-mesa-2"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith('/m/')
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Cliente (Mesa 2)</span>
            </Link>
          </nav>

          {/* POS Control & Demo Toolbar */}
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePosErrorSimulation}
              title="Simular errores aleatorios en POS para probar alertas de retry"
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition-all ${
                posSimulateErrors
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simular Error POS:</span>
              <span className="font-bold">{posSimulateErrors ? 'ACTIVO (25%)' : 'INACTIVO'}</span>
            </button>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 ml-1 hidden sm:block" />
              <span className="text-[11px] text-slate-400 font-mono font-medium px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                Single-Order Core Engine
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
