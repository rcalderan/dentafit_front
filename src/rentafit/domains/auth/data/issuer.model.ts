export interface IssuerInfo {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  ie?: string;
  im?: string;
  crt: string;
  fone?: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipioCodigo: string;
  municipioNome: string;
  uf: string;
  cep: string;
  paisCodigo: string;
  paisNome: string;
  certificateConfigured: boolean;
}

export interface IssuerSetupRequest {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  ie?: string;
  im?: string;
  crt: string;
  fone?: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipioCodigo: string;
  municipioNome: string;
  uf: string;
  cep: string;
  paisCodigo: string;
  paisNome: string;
}
