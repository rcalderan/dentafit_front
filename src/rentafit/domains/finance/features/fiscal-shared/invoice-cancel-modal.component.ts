import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/** Modal de cancelamento de nota fiscal (NF-e/NFS-e). Componente apresentacional. */
@Component({
  selector: 'rentafit-invoice-cancel-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-cancel-modal.component.html',
  styleUrl: './fiscal-modal.css',
})
export class InvoiceCancelModalComponent {
  readonly documentLabel = input<string>('Nota Fiscal');
  readonly invoiceNumber = input<string>('');
  readonly accessKey = input<string>('');
  readonly value = input<string>('');

  readonly confirm = output<string>();
  readonly close = output<void>();

  protected readonly reason = signal('');

  protected submit(): void {
    const reason = this.reason().trim();
    if (!reason) return;
    this.confirm.emit(reason);
  }
}
