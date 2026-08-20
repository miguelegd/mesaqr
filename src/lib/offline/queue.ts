import Dexie, { Table } from 'dexie';

export interface PendingOfflineOrder {
  id?: number;
  tableSessionId: string;
  waiterId: string;
  waiterName: string;
  idempotencyKey: string;
  items: Array<{ productId: string; quantity: number }>;
  createdAt: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  errorMessage?: string;
}

class MesaQROfflineDB extends Dexie {
  pendingOrders!: Table<PendingOfflineOrder>;

  constructor() {
    super('MesaQROfflineDB');
    this.version(1).stores({
      pendingOrders: '++id, tableSessionId, idempotencyKey, status, createdAt',
    });
  }
}

export const offlineDb = new MesaQROfflineDB();

export async function enqueueOfflineOrder(
  tableSessionId: string,
  waiterId: string,
  waiterName: string,
  items: Array<{ productId: string; quantity: number }>
): Promise<PendingOfflineOrder> {
  const idempotencyKey = `off-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const record: PendingOfflineOrder = {
    tableSessionId,
    waiterId,
    waiterName,
    idempotencyKey,
    items,
    createdAt: new Date().toISOString(),
    status: 'PENDING',
  };

  const id = await offlineDb.pendingOrders.add(record);
  return { ...record, id };
}

export async function getPendingOrdersCount(): Promise<number> {
  return await offlineDb.pendingOrders.where('status').equals('PENDING').count();
}

export async function getAllPendingOrders(): Promise<PendingOfflineOrder[]> {
  return await offlineDb.pendingOrders.where('status').equals('PENDING').toArray();
}
