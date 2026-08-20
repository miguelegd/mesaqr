import React from 'react';
import { RestaurantNavbar } from '@/components/RestaurantNavbar';

export default function RestaurantAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <RestaurantNavbar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
