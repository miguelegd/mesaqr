'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMesaQRStore } from '@/lib/store/useMesaQRStore';
import { getCustomerPortalDTO } from '@/lib/dto/customer';
import {
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
  const db = useMesaQRStore();
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

  // Cross-device polling effect (syncs mobile phone with PC via /api/v1/sync every 2 seconds)
  React.useEffect(() => {
    const pollServer = async () => {
      try {
        const res = await fetch(`/api/v1/sync?token=${encodeURIComponent(token)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.order) {
          const serverOrder = data.order;
          const resolvedTableId = data.tableId || (token.includes('mesa-2') || token.includes('tbl-2') ? 'tbl-2' : 'tbl-1');
          const session = db.tableSessions.find((s) => s.tableId === resolvedTableId && (s.status === 'OPEN' || s.status === 'PAYMENT_PENDING' || s.status === 'PAYMENT_PROCESSING' || s.status === 'PAID'));
          
          if (session) {
            const localOrder = db.orders.find((o) => o.tableSessionId === session.id);
            if (localOrder && (localOrder.total !== serverOrder.total || localOrder.items.length !== serverOrder.items.length)) {
              localOrder.items = serverOrder.items.map((i: any) => ({
                id: i.id || `item-${Date.now()}`,
                orderId: localOrder.id,
                productId: `prod-${i.id}`,
                productNameSnapshot: i.productName,
                skuSnapshot: 'SYNC',
                quantity: i.quantity,
                unitPriceSnapshot: i.unitPrice,
                taxSnapshot: 0,
                discount: 0,
                subtotal: i.subtotal,
              }));
              localOrder.subtotal = serverOrder.subtotal;
              localOrder.tax = serverOrder.tax || 0;
              localOrder.total = serverOrder.total;
              db.saveToStorage();
              setTick((t) => t + 1);
            }
          }
        }
      } catch (err) {
        // silent catch
      }
    };

    pollServer();
    const intervalId = setInterval(pollServer, 2000);
    return () => clearInterval(intervalId);
  }, [token, db]);

  // Consume DTO
  const dto = getCustomerPortalDTO(token);

  if (!dto) {
    return (
      <div className="p-8 text-center space-y-3 bg-[#161619] min-h-screen">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h1 className="text-lg font-bold text-stone-100">Código QR No Válido</h1>
        <p className="text-xs text-stone-400">
          El token de la mesa no corresponde a ninguna sesión activa. Solicítale ayuda al camarero.
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

    const dummyUrl = 'https://placehold.co/600x800/18181c/ffffff.png?text=Comprobante+' + encodeURIComponent(file.name);
    db.uploadPaymentProof(dto.payment.id, dummyUrl, file.name);
    setActionSuccessMsg('Comprobante enviado al cajero para revisión.');
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-5 bg-[#141416] text-stone-100 font-sans">
      {/* Minimal Customer Header - Elegant Matte Black Theme */}
      <div className="bg-[#1c1c20] border border-stone-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
          <div>
            <h1 className="text-xl font-bold text-stone-50 tracking-wide font-serif">{dto.restaurantName}</h1>
            <p className="text-xs text-stone-400 font-medium">{dto.tableNumber} • {dto.tableZone}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-amber-500 block tracking-widest">Estado</span>
            {dto.sessionStatus === 'OPEN' && (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/80">
                Abierto 🟢
              </span>
            )}
            {dto.sessionStatus === 'PAYMENT_PENDING' && (
              <span className="text-xs font-semibold text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-800/80">
                Pago Pendiente 🟡
              </span>
            )}
            {dto.sessionStatus === 'PAYMENT_PROCESSING' && (
              <span className="text-xs font-semibold text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded border border-sky-800/80">
                En Proceso 🔵
              </span>
            )}
            {dto.sessionStatus === 'PAID' || dto.sessionStatus === 'CLOSED' ? (
              <span className="text-xs font-semibold text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-800/80">
                Pagado ✓
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action Toast Notification */}
      {actionSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-800/90 text-emerald-300 p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Itemized Order Breakdown */}
      <div className="bg-[#1c1c20] border border-stone-800/90 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
          <h2 className="font-bold text-sm text-stone-100 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Tu Cuenta</span>
          </h2>
          <span className="text-[11px] text-stone-400 font-mono">
            {dto.order ? `Comanda #${dto.order.id}` : 'Sin Pedidos'}
          </span>
        </div>

        {!dto.order || dto.order.items.length === 0 ? (
          <div className="text-center py-6 text-stone-500 text-xs">
            <p>Aún no tienes productos registrados.</p>
            <p className="mt-0.5">El camarero añadirá tu pedido en breve.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dto.order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 border-b border-stone-800/50 text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="font-bold text-amber-400 bg-stone-800 px-2 py-0.5 rounded border border-stone-700">
                    {item.quantity}x
                  </span>
                  <div>
                    <div className="font-semibold text-stone-100">{item.productName}</div>
                    <div className="text-[10px] text-stone-400 font-mono">${item.unitPrice.toFixed(2)} c/u</div>
                  </div>
                </div>
                <div className="font-bold font-mono text-stone-200">${item.subtotal.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {dto.order && (
          <div className="pt-3 border-t border-stone-800/90 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>Subtotal</span>
              <span className="font-mono text-stone-200">${dto.order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>IVA (0%)</span>
              <span className="font-mono text-stone-200">${dto.order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-stone-50 pt-2 border-t border-stone-800">
              <span>TOTAL A PAGAR</span>
              <span className="font-mono text-amber-400 text-lg font-black">${dto.order.total.toFixed(2)}</span>
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
              className="w-full bg-[#ca8a04] hover:bg-[#eab308] text-stone-950 font-bold py-3.5 px-5 rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center space-x-2 text-sm border border-amber-600"
            >
              <span>CERRAR CUENTA & PAGAR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {(dto.sessionStatus === 'PAYMENT_PENDING' || dto.sessionStatus === 'PAYMENT_PROCESSING') && (
            <div className="bg-[#1c1c20] border border-stone-800/90 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="font-bold text-sm text-stone-100 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span>Seleccionar Método de Pago</span>
              </h3>

              {/* Payment Methods Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleInitiatePayment('CARD')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedMethod === 'CARD'
                      ? 'bg-amber-950/50 border-amber-500 text-stone-100'
                      : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-amber-500 mb-1" />
                  <div className="font-bold text-xs">Punto / Tarjeta</div>
                  <div className="text-[10px] text-stone-400">Pagar en mesa</div>
                </button>

                <button
                  onClick={() => handleInitiatePayment('CASH')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedMethod === 'CASH'
                      ? 'bg-amber-950/50 border-amber-500 text-stone-100'
                      : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-500 mb-1" />
                  <div className="font-bold text-xs">Efectivo</div>
                  <div className="text-[10px] text-stone-400">Pagar al camarero</div>
                </button>

                <button
                  onClick={() => handleInitiatePayment('BANK_TRANSFER')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedMethod === 'BANK_TRANSFER'
                      ? 'bg-amber-950/50 border-amber-500 text-stone-100'
                      : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-blue-400 mb-1" />
                  <div className="font-bold text-xs">Pago Móvil / Transf.</div>
                  <div className="text-[10px] text-stone-400">Adjuntar comprobante</div>
                </button>

                <button
                  onClick={() => handleInitiatePayment('BINANCE_PAY')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedMethod === 'BINANCE_PAY'
                      ? 'bg-amber-950/50 border-amber-500 text-stone-100'
                      : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <Coins className="w-5 h-5 text-yellow-500 mb-1" />
                  <div className="font-bold text-xs">Binance Pay</div>
                  <div className="text-[10px] text-stone-400">USDT / Cripto</div>
                </button>
              </div>

              {/* Dynamic Details for selected payment method */}
              {dto.payment && (
                <div className="bg-stone-900/80 p-4 rounded-xl border border-stone-800 space-y-3 text-xs">
                  {dto.payment.method === 'BANK_TRANSFER' && dto.bankDetails && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-amber-400">Datos para Pago Móvil / Transferencia:</h4>
                      <div className="space-y-1 text-[11px] text-stone-300 font-mono bg-stone-950 p-2.5 rounded border border-stone-800">
                        <div>Banco: <strong>{dto.bankDetails.bankName}</strong></div>
                        <div>Titular: <strong>{dto.bankDetails.accountHolder}</strong></div>
                        <div>RIF: <strong>{dto.bankDetails.taxId}</strong></div>
                        <div>Teléfono: <strong>{dto.bankDetails.phone}</strong></div>
                      </div>

                      <div className="pt-2 space-y-2">
                        <label className="block text-stone-300 font-semibold">Número de Referencia:</label>
                        <input
                          type="text"
                          placeholder="Ej: 948271"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                        />

                        <label className="block text-stone-300 font-semibold pt-1">Subir Comprobante (Captura):</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadSimulatedProof}
                            className="hidden"
                            id="proof-upload"
                          />
                          <label
                            htmlFor="proof-upload"
                            className="w-full bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 py-2.5 px-3 rounded-lg flex items-center justify-center space-x-2 cursor-pointer transition-all font-semibold"
                          >
                            <Upload className="w-4 h-4 text-amber-500" />
                            <span>{uploadedProofName || dto.payment.proofFileName || 'Seleccionar Imagen'}</span>
                          </label>
                        </div>

                        {dto.payment.proofStatus === 'PENDING_REVIEW' && (
                          <div className="bg-amber-950/60 border border-amber-800 text-amber-300 p-2.5 rounded text-[11px] flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Comprobante en revisión por la caja del restaurante.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {dto.payment.method === 'BINANCE_PAY' && dto.binanceDetails && (
                    <div className="space-y-2 text-center">
                      <h4 className="font-bold text-amber-400">Binance Pay ID:</h4>
                      <div className="text-base font-extrabold text-white font-mono bg-stone-950 p-3 rounded border border-stone-800">
                        {dto.binanceDetails.payId}
                      </div>
                      <p className="text-[11px] text-stone-400">Escanea el código Pay desde tu App de Binance</p>
                    </div>
                  )}

                  {(dto.payment.method === 'CASH' || dto.payment.method === 'CARD') && (
                    <div className="text-center py-2 space-y-1">
                      <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto" />
                      <p className="font-bold text-stone-200">El camarero asistirá a tu mesa en un momento.</p>
                      <p className="text-[11px] text-stone-400">Monto total a cobrar: ${dto.payment.amount.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL PARA CONFIRMAR CIERRE DE CUENTA */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1c20] border border-stone-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-stone-50">¿Deseas cerrar tu cuenta?</h3>
            <p className="text-xs text-stone-400">
              Al cerrar la cuenta no podrás agregar más productos y procederás a elegir tu método de pago.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-2.5 rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCloseAccount}
                className="flex-1 bg-[#ca8a04] hover:bg-[#eab308] text-stone-950 font-extrabold py-2.5 rounded-xl text-xs shadow-md"
              >
                Sí, Cerrar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
