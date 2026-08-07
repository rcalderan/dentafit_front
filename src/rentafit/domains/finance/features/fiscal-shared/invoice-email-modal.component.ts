import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IEmailInvoiceRequest } from '../../data/fiscal-document.types';

/** Modal de envio de nota fiscal por e-mail. Componente apresentacional. */
@Component({
  selector: 'rentafit-invoice-email-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-email-modal.component.html',
  styleUrl: './fiscal-modal.css',
})
export class InvoiceEmailModalComponent {
  readonly documentLabel = input<string>('Nota Fiscal');
  readonly invoiceNumber = input<string>('');
  readonly series = input<string>('');
  readonly customerName = input<string>('');
  readonly customerEmail = input<string>('');

  readonly send = output<IEmailInvoiceRequest>();
  readonly close = output<void>();

  protected readonly altEmail = signal('');
  protected readonly includeDanfe = signal(true);
  protected readonly includeXml = signal(true);

  protected submit(): void {
    this.send.emit({
      email: this.altEmail().trim() || undefined,
      includeDanfe: this.includeDanfe(),
      includeXml: this.includeXml(),
    });
  }
}
