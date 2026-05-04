import { Component, inject, signal, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../domains/auth/services/auth.service';
import { UserRole } from '../../../domains/auth/data/user.model';

@Component({
  selector: 'rentafit-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);

  protected readonly isMobile = signal(false);
  protected readonly isSidebarVisible = signal(true);
  protected readonly isCustomerSubmenuOpen = signal(false);
  protected readonly isProductSubmenuOpen = signal(false);
  protected readonly isRentalSubmenuOpen = signal(false);
  protected readonly isReportsSubmenuOpen = signal(false);
  protected readonly showFab = signal(true);

  // Expõe UserRole para uso no template
  protected readonly UserRole = UserRole;

  constructor() {
    // Detecta se a tela é mobile/tablet
    this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.TabletPortrait
    ]).subscribe(result => {
      const mobile = result.matches;
      this.isMobile.set(mobile);
      // No mobile, a sidebar começa escondida. No desktop, começa visível.
      this.isSidebarVisible.set(!mobile);
    });

    // Fecha a sidebar automaticamente ao navegar no mobile
    // e oculta o FAB nas rotas de devolução (BUG-2026-05-02-4)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const url = (event as NavigationEnd).url;
      this.showFab.set(!url.includes('/rental/return/'));
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
    this.isReportsSubmenuOpen.set(false);
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

  protected toggleReportsSubmenu(): void {
    const nextState = !this.isReportsSubmenuOpen();
    this.closeAllSubmenus();
    this.isReportsSubmenuOpen.set(nextState);
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
