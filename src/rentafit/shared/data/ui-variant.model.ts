export type UiVariant = 'simplified' | 'legacy' | 'atelier';

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
  {
    id: 'atelier',
    name: 'Atelier',
    description: 'Experiência premium, elegante e focada para o trabalho diário.',
  },
];

export function isUiVariant(value: unknown): value is UiVariant {
  return value === 'simplified' || value === 'legacy' || value === 'atelier';
}
