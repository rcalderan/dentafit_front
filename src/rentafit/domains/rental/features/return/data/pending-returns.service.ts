import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface PendingReturnItem {
  contractId: string;
  legacyId: string;
  customerName: string;
  returnDate: string;
  daysUntilReturn: number;
  pendingItemsCount: number;
}

const MOCK_PENDING_RETURNS: PendingReturnItem[] = [
  {
    contractId: 'mock-contract-1',
    legacyId: '20250502-15',
    customerName: 'Maria Silva',
    returnDate: '2026-05-01',
    daysUntilReturn: -1,
    pendingItemsCount: 3,
  },
  {
    contractId: 'mock-contract-3',
    legacyId: '20250428-08',
    customerName: 'Ana Carolina Souza',
    returnDate: '2026-04-28',
    daysUntilReturn: -4,
    pendingItemsCount: 2,
  },
  {
    contractId: '550e8400-e29b-41d4-a716-446655440001',
    legacyId: '20250505-20',
    customerName: 'Pedro Henrique Lima',
    returnDate: '2026-05-05',
    daysUntilReturn: 0,
    pendingItemsCount: 1,
  },
  {
    contractId: '550e8400-e29b-41d4-a716-446655440002',
    legacyId: '20250506-25',
    customerName: 'Juliana Costa Mendes',
    returnDate: '2026-05-06',
    daysUntilReturn: 1,
    pendingItemsCount: 2,
  },
];

@Injectable({ providedIn: 'root' })
export class PendingReturnsService {
  /**
   * Retorna lista de devoluções pendentes (contratos FINALIZED com returnDate <= hoje + margem)
   * Usa dados mockados para Fase 1 (frontend-only)
   */
  getPendingReturns(): Observable<PendingReturnItem[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = MOCK_PENDING_RETURNS.filter(item => {
      const returnDate = new Date(item.returnDate);
      returnDate.setHours(0, 0, 0, 0);
      const diffTime = returnDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    });

    return of(filtered).pipe(delay(300));
  }
}
