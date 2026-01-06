import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Customer } from '../../data/customer';

@Component({
  selector: 'rentafit-registration',
  imports: [ReactiveFormsModule],
  templateUrl: './registration.html',
  styleUrl: './registration.css',
})
export class Registration implements OnInit {
  private fb = inject(FormBuilder);

  private existingCustomer: Customer = {
    id:'uuid-1234-5678-9012',
  legacyId: "1",
  name: "João Silva 2",
  document: "12345678901",
  email: "joao.silva@example.com",
  isAuthenticated: false,
  notes: "Cliente regular",
  address: {
    zipCode: "12345-672",
    street: "Rua das Flores 2",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP"
  },
  number: "123",
  complement: "Apto 45",
  phones: [
    "11987654321",
    "1133334444",
    "1133334444"
  ]
}

  customerData = signal<Customer | null>(null);

  form: FormGroup = this.fb.group({
    id: [{ value: this.existingCustomer?.id || 0, disabled: true }],
    legacyId: [this.existingCustomer?.legacyId || ''],
    name: [this.existingCustomer?.name || '', [Validators.required, Validators.minLength(3)]],
    document: [this.existingCustomer?.document || '', [Validators.required]],
    isAuthenticated: [{ value: this.existingCustomer?.isAuthenticated || false, disabled: true }],
    address: this.fb.group({
      street: [this.existingCustomer?.address?.street || ''],
      neighborhood: [this.existingCustomer?.address?.neighborhood || ''],
      city: [this.existingCustomer?.address?.city || ''],
      state: [this.existingCustomer?.address?.state || '', [Validators.maxLength(2)]],
      zipCode: [this.existingCustomer?.address?.zipCode || '']
    }),
    phones: this.fb.array(
      this.existingCustomer?.phones?.map(phone => this.fb.control(phone)) || [
        this.fb.control(''),
        this.fb.control('')
      ]
    ),
    email: [this.existingCustomer?.email || '', [Validators.email]],
    number: [this.existingCustomer?.number || ''],
    complement: [this.existingCustomer?.complement || ''],
    notes: ['']
  });

  ngOnInit(): void {

  }

  save() {
    if (this.form.valid) {
      const customerToSave = this.form.getRawValue();
      console.log('Salvando cliente:', customerToSave);
    }
  }
}
