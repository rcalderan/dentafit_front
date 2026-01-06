
type UUID = string;

export interface Customer {
  id: UUID;
  legacyId: string;
  name: string;
  document: string;
  isAuthenticated: boolean;
  email: string;
  notes: string;
  complement: string;  
  number: string;
  phones: string[];
  address: Address;
}

export interface Address {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * {
  "name": "João Silva 2",
  "document": "12345678901",
  "email": "joao.silva@example.com",
  "isAuthenticated": false,
  "notes": "Cliente regular",
  "address": {
    "zipCode": "12345-672",
    "street": "Rua das Flores 2",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP"
  },
  "number": "123",
  "complement": "Apto 45",
  "phones": [
    "11987654321",
    "1133334444",
    "1133334444"
  ]
}
 */

    // "id": 1,
    // "name": "JOÃO DA SILVA",
    // "document": "123.456.789-00",
    // "documentType": "CPF",
    // "birthDate": "1990-05-15",
    // "sex": true,
    // "authentication": true,
    // "phones": [
    //     "(11) 98888-8888",
    //     "(11) 3333-3333"
    // ],
    // "details": "CLIENTE PREFERENCIAL",
    // "email": "joao@email.com",
    // "address": {
    //     "cep": "01234-567",
    //     "street": "RUA DAS FLORES",
    //     "number": "123",
    //     "complement": null,
    //     "neighborhood": "CENTRO",
    //     "city": "SÃO PAULO",
    //     "state": "SP"
    // }