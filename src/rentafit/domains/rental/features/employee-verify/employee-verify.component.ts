import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
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
export class EmployeeVerifyComponent implements AfterViewInit {
  @Input() title = 'Identificar Atendente';
  @Input() requirePin = false;

  @Output() confirmed = new EventEmitter<EmployeeConfirmedEvent>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('initialsInput') initialsInput!: ElementRef<HTMLInputElement>;
  @ViewChild('pinInput') pinInput?: ElementRef<HTMLInputElement>;

  private readonly employeeService = inject(EmployeeService);

  initials: string | null = null;
  pin = '';
  isLoading = false;
  error = '';

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.reset();
      this.initialsInput?.nativeElement.focus();
    }, 0);
  }

  onInitialsEnter(): void {
    if (this.requirePin) {
      this.pinInput?.nativeElement.focus();
    } else {
      this.confirm();
    }
  }

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
