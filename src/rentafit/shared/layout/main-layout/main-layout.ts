import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../domains/auth/services/auth.service';
import { UserRole } from '../../../domains/auth/data/user.model';
import { UiVariantService } from '../../services/ui-variant.service';

@Component({
  selector: 'rentafit-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  protected readonly authService = inject(AuthService);
  protected readonly uiVariant = inject(UiVariantService);

  protected readonly isMobile = this.uiVariant.isMobile;
  protected readonly isSidebarVisible = signal(!this.isMobile());
  protected readonly isCustomerSubmenuOpen = signal(false);
  protected readonly isProductSubmenuOpen = signal(false);
  protected readonly isRentalSubmenuOpen = signal(false);
  protected readonly isSalesSubmenuOpen = signal(false);
  protected readonly isReportsSubmenuOpen = signal(false);
  protected readonly isAdminSubmenuOpen = signal(false);
  protected readonly showFab = signal(true);
  protected readonly pageTitle = signal('Dashboard');

  // Expõe UserRole para uso no template
  protected readonly UserRole = UserRole;

  constructor() {
    // BUG-2026-05-04-4: atualiza título do header e estado do FAB a cada navegação
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const url = (event as NavigationEnd).url;
      this.showFab.set(!url.includes('/rental/return/'));

      // Percorre a árvore de rotas ativadas para encontrar o title mais específico
      let child = this.activatedRoute.firstChild;
      while (child?.firstChild) { child = child.firstChild; }
      const title = child?.snapshot.data?.['title'] as string | undefined;
      this.pageTitle.set(title ?? 'Dashboard');

      if (this.isMobile()) {
        this.isSidebarVisible.set(false);
      }
    });
  }

  protected toggleSidebar(): void {
    this.isSidebarVisible.update(visible => !visible);
  }
  
  public closeAllSubmenus(): void {
    this.isCustomerSubmenuOpen.set(false);
    this.isProductSubmenuOpen.set(false);
    this.isRentalSubmenuOpen.set(false);
    this.isSalesSubmenuOpen.set(false);
    this.isReportsSubmenuOpen.set(false);
    this.isAdminSubmenuOpen.set(false);
  }

  protected toggleCustomerSubmenu(): void {
    const nextState = !this.isCustomerSubmenuOpen();
    this.closeAllSubmenus();
    this.isCustomerSubmenuOpen.set(nextState);
  }

  protected toggleProductSubmenu(): void {
    const nextState = !this.isProductSubmenuOpen();
    this.closeAllSubmenus();
    this.isProductSubmenuOpen.set(nextState);
  }

  protected toggleRentalSubmenu(): void {
    const nextState = !this.isRentalSubmenuOpen();
    this.closeAllSubmenus();
    this.isRentalSubmenuOpen.set(nextState);
  }

  protected toggleSalesSubmenu(): void {
    const nextState = !this.isSalesSubmenuOpen();
    this.closeAllSubmenus();
    this.isSalesSubmenuOpen.set(nextState);
  }

  protected toggleReportsSubmenu(): void {
    const nextState = !this.isReportsSubmenuOpen();
    this.closeAllSubmenus();
    this.isReportsSubmenuOpen.set(nextState);
  }

  protected toggleAdminSubmenu(): void {
    const nextState = !this.isAdminSubmenuOpen();
    this.closeAllSubmenus();
    this.isAdminSubmenuOpen.set(nextState);
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected hasRole(role: UserRole): boolean {
    return this.authService.hasRole(role);
  }

  protected hasAnyRole(roles: UserRole[]): boolean {
    return this.authService.hasAnyRole(roles);
  }
}
