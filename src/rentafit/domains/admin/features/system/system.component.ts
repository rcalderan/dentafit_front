import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UiVariantSelectorComponent } from './ui-variant-selector.component';
import { TabService } from '../../../../shared/services/tab.service';

@Component({
  selector: 'rentafit-system',
  standalone: true,
  imports: [UiVariantSelectorComponent, RouterModule],
  templateUrl: './system.component.html',
  styleUrl: './system.component.css',
})
export class SystemComponent {
  private readonly tabService = inject(TabService);

  openMigration(): void {
    this.tabService.open('/admin/migration', 'Migração', 'admin');
  }
}
