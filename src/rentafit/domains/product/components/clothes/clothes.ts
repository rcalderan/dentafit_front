import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'rentafit-clothes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './clothes.html',
  styleUrl: './clothes.css',
})
export class Clothes {
  clothes = signal({
    codigo: '',
    nome: '',
    tipo: '',
    tamanho: '',
    corDominante: '',
    situacao: 'Disponível',
    valor: 0,
    ajuste: 0,
    percentual: 0,
    primeiroAluguel: false,
    observacao: ''
  });

  save() {
    console.log('Saving clothes:', this.clothes());
  }

  update() {
    console.log('Updating clothes:', this.clothes());
  }

  delete() {
    console.log('Deleting clothes:', this.clothes().codigo);
  }
}
