import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { MigrationComparison, MigrationReport, MigrationSession } from './migration.model';

@Injectable({ providedIn: 'root' })
export class MigrationService {
    private readonly api = `${environment.apiBaseUrl}/api/v1/migration`;

    constructor(private http: HttpClient) {}

    createSession(): Observable<MigrationSession> {
        return this.http.post<MigrationSession>(`${this.api}/sessions`, {});
    }

    uploadFile(sessionId: string, file: File): Observable<MigrationSession> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<MigrationSession>(`${this.api}/sessions/${sessionId}/files`, formData);
    }

    getSession(sessionId: string): Observable<MigrationSession> {
        return this.http.get<MigrationSession>(`${this.api}/sessions/${sessionId}`);
    }

    validate(sessionId: string): Observable<MigrationSession> {
        return this.http.post<MigrationSession>(`${this.api}/sessions/${sessionId}/validate`, {});
    }

    cloneDatabase(sessionId: string): Observable<string> {
        return this.http.post(`${this.api}/sessions/${sessionId}/clone`, {}, { responseType: 'text' });
    }

    runMigration(sessionId: string): Observable<MigrationReport> {
        return this.http.post<MigrationReport>(`${this.api}/sessions/${sessionId}/run`, {});
    }

    compare(): Observable<MigrationComparison> {
        return this.http.get<MigrationComparison>(`${this.api}/compare`);
    }

    backup(): Observable<string> {
        return this.http.post(`${this.api}/backup`, {}, { responseType: 'text' });
    }

    promote(): Observable<string> {
        return this.http.post(`${this.api}/promote`, {}, { responseType: 'text' });
    }
}
