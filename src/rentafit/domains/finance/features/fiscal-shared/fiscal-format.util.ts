/**
 * Funções puras de formatação compartilhadas pelos componentes fiscais
 * (emissão e visualização de NF-e/NFS-e).
 */

export function formatFiscalCurrency(value: number | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

export function formatFiscalDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}
