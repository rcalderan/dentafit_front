import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'rentafit-relatorio-locacao-legacy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorio-locacao.html',
  styleUrl: './relatorio-locacao.css'
})
export class RelatorioLocacaoLegacy {
  porData: boolean = false;
  dataDe: string = '';
  dataAte: string = '';
  organizarPor: string = 'Organizar Por';
  incluirAcessorios: boolean = false;
  porTipo: boolean = false;
  tipo: string = 'N';
}
