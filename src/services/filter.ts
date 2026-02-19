import {
  Product,
  FilteredProduct,
  AvailableSize,
  SIZE_CODE_TO_NAME,
} from "../types/product";

export function calculateDiscount(
  basePrice: number,
  promoPrice: number,
): number {
  if (basePrice <= 0) {
    return 0;
  }

  if (promoPrice > basePrice) {
    return 0;
  }

  const discount = ((basePrice - promoPrice) / basePrice) * 100;
  return Math.round(discount * 100) / 100;
}

export function meetsDiscountThreshold(
  product: Product,
  threshold: number,
): boolean {
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

export function extractAvailableSizes(
  product: Product,
  stockData?: { l2s: any[]; stocks: Record<string, any> },
): AvailableSize[] {
  const availableSizes: AvailableSize[] = [];

  if (!stockData) {
    return availableSizes;
  }

  const excludedSizeCodes = ["SMA005", "SMA006", "SMA007", "SMA008"];

  for (const l2 of stockData.l2s) {
    if (excludedSizeCodes.includes(l2.size.code)) {
      continue;
    }

    const stock = stockData.stocks[l2.l2Id];

    if (
      stock &&
      (stock.statusCode === "IN_STOCK" || stock.statusCode === "LOW_STOCK")
    ) {
      const sizeName = SIZE_CODE_TO_NAME[l2.size.code] || l2.size.displayCode;

      availableSizes.push({
        sizeCode: l2.size.displayCode,
        sizeName: sizeName,
      });
    }
  }

  return availableSizes;
}

async function processBatch(
  products: Product[],
  storeId: string,
  fetchStockFn: (
    productId: string,
    priceGroup: string,
    storeId: string,
  ) => Promise<any>,
): Promise<FilteredProduct[]> {
  const results = await Promise.allSettled(
    products.map(async (product) => {
      try {
        const stockData = await fetchStockFn(
          product.productId,
          product.priceGroup,
          storeId,
        );
        const availableSizes = extractAvailableSizes(product, stockData.result);

        if (availableSizes.length === 0) {
          return null;
        }

        const discount = calculateDiscount(
          product.prices.base.value,
          product.prices.promo.value,
        );

        const lowestPrice = product.prices.lowestPriceDetails?.lowestPrice;
        const discountVsRecent =
          lowestPrice != null
            ? calculateDiscount(lowestPrice, product.prices.promo.value)
            : null;

        return {
          product,
          availableSizes,
          discountPercentage: discount,
          discountVsRecent,
        };
      } catch (error) {
        console.warn(
          `Failed to fetch stock for product ${product.productId}:`,
          error instanceof Error ? error.message : "Unknown error",
        );
        return null;
      }
    }),
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<FilteredProduct | null> =>
        result.status === "fulfilled" && result.value !== null,
    )
    .map((result) => result.value as FilteredProduct);
}

export async function filterProducts(
  products: Product[],
  storeId: string,
  fetchStockFn: (
    productId: string,
    priceGroup: string,
    storeId: string,
  ) => Promise<any>,
): Promise<FilteredProduct[]> {
  const filtered: FilteredProduct[] = [];
  const BATCH_SIZE = 15;

  console.log(
    `Checking stock for ${products.length} products in parallel batches of ${BATCH_SIZE}...`,
  );

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const batchResults = await processBatch(
      batch,
      storeId,
      fetchStockFn,
    );

    filtered.push(...batchResults);

    console.log(
      `Processed ${Math.min(i + BATCH_SIZE, products.length)}/${
        products.length
      } products, found ${filtered.length} qualifying`,
    );
  }

  return filtered;
}
