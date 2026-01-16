import {
  Product,
  FilteredProduct,
  AvailableSize,
  SIZE_CODES,
  SIZE_DISPLAY_CODES,
  SIZE_NAMES,
} from "../types/product";

export function calculateDiscount(
  basePrice: number,
  promoPrice: number
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
  threshold: number
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
  stockData?: { l2s: any[]; stocks: Record<string, any> }
): AvailableSize[] {
  const availableSizes: AvailableSize[] = [];

  if (!stockData) {
    return availableSizes;
  }

  const targetSizeCodes = [
    SIZE_CODES.XS,
    SIZE_CODES.S,
    SIZE_CODES.M,
    "INS030",
    "INS031",
    "MSC027",
    "SIZ999",
    "SSE420",
  ];

  for (const l2 of stockData.l2s) {
    if (targetSizeCodes.includes(l2.size.code)) {
      const stock = stockData.stocks[l2.l2Id];

      if (
        stock &&
        (stock.statusCode === "IN_STOCK" || stock.statusCode === "LOW_STOCK")
      ) {
        const getSizeName = (sizeCode: string): string => {
          if (sizeCode === SIZE_CODES.XS) return "XS";
          if (sizeCode === SIZE_CODES.S) return "S";
          if (sizeCode === SIZE_CODES.M) return "M";
          if (sizeCode === "INS030") return "30inch";
          if (sizeCode === "INS031") return "31inch";
          return l2.size.displayCode;
        };

        availableSizes.push({
          sizeCode: l2.size.displayCode,
          sizeName: getSizeName(l2.size.code),
          displayCode: l2.size.displayCode,
        });
      }
    }
  }

  return availableSizes;
}

async function processBatch(
  products: Product[],
  threshold: number,
  storeId: string,
  fetchStockFn: (
    productId: string,
    priceGroup: string,
    storeId: string
  ) => Promise<any>
): Promise<FilteredProduct[]> {
  const results = await Promise.allSettled(
    products.map(async (product) => {
      if (!meetsDiscountThreshold(product, threshold)) {
        return null;
      }

      try {
        const stockData = await fetchStockFn(
          product.productId,
          product.priceGroup,
          storeId
        );
        const availableSizes = extractAvailableSizes(product, stockData.result);

        if (availableSizes.length === 0) {
          return null;
        }

        const discount = calculateDiscount(
          product.prices.base.value,
          product.prices.promo.value
        );

        return {
          product,
          availableSizes,
          discountPercentage: discount,
        };
      } catch (error) {
        console.warn(
          `Failed to fetch stock for product ${product.productId}:`,
          error instanceof Error ? error.message : "Unknown error"
        );
        return null;
      }
    })
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<FilteredProduct | null> =>
        result.status === "fulfilled" && result.value !== null
    )
    .map((result) => result.value as FilteredProduct);
}

export async function filterProducts(
  products: Product[],
  threshold: number,
  storeId: string,
  fetchStockFn: (
    productId: string,
    priceGroup: string,
    storeId: string
  ) => Promise<any>
): Promise<FilteredProduct[]> {
  const filtered: FilteredProduct[] = [];
  const BATCH_SIZE = 10;

  console.log(
    `Checking stock for ${products.length} products in parallel batches of ${BATCH_SIZE}...`
  );

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const batchResults = await processBatch(
      batch,
      threshold,
      storeId,
      fetchStockFn
    );

    filtered.push(...batchResults);

    console.log(
      `Processed ${Math.min(i + BATCH_SIZE, products.length)}/${
        products.length
      } products, found ${filtered.length} qualifying`
    );

    if (i + BATCH_SIZE < products.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return filtered;
}
