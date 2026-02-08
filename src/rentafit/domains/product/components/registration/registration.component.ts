import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { IProduct, IRentalHistoryItem } from '../../data/Product.interface';
import { ProductService } from '../../service/product.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'rentafit-registration',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css',
})
export class Registration implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private service = inject(ProductService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  form: FormGroup;
  isReadOnly = signal(false);
  errorMessage = signal<string[] | string | null>(null);

  rentalHistory = signal<IRentalHistoryItem[]>([
    { legacyId: 'L-1001', name: 'VESTIDO NOIVA RENDA', date: '12/01/2026' },
    { legacyId: 'L-1009', name: 'PALETÓ SLIM PRETO', date: '28/01/2026' },
    { legacyId: 'L-1032', name: 'VESTIDO MARSALA', date: '03/02/2026' }
  ]);

  constructor() {
    this.form = this.fb.group({
      id: [{ value: '', disabled: true }],
      legacyId: [{ value: '', disabled: true }],
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      size: ['', Validators.required],
      color: ['', Validators.required],
      value: [null, [Validators.required, Validators.min(0.01)]],
      status: [{ value: 'Disponível', disabled: true }],
      notes: ['']
    });
  }

  ngOnInit(): void {
    const product: IProduct = {
      name: '',
      type: '',
      size: '',
      color: '',
      value: 0,
      status: 'Disponível',
      notes: ''
    };

    this.form.patchValue({ ...product });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getControlStatus(controlName: string): 'VALID' | 'INVALID' | 'PENDING' | 'NONE' {
    const control = this.form.get(controlName);
    if (!control || (!control.dirty && !control.touched)) return 'NONE';
    return control.valid ? 'VALID' : 'INVALID';
  }

  getControlError(controlName: string): string | null {
    const control = this.form.get(controlName);
    if (!control || !control.errors || (!control.dirty && !control.touched)) return null;

    if (control.errors['required']) return 'Campo obrigatório';
    if (control.errors['minlength']) return `Mínimo de ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['min']) return 'Valor deve ser maior que zero';

    return 'Campo inválido';
  }

  save(): void {
    if (this.form.invalid) return;

    const product: IProduct = this.form.getRawValue();
    this.service.saveProduct(product).pipe(takeUntil(this.destroy$)).subscribe({
      next: (saved) => {
        this.form.patchValue(saved);
        this.isReadOnly.set(true);
        this.form.disable();
      },
      error: (error) => this.handleError(error)
    });
  }

  clear(): void {
    this.form.reset();
    this.form.enable();
    this.isReadOnly.set(false);
    this.form.get('id')?.disable();
    this.form.get('legacyId')?.disable();
    this.form.get('status')?.disable();
  }

  close(): void {
    this.form.reset();
    this.form.enable();
    this.isReadOnly.set(false);
    this.form.get('id')?.disable();
    this.form.get('legacyId')?.disable();
    this.form.get('status')?.disable();
    this.router.navigate(['/']);
  }

  enableEditing(): void {
    this.isReadOnly.set(false);
    this.form.enable();
    this.form.get('id')?.disable();
    this.form.get('legacyId')?.disable();
    this.form.get('status')?.disable();
  }

  clearError(): void {
    this.errorMessage.set(null);
  }

  private handleError(error: any): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 400) {
        this.errorMessage.set(
          error.error
            ? error.error.errors?.map((err: any) => err.message || err)
            : 'Erros de validação ocorreram. Verifique os dados informados.'
        );
        return;
      }
    }
    console.error('Erro ao salvar produto:', error);
    this.errorMessage.set('Ocorreu um erro ao salvar os dados do produto.');
  }

}
