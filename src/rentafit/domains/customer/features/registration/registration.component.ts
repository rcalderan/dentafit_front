import { Component, inject, OnInit, signal, effect, computed, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY, Subject } from 'rxjs';
import { switchMap, tap, takeUntil, catchError } from 'rxjs/operators';
import { ICustomer } from '../../data/Customer.interface';
import { CustomerService } from '../../service/customer-service';
import { AddressService } from '../../service/address.service';

@Component({
  selector: 'rentafit-registration',
  imports: [ReactiveFormsModule],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css',
})
export class RegistrationComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private service = inject(CustomerService);
  private addressService = inject(AddressService);

  private destroy$ = new Subject<void>();
  private zipCodeSubject$ = new Subject<string>();

  //currentIndex = signal(0);
  private customer: ICustomer;
  form: FormGroup;

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

  findByLegacyId(event: KeyboardEvent, document: string) {
    if(event.key !== 'Enter') return;
    this.service.getCustomerByLegacyId(Number(document)).subscribe({
      next: (customer: ICustomer) => {
        console.log('Cliente encontrado:', customer);
        this.form.patchValue({ ...customer });
      },
      error: (error: any) => {
        //Set a message to user
        console.error('Erro ao buscar cliente:', error);
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
    this.service.getCustomerById(document).subscribe({
      next: (data: any) => {
        console.log('Cliente encontrado:', data);
      },
      error: (error: any) => {
        //Set a message to user
        console.error('Erro ao buscar cliente:', error);
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
        // Aqui você pode exibir uma mensagem de erro ao usuário
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  next() {
    //if (this.hasNext()) this.currentIndex.update(i => i + 1);
  }

  previous() {
    //if (this.hasPrevious()) this.currentIndex.update(i => i - 1);
  }

  save() {
    if (this.form.valid) {
      const v = this.form.getRawValue();

      console.log('Salvando cliente:',v);
      const customer: ICustomer = v;
      this.service.createCustomer(customer).subscribe({
        next: (data: any) => {  
          console.log('Cliente Salvo:', data);
        },
        error: (error: any) => {
          console.error('Erro ao salvar cliente:', error);
        }
      });
          
    }
  }
}
