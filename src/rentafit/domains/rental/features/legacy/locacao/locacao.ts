import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'rentafit-locacao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './locacao.html',
  styleUrl: './locacao.css'
})
export class LocacaoComponent {
  clienteCodigo: string = '';
  clienteNome: string = '';
  dataRetirada: string = '';
  dataUso: string = '';
  dataDevolucao: string = '';
  
  itemCodigo: string = '';
  itemDescricao: string = '';
  itemValor: string = '0,00';
  
  total: string = '0,00';
  
  comunicado: boolean = false;
}
