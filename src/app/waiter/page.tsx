'use client';

import React, { useState, useEffect } from 'react';
import { useMesaQRStore } from '@/lib/store/useMesaQRStore';
import { Navbar } from '@/components/Navbar';
import {
  Smartphone,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  ShoppingBag,
  Send,
  RefreshCw,
  Clock,
  Check,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { enqueueOfflineOrder, getPendingOrdersCount, getAllPendingOrders, offlineDb } from '@/lib/offline/queue';

export default function WaiterPage() {
  const db = useMesaQRStore();

  const [selectedTableId, setSelectedTableId] = useState<string>('tbl-2');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-hamb');
  const [orderCart, setOrderCart] = useState<Record<string, number>>({});
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncingOffline, setSyncingOffline] = useState<boolean>(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  // Manual Order state
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualName, setManualName] = useState<string>('');
  const [manualPrice, setManualPrice] = useState<string>('');
  const [manualQty, setManualQty] = useState<number>(1);

  const handleAddManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPrice) return;

    const priceNum = parseFloat(manualPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const session = db.getOrCreateActiveSession('rest-caracas-grill-001', selectedTableId, 'usr-waiter-carlos', 'Carlos Mendoza');
    const idempotencyKey = `w-man-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    db.createOrUpdateOrder(
      'rest-caracas-grill-001',
      session.id,
      'usr-waiter-carlos',
      'Carlos Mendoza',
      [{ customName: manualName.trim(), customPrice: priceNum, quantity: manualQty }],
      idempotencyKey
    );

    setShowManualModal(false);
    setManualName('');
    setManualPrice('');
    setManualQty(1);
    showMessage(`✅ Ítem manual "${manualName.trim()}" agregado a la comanda de ${currentTable?.number}.`);
  };

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updatePendingQueueCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingQueueCount = async () => {
    try {
      const count = await getPendingOrdersCount();
      setPendingCount(count);
    } catch (err) {
      console.error(err);
    }
  };

  const syncOfflineQueue = async () => {
    if (!isOnline || syncingOffline) return;
    setSyncingOffline(true);
    try {
      const pendingOrders = await getAllPendingOrders();
      for (const order of pendingOrders) {
        db.createOrUpdateOrder(
          'rest-caracas-grill-001',
          order.tableSessionId,
          order.waiterId,
          order.waiterName,
          order.items,
          order.idempotencyKey
        );
        if (order.id) {
          await offlineDb.pendingOrders.delete(order.id);
        }
      }
      await updatePendingQueueCount();
      showMessage(`✅ ${pendingOrders.length} comanda(s) offline sincronizadas exitosamente con el servidor.`);
    } catch (err) {
      showMessage('❌ Error al sincronizar cola offline.');
    } finally {
      setSyncingOffline(false);
    }
  };

  const showMessage = (msg: string) => {
    setLastActionMessage(msg);
    setTimeout(() => setLastActionMessage(null), 3500);
  };

  const currentTable = db.tables.find((t) => t.id === selectedTableId);
  const activeSession = db.tableSessions.find(
    (s) => s.tableId === selectedTableId && (s.status === 'OPEN' || s.status === 'PAYMENT_PENDING' || s.status === 'PAYMENT_PROCESSING')
  );

  const currentOrder = activeSession
    ? db.orders.find((o) => o.tableSessionId === activeSession.id)
    : undefined;

  const categories = db.categories;
  const products = db.products.filter((p) => p.categoryId === selectedCategoryId);

  const handleQuantityChange = (productId: string, delta: number) => {
    setOrderCart((prev) => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  };

  const handleSendComanda = async () => {
    const items = Object.entries(orderCart).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    if (items.length === 0) return;

    const session = db.getOrCreateActiveSession('rest-caracas-grill-001', selectedTableId, 'usr-waiter-carlos', 'Carlos Mendoza');

    if (!isOnline) {
      await enqueueOfflineOrder(session.id, 'usr-waiter-carlos', 'Carlos Mendoza', items);
      await updatePendingQueueCount();
      setOrderCart({});
      showMessage('📱 Sin conexión a Internet. Comanda guardada localmente en cola offline.');
      return;
    }

    try {
      const idempotencyKey = `w-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      db.createOrUpdateOrder(
        'rest-caracas-grill-001',
        session.id,
        'usr-waiter-carlos',
        'Carlos Mendoza',
        items,
        idempotencyKey
      );

      setOrderCart({});
      showMessage(`✅ Comanda enviada a ${currentTable?.number}. Actualizada en tiempo real.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al enviar comanda';
      showMessage(`❌ ${message}`);
    }
  };

  const totalCartItemsCount = Object.values(orderCart).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#111113] text-stone-100 flex flex-col font-sans">
      <Navbar currentRole="WAITER" />

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-[#b45309] text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center space-x-2">
          <WifiOff className="w-4 h-4" />
          <span>Modo Contingencia Offline Activo: Las comandas se guardarán en la cola del dispositivo.</span>
        </div>
      )}

      {pendingCount > 0 && isOnline && (
        <div className="bg-emerald-900 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center space-x-2 border-b border-emerald-800">
          <RefreshCw className={`w-4 h-4 ${syncingOffline ? 'animate-spin' : ''}`} />
          <span>Hay {pendingCount} comanda(s) pendientes de sincronización offline.</span>
          <button
            onClick={syncOfflineQueue}
            className="underline ml-2 bg-emerald-950 px-2.5 py-0.5 rounded text-[11px] font-bold border border-emerald-700"
          >
            Sincronizar Ahora
          </button>
        </div>
      )}

      {/* Action Notification Toast */}
      {lastActionMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#1c1c20] border border-stone-700 text-stone-100 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 text-sm font-medium animate-in fade-in slide-in-from-top-4">
          <span>{lastActionMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Table Selector & Table Details */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#18181c] border border-stone-800/90 rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-stone-300 uppercase tracking-wider flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-amber-500" />
                <span>Mesas del Restaurante</span>
              </h2>
              <span className="text-xs text-stone-400">{db.tables.length} Mesas</span>
            </div>

            {/* Grid of Tables */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {db.tables.map((t) => {
                const session = db.tableSessions.find(
                  (s) => s.tableId === t.id && (s.status === 'OPEN' || s.status === 'PAYMENT_PENDING' || s.status === 'PAYMENT_PROCESSING')
                );
                const order = session ? db.orders.find((o) => o.tableSessionId === session.id) : undefined;
                const isSelected = t.id === selectedTableId;

                let statusBadge = { bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80', text: 'Libre' };
                if (t.status === 'OCCUPIED') {
                  statusBadge = { bg: 'bg-amber-950/60 text-amber-400 border-amber-800/80', text: `$${order?.total || '0'}` };
                } else if (t.status === 'PAYMENT_PENDING') {
                  statusBadge = { bg: 'bg-rose-950/60 text-rose-400 border-rose-800/80', text: 'Pago Pend.' };
                }

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTableId(t.id);
                      setOrderCart({});
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-[#242429] border-amber-600 text-stone-50 shadow-md ring-1 ring-amber-600/40 font-bold'
                        : 'bg-[#111113] border-stone-800 text-stone-300 hover:bg-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-bold text-base font-serif">{t.number}</div>
                    <div className="text-[11px] text-stone-400 truncate">{t.zone}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${statusBadge.bg}`}>
                        {statusBadge.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Current Consumptions & Active Order Info */}
          {currentTable && (
            <div className="bg-[#18181c] border border-stone-800/90 rounded-2xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                <div>
                  <h3 className="font-bold text-lg text-stone-50 font-serif">{currentTable.number}</h3>
                  <p className="text-xs text-stone-400">Camarero: Carlos Mendoza</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400 block">Consumo Actual</span>
                  <span className="text-xl font-bold text-amber-400 font-mono">
                    ${currentOrder ? currentOrder.total.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>

              {/* Sync status badge */}
              {currentOrder && (
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-stone-400">Sincronización POS:</span>
                    {currentOrder.syncStatus === 'SYNCED' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800/80 flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Sincronizado</span>
                      </span>
                    )}
                    {currentOrder.syncStatus === 'SYNC_ERROR' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 font-semibold border border-rose-800/80 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 text-rose-400" />
                        <span>Error POS</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Items already ordered */}
              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Comanda Confirmada</h4>
                {!currentOrder || currentOrder.items.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">Mesa sin pedidos confirmados en esta sesión.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {currentOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs bg-[#111113] p-2 rounded-lg border border-stone-800"
                      >
                        <div className="flex items-center space-x-2 truncate max-w-[140px]">
                          <span className="font-bold text-amber-400 font-mono">{item.quantity}x</span>
                          <span className="text-stone-200 truncate">{item.productNameSnapshot}</span>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="font-mono text-stone-300 text-[11px]">${item.subtotal.toFixed(2)}</span>
                          <button
                            onClick={() => db.updateItemQuantity('rest-caracas-grill-001', currentOrder.id, item.id, -1)}
                            className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold rounded flex items-center justify-center text-xs transition-all border border-stone-700"
                            title="Restar 1 unidad"
                          >
                            -
                          </button>
                          <button
                            onClick={() => db.removeOrderItem('rest-caracas-grill-001', currentOrder.id, item.id)}
                            className="w-5 h-5 bg-rose-950 hover:bg-rose-900 text-rose-400 rounded flex items-center justify-center text-xs transition-all border border-rose-800"
                            title="Quitar de la comanda"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Quick Menu & Comanda Register */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {/* Category Tabs & Manual Entry Button */}
          <div className="bg-[#18181c] border border-stone-800/90 rounded-2xl p-2.5 shadow-md flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex space-x-2 overflow-x-auto">
              {categories.map((c) => {
                const isCatSelected = c.id === selectedCategoryId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategoryId(c.id)}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                      isCatSelected
                        ? 'bg-[#ca8a04] text-stone-950 font-extrabold shadow-sm'
                        : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white border border-stone-700/60'
                    }`}
                  >
                    <span className="text-base">{c.icon || '🍽️'}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowManualModal(true)}
              className="bg-[#ca8a04] hover:bg-[#eab308] text-stone-950 px-3.5 py-2.5 rounded-xl font-extrabold text-xs whitespace-nowrap flex items-center space-x-1.5 shadow-sm border border-amber-600"
            >
              <span>📝 + Ítem Manual</span>
            </button>
          </div>

          {/* Product Grid */}
          <div className="flex-1 bg-[#18181c] border border-stone-800/90 rounded-2xl p-4 shadow-md">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
              Seleccionar Productos — {categories.find((c) => c.id === selectedCategoryId)?.name}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map((p) => {
                const countInCart = orderCart[p.id] || 0;
                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      countInCart > 0
                        ? 'bg-[#242429] border-amber-600 shadow-md ring-1 ring-amber-600/40'
                        : 'bg-[#111113] border-stone-800 text-stone-200 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-stone-100 text-sm font-serif">{p.name}</h4>
                        <span className="font-mono text-xs font-bold text-amber-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                          ${p.price.toFixed(2)}
                        </span>
                      </div>
                      {p.description && <p className="text-xs text-stone-400 mt-1 line-clamp-2">{p.description}</p>}
                      <span className="text-[10px] text-stone-500 font-mono block mt-1">SKU: {p.sku}</span>
                    </div>

                    {/* Touch Counter Buttons */}
                    <div className="mt-3 pt-2 border-t border-stone-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-400">
                        {countInCart > 0 ? `Seleccionado: ${countInCart}` : 'Agregar'}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleQuantityChange(p.id, -1)}
                          disabled={countInCart === 0}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg transition-all ${
                            countInCart > 0
                              ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                              : 'bg-stone-900 text-stone-700 border border-stone-800 cursor-not-allowed'
                          }`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <span className="w-8 text-center font-bold text-sm text-white font-mono">
                          {countInCart}
                        </span>

                        <button
                          onClick={() => handleQuantityChange(p.id, 1)}
                          className="w-9 h-9 rounded-lg bg-[#ca8a04] hover:bg-[#eab308] text-stone-950 flex items-center justify-center font-bold shadow transition-all border border-amber-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Bar: Action Button (ENVIAR COMANDA) */}
          <div className="bg-[#18181c] border border-stone-800/90 rounded-2xl p-4 shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-400 block font-medium">Nuevos ítems a enviar</span>
              <span className="text-lg font-bold text-stone-100">
                {totalCartItemsCount} ítem(s) seleccionados
              </span>
            </div>

            <button
              onClick={handleSendComanda}
              disabled={totalCartItemsCount === 0}
              className={`px-6 py-3.5 rounded-xl font-bold text-sm flex items-center space-x-2 shadow transition-all border ${
                totalCartItemsCount > 0
                  ? 'bg-[#ca8a04] hover:bg-[#eab308] text-stone-950 border-amber-600'
                  : 'bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>ENVIAR COMANDA</span>
            </button>
          </div>
        </div>
      </main>

      {/* MANUAL ITEM ADDITION MODAL FOR WAITER */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddManualOrder}
            className="bg-[#18181c] border border-stone-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-widest block">Camarero — Carga Manual</span>
              <h3 className="font-bold text-xl text-stone-50 font-serif mt-0.5">Agregar Pedido Manual a {currentTable?.number}</h3>
              <p className="text-xs text-stone-400 mt-1">
                Ingresa una descripción personalizada y precio para subir directamente a la cuenta de esta mesa.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Nombre o Descripción del Pedido</label>
                <input
                  type="text"
                  placeholder="Ej: Ración de Tequeños, Hamburguesa especial sin cebolla..."
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  required
                  className="w-full bg-[#111113] border border-stone-800 rounded-xl px-3 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Precio Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 5.50"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    required
                    className="w-full bg-[#111113] border border-stone-800 rounded-xl px-3 py-2.5 text-sm text-stone-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Cantidad</label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setManualQty(Math.max(1, manualQty - 1))}
                      className="w-9 h-9 bg-stone-800 text-stone-100 font-bold rounded-lg border border-stone-700 flex items-center justify-center text-base"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm text-stone-100 font-mono w-6 text-center">{manualQty}</span>
                    <button
                      type="button"
                      onClick={() => setManualQty(manualQty + 1)}
                      className="w-9 h-9 bg-[#ca8a04] text-stone-950 font-bold rounded-lg flex items-center justify-center text-base"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-3">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-3 rounded-xl text-xs transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#ca8a04] hover:bg-[#eab308] text-stone-950 font-extrabold py-3 rounded-xl text-xs shadow-md transition-all border border-amber-600"
              >
                AÑADIR A LA CUENTA
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
