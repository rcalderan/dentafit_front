import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../../auth/services/auth.service';
import { IRentalSummary, ISalesOrderSummary, IPagedRentals } from '../../data/account.model';

type ActiveTab = 'rentals' | 'orders';

@Component({
  selector: 'rentafit-account-profile',
  imports: [CommonModule],
  templateUrl: './account-profile.component.html',
  styleUrl: './account-profile.component.css'
})
export class AccountProfileComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly authService = inject(AuthService);

  readonly user = this.authService.getCurrentUser();

  activeTab = signal<ActiveTab>('rentals');
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  rentals = signal<IPagedRentals | null>(null);
  orders = signal<ISalesOrderSummary[]>([]);

  currentPage = signal(0);
  readonly pageSize = 10;

  ngOnInit(): void {
    this.loadHistory();
  }

  selectTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
  }

  loadHistory(page = 0): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.currentPage.set(page);

    this.accountService.getHistory(page, this.pageSize).subscribe({
      next: (data) => {
        this.rentals.set(data.rentals);
        this.orders.set(data.orders);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      }
    });
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.loadHistory(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    const total = this.rentals()?.totalPages ?? 1;
    if (this.currentPage() < total - 1) {
      this.loadHistory(this.currentPage() + 1);
    }
  }

  rentalStatusClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'status-draft',
      SIGNED: 'status-signed',
      FINALIZED: 'status-finalized',
      RETURNED: 'status-returned',
      CANCELLED: 'status-cancelled',
    };
    return map[status] ?? 'status-default';
  }

  orderStatusClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'status-draft',
      CONFIRMED: 'status-signed',
      PAID: 'status-finalized',
      COMPLETED: 'status-returned',
      CANCELLED: 'status-cancelled',
    };
    return map[status] ?? 'status-default';
  }
}
