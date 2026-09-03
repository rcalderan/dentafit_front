import { CommonModule } from '@angular/common';
import { Component, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MigrationComparison, MigrationReport, MigrationSession } from './migration.model';
import { MigrationService } from './migration.service';

@Component({
    selector: 'app-migration',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './migration.component.html',
    styleUrl: './migration.component.css',
})
export class MigrationComponent implements OnDestroy {
    session = signal<MigrationSession | null>(null);
    report = signal<MigrationReport | null>(null);
    comparison = signal<MigrationComparison | null>(null);
    loading = signal(false);
    logs = signal<string[]>([]);

    private statusCheck: ReturnType<typeof setInterval> | null = null;

    constructor(private service: MigrationService) {}

    ngOnDestroy(): void {
        this.stopStatusCheck();
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        const files = event.dataTransfer?.files;
        if (files) {
            this.uploadFiles(Array.from(files));
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.uploadFiles(Array.from(input.files));
        }
    }

    startSession(): void {
        this.loading.set(true);
        this.service.createSession().subscribe({
            next: s => { this.session.set(s); this.loading.set(false); },
            error: e => { this.log(e); this.loading.set(false); }
        });
    }

    uploadFiles(files: File[]): void {
        if (!this.session()) {
            this.loading.set(true);
            this.service.createSession().subscribe({
                next: s => {
                    this.session.set(s);
                    this.loading.set(false);
                    this.doUpload(s.id, files);
                },
                error: e => { this.log(e); this.loading.set(false); }
            });
            return;
        }
        this.doUpload(this.session()!.id, files);
    }

    private doUpload(sessionId: string, files: File[]): void {
        for (const file of files) {
            this.loading.set(true);
            this.service.uploadFile(sessionId, file).subscribe({
                next: s => { this.session.set(s); this.loading.set(false); },
                error: e => { this.log(e); this.loading.set(false); }
            });
        }
    }

    validate(): void {
        const id = this.session()?.id;
        if (!id) return;
        this.loading.set(true);
        this.service.validate(id).subscribe({
            next: s => { this.session.set(s); this.loading.set(false); },
            error: e => { this.log(e); this.loading.set(false); }
        });
    }

    clone(): void {
        const id = this.session()?.id;
        if (!id) return;
        this.loading.set(true);
        this.service.cloneDatabase(id).subscribe({
            next: m => { this.log(m); this.loading.set(false); },
            error: e => { this.log(e); this.loading.set(false); }
        });
    }

    run(): void {
        const id = this.session()?.id;
        if (!id) return;
        this.loading.set(true);
        this.log('Executando migração...');
        this.service.runMigration(id).subscribe({
            next: r => { this.report.set(r); this.loading.set(false); this.loadComparison(); },
            error: e => { this.log(e); this.loading.set(false); }
        });
    }

    loadComparison(): void {
        this.service.compare().subscribe({
            next: c => this.comparison.set(c),
            error: e => this.log(e)
        });
    }

    backup(): void {
        this.loading.set(true);
        this.service.backup().subscribe({
            next: m => { this.log(m); this.loading.set(false); },
            error: e => { this.log(e); this.loading.set(false); }
        });
    }

    promote(): void {
        if (!confirm('Deseja promover rentafit_dump para rentafit? Esta ação é irreversível.')) {
            return;
        }
        this.loading.set(true);
        this.service.promote().subscribe({
            next: m => { this.log(m); this.loading.set(false); },
            error: e => { this.log(e); this.loading.set(false); }
        });
    }

    private log(message: string | Error): void {
        const text = typeof message === 'string' ? message : message.message;
        this.logs.update(list => [...list, text]);
    }

    private stopStatusCheck(): void {
        if (this.statusCheck) {
            clearInterval(this.statusCheck);
            this.statusCheck = null;
        }
    }
}
