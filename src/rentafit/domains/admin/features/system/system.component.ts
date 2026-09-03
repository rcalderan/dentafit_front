import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UiVariantSelectorComponent } from './ui-variant-selector.component';

@Component({
  selector: 'rentafit-system',
  standalone: true,
  imports: [UiVariantSelectorComponent, RouterModule],
  templateUrl: './system.component.html',
  styleUrl: './system.component.css',
})
export class SystemComponent {}
