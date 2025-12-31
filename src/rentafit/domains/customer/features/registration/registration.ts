import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Customer {
  id: number;
  nome: string;
  cpf: string;
  rg: string;
  nascimento: string;
  sexo: 'male' | 'female' | 'other';
  autenticacao: boolean;
  fones: string[];
  observacao: string;
  email: string;
  endereco: Endereco;
}

const CUSTOMERS_MOCK: Customer[] = [
  {
    id: 1,
    nome: 'JOÃO DA SILVA',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    nascimento: '1990-05-15',
    sexo: 'male',
    autenticacao: true,
    fones: ['(11) 98888-8888', '(11) 3333-3333'],
    observacao: 'CLIENTE PREFERENCIAL',
    email: 'joao@email.com',
    endereco: {
      cep: '01234-567',
      logradouro: 'RUA DAS FLORES',
      numero: '123',
      bairro: 'CENTRO',
      cidade: 'SÃO PAULO',
      uf: 'SP'
    }
  },
  {
    id: 2,
    nome: 'MARIA SOUZA',
    cpf: '987.654.321-11',
    rg: '98.765.432-1',
    nascimento: '1985-10-20',
    sexo: 'female',
    autenticacao: false,
    fones: ['(21) 97777-7777'],
    observacao: '',
    email: 'maria@email.com',
    endereco: {
      cep: '20000-000',
      logradouro: 'AVENIDA BRASIL',
      numero: '500',
      bairro: 'COPACABANA',
      cidade: 'RIO DE JANEIRO',
      uf: 'RJ'
    }
  }
];

@Component({
  selector: 'rentafit-registration',
  imports: [FormsModule],
  templateUrl: './registration.html',
  styleUrl: './registration.css',
})
export class Registration {
  customer = signal<Customer>(CUSTOMERS_MOCK[0]);
}
