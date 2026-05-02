import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ReturnApiPort } from './return-api.port';
import {
  CloseReturnRequestModel,
  MarkReturnRequestModel,
  ReturnAccessoryModel,
  ReturnItemModel,
  ReturnSummaryModel,
  PaymentPreviewModel,
} from './return.model';

const MOCK_CONTRACTS = new Map<string, ReturnSummaryModel>([
  [
    'mock-contract-1',
    {
      contractId: '550e8400-e29b-41d4-a716-446655440000',
      legacyId: '20250502-15',
      customerName: 'Maria Silva',
      returnDate: '2026-05-01',
      actualReturnDate: undefined,
      pendingCount: 3,
      isFullyReturned: false,
      delayDays: 1,
      suggestedFine: 50.0,
      returnerName: '',
      items: [
        {
          itemId: 'item-1',
          description: 'Vestido de Noiva Princesa',
          isReturned: false,
          returnedAt: undefined,
          returnedBy: undefined,
          accessories: [
            {
              accessoryId: 'acc-1',
              description: 'Véu Catedral',
              type: 'ACESSORIO',
              isReturned: false,
              returnedAt: undefined,
              returnedBy: undefined,
            },
            {
              accessoryId: 'acc-2',
              description: 'Tiara de Cristais',
              type: 'ACESSORIO',
              isReturned: false,
              returnedAt: undefined,
              returnedBy: undefined,
            },
          ],
        },
        {
          itemId: 'item-2',
          description: 'Terno Slim Fit Preto',
          isReturned: false,
          returnedAt: undefined,
          returnedBy: undefined,
          accessories: [
            {
              accessoryId: 'acc-3',
              description: 'Gravata Prata',
              type: 'ACESSORIO',
              isReturned: false,
              returnedAt: undefined,
              returnedBy: undefined,
            },
          ],
        },
        {
          itemId: 'item-3',
          description: 'Vestido de Festa Curto',
          isReturned: true,
          returnedAt: '2026-05-02T10:00:00Z',
          returnedBy: 'Carlos (pai da noiva)',
          accessories: [],
        },
      ],
      paymentsPreview: [
        { installmentNumber: 1, value: 800.0, status: 'PAID', paymentDate: '2026-04-15' },
        { installmentNumber: 2, value: 500.0, status: 'PENDING', paymentDate: '2026-05-01' },
      ],
    },
  ],
  [
    'mock-contract-2',
    {
      contractId: '660e8400-e29b-41d4-a716-446655440001',
      legacyId: '20250510-22',
      customerName: 'João Pereira',
      returnDate: '2026-05-10',
      actualReturnDate: undefined,
      pendingCount: 0,
      isFullyReturned: true,
      delayDays: 0,
      suggestedFine: 0,
      returnerName: 'João Pereira',
      items: [
        {
          itemId: 'item-4',
          description: 'Smoking Completo',
          isReturned: true,
          returnedAt: '2026-05-10T09:30:00Z',
          returnedBy: 'João Pereira',
          accessories: [
            {
              accessoryId: 'acc-4',
              description: 'Botões de Punho',
              type: 'ACESSORIO',
              isReturned: true,
              returnedAt: '2026-05-10T09:30:00Z',
              returnedBy: 'João Pereira',
            },
          ],
        },
      ],
      paymentsPreview: [
        { installmentNumber: 1, value: 600.0, status: 'PAID', paymentDate: '2026-05-01' },
      ],
    },
  ],
  [
    'mock-contract-3',
    {
      contractId: '770e8400-e29b-41d4-a716-446655440002',
      legacyId: '20250428-08',
      customerName: 'Ana Carolina Souza',
      returnDate: '2026-04-28',
      actualReturnDate: undefined,
      pendingCount: 2,
      isFullyReturned: false,
      delayDays: 4,
      suggestedFine: 200.0,
      returnerName: '',
      items: [
        {
          itemId: 'item-5',
          description: 'Vestido de Madrinha Azul',
          isReturned: false,
          returnedAt: undefined,
          returnedBy: undefined,
          accessories: [
            {
              accessoryId: 'acc-5',
              description: 'Cinto Dourado',
              type: 'ACESSORIO',
              isReturned: false,
              returnedAt: undefined,
              returnedBy: undefined,
            },
            {
              accessoryId: 'acc-6',
              description: 'Brincos de Pérola',
              type: 'ACESSORIO',
              isReturned: true,
              returnedAt: '2026-05-01T16:00:00Z',
              returnedBy: 'Ana Carolina',
            },
          ],
        },
        {
          itemId: 'item-6',
          description: 'Sapato Social Feminino',
          isReturned: false,
          returnedAt: undefined,
          returnedBy: undefined,
          accessories: [],
        },
      ],
      paymentsPreview: [
        { installmentNumber: 1, value: 400.0, status: 'PAID', paymentDate: '2026-04-20' },
      ],
    },
  ],
]);

