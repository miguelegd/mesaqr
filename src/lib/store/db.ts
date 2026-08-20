import {
  Restaurant,
  User,
  Table,
  QRCodeData,
  TableSession,
  Category,
  Product,
  Order,
  OrderItem,
  Payment,
  PaymentProof,
  ProductMapping,
  SyncEvent,
  AuditLog,
  PaymentMethod
} from '../types';
import { mockPOSAdapter } from '../pos/mockAdapter';

export const DEMO_RESTAURANT_ID = 'rest-caracas-grill-001';
const STORAGE_KEY = 'mesaqr_db_state_v2';

type EventCallback = (eventType: string, payload: unknown) => void;

let broadcastBus: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastBus = new BroadcastChannel('mesaqr_realtime_channel');
  } catch (e) {
    console.warn('BroadcastChannel error:', e);
  }
}

class MesaQRDatabase {
  private listeners: Set<EventCallback> = new Set();

  restaurants: Restaurant[] = [];
  users: User[] = [];
  tables: Table[] = [];
  qrCodes: QRCodeData[] = [];
  tableSessions: TableSession[] = [];
  categories: Category[] = [];
  products: Product[] = [];
  orders: Order[] = [];
  payments: Payment[] = [];
  paymentProofs: PaymentProof[] = [];
  productMappings: ProductMapping[] = [];
  syncEvents: SyncEvent[] = [];
  auditLogs: AuditLog[] = [];

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.loadFromParsedData(parsed);
        } catch (e) {
          this.seedDemoData();
          this.saveToStorage();
        }
      } else {
        this.seedDemoData();
        this.saveToStorage();
      }

      if (broadcastBus) {
        broadcastBus.onmessage = (event) => {
          this.reloadFromStorage();
          this.listeners.forEach((cb) => cb(event.data?.eventType || 'SYNC', event.data?.payload));
        };
      }

      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
          this.reloadFromStorage();
          this.listeners.forEach((cb) => cb('STORAGE_SYNC', null));
        }
      });
    } else {
      this.seedDemoData();
    }
  }

  reloadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.loadFromParsedData(parsed);
      }
    } catch (e) {
      console.error('Error reloading state:', e);
    }
  }

  private loadFromParsedData(parsed: Record<string, unknown>) {
    if (Array.isArray(parsed.restaurants)) this.restaurants = parsed.restaurants as Restaurant[];
    if (Array.isArray(parsed.users)) this.users = parsed.users as User[];
    if (Array.isArray(parsed.tables)) this.tables = parsed.tables as Table[];
    if (Array.isArray(parsed.qrCodes)) this.qrCodes = parsed.qrCodes as QRCodeData[];
    if (Array.isArray(parsed.tableSessions)) this.tableSessions = parsed.tableSessions as TableSession[];
    if (Array.isArray(parsed.categories)) this.categories = parsed.categories as Category[];
    if (Array.isArray(parsed.products)) this.products = parsed.products as Product[];
    if (Array.isArray(parsed.orders)) this.orders = parsed.orders as Order[];
    if (Array.isArray(parsed.payments)) this.payments = parsed.payments as Payment[];
    if (Array.isArray(parsed.paymentProofs)) this.paymentProofs = parsed.paymentProofs as PaymentProof[];
    if (Array.isArray(parsed.productMappings)) this.productMappings = parsed.productMappings as ProductMapping[];
    if (Array.isArray(parsed.syncEvents)) this.syncEvents = parsed.syncEvents as SyncEvent[];
    if (Array.isArray(parsed.auditLogs)) this.auditLogs = parsed.auditLogs as AuditLog[];
  }

  saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const data = {
        restaurants: this.restaurants,
        users: this.users,
        tables: this.tables,
        qrCodes: this.qrCodes,
        tableSessions: this.tableSessions,
        categories: this.categories,
        products: this.products,
        orders: this.orders,
        payments: this.payments,
        paymentProofs: this.paymentProofs,
        productMappings: this.productMappings,
        syncEvents: this.syncEvents,
        auditLogs: this.auditLogs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }

  resetToDemoData() {
    this.seedDemoData();
    this.saveToStorage();
    this.notify('DEMO_RESET', null);
  }

  subscribe(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(eventType: string, payload: unknown) {
    this.saveToStorage();

    // Push update to server endpoint for cross-device synchronization over Internet / 4G
    if (typeof window !== 'undefined' && eventType === 'ORDER_UPDATED' && payload) {
      try {
        const order = payload as Order;
        const tableSession = this.tableSessions.find((s) => s.id === order.tableSessionId);
        fetch('/api/v1/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'UPDATE_ORDER',
            tableId: tableSession?.tableId || 'tbl-1',
            order: {
              orderId: order.id,
              tableId: tableSession?.tableId || 'tbl-1',
              tableNumber: order.tableNumber,
              total: order.total,
              subtotal: order.subtotal,
              tax: order.tax,
              status: order.status,
              items: order.items.map((i) => ({
                id: i.id,
                productName: i.productNameSnapshot,
                quantity: i.quantity,
                unitPrice: i.unitPriceSnapshot,
                subtotal: i.subtotal,
              })),
            },
          }),
        }).catch(() => {});
      } catch (e) {
        // ignore
      }
    }

    if (broadcastBus) {
      try {
        broadcastBus.postMessage({ eventType, payload, ts: Date.now() });
      } catch (e) {
        // ignore
      }
    }
    this.listeners.forEach((cb) => cb(eventType, payload));
  }

  private seedDemoData() {
    const rId = DEMO_RESTAURANT_ID;

    // 1. Restaurant
    this.restaurants = [
      {
        id: rId,
        name: 'Restaurante Demo',
        slug: 'restaurante-demo',
        currency: 'USD',
        currencySymbol: '$',
        taxRate: 0.0, // Set tax to 0.0 for Mesa 01 exact subtotal = total match ($32.00) as requested by user
        bankDetails: {
          bankName: 'Banesco (0134)',
          accountHolder: 'Restaurante Demo C.A.',
          taxId: 'J-30948271-0',
          accountNumber: '0134-0123-45-1234567890',
          phone: '0412-5551234',
        },
        binanceDetails: {
          payId: '298374102',
          merchantName: 'RestauranteDemoPay',
        },
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    // 2. Users
    this.users = [
      {
        id: 'usr-admin-01',
        restaurantId: rId,
        name: 'Administrador General',
        email: 'admin@demo.com',
        role: 'ADMIN',
        isActive: true,
      },
      {
        id: 'usr-waiter-carlos',
        restaurantId: rId,
        name: 'Carlos Mendoza',
        email: 'carlos@demo.com',
        role: 'WAITER',
        isActive: true,
      },
      {
        id: 'usr-cashier-maria',
        restaurantId: rId,
        name: 'María Rodríguez',
        email: 'maria@demo.com',
        role: 'CASHIER',
        isActive: true,
      },
    ];

    // 3. Tables & QRs
    const tableConfigs = [
      { id: 'tbl-1', number: 'Mesa 01', zone: 'Terraza Principal', capacity: 4, token: 'token-demo-mesa-1' },
      { id: 'tbl-2', number: 'Mesa 02', zone: 'Terraza', capacity: 2, token: 'token-demo-mesa-2' },
      { id: 'tbl-3', number: 'Mesa 03', zone: 'Comedor', capacity: 6, token: 'token-demo-mesa-3' },
      { id: 'tbl-4', number: 'Mesa 04', zone: 'VIP', capacity: 4, token: 'token-demo-mesa-4' },
      { id: 'tbl-5', number: 'Mesa 05', zone: 'Bar', capacity: 2, token: 'token-demo-mesa-5' },
    ];

    this.tables = tableConfigs.map((t) => ({
      id: t.id,
      restaurantId: rId,
      number: t.number,
      zone: t.zone,
      capacity: t.capacity,
      status: t.id === 'tbl-1' ? 'OCCUPIED' : t.id === 'tbl-3' ? 'PAYMENT_PENDING' : 'FREE',
    }));

    this.qrCodes = tableConfigs.map((t) => ({
      id: `qr-${t.id}`,
      restaurantId: rId,
      tableId: t.id,
      publicToken: t.token,
      createdAt: new Date().toISOString(),
    }));

    // 4. Categories
    this.categories = [
      { id: 'cat-hamb', restaurantId: rId, name: 'Hamburguesas', icon: '🍔', sortOrder: 1 },
      { id: 'cat-papas', restaurantId: rId, name: 'Acompañantes', icon: '🍟', sortOrder: 2 },
      { id: 'cat-beb', restaurantId: rId, name: 'Bebidas', icon: '🍺', sortOrder: 3 },
      { id: 'cat-pizz', restaurantId: rId, name: 'Pizzas', icon: '🍕', sortOrder: 4 },
    ];

    // 5. Products (With Exact Prices from User Prompt)
    this.products = [
      {
        id: 'prod-hamb-1',
        restaurantId: rId,
        categoryId: 'cat-hamb',
        name: 'Hamburguesa clásica',
        sku: 'HAM-001',
        description: 'Carne de res 180g, queso cheddar, lechuga y tomate',
        price: 10.0,
        taxRate: 0.0,
        isAvailable: true,
      },
      {
        id: 'prod-papas-1',
        restaurantId: rId,
        categoryId: 'cat-papas',
        name: 'Papas fritas',
        sku: 'PAP-001',
        description: 'Papas fritas crujientes con sal marina',
        price: 5.0,
        taxRate: 0.0,
        isAvailable: true,
      },
      {
        id: 'prod-beb-1',
        restaurantId: rId,
        categoryId: 'cat-beb',
        name: 'Cerveza',
        sku: 'BEB-001',
        description: 'Cerveza Pilsen 330ml helada',
        price: 3.0,
        taxRate: 0.0,
        isAvailable: true,
      },
      {
        id: 'prod-beb-2',
        restaurantId: rId,
        categoryId: 'cat-beb',
        name: 'Coca-Cola',
        sku: 'BEB-002',
        description: 'Refresco Coca-Cola 500ml',
        price: 2.0,
        taxRate: 0.0,
        isAvailable: true,
      },
    ];

    // 6. Product Mappings
    this.productMappings = [
      {
        id: 'map-1',
        restaurantId: rId,
        productId: 'prod-hamb-1',
        posAdapterId: 'mock-pos',
        externalProductId: 'POS-PROD-001',
        externalSku: 'HAMB-CLAS-01',
        mappedAt: new Date().toISOString(),
      },
      {
        id: 'map-2',
        restaurantId: rId,
        productId: 'prod-beb-1',
        posAdapterId: 'mock-pos',
        externalProductId: 'POS-PROD-002',
        externalSku: 'CERV-PILS-330',
        mappedAt: new Date().toISOString(),
      },
    ];

    // 7. Seed ACTIVE Session for MESA 01 (tbl-1)
    const session1Id = 'sess-tbl-1-demo';
    this.tableSessions.push({
      id: session1Id,
      restaurantId: rId,
      tableId: 'tbl-1',
      waiterId: 'usr-waiter-carlos',
      waiterName: 'Carlos Mendoza',
      status: 'OPEN',
      openedAt: new Date(Date.now() - 3600000).toISOString(),
    });

    // Exact Items for Mesa 01 requested by user:
    // 2x Hamburguesa clásica ($20.00)
    // 1x Papas fritas ($5.00)
    // 2x Coca-Cola ($4.00)
    // 1x Cerveza ($3.00)
    // Subtotal = $32.00, Total = $32.00
    const order1Id = 'ORD-000101';
    const items1: OrderItem[] = [
      {
        id: 'item-m1-1',
        orderId: order1Id,
        productId: 'prod-hamb-1',
        productNameSnapshot: 'Hamburguesa clásica',
        skuSnapshot: 'HAM-001',
        quantity: 2,
        unitPriceSnapshot: 10.0,
        taxSnapshot: 0.0,
        discount: 0,
        subtotal: 20.0,
      },
      {
        id: 'item-m1-2',
        orderId: order1Id,
        productId: 'prod-papas-1',
        productNameSnapshot: 'Papas fritas',
        skuSnapshot: 'PAP-001',
        quantity: 1,
        unitPriceSnapshot: 5.0,
        taxSnapshot: 0.0,
        discount: 0,
        subtotal: 5.0,
      },
      {
        id: 'item-m1-3',
        orderId: order1Id,
        productId: 'prod-beb-2',
        productNameSnapshot: 'Coca-Cola',
        skuSnapshot: 'BEB-002',
        quantity: 2,
        unitPriceSnapshot: 2.0,
        taxSnapshot: 0.0,
        discount: 0,
        subtotal: 4.0,
      },
      {
        id: 'item-m1-4',
        orderId: order1Id,
        productId: 'prod-beb-1',
        productNameSnapshot: 'Cerveza',
        skuSnapshot: 'BEB-001',
        quantity: 1,
        unitPriceSnapshot: 3.0,
        taxSnapshot: 0.0,
        discount: 0,
        subtotal: 3.0,
      },
    ];

    const sub1 = 32.0;
    const tot1 = 32.0;

    this.orders.push({
      id: order1Id,
      restaurantId: rId,
      tableSessionId: session1Id,
      waiterId: 'usr-waiter-carlos',
      waiterName: 'Carlos Mendoza',
      tableNumber: 'Mesa 01',
      status: 'CONFIRMED',
      syncStatus: 'SYNCED',
      posOrderId: 'POS-991001',
      subtotal: sub1,
      tax: 0,
      discount: 0,
      tip: 0,
      total: tot1,
      idempotencyKey: 'idemp-demo-m1',
      version: 1,
      createdAt: new Date(Date.now() - 3500000).toISOString(),
      updatedAt: new Date(Date.now() - 3500000).toISOString(),
      items: items1,
    });

    // Session for Mesa 03 (Pago Pendiente)
    const session3Id = 'sess-tbl-3-demo';
    this.tableSessions.push({
      id: session3Id,
      restaurantId: rId,
      tableId: 'tbl-3',
      waiterId: 'usr-waiter-carlos',
      waiterName: 'Carlos Mendoza',
      status: 'PAYMENT_PROCESSING',
      openedAt: new Date(Date.now() - 5400000).toISOString(),
    });

    const order3Id = 'ORD-000103';
    const items3: OrderItem[] = [
      {
        id: 'item-m3-1',
        orderId: order3Id,
        productId: 'prod-hamb-1',
        productNameSnapshot: 'Hamburguesa clásica',
        skuSnapshot: 'HAM-001',
        quantity: 2,
        unitPriceSnapshot: 10.0,
        taxSnapshot: 0.0,
        discount: 0,
        subtotal: 20.0,
      },
    ];

    this.orders.push({
      id: order3Id,
      restaurantId: rId,
      tableSessionId: session3Id,
      waiterId: 'usr-waiter-carlos',
      waiterName: 'Carlos Mendoza',
      tableNumber: 'Mesa 03',
      status: 'CONFIRMED',
      syncStatus: 'SYNC_ERROR',
      subtotal: 20.0,
      tax: 0,
      discount: 0,
      tip: 0,
      total: 20.0,
      idempotencyKey: 'idemp-demo-m3',
      version: 1,
      createdAt: new Date(Date.now() - 5000000).toISOString(),
      updatedAt: new Date(Date.now() - 5000000).toISOString(),
      items: items3,
    });

    const payment3Id = 'pay-demo-m3';
    this.payments.push({
      id: payment3Id,
      restaurantId: rId,
      tableSessionId: session3Id,
      tableNumber: 'Mesa 03',
      method: 'PAGO_MOVIL',
      status: 'PROCESSING',
      amount: 20.0,
      currency: 'USD',
      referenceNumber: '098124',
      createdAt: new Date(Date.now() - 600000).toISOString(),
      proof: {
        id: 'proof-demo-m3',
        paymentId: payment3Id,
        proofUrl: 'https://placehold.co/600x800/2b2b36/ffffff.png?text=Comprobante+Pago+Movil+Ref+098124',
        fileName: 'comprobante_banco_098124.jpg',
        status: 'UNDER_REVIEW',
        uploadedAt: new Date(Date.now() - 600000).toISOString(),
      },
    });

    this.logAudit(rId, 'usr-admin-01', 'ADMIN', 'Administrador General', 'SYSTEM', rId, 'SYSTEM_INIT', {
      message: 'MesaQR inicializado con datos de prueba para Mesa 01',
    });
  }

  logAudit(
    restaurantId: string,
    userId: string | undefined,
    userRole: string | undefined,
    userName: string | undefined,
    entityType: string,
    entityId: string,
    action: string,
    details: Record<string, unknown>
  ) {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      restaurantId,
      userId,
      userRole,
      userName,
      entityType,
      entityId,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    this.notify('AUDIT_LOGGED', log);
  }

  getQRCodeByToken(token: string): QRCodeData | undefined {
    return this.qrCodes.find((q) => q.publicToken === token);
  }

  getTableById(id: string): Table | undefined {
    return this.tables.find((t) => t.id === id);
  }

  getOrCreateActiveSession(restaurantId: string, tableId: string, waiterId?: string, waiterName?: string): TableSession {
    let session = this.tableSessions.find(
      (s) => s.tableId === tableId && (s.status === 'OPEN' || s.status === 'PAYMENT_PENDING' || s.status === 'PAYMENT_PROCESSING')
    );

    if (!session) {
      session = {
        id: `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        restaurantId,
        tableId,
        waiterId: waiterId || 'usr-waiter-carlos',
        waiterName: waiterName || 'Carlos Mendoza',
        status: 'OPEN',
        openedAt: new Date().toISOString(),
      };
      this.tableSessions.push(session);

      const table = this.tables.find((t) => t.id === tableId);
      if (table) table.status = 'OCCUPIED';

      this.logAudit(restaurantId, waiterId, 'WAITER', waiterName, 'TABLE_SESSION', session.id, 'SESSION_CREATED', {
        tableId,
      });
      this.notify('SESSION_UPDATED', session);
      if (table) this.notify('TABLE_UPDATED', table);
    }

    return session;
  }

  createOrUpdateOrder(
    restaurantId: string,
    tableSessionId: string,
    waiterId: string,
    waiterName: string,
    itemsInput: Array<{ productId?: string; customName?: string; customPrice?: number; quantity: number }>,
    idempotencyKey?: string
  ): { order: Order; isDuplicate: boolean } {
    if (idempotencyKey) {
      const existing = this.orders.find((o) => o.idempotencyKey === idempotencyKey);
      if (existing) return { order: existing, isDuplicate: true };
    }

    const session = this.tableSessions.find((s) => s.id === tableSessionId);
    if (!session) throw new Error('Sesión de mesa no encontrada');
    if (session.status === 'PAID' || session.status === 'CLOSED') {
      throw new Error('No se pueden añadir productos a una cuenta ya cerrada');
    }

    const table = this.tables.find((t) => t.id === session.tableId);
    const tableNumber = table ? table.number : 'Mesa Desconocida';

    let order = this.orders.find((o) => o.tableSessionId === tableSessionId && o.status !== 'CLOSED' && o.status !== 'CANCELLED');

    if (!order) {
      const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      order = {
        id: orderId,
        restaurantId,
        tableSessionId,
        waiterId,
        waiterName,
        tableNumber,
        status: 'CONFIRMED',
        syncStatus: 'NOT_SYNCED',
        subtotal: 0,
        tax: 0,
        discount: 0,
        tip: 0,
        total: 0,
        idempotencyKey,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
      };
      this.orders.push(order);
      this.logAudit(restaurantId, waiterId, 'WAITER', waiterName, 'ORDER', order.id, 'ORDER_CREATED', {
        tableSessionId,
        tableNumber,
      });
    } else {
      order.version += 1;
      order.updatedAt = new Date().toISOString();
    }

    const restaurant = this.restaurants.find((r) => r.id === restaurantId);
    const taxRate = restaurant ? restaurant.taxRate : 0.0;

    for (const input of itemsInput) {
      let prodName = '';
      let prodSku = 'MANUAL';
      let prodPrice = 0;
      let targetProductId = input.productId || `prod-custom-${Date.now()}`;

      if (input.productId) {
        const prod = this.products.find((p) => p.id === input.productId);
        if (prod) {
          prodName = prod.name;
          prodSku = prod.sku;
          prodPrice = prod.price;
        }
      }

      if (input.customName && input.customPrice !== undefined) {
        prodName = input.customName;
        prodPrice = input.customPrice;
        prodSku = 'MANUAL';
        targetProductId = `prod-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }

      if (!prodName) continue;

      const existingItem = order.items.find(
        (i) => i.productId === targetProductId || (input.customName && i.productNameSnapshot === input.customName)
      );

      if (existingItem) {
        existingItem.quantity += input.quantity;
        if (existingItem.quantity <= 0) {
          order.items = order.items.filter((i) => i.id !== existingItem.id);
          this.logAudit(restaurantId, waiterId, 'WAITER', waiterName, 'ORDER_ITEM', existingItem.id, 'ITEM_REMOVED', {
            productName: prodName,
          });
        } else {
          existingItem.subtotal = Number((existingItem.quantity * existingItem.unitPriceSnapshot).toFixed(2));
          this.logAudit(restaurantId, waiterId, 'WAITER', waiterName, 'ORDER_ITEM', existingItem.id, 'ITEM_UPDATED', {
            productName: prodName,
            newQuantity: existingItem.quantity,
          });
        }
      } else if (input.quantity > 0) {
        const newItem: OrderItem = {
          id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          orderId: order.id,
          productId: targetProductId,
          productNameSnapshot: prodName,
          skuSnapshot: prodSku,
          quantity: input.quantity,
          unitPriceSnapshot: prodPrice,
          taxSnapshot: taxRate,
          discount: 0,
          subtotal: Number((prodPrice * input.quantity).toFixed(2)),
        };
        order.items.push(newItem);
        this.logAudit(restaurantId, waiterId, 'WAITER', waiterName, 'ORDER_ITEM', newItem.id, 'ITEM_ADDED', {
          productName: prodName,
          quantity: input.quantity,
          unitPrice: prodPrice,
        });
      }
    }

    const subtotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = Number((subtotal * taxRate).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    order.subtotal = Number(subtotal.toFixed(2));
    order.tax = tax;
    order.total = total;

    this.notify('ORDER_UPDATED', order);
    this.notify('SESSION_UPDATED', session);

    this.triggerPOSSync(order.id);

    return { order, isDuplicate: false };
  }

  async triggerPOSSync(orderId: string): Promise<SyncEvent> {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Orden no encontrada');

    order.syncStatus = 'SYNCING';
    this.notify('ORDER_UPDATED', order);

    const mappedItems = order.items.map((item) => {
      const mapping = this.productMappings.find((m) => m.productId === item.productId);
      return {
        externalProductId: mapping?.externalProductId,
        sku: mapping?.externalSku || item.skuSnapshot,
        productName: item.productNameSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPriceSnapshot,
        subtotal: item.subtotal,
      };
    });

    const payload = {
      mesaQrOrderId: order.id,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      items: mappedItems,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      currency: 'USD',
    };

    const response = await mockPOSAdapter.createOrder(payload);

    const syncEvent: SyncEvent = {
      id: `sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      restaurantId: order.restaurantId,
      orderId: order.id,
      adapterName: mockPOSAdapter.name,
      status: response.success ? 'SUCCESS' : 'ERROR',
      payloadSent: payload,
      responseReceived: response.rawResponse,
      errorMessage: response.errorMessage,
      retryCount: 1,
      createdAt: new Date().toISOString(),
    };

    this.syncEvents.unshift(syncEvent);

    if (response.success) {
      order.syncStatus = 'SYNCED';
      order.posOrderId = response.posOrderId;
    } else {
      order.syncStatus = 'SYNC_ERROR';
    }

    this.notify('ORDER_UPDATED', order);
    this.notify('SYNC_EVENT_ADDED', syncEvent);

    return syncEvent;
  }

  requestCloseAccount(tableSessionId: string, requestedBy: string = 'CLIENT'): TableSession {
    const session = this.tableSessions.find((s) => s.id === tableSessionId);
    if (!session) throw new Error('Sesión de mesa no encontrada');

    session.status = 'PAYMENT_PENDING';
    const table = this.tables.find((t) => t.id === session.tableId);
    if (table) table.status = 'PAYMENT_PENDING';

    this.logAudit(session.restaurantId, undefined, requestedBy, requestedBy, 'TABLE_SESSION', session.id, 'ORDER_CLOSED', {
      message: 'Cierre de cuenta solicitado',
    });

    this.notify('SESSION_UPDATED', session);
    if (table) this.notify('TABLE_UPDATED', table);

    return session;
  }

  reopenAccount(tableSessionId: string, userId: string, userName: string): TableSession {
    const session = this.tableSessions.find((s) => s.id === tableSessionId);
    if (!session) throw new Error('Sesión de mesa no encontrada');

    session.status = 'OPEN';
    const table = this.tables.find((t) => t.id === session.tableId);
    if (table) table.status = 'OCCUPIED';

    this.logAudit(session.restaurantId, userId, 'ADMIN/WAITER', userName, 'TABLE_SESSION', session.id, 'ORDER_REOPENED', {
      reason: 'Reapertura manual de cuenta auditada',
    });

    this.notify('SESSION_UPDATED', session);
    if (table) this.notify('TABLE_UPDATED', table);

    return session;
  }

  createPayment(
    restaurantId: string,
    tableSessionId: string,
    method: PaymentMethod,
    amount: number,
    referenceNumber?: string,
    idempotencyKey?: string
  ): Payment {
    if (idempotencyKey) {
      const existing = this.payments.find((p) => p.idempotencyKey === idempotencyKey);
      if (existing) return existing;
    }

    const session = this.tableSessions.find((s) => s.id === tableSessionId);
    if (!session) throw new Error('Sesión de mesa no encontrada');

    const table = this.tables.find((t) => t.id === session.tableId);

    const payment: Payment = {
      id: `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      restaurantId,
      tableSessionId,
      tableNumber: table ? table.number : 'Mesa',
      method,
      status: method === 'BANK_TRANSFER' || method === 'PAGO_MOVIL' ? 'PENDING' : 'CREATED',
      amount,
      currency: 'USD',
      referenceNumber,
      idempotencyKey,
      createdAt: new Date().toISOString(),
    };

    this.payments.unshift(payment);
    session.status = 'PAYMENT_PROCESSING';

    this.logAudit(restaurantId, undefined, 'CLIENT', 'Cliente', 'PAYMENT', payment.id, 'PAYMENT_CREATED', {
      method,
      amount,
      referenceNumber,
    });

    this.notify('PAYMENT_UPDATED', payment);
    this.notify('SESSION_UPDATED', session);

    return payment;
  }

  uploadPaymentProof(paymentId: string, proofUrl: string, fileName: string): PaymentProof {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Pago no encontrado');

    const proof: PaymentProof = {
      id: `proof-${Date.now()}`,
      paymentId,
      proofUrl,
      fileName,
      status: 'UNDER_REVIEW',
      uploadedAt: new Date().toISOString(),
    };

    payment.proof = proof;
    payment.status = 'PROCESSING';
    this.paymentProofs.unshift(proof);

    this.logAudit(payment.restaurantId, undefined, 'CLIENT', 'Cliente', 'PAYMENT_PROOF', proof.id, 'PAYMENT_PROOF_UPLOADED', {
      paymentId,
      fileName,
    });

    this.notify('PAYMENT_UPDATED', payment);
    this.notify('PROOF_UPDATED', proof);

    return proof;
  }

  approvePayment(paymentId: string, userId: string, userName: string): Payment {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Pago no encontrado');

    payment.status = 'CONFIRMED';
    if (payment.proof) payment.proof.status = 'APPROVED';

    const session = this.tableSessions.find((s) => s.id === payment.tableSessionId);
    if (session) {
      session.status = 'CLOSED';
      session.closedAt = new Date().toISOString();

      const table = this.tables.find((t) => t.id === session.tableId);
      if (table) table.status = 'FREE';

      const order = this.orders.find((o) => o.tableSessionId === session.id);
      if (order) order.status = 'CLOSED';

      this.notify('SESSION_UPDATED', session);
      if (table) this.notify('TABLE_UPDATED', table);
    }

    this.logAudit(payment.restaurantId, userId, 'CASHIER', userName, 'PAYMENT', payment.id, 'PAYMENT_APPROVED', {
      amount: payment.amount,
      method: payment.method,
    });

    this.notify('PAYMENT_UPDATED', payment);

    return payment;
  }

  rejectPayment(paymentId: string, userId: string, userName: string, reason: string): Payment {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Pago no encontrado');

    payment.status = 'FAILED';
    if (payment.proof) {
      payment.proof.status = 'REJECTED';
      payment.proof.rejectionReason = reason;
    }

    const session = this.tableSessions.find((s) => s.id === payment.tableSessionId);
    if (session) {
      session.status = 'PAYMENT_PENDING';
      this.notify('SESSION_UPDATED', session);
    }

    this.logAudit(payment.restaurantId, userId, 'CASHIER', userName, 'PAYMENT', payment.id, 'PAYMENT_REJECTED', {
      reason,
    });

    this.notify('PAYMENT_UPDATED', payment);

    return payment;
  }

  createProduct(productInput: Omit<Product, 'id'>): Product {
    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...productInput,
    };
    this.products.push(newProduct);
    this.notify('CATALOG_UPDATED', newProduct);
    return newProduct;
  }

  createTable(tableInput: Omit<Table, 'id' | 'status'>): { table: Table; qr: QRCodeData } {
    const id = `tbl-${Date.now()}`;
    const token = `token-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
    
    const table: Table = {
      id,
      status: 'FREE',
      ...tableInput,
    };
    this.tables.push(table);

    const qr: QRCodeData = {
      id: `qr-${id}`,
      restaurantId: tableInput.restaurantId,
      tableId: id,
      publicToken: token,
      createdAt: new Date().toISOString(),
    };
    this.qrCodes.push(qr);

    this.notify('TABLE_UPDATED', table);
    return { table, qr };
  }
}

export const db = new MesaQRDatabase();
