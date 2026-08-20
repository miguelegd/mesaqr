export type UserRole = 'ADMIN' | 'WAITER' | 'CASHIER' | 'CLIENT';

export type TableStatus = 'FREE' | 'OCCUPIED' | 'PAYMENT_PENDING';

export type TableSessionStatus = 
  | 'OPEN' 
  | 'PAYMENT_PENDING' 
  | 'PAYMENT_PROCESSING' 
  | 'PAID' 
  | 'CLOSED' 
  | 'CANCELLED';

export type OrderStatus = 
  | 'DRAFT' 
  | 'CONFIRMED' 
  | 'IN_PREPARATION' 
  | 'SERVED' 
  | 'CLOSED' 
  | 'CANCELLED';

export type SyncStatus = 
  | 'NOT_SYNCED' 
  | 'SYNCING' 
  | 'SYNCED' 
  | 'SYNC_ERROR' 
  | 'RETRYING';

export type PaymentMethod = 
  | 'CASH' 
  | 'CARD' 
  | 'BANK_TRANSFER' 
  | 'PAGO_MOVIL' 
  | 'BINANCE';

export type PaymentStatus = 
  | 'CREATED' 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'CONFIRMED' 
  | 'PAID' 
  | 'FAILED' 
  | 'EXPIRED';

export type ProofStatus = 
  | 'PROOF_REQUIRED' 
  | 'PROOF_UPLOADED' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'REJECTED';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  currency: string;
  currencySymbol: string;
  taxRate: number; // e.g. 0.16 for 16% IVA in Venezuela
  bankDetails?: {
    bankName: string;
    accountHolder: string;
    taxId: string; // RIF
    accountNumber: string;
    phone: string; // For Pago Móvil
  };
  binanceDetails?: {
    payId: string;
    merchantName: string;
  };
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface Table {
  id: string;
  restaurantId: string;
  number: string;
  zone: string;
  capacity: number;
  status: TableStatus;
}

export interface QRCodeData {
  id: string;
  restaurantId: string;
  tableId: string;
  publicToken: string;
  qrImageUrl?: string;
  createdAt: string;
}

export interface TableSession {
  id: string;
  restaurantId: string;
  tableId: string;
  waiterId?: string;
  waiterName?: string;
  status: TableSessionStatus;
  openedAt: string;
  closedAt?: string;
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  icon?: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  taxRate: number;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPriceSnapshot: number;
  taxSnapshot: number;
  discount: number;
  subtotal: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  tableSessionId: string;
  waiterId: string;
  waiterName: string;
  tableNumber: string;
  status: OrderStatus;
  syncStatus: SyncStatus;
  posOrderId?: string;
  subtotal: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
  idempotencyKey?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface PaymentProof {
  id: string;
  paymentId: string;
  proofUrl: string;
  fileName: string;
  status: ProofStatus;
  reviewedByUserId?: string;
  rejectionReason?: string;
  uploadedAt: string;
}

export interface Payment {
  id: string;
  restaurantId: string;
  tableSessionId: string;
  tableNumber: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  referenceNumber?: string;
  idempotencyKey?: string;
  createdAt: string;
  proof?: PaymentProof;
}

export interface ProductMapping {
  id: string;
  restaurantId: string;
  productId: string;
  posAdapterId: string;
  externalProductId: string;
  externalSku: string;
  mappedAt: string;
}

export interface SyncEvent {
  id: string;
  restaurantId: string;
  orderId: string;
  adapterName: string;
  status: 'SUCCESS' | 'ERROR' | 'RETRY';
  payloadSent: Record<string, unknown>;
  responseReceived?: Record<string, unknown>;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  restaurantId: string;
  userId?: string;
  userRole?: string;
  userName?: string;
  entityType: string;
  entityId: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: string;
}
