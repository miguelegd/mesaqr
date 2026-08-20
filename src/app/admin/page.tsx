'use client';

import React, { useState } from 'react';
import { useMesaQRStore } from '@/lib/store/useMesaQRStore';
import { Navbar } from '@/components/Navbar';
import {
  LayoutDashboard,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  Building2,
  ShoppingBag,
  History,
  Check,
  X,
  Layers,
  ArrowRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import QRCode from 'qrcode';

export default function AdminDashboardPage() {
  const db = useMesaQRStore();

  const [activeTab, setActiveTab] = useState<'tables' | 'payments' | 'pos' | 'products' | 'audit'>('tables');
  const [tableFilter, setTableFilter] = useState<'ALL' | 'FREE' | 'OCCUPIED' | 'PAYMENT_PENDING'>('ALL');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [selectedPaymentIdForReject, setSelectedPaymentIdForReject] = useState<string | null>(null);
  const [previewQrModalToken, setPreviewQrModalToken] = useState<string | null>(null);
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState<string | null>(null);

  // Filter Tables
  const filteredTables = db.tables.filter((t) => {
    if (tableFilter === 'ALL') return true;
    return t.status === tableFilter;
  });

  const pendingPayments = db.payments.filter((p) => p.status === 'PROCESSING' || p.status === 'PENDING');
  const allPayments = db.payments;

  const handleApprove = (paymentId: string) => {
    db.approvePayment(paymentId, 'usr-cashier-maria', 'María Rodríguez');
  };

  const handleReject = (paymentId: string) => {
    if (!rejectReason) return;
    db.rejectPayment(paymentId, 'usr-cashier-maria', 'María Rodríguez', rejectReason);
    setSelectedPaymentIdForReject(null);
    setRejectReason('');
  };

  const handleOpenQrModal = async (publicToken: string) => {
    setPreviewQrModalToken(publicToken);
    try {
      const url = await QRCode.toDataURL(`https://mesaqr.app/m/${publicToken}`, {
        width: 300,
        margin: 2,
        color: { dark: '#090d16', light: '#ffffff' },
      });
      setGeneratedQrDataUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar currentRole="ADMIN" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Header & Quick Metrics */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center space-x-3">
              <LayoutDashboard className="w-7 h-7 text-amber-400" />
              <span>Panel del Restaurante — Caracas Grill</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Monitoreo operativo de comandas, comprobantes de pago y sincronización POS en tiempo real
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Mesas Ocupadas</span>
              <span className="text-base font-extrabold text-amber-400">
                {db.tables.filter((t) => t.status === 'OCCUPIED' || t.status === 'PAYMENT_PENDING').length} / {db.tables.length}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Pagos por Revisar</span>
              <span className="text-base font-extrabold text-rose-400">{pendingPayments.length}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Estado POS</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-center space-x-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>MockPOS Online</span>
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
              activeTab === 'tables'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Monitoreo de Mesas ({db.tables.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all relative ${
              activeTab === 'payments'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Aprobación de Pagos</span>
            {pendingPayments.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingPayments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
              activeTab === 'pos'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Integración POS & Mapeo</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
              activeTab === 'products'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Catálogo de Productos</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Auditoría de Acciones</span>
          </button>
        </div>

        {/* TAB 1: TABLES MONITORING */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-semibold">Filtrar:</span>
              <button
                onClick={() => setTableFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg border font-bold ${
                  tableFilter === 'ALL'
                    ? 'bg-slate-800 border-amber-500 text-amber-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Todas ({db.tables.length})
              </button>
              <button
                onClick={() => setTableFilter('FREE')}
                className={`px-3 py-1.5 rounded-lg border font-bold ${
                  tableFilter === 'FREE'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Libres (🟢)
              </button>
              <button
                onClick={() => setTableFilter('OCCUPIED')}
                className={`px-3 py-1.5 rounded-lg border font-bold ${
                  tableFilter === 'OCCUPIED'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Ocupadas (🟡)
              </button>
              <button
                onClick={() => setTableFilter('PAYMENT_PENDING')}
                className={`px-3 py-1.5 rounded-lg border font-bold ${
                  tableFilter === 'PAYMENT_PENDING'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Pago Pendiente (🔴)
              </button>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTables.map((t) => {
                const qr = db.qrCodes.find((q) => q.tableId === t.id);
                const session = db.tableSessions.find(
                  (s) => s.tableId === t.id && (s.status === 'OPEN' || s.status === 'PAYMENT_PENDING' || s.status === 'PAYMENT_PROCESSING')
                );
                const order = session ? db.orders.find((o) => o.tableSessionId === session.id) : undefined;

                return (
                  <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-extrabold text-lg text-white">{t.number}</h3>
                        <span className="text-xs text-slate-400">{t.zone}</span>
                      </div>

                      {t.status === 'FREE' && (
                        <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                          Libre 🟢
                        </span>
                      )}
                      {t.status === 'OCCUPIED' && (
                        <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30">
                          Ocupada 🟡
                        </span>
                      )}
                      {t.status === 'PAYMENT_PENDING' && (
                        <span className="text-xs px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/30 animate-pulse">
                          Pago Pendiente 🔴
                        </span>
                      )}
                    </div>

                    {/* Order Details */}
                    {order ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Consumo Total:</span>
                          <span className="font-extrabold text-white text-sm font-mono">${order.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Sincronización POS:</span>
                          <span
                            className={`font-semibold ${
                              order.syncStatus === 'SYNCED'
                                ? 'text-emerald-400'
                                : order.syncStatus === 'SYNC_ERROR'
                                ? 'text-rose-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {order.syncStatus}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                          {order.items.map((i) => (
                            <div key={i.id} className="flex justify-between text-[11px]">
                              <span className="text-slate-300">
                                {i.quantity}x {i.productNameSnapshot}
                              </span>
                              <span className="font-mono text-slate-400">${i.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic py-2">Sin sesión o consumo activo.</p>
                    )}

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-between gap-2">
                      {qr && (
                        <button
                          onClick={() => handleOpenQrModal(qr.publicToken)}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 border border-slate-700"
                        >
                          <QrCode className="w-4 h-4 text-amber-400" />
                          <span>Ver QR Token</span>
                        </button>
                      )}

                      {session && session.status === 'PAYMENT_PENDING' && (
                        <button
                          onClick={() => db.reopenAccount(session.id, 'usr-admin-01', 'Administrador General')}
                          className="text-xs bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold px-3 py-2 rounded-xl"
                        >
                          Reabrir Cuenta
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENTS APPROVAL PANEL */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-amber-400" />
              <span>Verificación y Aprobación de Pagos (Caja)</span>
            </h2>

            {pendingPayments.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                <p className="font-bold text-white text-base">No hay pagos pendientes de revisión</p>
                <p className="text-xs mt-1">Todos los comprobantes han sido verificados.</p>
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
                        <span className="text-xs text-slate-400 block">Monto a Confirmar</span>
                        <span className="text-xl font-extrabold text-amber-400 font-mono">${p.amount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div>
                        <strong>Método:</strong> {p.method}
                      </div>
                      {p.referenceNumber && (
                        <div>
                          <strong>N° Referencia:</strong> <span className="font-mono text-amber-300">{p.referenceNumber}</span>
                        </div>
                      )}
                      <div>
                        <strong>Estado:</strong> {p.status}
                      </div>
                    </div>

                    {/* Proof preview if available */}
                    {p.proof && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-300 block">Comprobante de Transferencia:</span>
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                          <img
                            src={p.proof.proofUrl}
                            alt="Comprobante"
                            className="max-h-48 mx-auto rounded-lg object-contain"
                          />
                          <span className="text-[11px] text-slate-400 block mt-1">{p.proof.fileName}</span>
                        </div>
                      </div>
                    )}

                    {/* Approve / Reject Controls */}
                    {selectedPaymentIdForReject === p.id ? (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <textarea
                          placeholder="Ingresa la razón del rechazo..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                          rows={2}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedPaymentIdForReject(null)}
                            className="flex-1 bg-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleReject(p.id)}
                            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs"
                          >
                            Confirmar Rechazo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 pt-2">
                        <button
                          onClick={() => setSelectedPaymentIdForReject(p.id)}
                          className="flex-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold py-3 rounded-xl text-xs hover:bg-rose-500/20"
                        >
                          Rechazar Pago
                        </button>
                        <button
                          onClick={() => handleApprove(p.id)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-1"
                        >
                          <Check className="w-4 h-4" />
                          <span>APROBAR PAGO</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: POS INTEGRATION & PRODUCT MAPPING */}
        {activeTab === 'pos' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-white">Estado del Adaptador POS</h3>
                  <p className="text-xs text-slate-400">Mock POS Adapter de demostración</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                  CONECTADO 🟢
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Adaptador Activo</span>
                  <span className="font-bold text-white">MockPOSAdapter</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Latencia Promedio</span>
                  <span className="font-bold text-amber-400 font-mono">600 ms</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Auto-Reintento</span>
                  <span className="font-bold text-emerald-400">Habilitado (Exponential Backoff)</span>
                </div>
              </div>
            </div>

            {/* Mapped Products Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="font-bold text-base text-white">Mapeo de Productos (MesaQR SKU ↔ External POS SKU)</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Producto MesaQR</th>
                      <th className="p-3">SKU MesaQR</th>
                      <th className="p-3">Adaptador POS</th>
                      <th className="p-3">External SKU POS</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {db.products.map((p) => {
                      const map = db.productMappings.find((m) => m.productId === p.id);
                      return (
                        <tr key={p.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-semibold text-white">{p.name}</td>
                          <td className="p-3 font-mono text-amber-400">{p.sku}</td>
                          <td className="p-3">MockPOSAdapter</td>
                          <td className="p-3 font-mono text-emerald-400">{map?.externalSku || p.sku}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30 text-[10px]">
                              Mapeado 🟢
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sync Event Logs */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="font-bold text-base text-white">Registro de Eventos de Sincronización (SyncEvent Logs)</h3>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {db.syncEvents.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No hay eventos de sincronización registrados.</p>
                ) : (
                  db.syncEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">Orden {evt.orderId}</span>
                          <span className="text-[11px] text-slate-400 font-mono">Adapter: {evt.adapterName}</span>
                        </div>
                        {evt.errorMessage && <p className="text-rose-400 text-[11px] font-mono">{evt.errorMessage}</p>}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          evt.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {evt.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PRODUCTS CATALOG */}
        {activeTab === 'products' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Catálogo de Productos</h3>
              <span className="text-xs text-slate-400">{db.products.length} Productos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {db.products.map((p) => (
                <div key={p.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white text-sm">{p.name}</h4>
                    <span className="font-mono text-amber-400 font-extrabold text-sm">${p.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                  <div className="pt-2 flex justify-between text-[11px] font-mono text-slate-500">
                    <span>SKU: {p.sku}</span>
                    <span>IVA: {(p.taxRate * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white">Trazabilidad & Auditoría de Operaciones</h3>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {db.auditLogs.map((log) => (
                <div key={log.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">{log.action}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300 text-[11px]">
                    <span>Usuario: <strong>{log.userName || 'Sistema'}</strong></span>
                    <span>•</span>
                    <span>Entidad: {log.entityType} ({log.entityId})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* QR PREVIEW MODAL */}
      {previewQrModalToken && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <h3 className="font-extrabold text-lg text-white">Código QR de Mesa</h3>
            {generatedQrDataUrl && (
              <img src={generatedQrDataUrl} alt="QR Code" className="w-56 h-56 mx-auto rounded-xl shadow-lg" />
            )}
            <p className="text-xs font-mono text-slate-400 break-all bg-slate-950 p-2 rounded-xl">
              https://mesaqr.app/m/{previewQrModalToken}
            </p>
            <button
              onClick={() => setPreviewQrModalToken(null)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
