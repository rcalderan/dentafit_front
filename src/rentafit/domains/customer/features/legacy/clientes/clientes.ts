import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'rentafit-clientes-legacy',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class ClientesLegacy {
  customer = signal({
    codigo: '',
    nome: '',
    cpf: '',
    rg: '',
    nascimento: '',
    sexo: 'Masculino',
    autenticado: false,
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    fone1: '',
    fone2: '',
    email: '',
    observacao: ''
  });

  save() {
    console.log('Saving customer legacy:', this.customer());
  }

  update() {
    console.log('Updating customer legacy:', this.customer());
  }

  delete() {
    console.log('Deleting customer legacy:', this.customer().codigo);
  }
}
