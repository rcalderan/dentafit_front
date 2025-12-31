import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'rentafit-devolucao-legacy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devolucao.html',
  styleUrl: './devolucao.css'
})
export class DevolucaoLegacy {
  pesqContrato: string = '';
  contratoId: string = '0';
  clienteCodigo: string = '';
  clienteNome: string = '';
  dataRetirada: string = '';
  dataUso: string = '';
  dataDevolucao: string = '';
  comunicado: string = '';
}
