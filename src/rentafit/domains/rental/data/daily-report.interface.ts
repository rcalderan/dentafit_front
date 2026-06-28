import { ItemMetaTypeApi } from './rental-api.types';

/** Espelha os DTOs de relatório do backend (br.com.rentafit.rental.dto.report). */

export interface IReportAdjustment {
  type: ItemMetaTypeApi;
  typeDescription: string;
  description: string;
}

export interface IReportItem {
  contractLegacyId: string;
  customerName: string;
  legacyProductCode: string;
  description: string;
  size?: string;
  color?: string;
  pickupDate: string;
  adjustments: IReportAdjustment[];
}

export interface IClothingTypeGroup {
  clothingType: string;
  itemCount: number;
  items: IReportItem[];
}

export interface IDailyRentalReport {
  eventDate: string;
  generatedAt: string;
  contractCount: number;
  itemCount: number;
  adjustmentCount: number;
  groups: IClothingTypeGroup[];
}
