'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMesaQRStore } from '@/lib/store/useMesaQRStore';
import { getCustomerPortalDTO } from '@/lib/dto/customer';
import {
  QrCode,
  CreditCard,
  Banknote,
  Building2,
  Coins,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { PaymentMethod } from '@/lib/types';

export default function CustomerPortalPage() {
  const params = useParams();
  const token = (params.token as string) || 'token-demo-mesa-1';
  const db = useMesaQRStore(); // Subscribes to realtime updates
  const [, setTick] = useState(0);

  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [uploadedProofName, setUploadedProofName] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const handleStorage = () => {
      db.reloadFromStorage();
      setTick((t) => t + 1);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [db]);

  // Consume DTO
  const dto = getCustomerPortalDTO(token);

  if (!dto) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h1 className="text-lg font-bold text-white">Código QR No Válido</h1>
        <p className="text-xs text-slate-400">
          El token de la mesa no corresponde a ninguna sesión activa. Solicitale ayuda al camarero.
        </p>
      </div>
    );
  }

  // Get raw session ID for mutation actions
  const qr = db.getQRCodeByToken(token);
  let resolvedTableId = qr?.tableId;
  if (!resolvedTableId) {
    if (token.includes('mesa-1') || token.includes('tbl-1')) resolvedTableId = 'tbl-1';
    else if (token.includes('mesa-2') || token.includes('tbl-2')) resolvedTableId = 'tbl-2';
    else resolvedTableId = 'tbl-1';
  }

  const session = db.tableSessions.find(
    (s) => s.tableId === resolvedTableId && (s.status === 'OPEN' || s.status === 'PAYMENT_PENDING' || s.status === 'PAYMENT_PROCESSING' || s.status === 'PAID')
  );

  const handleConfirmCloseAccount = () => {
    if (!session) return;
    db.requestCloseAccount(session.id, 'CLIENT');
    setShowCloseModal(false);
    setActionSuccessMsg('Cierre de cuenta solicitado. Elige tu método de pago.');
  };

  const handleInitiatePayment = (method: PaymentMethod) => {
    if (!session || !dto.order) return;
    setSelectedMethod(method);
    db.createPayment('rest-caracas-grill-001', session.id, method, dto.order.total, referenceNumber || undefined);
  };

  const handleUploadSimulatedProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!dto.payment || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadedProofName(file.name);

    const dummyUrl = 'https://placehold.co/600x800/1e293b/ffffff.png?text=Comprobante+' + encodeURIComponent(file.name);
    db.uploadPaymentProof(dto.payment.id, dummyUrl, file.name);
    setActionSuccessMsg('Comprobante enviado al cajero para revisión.');
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-5">
      {/* Minimal Customer Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">{dto.restaurantName}</h1>
            <p className="text-xs text-slate-400 font-semibold">{dto.tableNumber} • {dto.tableZone}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Estado</span>
            {dto.sessionStatus === 'OPEN' && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Abierto 🟢
              </span>
            )}
            {dto.sessionStatus === 'PAYMENT_PENDING' && (
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Pago Pendiente 🟡
              </span>
            )}
            {dto.sessionStatus === 'PAYMENT_PROCESSING' && (
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                En Proceso 🔵
              </span>
            )}
            {dto.sessionStatus === 'PAID' || dto.sessionStatus === 'CLOSED' ? (
              <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Pagado 🎉
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action Toast Notification */}
      {actionSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Itemized Order Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-bold text-sm text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Tu Cuenta</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            {dto.order ? `Comanda #${dto.order.id}` : 'Sin Pedidos'}
          </span>
        </div>

        {!dto.order || dto.order.items.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            <p>Aún no tienes productos registrados.</p>
            <p className="mt-0.5">El camarero añadirá tu pedido en breve.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dto.order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-800/40 text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    {item.quantity}x
                  </span>
                  <div>
                    <div className="font-semibold text-slate-100">{item.productName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">${item.unitPrice.toFixed(2)} c/u</div>
                  </div>
                </div>
                <div className="font-extrabold font-mono text-slate-200">${item.subtotal.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {dto.order && (
          <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono text-slate-200">${dto.order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>IVA (16%)</span>
              <span className="font-mono text-slate-200">${dto.order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
              <span>TOTAL A PAGAR</span>
              <span className="font-mono text-amber-400 text-lg">${dto.order.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ACCOUNT CLOSING & PAYMENT SELECTION */}
      {dto.order && dto.order.items.length > 0 && (
        <>
          {dto.sessionStatus === 'OPEN' && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold py-3.5 px-5 rounded-2xl shadow-xl shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center space-x-2 text-sm"
            >
              <span>CERRAR CUENTA & PAGAR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {(dto.sessionStatus === 'PAYMENT_PENDING' || dto.sessionStatus === 'PAYMENT_PROCESSING') && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>¿Cómo deseas pagar?</span>
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleInitiatePayment('BANK_TRANSFER')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedMethod === 'BANK_TRANSFER' || dto.payment?.method === 'BANK_TRANSFER' || dto.payment?.method === 'PAGO_MOVIL'
                      ? 'bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-amber-400 mb-1" />
                  <div>
                    <div className="font-bold text-xs">Pago Móvil / Banco</div>
                    <div className="text-[10px] text-slate-400">Banesco</div>
                  </div>
                </button>

                <button
                  onClick={() => handleInitiatePayment('CASH')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedMethod === 'CASH' || dto.payment?.method === 'CASH'
                      ? 'bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-400 mb-1" />
                  <div>
                    <div className="font-bold text-xs">Efectivo</div>
                    <div className="text-[10px] text-slate-400">Pagar en caja</div>
                  </div>
                </button>

                <button
                  onClick={() => handleInitiatePayment('CARD')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedMethod === 'CARD' || dto.payment?.method === 'CARD'
                      ? 'bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-400 mb-1" />
                  <div>
                    <div className="font-bold text-xs">Tarjeta</div>
                    <div className="text-[10px] text-slate-400">Punto de venta</div>
                  </div>
                </button>

                <button
                  onClick={() => handleInitiatePayment('BINANCE')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedMethod === 'BINANCE' || dto.payment?.method === 'BINANCE'
                      ? 'bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Coins className="w-5 h-5 text-yellow-400 mb-1" />
                  <div>
                    <div className="font-bold text-xs">Binance Pay</div>
                    <div className="text-[10px] text-slate-400">USDT</div>
                  </div>
                </button>
              </div>

              {/* FLOW: CASH / CARD INSTRUCTIONS */}
              {(dto.payment?.method === 'CASH' || dto.payment?.method === 'CARD') && (
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1 animate-in fade-in">
                  <div className="font-bold text-amber-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pago en Caja Requerido</span>
                  </div>
                  <p>
                    Dirígete a caja e indica que vas a cancelar el consumo de la{' '}
                    <strong className="text-white font-bold">{dto.tableNumber}</strong> (${dto.order.total.toFixed(2)}).
                  </p>
                </div>
              )}

              {/* FLOW: BANK TRANSFER / PAGO MOVIL DETAILED FORM */}
              {(dto.payment?.method === 'BANK_TRANSFER' || dto.payment?.method === 'PAGO_MOVIL') && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-xs text-amber-400">Datos Bancarios para Transferencia / Pago Móvil</h4>

                  <div className="text-[11px] bg-slate-900 p-2.5 rounded-xl space-y-1 font-mono text-slate-300">
                    <div><strong>Banco:</strong> {dto.bankDetails?.bankName}</div>
                    <div><strong>Titular:</strong> {dto.bankDetails?.accountHolder}</div>
                    <div><strong>RIF:</strong> {dto.bankDetails?.taxId}</div>
                    <div><strong>Teléfono Pago Móvil:</strong> {dto.bankDetails?.phone}</div>
                    <div><strong>Cuenta:</strong> {dto.bankDetails?.accountNumber}</div>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Número de Referencia
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 098124"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Subir Imagen de Comprobante
                      </label>
                      <label className="border border-dashed border-slate-700 hover:border-amber-500 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-slate-900/50 transition-all">
                        <Upload className="w-5 h-5 text-amber-400 mb-1" />
                        <span className="text-[11px] text-slate-300 text-center font-medium">
                          {uploadedProofName || dto.payment.proofFileName || 'Seleccionar comprobante'}
                        </span>
                        <input type="file" accept="image/*" onChange={handleUploadSimulatedProof} className="hidden" />
                      </label>
                    </div>

                    {dto.payment.proofStatus && (
                      <div className="p-2.5 rounded-xl border bg-slate-900 text-xs flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Estado:</span>
                        {dto.payment.proofStatus === 'UNDER_REVIEW' && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[10px]">
                            En Revisión por Caja ⏳
                          </span>
                        )}
                        {dto.payment.proofStatus === 'APPROVED' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[10px]">
                            Pago Aprobado ✅
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FLOW: BINANCE PAY MOCK */}
              {dto.payment?.method === 'BINANCE' && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-center animate-in fade-in">
                  <Coins className="w-8 h-8 text-yellow-400 mx-auto" />
                  <h4 className="font-bold text-xs text-white">Binance Pay</h4>
                  <p className="text-[11px] text-slate-400">
                    Merchant PayID: <strong className="text-white font-mono">{dto.binanceDetails?.payId}</strong>
                  </p>
                  <div className="bg-white p-2 w-32 h-32 mx-auto rounded-xl flex items-center justify-center">
                    <QrCode className="w-28 h-28 text-slate-900" />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CONFIRM CLOSE MODAL */}
      {showCloseModal && dto.order && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-xs w-full space-y-3 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-extrabold text-base text-white">¿Confirmar Cierre de Cuenta?</h3>
            <p className="text-xs text-slate-300">
              Solicitarás el cierre de cuenta para <strong className="text-white font-bold">{dto.tableNumber}</strong>.
            </p>

            <div className="bg-slate-950 p-2.5 rounded-xl text-xs flex justify-between">
              <span className="text-slate-400">Monto Total:</span>
              <span className="font-extrabold text-amber-400 font-mono">${dto.order.total.toFixed(2)}</span>
            </div>

            <div className="flex space-x-2 pt-2">
              <button onClick={() => setShowCloseModal(false)} className="flex-1 bg-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs">
                Volver
              </button>
              <button onClick={handleConfirmCloseAccount} className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs">
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
