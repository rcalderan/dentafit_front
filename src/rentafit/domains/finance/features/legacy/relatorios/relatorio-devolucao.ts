import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'rentafit-relatorio-devolucao-legacy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorio-devolucao.html',
  styleUrl: './relatorio-devolucao.css'
})
export class RelatorioDevolucaoLegacy {
  info: string = '';
}
