export interface POSProductImport {
  externalId: string;
  sku: string;
  name: string;
  price: number;
  categoryName: string;
  taxRate: number;
  isAvailable: boolean;
}

export interface POSOrderPayload {
  mesaQrOrderId: string;
  tableNumber: string;
  waiterName: string;
  items: Array<{
    externalProductId?: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

export interface POSSyncResponse {
  success: boolean;
  posOrderId?: string;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: Record<string, unknown>;
}

export interface POSAdapter {
  id: string;
  name: string;
  description: string;
  connect(config?: Record<string, unknown>): Promise<boolean>;
  testConnection(): Promise<{ ok: boolean; latencyMs: number; message: string }>;
  getProducts(): Promise<POSProductImport[]>;
  createOrder(order: POSOrderPayload): Promise<POSSyncResponse>;
  cancelOrder(posOrderId: string, reason: string): Promise<POSSyncResponse>;
}
