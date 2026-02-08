import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NfseService } from '../../service/nfse-service';

@Component({
  selector: 'rentafit-nfse-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nfse-upload.html',
  styleUrl: './nfse-upload.css'
})
export class NfseUpload {
  selectedFile = signal<File | null>(null);
  uploadStatus = signal<'idle' | 'success' | 'error'>('idle');

  constructor(public nfseService: NfseService) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
      this.uploadStatus.set('idle');
    }
  }

  upload() {
    const file = this.selectedFile();
    if (file) {
      this.nfseService.uploadBackup(file).subscribe(success => {
        if (success) {
          this.uploadStatus.set('success');
          this.selectedFile.set(null);
        } else {
          this.uploadStatus.set('error');
        }
      });
    }
  }
}
