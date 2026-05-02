import { Observable } from 'rxjs';
import {
  CloseReturnRequestModel,
  MarkReturnRequestModel,
  ReturnSummaryModel,
} from './return.model';

export abstract class ReturnApiPort {
  abstract getReturnSummary(contractId: string): Observable<ReturnSummaryModel>;

  abstract markItemsReturned(
    contractId: string,
    request: MarkReturnRequestModel
  ): Observable<ReturnSummaryModel>;

  abstract closeReturn(
    contractId: string,
    request: CloseReturnRequestModel
  ): Observable<ReturnSummaryModel>;
}
