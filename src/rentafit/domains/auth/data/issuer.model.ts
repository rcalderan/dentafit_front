export interface IssuerInfo {
  cnpj: string;
  rootCnpj: string;
  branchOrder: string;
  digitoControle: string;
  matriz: boolean;
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

export interface IssuerBranchSetupRequest {
  cnpj: string;
  nomeFantasia?: string;
  ie?: string;
  im?: string;
  fone?: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipioCodigo: string;
  municipioNome: string;
  uf: string;
  cep: string;
  certificatePath?: string;
  certificatePassword?: string;
}
