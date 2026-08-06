import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CertificateService } from '../../service/certificate.service';
import { ICertificateDetails } from '../../data/certificate.model';

@Component({
  selector: 'rentafit-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly certificateService = inject(CertificateService);

  details = signal<ICertificateDetails | null>(null);
  selectedFile = signal<File | null>(null);
  password = signal('');
  isUploading = signal(false);
  errorMessage = signal<string | null>(null);
  showUploadModal = signal(false);

  showUploadControls = computed(() => {
    const d = this.details();
    if (!d) return true;
    if (!d.valido) return true;
    if (d.diasRestantes == null) return true;
    return d.diasRestantes <= 30;
  });

  uploadButtonLabel = computed(() => (this.details() ? 'Atualizar' : 'Verificar'));

  ngOnInit(): void {
    this.loadStatus();
  }

  loadStatus(): void {
    this.certificateService.status().subscribe({
      next: (status) => {
        this.details.set(status);
        this.errorMessage.set(null);
      },
      error: (err: Error) => this.errorMessage.set(err.message),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pfx')) {
      this.errorMessage.set('O arquivo deve estar no formato .pfx.');
      this.selectedFile.set(null);
      this.password.set('');
      return;
    }
    this.errorMessage.set(null);
    this.selectedFile.set(file);
  }

  openUploadModal(): void {
    this.password.set('');
    this.errorMessage.set(null);
    this.showUploadModal.set(true);
  }

  closeUploadModal(): void {
    this.showUploadModal.set(false);
    this.password.set('');
    this.errorMessage.set(null);
  }

  upload(): void {
    const file = this.selectedFile();
    const password = this.password();
    if (!file || !password) return;

    this.isUploading.set(true);
    this.errorMessage.set(null);
    this.certificateService.upload(file, password).subscribe({
      next: (status) => {
        this.details.set(status);
        this.showUploadModal.set(false);
        this.selectedFile.set(null);
        this.password.set('');
        this.isUploading.set(false);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.isUploading.set(false);
      },
    });
  }
}
