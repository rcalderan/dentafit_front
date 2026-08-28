export type UiVariant = 'simplified' | 'legacy';

export interface UiVariantOption {
  readonly id: UiVariant;
  readonly name: string;
  readonly description: string;
}

export const DEFAULT_UI_VARIANT: UiVariant = 'simplified';

export const UI_VARIANT_OPTIONS: readonly UiVariantOption[] = [
  {
    id: 'simplified',
    name: 'Simplificada',
    description: 'Interface leve, moderna e otimizada para telas pequenas.',
  },
  {
    id: 'legacy',
    name: 'Legacy',
    description: 'Interface compacta inspirada no sistema clássico para desktop.',
  },
];

export function isUiVariant(value: unknown): value is UiVariant {
  return value === 'simplified' || value === 'legacy';
}
