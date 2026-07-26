export type QualityGrade = 'Original' | 'HighCopy' | 'Copy' | 'Used';

export interface TieredPrice {
  minQty: number;
  price: number;
}

export interface DiscountMatrixRow {
  label: string;
  minQty: number;
  maxQty: number | null;
  price: number;
}

export interface CatalogProduct {
  id: string;
  title: string;
  brand: string;
  model: string;
  category: string;
  part?: string;
  qualityGrade: QualityGrade;
  stockQuantity: number;
  /** Effective unit price for this shop (after shop discount). */
  basePrice: number;
  /** Original catalog price before shop discount (when different). */
  listPrice?: number;
  shopDiscountPercent?: number;
  tieredPricing: TieredPrice[];
  imageUrl: string;
  sku?: string;
  stockLabel: string;
  discountMatrix: DiscountMatrixRow[];
}

export interface CatalogResponse {
  items: CatalogProduct[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CatalogBrand {
  id: string;
  name: string;
  iconUrl: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CatalogCategory {
  id: string;
  name: string;
  iconUrl: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CatalogFacets {
  brand: string[];
  model: string[];
  category: string[];
  part: string[];
  qualityGrade: string[];
}

export interface LineQuote {
  productId: string;
  quantity: number;
  basePrice: number;
  unitPrice: number;
  lineTotal: number;
  appliedMinQty: number;
  isTiered: boolean;
  stockQuantity: number;
}

export function resolveUnitPrice(
  quantity: number,
  basePrice: number,
  tieredPricing: TieredPrice[] = [],
): Pick<LineQuote, 'unitPrice' | 'lineTotal' | 'appliedMinQty' | 'isTiered'> {
  const qty = Math.max(0, Math.floor(quantity));
  const tiers = [...tieredPricing].sort((a, b) => a.minQty - b.minQty);
  let applied = { minQty: 1, price: basePrice };
  for (const tier of tiers) {
    if (qty >= tier.minQty) applied = { minQty: tier.minQty, price: tier.price };
  }
  const isTiered =
    tiers.some((t) => t.minQty === applied.minQty) && applied.price !== basePrice;
  return {
    unitPrice: applied.price,
    lineTotal: Number((applied.price * qty).toFixed(2)),
    appliedMinQty: applied.minQty,
    isTiered,
  };
}
