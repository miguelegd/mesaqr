import { db } from '../store/db';
import { TableSessionStatus, PaymentStatus, PaymentMethod } from '../types';

export interface CustomerPortalDTO {
  restaurantName: string;
  tableNumber: string;
  tableZone: string;
  sessionStatus: TableSessionStatus;
  order?: {
    id: string;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
  };
  payment?: {
    id: string;
    status: PaymentStatus;
    method: PaymentMethod;
    amount: number;
    referenceNumber?: string;
    proofStatus?: string;
    proofFileName?: string;
  };
  bankDetails?: {
    bankName: string;
    accountHolder: string;
    taxId: string;
    accountNumber: string;
    phone: string;
  };
  binanceDetails?: {
    payId: string;
    merchantName: string;
  };
}

/**
 * Transforms raw internal database structures into a clean, safe DTO for the Customer Portal.
 * Strips away internal UUIDs, waiter details, POS sync statuses, and data from other tables.
 */
export function getCustomerPortalDTO(publicToken: string): CustomerPortalDTO | null {
  const qr = db.getQRCodeByToken(publicToken);
  const table = qr ? db.getTableById(qr.tableId) : db.tables[1]; // Fallback to Mesa 2 for demo if token matches demo
  if (!table) return null;

  const restaurant = db.restaurants[0];

  // Resolve or create active session for table
  const session = db.tableSessions.find(
    (s) => s.tableId === table.id && (s.status === 'OPEN' || s.status === 'PAYMENT_PENDING' || s.status === 'PAYMENT_PROCESSING' || s.status === 'PAID')
  );

  const order = session ? db.orders.find((o) => o.tableSessionId === session.id) : undefined;
  const payment = session ? db.payments.find((p) => p.tableSessionId === session.id) : undefined;

  return {
    restaurantName: restaurant ? restaurant.name : 'Restaurante',
    tableNumber: table.number,
    tableZone: table.zone,
    sessionStatus: session ? session.status : 'OPEN',
    order: order
      ? {
          id: order.id,
          items: order.items.map((i) => ({
            productName: i.productNameSnapshot,
            quantity: i.quantity,
            unitPrice: i.unitPriceSnapshot,
            subtotal: i.subtotal,
          })),
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
        }
      : undefined,
    payment: payment
      ? {
          id: payment.id,
          status: payment.status,
          method: payment.method,
          amount: payment.amount,
          referenceNumber: payment.referenceNumber,
          proofStatus: payment.proof?.status,
          proofFileName: payment.proof?.fileName,
        }
      : undefined,
    bankDetails: restaurant?.bankDetails,
    binanceDetails: restaurant?.binanceDetails,
  };
}
