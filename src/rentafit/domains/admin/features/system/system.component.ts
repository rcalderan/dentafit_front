import { Component } from '@angular/core';
import { UiVariantSelectorComponent } from './ui-variant-selector.component';

@Component({
  selector: 'rentafit-system',
  standalone: true,
  imports: [UiVariantSelectorComponent],
  templateUrl: './system.component.html',
  styleUrl: './system.component.css',
})
export class SystemComponent {}
