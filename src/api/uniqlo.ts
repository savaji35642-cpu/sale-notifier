import axios, { AxiosError } from "axios";
import {
  ApiResponse,
  Product,
  SIZE_CODES,
  StockApiResponse,
} from "../types/product";

const BASE_URL = "https://www.uniqlo.com/de/api/commerce/v5/en/products";
const REQUEST_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 30000;
const STOCK_CHECK_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchProductPage(
  offset: number,
  limit: number,
  storeId: string,
  genderId: string
): Promise<ApiResponse> {
  const params = new URLSearchParams({
    path: `${genderId},,,`,
    flagCodes: "discount",
    storeId: storeId,
    inventoryCondition: "1",
    genderId: genderId,
    offset: offset.toString(),
    limit: limit.toString(),
    imageRatio: "3x4",
    httpFailure: "true",
  });

  const url = `${BASE_URL}?${params.toString()}`;

  try {
    const response = await axios.get<ApiResponse>(url, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/json",
        "x-fr-clientid": "uq.de.web-spa",
      },
    });

    if (response.data.status !== "ok") {
      throw new Error(`API returned non-ok status: ${response.data.status}`);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new Error(
          `API request failed with status ${axiosError.response.status}: ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error("API request failed: No response received from server");
      } else {
        throw new Error(`API request failed: ${axiosError.message}`);
      }
    }
    throw error;
  }
}

export async function fetchProductStock(
  productId: string,
  priceGroup: string,
  storeId: string
): Promise<StockApiResponse> {
  const url = `${BASE_URL}/${productId}/price-groups/${priceGroup}/l2s?withPrices=true&withStocks=true&storeId=${storeId}&includePreviousPrice=false&httpFailure=true`;

  try {
    const response = await axios.get<StockApiResponse>(url, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/json",
        "x-fr-clientid": "uq.de.web-spa",
      },
    });

    if (response.data.status !== "ok") {
      throw new Error(
        `Stock API returned non-ok status: ${response.data.status}`
      );
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new Error(
          `Stock API request failed with status ${axiosError.response.status}: ${axiosError.response.statusText}`
        );
      } else if (axiosError.request) {
        throw new Error(
          "Stock API request failed: No response received from server"
        );
      } else {
        throw new Error(`Stock API request failed: ${axiosError.message}`);
      }
    }
    throw error;
  }
}

export async function fetchAllProducts(
  storeId: string,
  genderId: string
): Promise<Product[]> {
  const allProducts: Product[] = [];
  let offset = 0;
  const limit = 36;
  let hasMore = true;

  console.log("Starting to fetch all products...");

  while (hasMore) {
    console.log(`Fetching page at offset ${offset}...`);

    const response = await fetchProductPage(offset, limit, storeId, genderId);
    const items = response.result.items;

    if (items && items.length > 0) {
      allProducts.push(...items);
      console.log(
        `Fetched ${items.length} products (total: ${allProducts.length})`
      );
    }

    hasMore = items.length === limit;
    offset += limit;

    if (hasMore) {
      await sleep(REQUEST_DELAY_MS);
    } else {
      console.log("Reached last page");
    }
  }

  console.log(`Total products fetched: ${allProducts.length}`);
  return allProducts;
}