@Injectable()
export class ReturnApiMockService implements ReturnApiPort {
  private mockData = new Map<string, ReturnSummaryModel>();

  constructor() {
    MOCK_CONTRACTS.forEach((value, key) => {
      this.mockData.set(key, this.deepClone(value));
      this.mockData.set(value.contractId, this.deepClone(value));
      this.mockData.set(value.legacyId, this.deepClone(value));
    });
  }

  getReturnSummary(contractId: string): Observable<ReturnSummaryModel> {
    const data = this.mockData.get(contractId);
    if (!data) {
      return throwError(() => new Error(`Contrato ${contractId} não encontrado.`)).pipe(delay(100));
    }
    return of(this.deepClone(data)).pipe(delay(300));
  }

  markItemsReturned(
    contractId: string,
    request: MarkReturnRequestModel
  ): Observable<ReturnSummaryModel> {
    const data = this.mockData.get(contractId);
    if (!data) {
      return throwError(() => new Error(`Contrato ${contractId} não encontrado.`)).pipe(delay(100));
    }

    const updated = this.deepClone(data);
    updated.returnerName = request.returnerName;

    for (const entry of request.entries) {
      if (entry.accessoryId) {
        const item = updated.items.find(i => i.itemId === entry.itemId);
        if (item) {
          const accessory = item.accessories.find(a => a.accessoryId === entry.accessoryId);
          if (accessory) {
            accessory.isReturned = true;
            accessory.returnedAt = entry.returnedAt;
            accessory.returnedBy = request.returnerName;
          }
        }
      } else {
        const item = updated.items.find(i => i.itemId === entry.itemId);
        if (item) {
          item.isReturned = true;
          item.returnedAt = entry.returnedAt;
          item.returnedBy = request.returnerName;
        }
      }
    }

    this.recalculateSummary(updated);
    this.mockData.set(contractId, this.deepClone(updated));
    this.mockData.set(updated.contractId, this.deepClone(updated));
    this.mockData.set(updated.legacyId, this.deepClone(updated));

    return of(updated).pipe(delay(300));
  }

  closeReturn(
    contractId: string,
    request: CloseReturnRequestModel
  ): Observable<ReturnSummaryModel> {
    const data = this.mockData.get(contractId);
    if (!data) {
      return throwError(() => new Error(`Contrato ${contractId} não encontrado.`)).pipe(delay(100));
    }

    if (!data.isFullyReturned) {
      return throwError(() => new Error('Não é possível fechar contrato com itens pendentes.')).pipe(
        delay(100)
      );
    }

    const updated = this.deepClone(data);
    updated.actualReturnDate = new Date().toISOString().slice(0, 10);

    if (request.applyFine && request.fineAmount && request.fineAmount > 0) {
      const maxInstallment = Math.max(...updated.paymentsPreview.map(p => p.installmentNumber), 0);
      updated.paymentsPreview.push({
        installmentNumber: maxInstallment + 1,
        value: request.fineAmount,
        status: 'MULTA',
      });
    }

    this.mockData.set(contractId, this.deepClone(updated));
    this.mockData.set(updated.contractId, this.deepClone(updated));
    this.mockData.set(updated.legacyId, this.deepClone(updated));

    return of(updated).pipe(delay(400));
  }

  private recalculateSummary(summary: ReturnSummaryModel): void {
    let pendingCount = 0;

    for (const item of summary.items) {
      if (!item.isReturned) {
        pendingCount++;
      }
      for (const accessory of item.accessories) {
        if (!accessory.isReturned) {
          pendingCount++;
        }
      }
    }

    summary.pendingCount = pendingCount;
    summary.isFullyReturned = pendingCount === 0;
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
