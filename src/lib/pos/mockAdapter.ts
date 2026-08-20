import { POSAdapter, POSOrderPayload, POSProductImport, POSSyncResponse } from './interface';

export class MockPOSAdapter implements POSAdapter {
  id = 'mock-pos';
  name = 'Mock POS Adapter (Demostración)';
  description = 'Simulador de sistema administrativo para pruebas sin conexión a POS real';

  private isConnected = true;
  private latencyMs = 600;
  private simulateRandomErrors = false;
  private forceNextError = false;

  setSimulateErrors(enabled: boolean) {
    this.simulateRandomErrors = enabled;
  }

  setForceNextError(enabled: boolean) {
    this.forceNextError = enabled;
  }

  async connect(config?: Record<string, unknown>): Promise<boolean> {
    await this.delay(300);
    this.isConnected = true;
    return true;
  }

  async testConnection(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    await this.delay(this.latencyMs);
    const elapsed = Date.now() - start;
    if (!this.isConnected) {
      return { ok: false, latencyMs: elapsed, message: 'POS Adapter no conectado' };
    }
    return { ok: true, latencyMs: elapsed, message: 'Conexión exitosa con Mock POS (Latencia: ' + elapsed + 'ms)' };
  }

  async getProducts(): Promise<POSProductImport[]> {
    await this.delay(400);
    return [
      {
        externalId: 'POS-PROD-001',
        sku: 'HAM-001',
        name: 'Hamburguesa Clásica POS',
        price: 12.0,
        categoryName: 'Hamburguesas',
        taxRate: 0.16,
        isAvailable: true,
      },
      {
        externalId: 'POS-PROD-002',
        sku: 'BEB-001',
        name: 'Cerveza Zulia POS',
        price: 3.0,
        categoryName: 'Bebidas',
        taxRate: 0.16,
        isAvailable: true,
      },
    ];
  }

  async createOrder(order: POSOrderPayload): Promise<POSSyncResponse> {
    await this.delay(this.latencyMs);

    if (this.forceNextError) {
      this.forceNextError = false;
      return {
        success: false,
        errorCode: 'POS_TIMEOUT',
        errorMessage: 'Error de comunicación forzado: Timeout de socket con el servidor del POS',
        rawResponse: { timestamp: new Date().toISOString(), status: 504 },
      };
    }

    if (this.simulateRandomErrors && Math.random() < 0.25) {
      return {
        success: false,
        errorCode: 'POS_BUSY',
        errorMessage: 'Error 500: El servidor del POS rechazó temporalmente la conexión por carga',
        rawResponse: { timestamp: new Date().toISOString(), status: 500 },
      };
    }

    const posId = `POS-${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      success: true,
      posOrderId: posId,
      rawResponse: {
        posOrderId: posId,
        mesaQrOrderId: order.mesaQrOrderId,
        table: order.tableNumber,
        totalReceived: order.total,
        status: 'RECEIVED_AND_PRINTED',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async cancelOrder(posOrderId: string, reason: string): Promise<POSSyncResponse> {
    await this.delay(300);
    return {
      success: true,
      posOrderId,
      rawResponse: { status: 'CANCELLED_IN_POS', reason },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const mockPOSAdapter = new MockPOSAdapter();
