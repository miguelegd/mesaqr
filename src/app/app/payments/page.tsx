'use client';

import React, { useState } from 'react';
import { useMesaQRStore } from '@/lib/store/useMesaQRStore';
import { FileCheck, CheckCircle2, XCircle, Check } from 'lucide-react';

export default function PaymentsPage() {
  const db = useMesaQRStore();
  const [rejectReason, setRejectReason] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pendingPayments = db.payments.filter((p) => p.status === 'PROCESSING' || p.status === 'PENDING');
  const confirmedPayments = db.payments.filter((p) => p.status === 'CONFIRMED' || p.status === 'PAID');

  const handleApprove = (paymentId: string) => {
    db.approvePayment(paymentId, 'usr-cashier-maria', 'María Rodríguez');
  };

  const handleReject = (paymentId: string) => {
    if (!rejectReason) return;
    db.rejectPayment(paymentId, 'usr-cashier-maria', 'María Rodríguez', rejectReason);
    setSelectedId(null);
    setRejectReason('');
  };

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-black text-white flex items-center space-x-3">
          <FileCheck className="w-7 h-7 text-amber-400" />
          <span>Modulo de Caja — Aprobación y Verificación de Pagos</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Revisión manual de transferencias bancarias, Pago Móvil y confirmación de cierre financiero
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <span>Pagos Pendientes de Revisión</span>
          {pendingPayments.length > 0 && (
            <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {pendingPayments.length}
            </span>
          )}
        </h2>

        {pendingPayments.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-white text-base">No hay comprobantes pendientes</p>
            <p className="text-xs mt-1">Todos los pagos ingresados han sido procesados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPayments.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-extrabold text-white text-lg">{p.tableNumber}</span>
                    <span className="text-xs text-slate-400 block font-mono">ID: {p.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Monto a Verificar</span>
                    <span className="text-xl font-extrabold text-amber-400 font-mono">${p.amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div><strong>Método:</strong> {p.method}</div>
                  {p.referenceNumber && (
                    <div><strong>N° Referencia:</strong> <span className="font-mono text-amber-300">{p.referenceNumber}</span></div>
                  )}
                  <div><strong>Estado:</strong> {p.status}</div>
                </div>

                {p.proof && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">Comprobante Cargado:</span>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                      <img src={p.proof.proofUrl} alt="Comprobante" className="max-h-48 mx-auto rounded-lg object-contain" />
                      <span className="text-[11px] text-slate-400 block mt-1">{p.proof.fileName}</span>
                    </div>
                  </div>
                )}

                {selectedId === p.id ? (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <textarea
                      placeholder="Indica la razón del rechazo..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <button onClick={() => setSelectedId(null)} className="flex-1 bg-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs">
                        Cancelar
                      </button>
                      <button onClick={() => handleReject(p.id)} className="flex-1 bg-rose-600 text-white font-bold py-2 rounded-xl text-xs">
                        Confirmar Rechazo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 pt-2">
                    <button onClick={() => setSelectedId(p.id)} className="flex-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold py-3 rounded-xl text-xs">
                      Rechazar Pago
                    </button>
                    <button onClick={() => handleApprove(p.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs flex items-center justify-center space-x-1">
                      <Check className="w-4 h-4" />
                      <span>APROBAR PAGO</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Confirmed Payments Log */}
        <div className="pt-6 border-t border-slate-800">
          <h2 className="text-base font-bold text-white mb-3">Historial de Pagos Confirmados</h2>
          <div className="space-y-2">
            {confirmedPayments.map((p) => (
              <div key={p.id} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">{p.tableNumber}</span> — {p.method} ({p.referenceNumber || 'Sin ref'})
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-emerald-400 font-bold">${p.amount.toFixed(2)}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    CONFIRMADO
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
