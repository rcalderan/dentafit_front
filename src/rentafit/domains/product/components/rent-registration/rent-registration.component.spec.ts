import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Registration } from './rent-registration.component';
import { ProductService } from '../../service/product.service';
import { CategoryService } from '../../service/category.service';
import { Router } from '@angular/router';
import { IRentalItem, ICategory } from '../../data/Product.interface';

describe('Registration', () => {
  let productService: { saveRentalItem: ReturnType<typeof vi.fn>; getRentalItemByLegacyId: ReturnType<typeof vi.fn> };
  let categoryService: { getByType: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const buildValidForm = (component: Registration) => {
    component.form.patchValue({
      name: 'Terno Azul',
      categoryId: 'cat-1',
      condition: 'NEW',
      size: 'M',
      color: 'Azul',
      value: 120,
      description: 'Desc',
      notes: 'Notas'
    });
  };

  beforeEach(async () => {
    productService = {
      saveRentalItem: vi.fn(),
      getRentalItemByLegacyId: vi.fn()
    };
    categoryService = {
      getByType: vi.fn()
    };
    router = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Registration],
      providers: [
        { provide: ProductService, useValue: productService },
        { provide: CategoryService, useValue: categoryService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
  });

  it('creates the component', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads categories on init', () => {
    const categories: ICategory[] = [
      { id: 'cat-1', name: 'Vestidos', productType: 'RENTAL', active: true }
    ];
    categoryService.getByType.mockReturnValue(of(categories));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(categoryService.getByType).toHaveBeenCalledWith('RENTAL');
    expect(component.categories()).toEqual(categories);
  });

  it('does not search by legacy id when field is empty', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.get('legacyId')?.setValue('');
    component.searchByLegacyId();

    expect(productService.getRentalItemByLegacyId).not.toHaveBeenCalled();
  });

  it('searches by legacy id and maps category name to id', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.categories.set([
      { id: 'cat-1', name: 'Vestidos', displayName: 'Vestidos', productType: 'RENTAL', active: true }
    ]);

    const product: IRentalItem = {
      legacyId: 'L-1001',
      name: 'Vestido',
      status: 'AVAILABLE',
      value: 10,
      categoryName: 'Vestidos',
      size: 'M',
      color: 'Azul',
      brand: '',
      description: '',
      notes: '',
      condition: 'NEW'
    };

    productService.getRentalItemByLegacyId.mockReturnValue(of(product));
    component.form.get('legacyId')?.setValue('L-1001');

    component.searchByLegacyId();

    expect(productService.getRentalItemByLegacyId).toHaveBeenCalledWith('L-1001');
    expect(component.form.get('categoryId')?.value).toBe('cat-1');
    expect(component.isReadOnly()).toBe(true);
    expect(component.form.get('legacyId')?.disabled).toBe(true);
    expect(component.form.get('name')?.disabled).toBe(true);
  });

  it('ignores 404 errors when searching by legacy id', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const error = new HttpErrorResponse({ status: 404 });
    productService.getRentalItemByLegacyId.mockReturnValue(throwError(() => error));
    component.form.get('legacyId')?.setValue('L-404');

    component.searchByLegacyId();

    expect(component.errorMessage()).toBeNull();
  });

  it('returns proper control status and error', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const nameControl = component.form.get('name');
    expect(component.getControlStatus('name')).toBe('NONE');

    nameControl?.markAsTouched();
    nameControl?.markAsDirty();
    expect(component.getControlStatus('name')).toBe('INVALID');
    expect(component.getControlError('name')).toMatch(/Campo/);

    const valueControl = component.form.get('value');
    valueControl?.setValue(0);
    valueControl?.markAsTouched();
    valueControl?.markAsDirty();
    expect(component.getControlError('value')).toContain('zero');
  });

  it('returns status class based on status value', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.get('status')?.setValue('AVAILABLE');
    expect(component.getStatusClass()).toBe('green');

    component.form.get('status')?.setValue('DAMAGED');
    expect(component.getStatusClass()).toBe('red');
  });

  it('detects when the form is empty', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ legacyId: '', name: '', categoryId: '' });
    expect(component.isFormEmpty()).toBe(true);

    component.form.patchValue({ name: 'Alguma coisa' });
    expect(component.isFormEmpty()).toBe(false);
  });

  it('does not save when form is invalid', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.get('name')?.setValue('');
    component.save();

    expect(productService.saveRentalItem).not.toHaveBeenCalled();
  });

  it('saves and locks the form when valid', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const saved: IRentalItem = {
      id: 'p-1',
      legacyId: 'L-1001',
      name: 'Vestido',
      status: 'AVAILABLE',
      value: 120,
      categoryId: 'cat-1',
      categoryName: 'Vestidos',
      size: 'M',
      color: 'Azul',
      brand: '',
      description: '',
      notes: '',
      condition: 'NEW'
    };

    productService.saveRentalItem.mockReturnValue(of(saved));

    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    buildValidForm(component);
    component.save();

    expect(productService.saveRentalItem).toHaveBeenCalled();
    expect(component.isReadOnly()).toBe(true);
    expect(component.form.disabled).toBe(true);
    expect(component.form.get('id')?.value).toBe('p-1');
  });

  it('stores validation errors from 400 responses', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const error = new HttpErrorResponse({
      status: 400,
      error: { errors: [{ message: 'Invalid payload' }] }
    });
    productService.saveRentalItem.mockReturnValue(throwError(() => error));

    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    buildValidForm(component);
    component.save();

    expect(component.errorMessage()).toEqual(['Invalid payload']);
  });

  it('clears and resets the form', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    buildValidForm(component);
    component.form.disable();
    component.isReadOnly.set(true);

    component.clear();

    expect(component.isReadOnly()).toBe(false);
    expect(component.form.get('id')?.disabled).toBe(true);
    expect(component.form.get('status')?.disabled).toBe(true);
    expect(component.form.get('legacyId')?.enabled).toBe(true);
  });

  it('enables editing while keeping system fields disabled', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.enableEditing();

    expect(component.isReadOnly()).toBe(false);
    expect(component.form.get('id')?.disabled).toBe(true);
    expect(component.form.get('legacyId')?.disabled).toBe(true);
    expect(component.form.get('status')?.disabled).toBe(true);
  });

  it('navigates home when closing', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.close();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('renders search icon and edit button based on read-only state', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    let searchIcon = fixture.nativeElement.querySelector('.search-icon');
    expect(searchIcon).not.toBeNull();

    component.isReadOnly.set(true);
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector('.edit-btn');
    expect(editButton).not.toBeNull();
  });

  it('shows status badge when form has values', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.patchValue({ name: 'Produto', categoryId: 'cat-1' });
    component.form.get('status')?.setValue('AVAILABLE');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.status-badge');
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toContain('AVAILABLE');
  });

  it('shows validation messages and icons', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const nameControl = component.form.get('name');
    const valueControl = component.form.get('value');

    nameControl?.setValue('');
    nameControl?.markAsDirty();
    nameControl?.markAsTouched();
    valueControl?.setValue(0);
    valueControl?.markAsDirty();
    valueControl?.markAsTouched();
    fixture.detectChanges();

    let fieldErrors = fixture.nativeElement.querySelectorAll('.field-error');
    let invalidIcons = fixture.nativeElement.querySelectorAll('.invalid-icon.show');
    expect(fieldErrors.length).toBeGreaterThan(0);
    expect(invalidIcons.length).toBeGreaterThan(0);

    nameControl?.setValue('Produto');
    valueControl?.setValue(100);
    nameControl?.markAsDirty();
    nameControl?.markAsTouched();
    valueControl?.markAsDirty();
    valueControl?.markAsTouched();
    fixture.detectChanges();

    const validIcons = fixture.nativeElement.querySelectorAll('.valid-icon.show');
    expect(validIcons.length).toBeGreaterThan(0);
  });

  it('renders modal when there is an error message', () => {
    categoryService.getByType.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(Registration);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.errorMessage.set('Error');
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('rentafit-modal');
    expect(modal).not.toBeNull();
  });
});
