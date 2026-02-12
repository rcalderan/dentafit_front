import { Component, inject, OnInit, OnDestroy, signal, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CategoryService } from '../../service/category.service';
import { CategoryProductType, ICategory } from '../../data/Product.interface';

@Component({
    selector: 'rentafit-category-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './category-modal.component.html',
    styleUrl: './category-modal.component.css',
})
export class CategoryModalComponent implements OnInit, OnDestroy {
    private fb = inject(FormBuilder);
    private categoryService = inject(CategoryService);
    private destroy$ = new Subject<void>();

    /** Tipo de produto para filtrar categorias (RENTAL, RETAIL, ACCESSORY) */
    productType = input<CategoryProductType>('RENTAL');

    /** Evento emitido ao fechar o modal */
    closed = output<void>();

    /** Evento emitido ao selecionar uma categoria */
    categorySelected = output<ICategory>();

    categories = signal<ICategory[]>([]);
    isLoading = signal(false);
    isFormVisible = signal(false);
    editingCategory = signal<ICategory | null>(null);
    errorMessage = signal<string | null>(null);
    successMessage = signal<string | null>(null);

    form: FormGroup;

    productTypes: CategoryProductType[] = ['RENTAL', 'RETAIL', 'ACCESSORY'];

    constructor() {
        this.form = this.fb.group({
            id: [null],
            name: ['', [Validators.required, Validators.minLength(2)]],
            displayName: ['', Validators.required],
            description: [''],
            productType: ['RENTAL', Validators.required],
            active: [true],
        });
    }

    ngOnInit(): void {
        this.form.patchValue({ productType: this.productType() });
        this.loadCategories();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadCategories(): void {
        this.isLoading.set(true);
        this.errorMessage.set(null);
        this.categoryService.getByType(this.productType())
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.categories.set(data);
                    this.isLoading.set(false);
                },
                error: (err) => {
                    this.errorMessage.set(err.message || 'Erro ao carregar categorias.');
                    this.isLoading.set(false);
                }
            });
    }

    showNewForm(): void {
        this.editingCategory.set(null);
        this.form.reset({ productType: this.productType(), active: true });
        this.isFormVisible.set(true);
        this.clearMessages();
    }

    editCategory(category: ICategory): void {
        this.editingCategory.set(category);
        this.form.patchValue(category);
        this.isFormVisible.set(true);
        this.clearMessages();
    }

    cancelForm(): void {
        this.isFormVisible.set(false);
        this.editingCategory.set(null);
        this.form.reset({ productType: this.productType(), active: true });
        this.clearMessages();
    }

    saveCategory(): void {
        if (this.form.invalid) return;

        this.isLoading.set(true);
        this.clearMessages();

        const category: ICategory = this.form.getRawValue();
        this.categoryService.save(category)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.successMessage.set(
                        this.editingCategory() ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!'
                    );
                    this.isFormVisible.set(false);
                    this.editingCategory.set(null);
                    this.form.reset({ productType: this.productType(), active: true });
                    this.loadCategories();
                },
                error: (err) => {
                    this.errorMessage.set(err.message || 'Erro ao salvar categoria.');
                    this.isLoading.set(false);
                }
            });
    }

    deleteCategory(category: ICategory): void {
        if (!category.id) return;

        this.isLoading.set(true);
        this.clearMessages();

        this.categoryService.delete(category.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.successMessage.set(`Categoria "${category.displayName || category.name}" removida.`);
                    this.loadCategories();
                },
                error: (err) => {
                    this.errorMessage.set(err.message || 'Erro ao remover categoria.');
                    this.isLoading.set(false);
                }
            });
    }

    selectCategory(category: ICategory): void {
        this.categorySelected.emit(category);
        this.closed.emit();
    }

    closeModal(): void {
        this.closed.emit();
    }

    getControlError(controlName: string): string | null {
        const control = this.form.get(controlName);
        if (!control || !control.errors || (!control.dirty && !control.touched)) return null;
        if (control.errors['required']) return 'Campo obrigatório';
        if (control.errors['minlength']) return `Mínimo de ${control.errors['minlength'].requiredLength} caracteres`;
        return 'Campo inválido';
    }

    private clearMessages(): void {
        this.errorMessage.set(null);
        this.successMessage.set(null);
    }
}
