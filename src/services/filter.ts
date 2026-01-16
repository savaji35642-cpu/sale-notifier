import {
  Product,
  FilteredProduct,
  AvailableSize,
  SIZE_DISPLAY_CODES,
  SIZE_NAMES,
} from '../types/product';

export function calculateDiscount(basePrice: number, promoPrice: number): number {
  if (basePrice <= 0) {
    return 0;
  }
  
  if (promoPrice > basePrice) {
    return 0;
  }

  const discount = ((basePrice - promoPrice) / basePrice) * 100;
  return Math.round(discount * 100) / 100;
}

export function meetsDiscountThreshold(product: Product, threshold: number): boolean {
  if (!product.prices || !product.prices.base || !product.prices.promo) {
    return false;
  }

  const basePrice = product.prices.base.value;
  const promoPrice = product.prices.promo.value;

  if (!product.prices.isDualPrice) {
    return false;
  }

  const discount = calculateDiscount(basePrice, promoPrice);
  return discount >= threshold;
}

export function extractAvailableSizes(product: Product): AvailableSize[] {
  const availableSizes: AvailableSize[] = [];
  
  const targetSizes = [
    { code: SIZE_DISPLAY_CODES.XS, name: 'XS' },
    { code: SIZE_DISPLAY_CODES.S, name: 'S' },
    { code: SIZE_DISPLAY_CODES.M, name: 'M' },
  ];

  for (const size of targetSizes) {
    availableSizes.push({
      sizeCode: size.code,
      sizeName: size.name,
      displayCode: size.code,
    });
  }

  return availableSizes;
}

export function filterProducts(
  products: Product[],
  threshold: number
): FilteredProduct[] {
  const filtered: FilteredProduct[] = [];

  for (const product of products) {
    if (!meetsDiscountThreshold(product, threshold)) {
      continue;
    }

    const availableSizes = extractAvailableSizes(product);
    
    if (availableSizes.length === 0) {
      continue;
    }

    const discountPercentage = calculateDiscount(
      product.prices.base.value,
      product.prices.promo.value
    );

    filtered.push({
      product,
      availableSizes,
      discountPercentage,
    });
  }

  return filtered;
}
