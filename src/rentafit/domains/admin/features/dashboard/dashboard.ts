import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CertificateService } from '../../service/certificate.service';
import { ICertificateDetails } from '../../data/certificate.model';
import { IssuerSetupService } from '../../../auth/services/issuer-setup.service';
import { IssuerInfo, IssuerSetupRequest } from '../../../auth/data/issuer.model';

@Component({
  selector: 'rentafit-dashboard',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly certificateService = inject(CertificateService);
  private readonly issuerSetupService = inject(IssuerSetupService);

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

  /** --- Firm / Issuer --- */
  firm = signal<IssuerInfo | null>(null);
  firmLoading = signal(false);
  firmEditing = signal(false);
  firmSaving = signal(false);
  firmError = signal<string | null>(null);

  editRazaoSocial = '';
  editNomeFantasia = '';
  editIe = '';
  editIm = '';
  editCrt = '1';
  editFone = '';
  editLogradouro = '';
  editNumero = '';
  editBairro = '';
  editMunicipioCodigo = '';
  editMunicipioNome = '';
  editUf = '';
  editCep = '';
  editPaisCodigo = '1058';
  editPaisNome = 'BRASIL';

  ngOnInit(): void {
    this.loadStatus();
    this.loadFirm();
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

  /** --- Firm / Issuer methods --- */
  loadFirm(): void {
    this.firmLoading.set(true);
    this.firmError.set(null);
    this.issuerSetupService.getCurrentIssuer().subscribe({
      next: (issuer) => {
        this.firm.set(issuer);
        this.firmLoading.set(false);
        if (issuer) {
          this.populateEditFields(issuer);
        }
      },
      error: (err: Error) => {
        this.firmError.set(err.message);
        this.firmLoading.set(false);
      },
    });
  }

  private populateEditFields(f: IssuerInfo): void {
    this.editRazaoSocial = f.razaoSocial || '';
    this.editNomeFantasia = f.nomeFantasia || '';
    this.editIe = f.ie || '';
    this.editIm = f.im || '';
    this.editCrt = f.crt || '1';
    this.editFone = f.fone || '';
    this.editLogradouro = f.logradouro || '';
    this.editNumero = f.numero || '';
    this.editBairro = f.bairro || '';
    this.editMunicipioCodigo = f.municipioCodigo || '';
    this.editMunicipioNome = f.municipioNome || '';
    this.editUf = f.uf || '';
    this.editCep = f.cep || '';
    this.editPaisCodigo = f.paisCodigo || '1058';
    this.editPaisNome = f.paisNome || 'BRASIL';
  }

  startEditFirm(): void {
    this.firmEditing.set(true);
    this.firmError.set(null);
  }

  cancelEditFirm(): void {
    this.firmEditing.set(false);
    const f = this.firm();
    if (f) {
      this.populateEditFields(f);
    }
  }

  saveFirm(): void {
    const f = this.firm();
    if (!f) {
      return;
    }
    this.firmSaving.set(true);
    this.firmError.set(null);
    const request: IssuerSetupRequest = {
      cnpj: f.cnpj,
      razaoSocial: this.editRazaoSocial.trim(),
      nomeFantasia: this.editNomeFantasia.trim() || undefined,
      ie: this.editIe.trim() || undefined,
      im: this.editIm.trim() || undefined,
      crt: this.editCrt,
      fone: this.editFone.trim() || undefined,
      logradouro: this.editLogradouro.trim(),
      numero: this.editNumero.trim(),
      bairro: this.editBairro.trim(),
      municipioCodigo: this.editMunicipioCodigo.trim(),
      municipioNome: this.editMunicipioNome.trim(),
      uf: this.editUf.trim().toUpperCase(),
      cep: this.editCep.replace(/\D/g, ''),
      paisCodigo: this.editPaisCodigo.trim(),
      paisNome: this.editPaisNome.trim(),
    };
    this.issuerSetupService.configureIssuer(request).subscribe({
      next: (updated) => {
        this.firm.set(updated);
        this.populateEditFields(updated);
        this.firmEditing.set(false);
        this.firmSaving.set(false);
      },
      error: (err: Error) => {
        this.firmError.set(err.message);
        this.firmSaving.set(false);
      },
    });
  }
}
