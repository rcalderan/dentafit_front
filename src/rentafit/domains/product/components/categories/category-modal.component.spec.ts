import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CategoryModalComponent } from './category-modal.component';
import { CategoryService } from '../../service/category.service';
import { ICategory } from '../../data/Product.interface';

describe('CategoryModalComponent', () => {
  let categoryService: {
    getByType: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    categoryService = {
      getByType: vi.fn(),
      save: vi.fn(),
      delete: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CategoryModalComponent],
      providers: [{ provide: CategoryService, useValue: categoryService }]
    }).compileComponents();
  });

  it('creates the component', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('initializes with product type and loads categories', () => {
    const categories: ICategory[] = [
      { id: 'cat-1', name: 'Vestidos', productType: 'RETAIL', active: true }
    ];
    categoryService.getByType.mockReturnValue(of(categories));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.componentRef.setInput('productType', 'RETAIL');
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(categoryService.getByType).toHaveBeenCalledWith('RETAIL');
    expect(component.form.get('productType')?.value).toBe('RETAIL');
    expect(component.categories()).toEqual(categories);
  });

  it('handles load categories error', () => {
    categoryService.getByType.mockReturnValue(throwError(() => new Error('Load failed')));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.errorMessage()).toBe('Load failed');
    expect(component.isLoading()).toBe(false);
  });

  it('shows new form and clears messages', () => {
    categoryService.getByType.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.errorMessage.set('Old error');
    component.successMessage.set('Old success');

    component.showNewForm();

    expect(component.isFormVisible()).toBe(true);
    expect(component.editingCategory()).toBeNull();
    expect(component.errorMessage()).toBeNull();
    expect(component.successMessage()).toBeNull();
  });

  it('edits a category', () => {
    categoryService.getByType.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const category: ICategory = {
      id: 'cat-1',
      name: 'Vestidos',
      displayName: 'Vestidos',
      productType: 'RENTAL',
      active: true
    };

    component.editCategory(category);

    expect(component.editingCategory()).toEqual(category);
    expect(component.form.get('name')?.value).toBe('Vestidos');
    expect(component.isFormVisible()).toBe(true);
  });

  it('cancels the form', () => {
    categoryService.getByType.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.isFormVisible.set(true);
    component.editingCategory.set({
      id: 'cat-1',
      name: 'Vestidos',
      productType: 'RENTAL',
      active: true
    });

    component.cancelForm();

    expect(component.isFormVisible()).toBe(false);
    expect(component.editingCategory()).toBeNull();
  });

  it('does not save when form is invalid', () => {
    categoryService.getByType.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.form.patchValue({ name: '', displayName: '' });
    component.saveCategory();

    expect(categoryService.save).not.toHaveBeenCalled();
  });

  it('saves a new category and reloads list', () => {
    categoryService.getByType.mockReturnValue(of([]));
    categoryService.save.mockReturnValue(of({
      id: 'cat-1',
      name: 'Vestidos',
      productType: 'RENTAL',
      active: true
    }));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const loadSpy = vi.spyOn(component, 'loadCategories');

    component.form.patchValue({ name: 'Vestidos', displayName: 'Vestidos', productType: 'RENTAL' });
    component.saveCategory();

    expect(categoryService.save).toHaveBeenCalled();
    expect(component.successMessage()).toMatch(/sucesso/);
    expect(component.isFormVisible()).toBe(false);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('stores error when save fails', () => {
    categoryService.getByType.mockReturnValue(of([]));
    categoryService.save.mockReturnValue(throwError(() => new Error('Save failed')));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.form.patchValue({ name: 'Vestidos', displayName: 'Vestidos', productType: 'RENTAL' });
    component.saveCategory();

    expect(component.errorMessage()).toBe('Save failed');
    expect(component.isLoading()).toBe(false);
  });

  it('does not delete when category has no id', () => {
    categoryService.getByType.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.deleteCategory({
      name: 'Vestidos',
      productType: 'RENTAL',
      active: true
    });

    expect(categoryService.delete).not.toHaveBeenCalled();
  });

  it('deletes a category and reloads list', () => {
    categoryService.getByType.mockReturnValue(of([]));
    categoryService.delete.mockReturnValue(of(undefined));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const loadSpy = vi.spyOn(component, 'loadCategories');

    component.deleteCategory({
      id: 'cat-1',
      name: 'Vestidos',
      productType: 'RENTAL',
      active: true
    });

    expect(categoryService.delete).toHaveBeenCalledWith('cat-1');
    expect(component.successMessage()).toMatch(/removida/);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('emits selected category and closes', () => {
    categoryService.getByType.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const selectedSpy = vi.fn();
    const closedSpy = vi.fn();

    component.categorySelected.subscribe(selectedSpy);
    component.closed.subscribe(closedSpy);

    const category: ICategory = {
      id: 'cat-1',
      name: 'Vestidos',
      productType: 'RENTAL',
      active: true
    };

    component.selectCategory(category);

    expect(selectedSpy).toHaveBeenCalledWith(category);
    expect(closedSpy).toHaveBeenCalled();
  });

  it('closes the modal', () => {
    categoryService.getByType.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    component.closeModal();

    expect(closedSpy).toHaveBeenCalled();
  });

  it('returns form control errors', () => {
    categoryService.getByType.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const nameControl = component.form.get('name');

    nameControl?.markAsTouched();
    nameControl?.markAsDirty();

    expect(component.getControlError('name')).toMatch(/Campo/);

    nameControl?.setValue('A');
    expect(component.getControlError('name')).toContain('caracteres');
  });

  it('renders empty state when no categories', () => {
    categoryService.getByType.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).not.toBeNull();
  });

  it('renders loading indicator when loading', () => {
    categoryService.getByType.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.isLoading.set(true);
    component.isFormVisible.set(false);
    fixture.detectChanges();

    const loading = fixture.nativeElement.querySelector('.loading-indicator');
    expect(loading).not.toBeNull();
  });

  it('renders category list and emits on select', () => {
    categoryService.getByType.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const selectedSpy = vi.fn();
    const closedSpy = vi.fn();
    component.categorySelected.subscribe(selectedSpy);
    component.closed.subscribe(closedSpy);

    component.categories.set([
      {
        id: 'cat-1',
        name: 'Vestidos',
        displayName: 'Vestidos',
        productType: 'RENTAL',
        active: false
      }
    ]);
    component.isLoading.set(false);
    component.isFormVisible.set(false);
    fixture.detectChanges();

    const inactiveBadge = fixture.nativeElement.querySelector('.badge-inactive');
    expect(inactiveBadge).not.toBeNull();

    const itemInfo = fixture.nativeElement.querySelector('.category-info');
    itemInfo?.dispatchEvent(new MouseEvent('click'));

    expect(selectedSpy).toHaveBeenCalledTimes(1);
    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('renders the form and validation errors', () => {
    categoryService.getByType.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.isFormVisible.set(true);
    component.form.get('name')?.markAsTouched();
    component.form.get('name')?.markAsDirty();
    component.form.get('displayName')?.markAsTouched();
    component.form.get('displayName')?.markAsDirty();
    fixture.detectChanges();

    const fieldErrors = fixture.nativeElement.querySelectorAll('.field-error');
    expect(fieldErrors.length).toBeGreaterThan(0);
  });

  it('shows edit form title when editing category', () => {
    categoryService.getByType.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.editCategory({
      id: 'cat-1',
      name: 'Vestidos',
      displayName: 'Vestidos',
      productType: 'RENTAL',
      active: true
    });
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.category-form h4');
    expect(title?.textContent).toContain('Editar');
  });

  it('renders error and success messages', () => {
    categoryService.getByType.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CategoryModalComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.errorMessage.set('Error');
    component.successMessage.set('Success');
    fixture.detectChanges();

    const errorMessage = fixture.nativeElement.querySelector('.message-error');
    const successMessage = fixture.nativeElement.querySelector('.message-success');
    expect(errorMessage).not.toBeNull();
    expect(successMessage).not.toBeNull();
  });
});
