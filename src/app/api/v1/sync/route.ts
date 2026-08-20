import { NextRequest, NextResponse } from 'next/server';

// Server-side shared state across requests on the same Node instance / Vercel container
interface GlobalServerStore {
  sessions: Record<string, any>;
  orders: Record<string, any>;
  version: number;
}

const g = globalThis as unknown as { __mesaqr_store?: GlobalServerStore };

if (!g.__mesaqr_store) {
  g.__mesaqr_store = {
    sessions: {},
    orders: {
      'tbl-1': {
        orderId: 'ORD-000101',
        tableId: 'tbl-1',
        tableNumber: 'Mesa 01',
        total: 32.0,
        subtotal: 32.0,
        tax: 0.0,
        status: 'CONFIRMED',
        items: [
          { id: 'i1', productName: 'Hamburguesa clásica', quantity: 2, unitPrice: 10.0, subtotal: 20.0 },
          { id: 'i2', productName: 'Papas fritas rugosas', quantity: 1, unitPrice: 4.5, subtotal: 4.5 },
          { id: 'i3', productName: 'Coca-Cola 350ml', quantity: 2, unitPrice: 2.25, subtotal: 4.5 },
          { id: 'i4', productName: 'Cerveza Zulia 330ml', quantity: 1, unitPrice: 3.0, subtotal: 3.0 },
        ],
        updatedAt: new Date().toISOString(),
      },
    },
    version: 1,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') || 'token-demo-mesa-1';
  const tableId = searchParams.get('tableId') || (token.includes('mesa-2') || token.includes('tbl-2') ? 'tbl-2' : 'tbl-1');

  const store = g.__mesaqr_store!;
  const activeOrder = store.orders[tableId];

  return NextResponse.json({
    success: true,
    version: store.version,
    tableId,
    order: activeOrder || null,
    serverTime: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = g.__mesaqr_store!;

    const tableId = body.tableId || 'tbl-1';

    if (body.action === 'UPDATE_ORDER' && body.order) {
      store.orders[tableId] = {
        ...body.order,
        updatedAt: new Date().toISOString(),
      };
      store.version += 1;
    } else if (body.action === 'ADD_ITEM' && body.item) {
      const currentOrder = store.orders[tableId] || {
        orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        tableId,
        tableNumber: tableId === 'tbl-1' ? 'Mesa 01' : 'Mesa 02',
        total: 0,
        subtotal: 0,
        tax: 0,
        status: 'CONFIRMED',
        items: [],
      };

      const existingIndex = currentOrder.items.findIndex(
        (i: any) => i.productName === body.item.productName
      );

      if (existingIndex >= 0) {
        currentOrder.items[existingIndex].quantity += body.item.quantity || 1;
        currentOrder.items[existingIndex].subtotal = Number(
          (currentOrder.items[existingIndex].quantity * currentOrder.items[existingIndex].unitPrice).toFixed(2)
        );
      } else {
        currentOrder.items.push({
          id: `item-${Date.now()}`,
          productName: body.item.productName,
          quantity: body.item.quantity || 1,
          unitPrice: body.item.unitPrice || 0,
          subtotal: Number(((body.item.quantity || 1) * (body.item.unitPrice || 0)).toFixed(2)),
        });
      }

      const newSubtotal = currentOrder.items.reduce((sum: number, i: any) => sum + i.subtotal, 0);
      currentOrder.subtotal = Number(newSubtotal.toFixed(2));
      currentOrder.tax = 0;
      currentOrder.total = Number(newSubtotal.toFixed(2));
      currentOrder.updatedAt = new Date().toISOString();

      store.orders[tableId] = currentOrder;
      store.version += 1;
    }

    return NextResponse.json({
      success: true,
      version: store.version,
      order: store.orders[tableId],
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
