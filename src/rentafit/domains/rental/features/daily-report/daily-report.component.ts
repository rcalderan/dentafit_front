import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DailyRentalReportService } from '../../service/daily-rental-report.service';
import { IDailyRentalReport } from '../../data/daily-report.interface';

@Component({
  selector: 'rentafit-daily-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-report.component.html',
  styleUrl: './daily-report.component.css',
})
export class DailyReportComponent implements OnInit {
  private readonly reportService = inject(DailyRentalReportService);

  protected readonly reportDate = signal<string>(DailyReportComponent.today());
  protected readonly report = signal<IDailyRentalReport | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMsg = signal<string | null>(null);

  protected readonly isEmpty = computed(() => {
    const current = this.report();
    return current != null && current.groups.length === 0;
  });

  ngOnInit(): void {
    this.generate();
  }

  protected generate(): void {
    const date = this.reportDate();
    if (!date) {
      this.errorMsg.set('Selecione uma data para gerar o relatório.');
      return;
    }
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.reportService.getDaily(date).subscribe({
      next: (data) => {
        this.report.set(data);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.errorMsg.set(err.message);
        this.report.set(null);
        this.isLoading.set(false);
      },
    });
  }

  protected print(): void {
    window.print();
  }

  protected formatDate(value: string): string {
    if (!value) return '';
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
  }

  protected formatLongDate(value: string): string {
    if (!value) return '';
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private static today(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }
}
