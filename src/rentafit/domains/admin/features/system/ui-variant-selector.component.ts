import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UI_VARIANT_OPTIONS, UiVariant } from '../../../../shared/data/ui-variant.model';
import { UiVariantService } from '../../../../shared/services/ui-variant.service';

@Component({
  selector: 'rentafit-ui-variant-selector',
  standalone: true,
  templateUrl: './ui-variant-selector.component.html',
  styleUrl: './ui-variant-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiVariantSelectorComponent {
  protected readonly variants = signal(UI_VARIANT_OPTIONS);
  protected readonly uiVariant = inject(UiVariantService);

  protected selectVariant(variant: UiVariant): void {
    this.uiVariant.selectVariant(variant);
  }
}
