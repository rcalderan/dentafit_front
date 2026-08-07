import { Component, ElementRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { CategoryModalComponent } from '../categories/category-modal.component';
import { Stock } from '../stock/stock';
import { IRetailItem, ICategory } from '../../data/Product.interface';
import { ProductService } from '../../service/product.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'rentafit-retail-registration',
    standalone: true,
    imports: [ReactiveFormsModule, ModalComponent, CategoryModalComponent, Stock],
    templateUrl: './retail-registration.component.html',
    styleUrl: './retail-registration.component.css',
})
export class RetailRegistration implements OnInit, OnDestroy {
    private fb = inject(FormBuilder);
    private service = inject(ProductService);
    private router = inject(Router);
    private destroy$ = new Subject<void>();
    private el = inject(ElementRef);

    form: FormGroup;
    isReadOnly = signal(false);
    isCategoryModalOpen = signal(false);
    isSkuSearching = signal(false);
    errorMessage = signal<string[] | string | null>(null);

    constructor() {
        this.form = this.fb.group({
            id: [{ value: '', disabled: true }],
            sku: [''],
            name: ['', [Validators.required, Validators.minLength(3)]],
            categoryId: [''],
            categoryName: ['', Validators.required],
            size: ['', Validators.required],
            color: ['', Validators.required],
            brand: [''],
            value: [null, [Validators.required, Validators.min(0.01)]],
            description: [''],
            details: [''],
            createdAt: [{ value: '', disabled: true }],
            updatedAt: [{ value: '', disabled: true }]
        });
    }

    ngOnInit(): void {
        const product: IRetailItem = {
            name: '',
            categoryId: '',
            categoryName: '',
            size: '',
            color: '',
            brand: '',
            value: 0,
            description: '',
            details: '',
            sku: '',
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
        this.form.markAllAsTouched();
        if (this.form.invalid) {
            this.scrollToFirstInvalid();
            return;
        }

        const retailItem: IRetailItem = this.form.getRawValue();
        this.service.saveRetailItem(retailItem).pipe(takeUntil(this.destroy$)).subscribe({
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
        this.form.get('createdAt')?.disable();
        this.form.get('updatedAt')?.disable();
    }

    close(): void {
        this.clear();
        this.router.navigate(['/']);
    }

    enableEditing(): void {
        this.isReadOnly.set(false);
        this.form.enable();
        this.form.get('id')?.disable();
        this.form.get('createdAt')?.disable();
        this.form.get('updatedAt')?.disable();
    }

    openCategoryModal(): void {
        this.isCategoryModalOpen.set(true);
    }

    closeCategoryModal(): void {
        this.isCategoryModalOpen.set(false);
    }

    onCategorySelected(category: ICategory): void {
        this.form.patchValue({
            categoryId: category.id ?? '',
            categoryName: category.displayName || category.name,
        });
        this.isCategoryModalOpen.set(false);
    }

    searchBySku(): void {
        const sku = this.form.get('sku')?.value?.trim();
        if (!sku) {
            this.errorMessage.set('Informe um SKU para realizar a busca.');
            return;
        }
        this.isSkuSearching.set(true);
        this.service.getRetailItemBySku(sku).pipe(takeUntil(this.destroy$)).subscribe({
            next: (product) => {
                this.form.patchValue(product);
                this.isReadOnly.set(true);
                this.form.disable();
                this.isSkuSearching.set(false);
            },
            error: (error: HttpErrorResponse) => {
                this.isSkuSearching.set(false);
                if (error.status === 404) {
                    this.errorMessage.set(`Produto com SKU "${sku}" não encontrado.`);
                } else {
                    this.handleError(error);
                }
            }
        });
    }

    clearError(): void {
        this.errorMessage.set(null);
    }

    private scrollToFirstInvalid(): void {
        const el: HTMLElement | null = this.el.nativeElement.querySelector(
            'input.ng-invalid, textarea.ng-invalid, select.ng-invalid'
        );
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
        }
    }

    private handleError(error: unknown): void {
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
        console.error('Erro ao salvar produto de varejo:', error);
        this.errorMessage.set('Ocorreu um erro ao salvar os dados do produto de varejo.');
    }
}
