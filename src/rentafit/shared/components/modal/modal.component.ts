import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'rentafit-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-container" (click)="$event.stopPropagation()" [class.error]="type() === 'error'">
        <div class="modal-header">
          <h3>{{ title() }}</h3>
          <button class="close-btn" (click)="close.emit()">×</button>
        </div>
        <div class="modal-body">
          @if (isMessageArray()) {
            <ul class="error-list">
              @for (err of messageAsArray(); track $index) {
                <li>{{ err }}</li>
              }
            </ul>
          } @else {
            <p>{{ message() }}</p>
          }
        </div>
        <div class="modal-footer">
          <button class="btn" [class.btn-error]="type() === 'error'" (click)="close.emit()">Fechar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }
    .modal-container {
      background: var(--card-bg, #fff);
      border-radius: 8px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      overflow: hidden;
      animation: modalEnter 0.3s ease-out;
    }
    .modal-container.error {
      border-top: 4px solid #f44336;
    }
    .modal-header {
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eee;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: var(--text-color);
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #999;
    }
    .modal-body {
      padding: 1.5rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .error-list {
      margin: 0;
      padding-left: 1.2rem;
      list-style-type: disc;
    }
    .error-list li {
      margin-bottom: 0.5rem;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid #eee;
    }
    .btn {
      padding: 0.5rem 1.5rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }
    .btn-error {
      background: #f44336;
      color: white;
    }
    .btn-error:hover {
      background: #d32f2f;
    }
    @keyframes modalEnter {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ModalComponent {
  title = input<string>('Mensagem');
  message = input<string | string[]>('');
  type = input<'info' | 'error'>('info');
  close = output<void>();

  protected isMessageArray = computed(() => Array.isArray(this.message()));
  protected messageAsArray = computed(() => {
    const msg = this.message();
    return Array.isArray(msg) ? msg : [msg];
  });
}
