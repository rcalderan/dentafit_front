import { Component, inject, OnInit, signal, effect, computed, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, Subject, throwError } from 'rxjs';
import { switchMap, tap, takeUntil, catchError, mergeMap } from 'rxjs/operators';
import { ICustomer } from '../../data/Customer.interface';
import { CustomerService } from '../../service/customer.service';
import { AddressService } from '../../service/address.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'rentafit-registration',
  imports: [ReactiveFormsModule, ModalComponent],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css',
})
export class RegistrationComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private service = inject(CustomerService);
  private addressService = inject(AddressService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();
  private zipCodeSubject$ = new Subject<string>();

  //currentIndex = signal(0);
  private customer: ICustomer;
  form: FormGroup;
  isReadOnly = signal(false);
  errorMessage = signal<string[] | string | null>(null);

  customerData = computed(() => this.customer);

  // Observable reactivo para busca de endereço
address$ = this.zipCodeSubject$.pipe(
  switchMap(zipCode => this.addressService.searchByZipCode(zipCode).pipe(
    tap(address => {
      console.log('Endereço encontrado:', address);
      this.form.patchValue({ address });
    }),
    catchError(error => {
      console.error('Erro ao buscar endereço:', error.message);
      // Aqui você pode exibir uma mensagem de erro ao usuário
      // Retorna EMPTY para manter o Subject vivo
      return EMPTY;
    })
  )),
  takeUntil(this.destroy$)
);

  constructor() {
    this.form = this.fb.group({
      id: [{ value: '', disabled: true }],
      legacyId: [''],
      name: ['', [Validators.required, Validators.minLength(3)]],
      document: ['', Validators.required],
      isAuthenticated: [{ value: false, disabled: true }],
      address: this.fb.group({
        street: [''],
        neighborhood: [''],
        city: [''],
        state: ['', Validators.maxLength(2)],
        zipCode: ['']
      }),
      phones: this.fb.array([this.fb.control(''), this.fb.control('')]),
      email: ['', Validators.email],
      number: [''],
      complement: [''],
      notes: ['']
    });
    this.customer = this.form.getRawValue();

    effect(() => {
      const customer = this.customerData();
      if (customer) {
        this.form.patchValue({ ...customer });
      }
    });
  }

  private loadCustomerForm(customer: ICustomer){
        this.form.patchValue({ ...customer });
        this.isReadOnly.set(true);
        this.form.disable();
  }

  findByLegacyId(event: KeyboardEvent, document: string) {
    if(event.key !== 'Enter') return;
    this.service.getCustomerByLegacyId(Number(document)).subscribe({
      next: (customer: ICustomer) => {
        console.log('Cliente encontrado:', customer);
        this.loadCustomerForm(customer);
        // Permite que o campo legacyId continue habilitado para novas buscas se necessário
        // Ou habilitamos apenas o botão editar
      },
      error: (error: any) => {
        console.error('Erro ao buscar cliente:', error);
        this.errorMessage.set('Não foi possível encontrar o cliente com este código.');
        this.clear();
      }
      
    });
  }

  findAddressByZipCode(event: KeyboardEvent, zipCode: string) {
    if(event.key !== 'Enter') return;

    if (!zipCode || zipCode.trim().length === 0) {
      console.warn('CEP vazio');
      return;
    }

    // Dispara o observable reactivo
    this.zipCodeSubject$.next(zipCode);
  }

  findByDocument(event: KeyboardEvent, document: string) {
    if(event.key !== 'Enter') return;
    this.service.getCustomerByDocument(document).subscribe({
      next: (customer: ICustomer) => {
        console.log('Cliente encontrado:', customer);
        this.loadCustomerForm(customer);
      },
      error: (error: any) => {
        console.error('Erro ao buscar cliente:', error);
        this.errorMessage.set('Não foi possível encontrar o cliente com este CPF.');
      }
      
    });
  }

  ngOnInit(): void {
    this.customer = {
      name: "",
      document: "",
      email: "",
      isAuthenticated: false,
      notes: "",
      address: {
        zipCode: "",
        street: "",
        neighborhood: "",
        city: "",
        state: ""
      },
      number: "",
      complement: "",
      phones: [],
    };

    // Subscrever ao observable de endereço para capturar erros
    this.address$.subscribe({
      error: (error: Error) => {
        console.error('Erro ao buscar endereço:', error.message);
        this.errorMessage.set('Erro ao buscar endereço para este CEP.');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  save() {
    if (this.form.valid) {
      const v = this.form.getRawValue();

      const customer: ICustomer = v;
      this.service.saveCustomer(customer).subscribe(
        {
          next: (customer: ICustomer) => {  
            console.log('Cliente Salvo:', customer);
            this.loadCustomerForm(customer);
          },
          error: (error) => this.handleError(error)
      });
    }
  }

  private handleError(error: any) {
    if(error instanceof HttpErrorResponse) {
      if( error.status === 400 ){
        this.errorMessage.set(
          error.error
          ? error.error.errors?.map((err: any) => err.message || err) 
          : 'Erros de validação ocorreram. Verifique os dados informados.');
        return;
      }
    }
    console.error('Erro ao salvar cliente:', error);
    this.errorMessage.set('Ocorreu um erro ao salvar os dados do cliente.');
  }

  clearError() {
    this.errorMessage.set(null);
  }

  clear() {
    this.form.reset();
    this.form.enable();
    this.isReadOnly.set(false);
  }

  close() {
    this.form.reset();
    this.form.enable();
    this.isReadOnly.set(false);
    this.router.navigate(['/']);
  }

  enableEditing() {
    this.isReadOnly.set(false);
    this.form.enable();
    this.form.get('id')?.disable();
    this.form.get('legacyId')?.disable();
    this.form.get('isAuthenticated')?.disable();
  }
}
