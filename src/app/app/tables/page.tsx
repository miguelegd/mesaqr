'use client';

import React, { useState, useEffect } from 'react';
import { useMesaQRStore } from '@/lib/store/useMesaQRStore';
import { Layers, QrCode, Plus, Copy, ExternalLink, Check, RefreshCw, Smartphone, Eye, Trash2 } from 'lucide-react';
import QRCode from 'qrcode';

export default function TablesPage() {
  const db = useMesaQRStore();
  const [filter, setFilter] = useState<'ALL' | 'FREE' | 'OCCUPIED' | 'PAYMENT_PENDING'>('ALL');
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [previewTableName, setPreviewTableName] = useState<string>('Mesa 01');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [targetScannableUrl, setTargetScannableUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Network IP detection state
  const [detectedIp, setDetectedIp] = useState<string>('localhost');
  const [customHost, setCustomHost] = useState<string>('');

  // Manual Order Modal state
  const [showManualModalTableId, setShowManualModalTableId] = useState<string | null>(null);
  const [manualTableName, setManualTableName] = useState<string>('');
  const [manualName, setManualName] = useState<string>('');
  const [manualPrice, setManualPrice] = useState<string>('');
  const [manualQty, setManualQty] = useState<number>(1);

  useEffect(() => {
    // Fetch local network IPv4 address from server API
    fetch('/api/v1/network-ip')
      .then((res) => res.json())
      .then((data) => {
        if (data.primaryIp) {
          setDetectedIp(data.primaryIp);
        }
      })
      .catch((err) => console.error('Error fetching network IP:', err));
  }, []);

  const filteredTables = db.tables.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  const handleOpenQrModal = async (token: string, tableName: string) => {
    setPreviewToken(token);
    setPreviewTableName(tableName);

    let fullUrl = '';
    if (customHost.trim()) {
      fullUrl = `http://${customHost.trim()}:3000/m/${token}`;
    } else if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1') {
      fullUrl = `${window.location.origin}/m/${token}`;
    } else {
      const hostToUse = detectedIp || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
      fullUrl = `http://${hostToUse}:3000/m/${token}`;
    }

    setTargetScannableUrl(fullUrl);

    try {
      const dataUrl = await QRCode.toDataURL(fullUrl, {
        width: 320,
        margin: 2,
        color: { dark: '#111113', light: '#ffffff' },
      });
      setQrUrl(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetScannableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddBeerToMesa1 = () => {
    const session = db.tableSessions.find((s) => s.tableId === 'tbl-1');
    if (!session) return;
    db.createOrUpdateOrder('rest-caracas-grill-001', session.id, 'usr-waiter-carlos', 'Carlos Mendoza', [
      { productId: 'prod-beb-1', quantity: 1 },
    ]);
  };

  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showManualModalTableId || !manualName.trim() || !manualPrice) return;

    const priceNum = parseFloat(manualPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const session = db.getOrCreateActiveSession('rest-caracas-grill-001', showManualModalTableId, 'usr-waiter-carlos', 'Carlos Mendoza');
    db.createOrUpdateOrder('rest-caracas-grill-001', session.id, 'usr-waiter-carlos', 'Carlos Mendoza', [
      { customName: manualName.trim(), customPrice: priceNum, quantity: manualQty },
    ]);

    setShowManualModalTableId(null);
    setManualName('');
    setManualPrice('');
    setManualQty(1);
  };

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 bg-[#111113] text-stone-100 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800/90 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-50 font-serif flex items-center space-x-3">
            <Layers className="w-6 h-6 text-amber-500" />
            <span>Gestión de Mesas & Códigos QR</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Generación de accesos QR y monitoreo de comanda activa por mesa
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-[#18181c] border border-stone-800 px-3.5 py-2 rounded-xl text-xs flex items-center space-x-2">
            <span className="text-stone-400 font-medium">IP Servidor:</span>
            <span className="font-mono text-emerald-400 font-bold">{detectedIp}:3000</span>
          </div>
        </div>
      </div>

      {/* Network Configuration Helper */}
      <div className="bg-[#18181c] border border-stone-800 rounded-2xl p-4 text-xs space-y-2 text-stone-300">
        <div className="flex items-center space-x-2 text-amber-400 font-bold">
          <Smartphone className="w-4 h-4" />
          <span>Acceso desde Teléfono Móvil</span>
        </div>
        <p className="text-stone-400">
          Para escanear desde tu dispositivo móvil, asegúrate de usar la URL pública en Vercel o la IP local de tu Wi-Fi:
        </p>
        <div className="flex items-center space-x-2 max-w-sm">
          <input
            type="text"
            placeholder={`Ej: ${detectedIp}`}
            value={customHost}
            onChange={(e) => setCustomHost(e.target.value)}
            className="bg-[#111113] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 w-full focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl font-bold border transition-all ${
            filter === 'ALL' ? 'bg-[#ca8a04] border-amber-600 text-stone-950 shadow' : 'bg-[#18181c] border-stone-800 text-stone-400 hover:text-stone-200'
          }`}
        >
          Todas ({db.tables.length})
        </button>
        <button
          onClick={() => setFilter('FREE')}
          className={`px-4 py-2 rounded-xl font-bold border transition-all ${
            filter === 'FREE' ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-[#18181c] border-stone-800 text-stone-400 hover:text-stone-200'
          }`}
        >
          Libres (🟢)
        </button>
        <button
          onClick={() => setFilter('OCCUPIED')}
          className={`px-4 py-2 rounded-xl font-bold border transition-all ${
            filter === 'OCCUPIED' ? 'bg-amber-950/80 border-amber-800 text-amber-300' : 'bg-[#18181c] border-stone-800 text-stone-400 hover:text-stone-200'
          }`}
        >
          Ocupadas (🟡)
        </button>
        <button
          onClick={() => setFilter('PAYMENT_PENDING')}
          className={`px-4 py-2 rounded-xl font-bold border transition-all ${
            filter === 'PAYMENT_PENDING' ? 'bg-rose-950/80 border-rose-800 text-rose-300' : 'bg-[#18181c] border-stone-800 text-stone-400 hover:text-stone-200'
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
            <div
              key={t.id}
              className="bg-[#18181c] border border-stone-800/90 rounded-2xl p-5 shadow-md space-y-4 transition-all"
            >
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-xl text-stone-50 font-serif">{t.number}</h3>
                    {t.id === 'tbl-1' && (
                      <span className="text-[10px] bg-amber-500/20 border border-amber-800 text-amber-300 px-2 py-0.5 rounded font-bold">
                        MESA DEMO
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-400 font-medium">{t.zone}</span>
                </div>

                {t.status === 'FREE' && (
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-800/80">
                    Libre 🟢
                  </span>
                )}
                {t.status === 'OCCUPIED' && (
                  <span className="text-xs px-3 py-1 rounded-full bg-amber-950/60 text-amber-400 font-bold border border-amber-800/80">
                    Ocupada 🟡
                  </span>
                )}
                {t.status === 'PAYMENT_PENDING' && (
                  <span className="text-xs px-3 py-1 rounded-full bg-rose-950/60 text-rose-400 font-bold border border-rose-800/80">
                    Pago Pendiente 🔴
                  </span>
                )}
              </div>

              {/* Order Items Breakdown */}
              {order ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-[#111113] p-2.5 rounded-xl border border-stone-800">
                    <span className="text-stone-400 font-medium">Total Consumo:</span>
                    <span className="font-bold text-amber-400 text-lg font-mono">${order.total.toFixed(2)}</span>
                  </div>

                  <div className="bg-[#111113] p-3 rounded-xl border border-stone-800 space-y-2 max-h-48 overflow-y-auto">
                    {order.items.map((i) => (
                      <div key={i.id} className="flex justify-between items-center text-xs bg-[#18181c] p-2 rounded-lg border border-stone-800/60">
                        <span className="text-stone-200 font-medium truncate max-w-[140px]" title={i.productNameSnapshot}>
                          <strong className="text-amber-400 font-mono">{i.quantity}x</strong> {i.productNameSnapshot}
                        </span>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="font-mono text-stone-300 text-[11px]">${i.subtotal.toFixed(2)}</span>
                          <button
                            onClick={() => db.updateItemQuantity('rest-caracas-grill-001', order.id, i.id, -1)}
                            className="w-5 h-5 bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold rounded flex items-center justify-center text-xs transition-all border border-stone-700"
                            title="Restar 1 unidad"
                          >
                            -
                          </button>
                          <button
                            onClick={() => db.removeOrderItem('rest-caracas-grill-001', order.id, i.id)}
                            className="w-5 h-5 bg-rose-950 hover:bg-rose-900 text-rose-400 rounded flex items-center justify-center text-xs transition-all border border-rose-800"
                            title="Quitar ítem de la comanda"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic py-2">Mesa libre sin pedidos.</p>
              )}

              {/* REALTIME TEST & MANUAL ORDER BUTTONS FOR MESA 01 / ALL TABLES */}
              <div className="bg-[#111113] p-3 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-amber-400 font-semibold block">
                    ⚡ Modificación de Comanda:
                  </span>
                  <button
                    onClick={() => {
                      setShowManualModalTableId(t.id);
                      setManualTableName(t.number);
                    }}
                    className="text-[11px] bg-[#ca8a04] hover:bg-[#eab308] text-stone-950 font-bold px-3 py-1.5 rounded-lg border border-amber-600 flex items-center space-x-1 shadow-sm transition-all"
                  >
                    <span>📝 + Ítem Manual</span>
                  </button>
                </div>

                {t.id === 'tbl-1' && (
                  <button
                    onClick={handleAddBeerToMesa1}
                    className="w-full bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-300 font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar +1 Cerveza ($3.00)</span>
                  </button>
                )}
              </div>

              {/* ACTION BUTTONS: VER CUENTA & GENERAR QR */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-800">
                {qr && (
                  <button
                    onClick={() => handleOpenQrModal(qr.publicToken, t.number)}
                    className="flex-1 text-xs bg-[#ca8a04] hover:bg-[#eab308] text-stone-950 font-extrabold py-2.5 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition-all border border-amber-600"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>GENERAR QR</span>
                  </button>
                )}

                {qr && (
                  <a
                    href={`/m/${qr.publicToken}`}
                    target="_blank"
                    className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold px-3 py-2.5 rounded-xl flex items-center space-x-1 border border-stone-700"
                  >
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>VER CUENTA</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* QR GENERATOR MODAL FOR MOBILE SCANNING */}
      {previewToken && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181c] border border-stone-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center animate-in zoom-in-95">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-widest block">Customer Portal</span>
              <h3 className="font-bold text-2xl text-stone-50 font-serif mt-0.5">{previewTableName}</h3>
            </div>

            {/* QR Image */}
            {qrUrl ? (
              <div className="bg-white p-4 rounded-2xl w-64 h-64 mx-auto shadow-xl flex items-center justify-center">
                <img src={qrUrl} alt="QR Code" className="w-56 h-56 rounded-lg" />
              </div>
            ) : (
              <div className="w-64 h-64 mx-auto bg-[#111113] rounded-2xl flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
            )}

            {/* Scannable Target URL */}
            <div className="bg-[#111113] p-3 rounded-2xl border border-stone-800 space-y-1">
              <span className="text-[10px] text-stone-400 block font-medium">URL Escaneable para Teléfono Móvil:</span>
              <p className="text-xs font-mono font-bold text-amber-400 break-all select-all">
                {targetScannableUrl}
              </p>
            </div>

            {/* Action Buttons: COPIAR LINK & ABRIR PORTAL */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleCopyLink}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-stone-700 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>{copied ? '¡COPIADO!' : 'COPIAR LINK'}</span>
              </button>

              <a
                href={targetScannableUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-[#ca8a04] hover:bg-[#eab308] text-stone-950 font-extrabold py-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all border border-amber-600"
              >
                <span>ABRIR PORTAL</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <button
              onClick={() => setPreviewToken(null)}
              className="w-full text-stone-400 hover:text-white font-bold text-xs py-1"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      )}

      {/* MANUAL ITEM ADDITION MODAL FOR WAITER */}
      {showManualModalTableId && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddManualItem}
            className="bg-[#18181c] border border-stone-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-widest block">Camarero — Carga Manual</span>
              <h3 className="font-bold text-xl text-stone-50 font-serif mt-0.5">Agregar Pedido Manual a {manualTableName}</h3>
              <p className="text-xs text-stone-400 mt-1">
                Ingresa una descripción personalizada y precio para subir directamente a la cuenta de esta mesa.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Nombre o Descripción del Pedido</label>
                <input
                  type="text"
                  placeholder="Ej: Ración de Tequeños con salsa, Extra queso..."
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
                    placeholder="Ej: 6.50"
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
                onClick={() => setShowManualModalTableId(null)}
                className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-3 rounded-xl text-xs transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#ca8a04] hover:bg-[#eab308] text-stone-950 font-extrabold py-3 rounded-xl text-xs shadow-md transition-all border border-amber-600"
              >
                SUBIR A LA CUENTA
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
