import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { EmployeeService } from '../../../admin/service/employee.service';

export interface EmployeeConfirmedEvent {
  employeeId: string;
  employeeName: string;
}

@Component({
  selector: 'rentafit-employee-verify',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-verify.component.html',
  styleUrl: './employee-verify.component.css',
})
export class EmployeeVerifyComponent {
  @Input() title = 'Identificar Atendente';
  @Input() requirePin = false;

  @Output() confirmed = new EventEmitter<EmployeeConfirmedEvent>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly employeeService = inject(EmployeeService);

  initials: string | null = null;
  pin = '';
  isLoading = false;
  error = '';

  confirm(): void {
    if (!this.initials?.trim()) {
      this.error = 'Informe as iniciais do funcionário.';
      return;
    }
    if (this.requirePin && !this.pin) {
      this.error = 'Informe o PIN.';
      return;
    }

    this.error = '';
    this.isLoading = true;

    const obs = this.requirePin
      ? this.employeeService.checkInitials(this.initials.trim().toUpperCase(), this.pin)
      : this.employeeService.getByInitials(this.initials.trim().toUpperCase());

    obs.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: (employee) => this.emit(employee),
      error: (err: unknown) => {
        this.error = err instanceof Error
          ? err.message
          : (this.requirePin ? 'Credenciais inválidas.' : 'Funcionário não encontrado.');
      },
    });
  }

  cancel(): void {
    this.reset();
    this.cancelled.emit();
  }

  private emit(employee: { id: string; name?: string }): void {
    this.confirmed.emit({ employeeId: employee.id, employeeName: employee.name ?? '' });
    this.reset();
  }

  private reset(): void {
    this.initials = null;
    this.pin = '';
    this.error = '';
  }
}
