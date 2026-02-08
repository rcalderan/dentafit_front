type UUID = string;

export interface IProduct {
  id?: UUID;
  legacyId?: number;
  name: string;
  type: string;
  size: string;
  color: string;
  value: number;
  status: string;
  notes: string;
}

export interface IRentalHistoryItem {
  legacyId: string;
  name: string;
  date: string;
}
