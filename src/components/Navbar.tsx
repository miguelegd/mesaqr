'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Smartphone, LayoutDashboard, Settings, AlertTriangle } from 'lucide-react';
import { mockPOSAdapter } from '@/lib/pos/mockAdapter';

interface NavbarProps {
  currentRole: 'ADMIN' | 'WAITER' | 'CLIENT';
  onRoleChange?: (role: 'ADMIN' | 'WAITER' | 'CLIENT') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole }) => {
  const pathname = usePathname();
  const [posSimulateErrors, setPosSimulateErrors] = React.useState(false);

  const togglePosErrorSimulation = () => {
    const next = !posSimulateErrors;
    setPosSimulateErrors(next);
    mockPOSAdapter.setSimulateErrors(next);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#161619] border-b border-stone-800/90 text-stone-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#ca8a04] flex items-center justify-center font-bold text-xl text-stone-950 font-serif shadow">
              M
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wide text-stone-100 font-serif">MesaQR</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 font-semibold border border-amber-800/80">
                  DEMO MVP
                </span>
              </div>
              <span className="text-xs text-stone-400 block -mt-0.5 font-medium">Caracas Grill & Bar</span>
            </div>
          </div>

          {/* Navigation Links according to view */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/app/waiter"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                pathname.includes('/waiter')
                  ? 'bg-[#ca8a04] text-stone-950 font-bold'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Camarero</span>
            </Link>

            <Link
              href="/app/dashboard"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                pathname.includes('/dashboard')
                  ? 'bg-[#ca8a04] text-stone-950 font-bold'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/app/settings"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                pathname.includes('/settings')
                  ? 'bg-[#ca8a04] text-stone-950 font-bold'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Ajustes</span>
            </Link>
          </nav>

          {/* POS Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePosErrorSimulation}
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
};
