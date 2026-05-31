export interface IRentalSummary {
  id: string;
  legacyId: string | null;
  status: string;
  statusDescription: string;
  eventDate: string | null;
  pickupDate: string | null;
  returnDate: string | null;
  returned: boolean;
  totalValue: number;
  paidValue: number;
  createdAt: string;
}

export interface ISalesOrderSummary {
  id: string;
  legacyId: string | null;
  status: string;
  statusDescription: string;
  invoiceStatus: string;
  totalValue: number;
  paidValue: number;
  itemCount: number;
  createdAt: string;
}

export interface IPagedRentals {
  content: IRentalSummary[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ICustomerAccountHistory {
  rentals: IPagedRentals;
  orders: ISalesOrderSummary[];
}
