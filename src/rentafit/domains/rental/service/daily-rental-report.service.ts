import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { APP_CONFIG } from '../../../shared/data/app-config.token';
import { ErrorMessages, HTTP_ERROR_MAP } from '../../../shared/data/error-messages';
import { IDailyRentalReport } from '../data/daily-report.interface';

@Injectable({ providedIn: 'root' })
export class DailyRentalReportService {
  private readonly apiUrl = `${inject(APP_CONFIG).apiBaseUrl}/api/v1/rental/reports`;

  constructor(private readonly http: HttpClient) {}

  /** Relatório diário de locação para a data do evento (YYYY-MM-DD). */
  getDaily(eventDate: string): Observable<IDailyRentalReport> {
    const params = new HttpParams().set('date', eventDate);
    return this.http
      .get<IDailyRentalReport>(`${this.apiUrl}/daily`, { params })
      .pipe(catchError(this.handleError.bind(this)));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('DailyRentalReportService error:', error);
    const msg =
      HTTP_ERROR_MAP[error.status] ?? error.error?.message ?? ErrorMessages.UNKNOWN_ERROR;
    return throwError(() => new Error(msg));
  }
}
