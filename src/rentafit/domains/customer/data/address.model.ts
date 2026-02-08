/**
 * Interface para representar um endereço
 */
export interface IAddress {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Tipo para resposta de busca por CEP
 */
export type AddressResponse = IAddress;
