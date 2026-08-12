export interface ICertificateDetails {
  valido: boolean;
  cnpjCpf?: string;
  vencimento?: string;
  diasRestantes?: number;
  caminho?: string;
  erro?: string;
}
