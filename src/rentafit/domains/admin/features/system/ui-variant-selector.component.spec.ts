import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UI_VARIANT_OPTIONS, UiVariant } from '../../../../shared/data/ui-variant.model';
import { UiVariantService } from '../../../../shared/services/ui-variant.service';
import { UiVariantSelectorComponent } from './ui-variant-selector.component';

class FakeUiVariantService {
  readonly preferredVariant = signal<UiVariant>('simplified');
  readonly activeVariant = signal<UiVariant>('simplified');
  readonly isMobile = signal(false);
  readonly selectVariant = vi.fn((variant: UiVariant) => {
    this.preferredVariant.set(variant);
    this.activeVariant.set(variant);
  });
}

type TestableSelector = {
  selectVariant: (variant: UiVariant) => void;
};

describe('UiVariantSelectorComponent', () => {
  let service: FakeUiVariantService;
  let component: TestableSelector;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiVariantSelectorComponent],
      providers: [{ provide: UiVariantService, useClass: FakeUiVariantService }],
    }).compileComponents();
    service = TestBed.inject(UiVariantService) as unknown as FakeUiVariantService;
    component = TestBed.createComponent(UiVariantSelectorComponent)
      .componentInstance as unknown as TestableSelector;
  });

  it('oferece as interfaces Simplificada e Legacy', () => {
    expect(UI_VARIANT_OPTIONS.map(variant => variant.name)).toEqual([
      'Simplificada',
      'Legacy',
      'Atelier',
    ]);
  });

  it('seleciona Atelier pelo serviço global', () => {
    component.selectVariant('atelier');

    expect(service.selectVariant).toHaveBeenCalledWith('atelier');
    expect(service.preferredVariant()).toBe('atelier');
  });
});
