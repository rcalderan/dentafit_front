type UUID = string;

/**
 * Interface base compartilhada entre Rental e Retail
 */
export interface IProductBase {
  id?: UUID;
  name: string;
  categoryId?: UUID;
  categoryName?: string;
  size: string;
  color: string;
  brand: string;
  value: number;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Condição do produto de aluguel
 */
export type ProductCondition = 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

/**
 * Status do produto
 */
export type ProductStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RESERVED' | 'DAMAGED' | 'RETIRED' | 'INACTIVE';

/**
 * Interface para itens de Aluguel (Rental)
 * Baseada no RentalItemDTO / RentalItemDetailsDTO do Swagger
 */
export interface IRentalItem extends IProductBase {
  legacyId?: string;
  status: ProductStatus | string;
  notes: string;
  condition: ProductCondition | string;
  lastRentalDate?: string | null;
  rentalCount?: number;
  maintenanceDueDate?: string | null;
}

/**
 * Interface para itens de Varejo (Retail)
 * Baseada no ProductRetailDTO / ProductRetailDetailsDTO do Swagger
 */
export interface IRetailItem extends IProductBase {
  sku?: string;
  details?: string;
  warrantyDays?: number;
  stock?: IStockDTO;
}

/**
 * Tipo de movimentação de estoque
 * Espelha o campo `type` do StockMovementDTO do backend
 */
export type StockMovementType = 'ADD' | 'REMOVE' | 'RESERVE' | 'RELEASE';

/**
 * Interface para movimentação de estoque
 * Baseada no StockMovementDTO do backend
 */
export interface IStockMovementDTO {
  stockId?: UUID;
  type: StockMovementType;
  quantity: number;
  movementDate?: string;
  userId?: UUID;
  notes?: string;
}

/**
 * Interface para dados de estoque
 * Baseada no StockDTO do Swagger
 */
export interface IStockDTO {
  productId?: UUID;
  quantityAvailable?: number;
  quantityReserved?: number;
  quantityTotal?: number;
  minStockLevel?: number;
  location?: string;
  lastMovementDate?: string;
}

/**
 * Interface de Categoria
 * Baseada no CategoryDTO do Swagger
 */
export interface ICategory {
  id?: UUID;
  name: string;
  displayName?: string;
  description?: string;
  productType: CategoryProductType;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Tipos de produto para categorias
 */
export type CategoryProductType = 'RENTAL' | 'RETAIL' | 'ACCESSORY';

/**
 * Interface para histórico de locação (mantida para compatibilidade)
 */
export interface IRentalHistoryItem {
  legacyId: string;
  name: string;
  date: string;
}

/**
 * Alias de compatibilidade (tipo legado)
 * @deprecated Use IRentalItem diretamente
 */
export type IProduct = IRentalItem;
