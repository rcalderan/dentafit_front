import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, EMPTY, throwError } from 'rxjs';
import { vi } from 'vitest';
import { RegistrationComponent } from './registration.component';
import { CustomerService } from '../../service/customer.service';
import { AddressService } from '../../service/address.service';
import { Router } from '@angular/router';
import { ICustomer } from '../../data/Customer.interface';

describe('RegistrationComponent', () => {
  let customerService: {
    saveCustomer: ReturnType<typeof vi.fn>;
    getCustomerByLegacyId: ReturnType<typeof vi.fn>;
    getCustomerByDocument: ReturnType<typeof vi.fn>;
  };
  let addressService: { searchByZipCode: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const buildValidForm = (component: RegistrationComponent) => {
    component.form.patchValue({
      name: 'João da Silva',
      document: '12345678901',
      email: 'joao@silva.com',
      number: '100',
      address: {
        street: 'Rua ABC',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000'
      }
    });
  };

  const buildSavedCustomer = (overrides: Partial<ICustomer> = {}): ICustomer => ({
    id: 'c-1',
    legacyId: 10,
    name: 'João da Silva',
    document: '12345678901',
    email: 'joao@silva.com',
    isAuthenticated: false,
    notes: '',
    complement: '',
    number: '100',
    phones: [],
    address: {
      zipCode: '01000-000',
      street: 'Rua ABC',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP'
    },
    ...overrides
  });

  beforeEach(async () => {
    Element.prototype.scrollIntoView = () => {};
    customerService = {
      saveCustomer: vi.fn(),
      getCustomerByLegacyId: vi.fn(),
      getCustomerByDocument: vi.fn()
    };
    addressService = { searchByZipCode: vi.fn().mockReturnValue(EMPTY) };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RegistrationComponent],
      providers: [
        { provide: CustomerService, useValue: customerService },
        { provide: AddressService, useValue: addressService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
  });

  //  Criação do componente 

  it('cria o componente', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('inicializa o formulário com um controle de telefone vazio', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.phonesArray.length).toBe(1);
    expect(component.phonesArray.at(0).value).toBe('');
  });

  //  Helpers de formulário 

  it('retorna NONE para controles não tocados', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.getControlStatus('name')).toBe('NONE');
    expect(component.getControlError('name')).toBeNull();
  });

  it('retorna INVALID e mensagem de erro quando o controle é inválido e tocado', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const nameControl = component.form.get('name');
    nameControl?.markAsTouched();
    nameControl?.markAsDirty();

    expect(component.getControlStatus('name')).toBe('INVALID');
    expect(component.getControlError('name')).toMatch(/Campo/);
  });

  it('retorna VALID quando o controle é válido e tocado', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const nameControl = component.form.get('name');
    nameControl?.setValue('Maria Oliveira');
    nameControl?.markAsTouched();
    nameControl?.markAsDirty();

    expect(component.getControlStatus('name')).toBe('VALID');
  });

  it('retorna erro de formato inválido para documento com tamanho incorreto', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const docControl = component.form.get('document');
    docControl?.setValue('123');
    docControl?.markAsTouched();
    docControl?.markAsDirty();

    expect(component.getControlError('document')).toBeTruthy();
  });

  it('retorna status e erro de controle dentro de grupo aninhado', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const streetControl = component.form.get('address.street');
    streetControl?.markAsTouched();
    streetControl?.markAsDirty();

    expect(component.getControlStatus('street', 'address')).toBe('INVALID');
    expect(component.getControlError('street', 'address')).toMatch(/Campo/);
  });

  //  Controles de telefone 

  it('adiciona novo controle de telefone', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.canAddPhone()).toBe(true);
    component.addPhone();
    expect(component.phonesArray.length).toBe(2);
  });

  it('remove controle de telefone quando há mais de um', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.addPhone();
    expect(component.phonesArray.length).toBe(2);

    component.removePhone(0);
    expect(component.phonesArray.length).toBe(1);
  });

  it('não remove o último controle de telefone', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.canRemovePhone()).toBe(false);
    component.removePhone(0);
    expect(component.phonesArray.length).toBe(1);
  });

  it('não adiciona telefone além do limite máximo de 5', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    for (let i = 0; i < 5; i++) component.addPhone();
    expect(component.phonesArray.length).toBe(5);
    expect(component.canAddPhone()).toBe(false);

    component.addPhone();
    expect(component.phonesArray.length).toBe(5);
  });

  it('retorna erro de telefone em formato inválido', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const phoneControl = component.getPhoneControl(0);
    phoneControl.setValue('123');
    phoneControl.markAsTouched();
    phoneControl.markAsDirty();

    expect(component.getPhoneStatus(0)).toBe('INVALID');
    expect(component.getPhoneError(0)).toContain('formato');
  });

  //  Busca por código legado 

  it('não realiza busca quando a tecla pressionada não é Enter', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const event = { key: 'Tab' } as KeyboardEvent;
    component.findByLegacyId(event, '1001');
    expect(customerService.getCustomerByLegacyId).not.toHaveBeenCalled();
  });

  it('busca cliente por código legado ao pressionar Enter', () => {
    const customer = buildSavedCustomer();
    customerService.getCustomerByLegacyId.mockReturnValue(of(customer));

    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const event = { key: 'Enter' } as KeyboardEvent;
    component.findByLegacyId(event, '10');

    expect(customerService.getCustomerByLegacyId).toHaveBeenCalledWith(10);
    expect(component.isReadOnly()).toBe(true);
    expect(component.form.disabled).toBe(true);
  });

  it('exibe erro ao não encontrar cliente por código legado', () => {
    customerService.getCustomerByLegacyId.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );

    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const event = { key: 'Enter' } as KeyboardEvent;
    component.findByLegacyId(event, '9999');

    expect(component.errorMessage()).not.toBeNull();
  });

  //  Save 

  it('não chama o serviço quando o formulário é inválido', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    component.save();

    expect(customerService.saveCustomer).not.toHaveBeenCalled();
  });

  it('salva e bloqueia o formulário quando válido', () => {
    const saved = buildSavedCustomer();
    customerService.saveCustomer.mockReturnValue(of(saved));

    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    buildValidForm(component);
    component.save();

    expect(customerService.saveCustomer).toHaveBeenCalled();
    expect(component.isReadOnly()).toBe(true);
    expect(component.form.disabled).toBe(true);
  });

  it('armazena erros de validação de respostas 400', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { errors: [{ message: 'CPF já cadastrado' }] }
    });
    customerService.saveCustomer.mockReturnValue(throwError(() => error));

    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    buildValidForm(component);
    component.save();

    expect(component.errorMessage()).toEqual(['CPF já cadastrado']);
  });

  it('armazena mensagem genérica em erros não-400', () => {
    customerService.saveCustomer.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    buildValidForm(component);
    component.save();

    expect(component.errorMessage()).not.toBeNull();
  });

  //  Scroll para o primeiro campo inválido 

  it('marca todos os controles como touched ao salvar com formulário inválido', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    component.save();

    // Controles diretos do formulário devem estar touched
    Object.values(component.form.controls).forEach(ctrl => {
      expect(ctrl.touched).toBe(true);
    });
  });

  it('marca controles aninhados de endereço como touched ao salvar inválido', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    component.save();

    const addressGroup = component.form.get('address');
    Object.values((addressGroup as any).controls).forEach((ctrl: any) => {
      expect(ctrl.touched).toBe(true);
    });
  });

  it('rola e foca o primeiro campo inválido ao salvar formulário inválido', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(() => {});

    component.save();

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(focusSpy).toHaveBeenCalled();
    expect(customerService.saveCustomer).not.toHaveBeenCalled();
  });

  it('não rola quando o formulário é válido', () => {
    const saved = buildSavedCustomer();
    customerService.saveCustomer.mockReturnValue(of(saved));

    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    buildValidForm(component);
    fixture.detectChanges();

    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    component.save();

    expect(scrollSpy).not.toHaveBeenCalled();
    expect(customerService.saveCustomer).toHaveBeenCalled();
  });

  //  Clear / enable editing / close 

  it('limpa e reseta o formulário', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.disable();
    component.isReadOnly.set(true);

    component.clear();

    expect(component.isReadOnly()).toBe(false);
    expect(component.form.enabled).toBe(true);
    expect(component.phonesArray.length).toBe(1);
  });

  it('habilita edição mantendo campos de sistema desabilitados', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.enableEditing();

    expect(component.isReadOnly()).toBe(false);
    expect(component.form.get('id')?.disabled).toBe(true);
    expect(component.form.get('legacyId')?.disabled).toBe(true);
    expect(component.form.get('isAuthenticated')?.disabled).toBe(true);
    expect(component.form.get('name')?.enabled).toBe(true);
  });

  it('navega para home ao fechar', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.close();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('limpa a mensagem de erro', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.errorMessage.set('Erro qualquer');
    component.clearError();

    expect(component.errorMessage()).toBeNull();
  });

  //  DOM 

  it('exibe o modal de erro quando há mensagem de erro', () => {
    const fixture = TestBed.createComponent(RegistrationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.errorMessage.set('Erro');
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('rentafit-modal');
    expect(modal).not.toBeNull();
  });
});
