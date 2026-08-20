import React from 'react';

export default function CustomerPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-start p-0 sm:p-4">
      {/* Mobile-first standalone container without any admin headers or navigation bars */}
      <div className="w-full max-w-md min-h-screen sm:min-h-0 sm:my-4 bg-slate-950 sm:border sm:border-slate-800 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
