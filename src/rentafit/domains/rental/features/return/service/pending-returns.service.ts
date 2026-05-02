import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RentalContractService } from '../../../service/rental-contract.service';

/** Nome do status FINALIZED conforme retornado pelo endpoint de listagem (RentalContractSummaryDTO.status = enum.name()). */
const STATUS_FINALIZED = 'FINALIZED';

export interface PendingReturnItem {
  contractId: string;
  legacyId: string;
  customerName: string;
  returnDate: string;
  daysUntilReturn: number;
  pendingItemsCount: number;
}

/** Janela de antecedência (dias) para exibir no dashboard. */
const UPCOMING_WINDOW_DAYS = 3;

@Injectable({ providedIn: 'root' })
export class PendingReturnsService {
  private readonly contractService = inject(RentalContractService);

  /**
   * Retorna contratos FINALIZED com returnDate dentro da janela de alerta (hoje + 3 dias)
   * ou com atraso, ainda não devolvidos.
   */
  getPendingReturns(): Observable<PendingReturnItem[]> {
    return this.contractService.list({ size: 200, sort: 'returnDate,asc' }).pipe(
      map(page => {
        const today = startOfDay(new Date());

        return page.content
          .filter(c => c.status === STATUS_FINALIZED && !c.returned)
          .filter(c => {
            const returnDate = startOfDay(new Date(c.returnDate));
            const diffDays = diffInDays(returnDate, today);
            return diffDays <= UPCOMING_WINDOW_DAYS;
          })
          .map(c => {
            const returnDate = startOfDay(new Date(c.returnDate));
            return {
              contractId: c.id,
              legacyId: c.legacyId ?? '',
              customerName: c.customerName,
              returnDate: c.returnDate,
              daysUntilReturn: diffInDays(returnDate, today),
              pendingItemsCount: 0,
            };
          });
      })
    );
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffInDays(target: Date, base: Date): number {
  return Math.ceil((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
}
