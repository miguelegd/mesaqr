'use client';

import React, { useState, useEffect } from 'react';
import { useMesaQRStore } from '@/lib/store/useMesaQRStore';
import { Layers, QrCode, Plus, Copy, ExternalLink, Check, RefreshCw, Smartphone, Eye } from 'lucide-react';
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
        color: { dark: '#090d16', light: '#ffffff' },
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

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-3">
            <Layers className="w-7 h-7 text-amber-400" />
            <span>Gestión de Mesas & Generación de QR Escaneable</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Genera QRs reales conectados a la IP local para probar con tu teléfono móvil en la misma red Wi-Fi
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs flex items-center space-x-2">
            <span className="text-slate-400">IP Detectada:</span>
            <span className="font-mono text-emerald-400 font-bold">{detectedIp}:3000</span>
          </div>
        </div>
      </div>

      {/* Network Configuration Helper */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs space-y-2 text-slate-200">
        <div className="flex items-center space-x-2 text-amber-400 font-bold">
          <Smartphone className="w-4 h-4" />
          <span>Configuración de Acceso desde Teléfono Móvil</span>
        </div>
        <p className="text-slate-300">
          Para escanear desde tu teléfono real, asegúrate de estar conectado a la **misma red Wi-Fi**. Si la IP detectada arriba es distinta, ingresa la IP local de tu ordenador aquí:
        </p>
        <div className="flex items-center space-x-2 max-w-sm">
          <input
            type="text"
            placeholder={`Ej: ${detectedIp}`}
            value={customHost}
            onChange={(e) => setCustomHost(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white w-full focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-2 rounded-xl font-bold border ${
            filter === 'ALL' ? 'bg-slate-800 border-amber-500 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          Todas ({db.tables.length})
        </button>
        <button
          onClick={() => setFilter('FREE')}
          className={`px-3.5 py-2 rounded-xl font-bold border ${
            filter === 'FREE' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          Libres (🟢)
        </button>
        <button
          onClick={() => setFilter('OCCUPIED')}
          className={`px-3.5 py-2 rounded-xl font-bold border ${
            filter === 'OCCUPIED' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          Ocupadas (🟡)
        </button>
        <button
          onClick={() => setFilter('PAYMENT_PENDING')}
          className={`px-3.5 py-2 rounded-xl font-bold border ${
            filter === 'PAYMENT_PENDING' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-400'
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
              className={`bg-slate-900 border rounded-2xl p-5 shadow-xl space-y-4 transition-all ${
                t.id === 'tbl-1' ? 'border-amber-500/80 ring-1 ring-amber-500/40' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-xl text-white">{t.number}</h3>
                    {t.id === 'tbl-1' && (
                      <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-extrabold">
                        MESA DE PRUEBA
                      </span>
                    )}
                  </div>
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

              {/* Order Items Breakdown */}
              {order ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-semibold">Total Consumo:</span>
                    <span className="font-extrabold text-amber-400 text-lg font-mono">${order.total.toFixed(2)}</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 max-h-40 overflow-y-auto">
                    {order.items.map((i) => (
                      <div key={i.id} className="flex justify-between text-xs">
                        <span className="text-slate-200 font-medium">
                          <strong className="text-amber-400">{i.quantity}x</strong> {i.productNameSnapshot}
                        </span>
                        <span className="font-mono text-slate-400">${i.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">Mesa libre sin pedidos.</p>
              )}

              {/* REALTIME TEST BUTTON FOR MESA 01 */}
              {t.id === 'tbl-1' && order && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] text-amber-400 font-bold block">
                    ⚡ Prueba de Actualización en Tiempo Real:
                  </span>
                  <button
                    onClick={handleAddBeerToMesa1}
                    className="w-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar +1 Cerveza ($3.00)</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center">
                    Haz clic aquí en tu PC y observa como tu teléfono se actualiza de $32.00 a $35.00 sin refrescar la página.
                  </p>
                </div>
              )}

              {/* ACTION BUTTONS: VER CUENTA & GENERAR QR */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
                {qr && (
                  <button
                    onClick={() => handleOpenQrModal(qr.publicToken, t.number)}
                    className="flex-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2.5 rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>GENERAR QR</span>
                  </button>
                )}

                {qr && (
                  <a
                    href={`/m/${qr.publicToken}`}
                    target="_blank"
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2.5 rounded-xl flex items-center space-x-1 border border-slate-700"
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
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center animate-in zoom-in-95">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-widest block">Customer Portal</span>
              <h3 className="font-black text-2xl text-white mt-0.5">{previewTableName}</h3>
            </div>

            {/* QR Image */}
            {qrUrl ? (
              <div className="bg-white p-4 rounded-2xl w-64 h-64 mx-auto shadow-2xl flex items-center justify-center">
                <img src={qrUrl} alt="QR Code" className="w-56 h-56 rounded-lg" />
              </div>
            ) : (
              <div className="w-64 h-64 mx-auto bg-slate-950 rounded-2xl flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
            )}

            {/* Scannable Target URL */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">URL Escaneable para Teléfono Móvil:</span>
              <p className="text-xs font-mono font-bold text-amber-300 break-all select-all">
                {targetScannableUrl}
              </p>
            </div>

            {/* Action Buttons: COPIAR LINK & ABRIR PORTAL */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleCopyLink}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-slate-700 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>{copied ? '¡COPIADO!' : 'COPIAR LINK'}</span>
              </button>

              <a
                href={targetScannableUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/20 transition-all"
              >
                <span>ABRIR PORTAL</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <button
              onClick={() => setPreviewToken(null)}
              className="w-full text-slate-400 hover:text-white font-bold text-xs py-1"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
