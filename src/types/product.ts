export interface Currency {
  code: string;
  symbol: string;
}

export interface Price {
  currency: Currency;
  value: number;
}

export interface Prices {
  base: Price;
  promo: Price;
  isDualPrice: boolean;
  discountPercentage: number | null;
  lowestPriceDetails?: {
    canDisplayLowestPrice: boolean;
    lowestPeriod: number;
    lowestPrice: number;
  };
}

export interface Color {
  code: string;
  displayCode: string;
  name: string;
  display: {
    showFlag: boolean;
    chipType: number;
  };
  filterCode: string;
  hexBackgroundColor?: string;
}

export interface Rating {
  average: number;
  count: number;
}

export interface Size {
  code: string;
  displayCode: string;
  name: string;
  display: {
    showFlag: boolean;
    chipType: number;
  };
}

export interface Product {
  l1Id: string;
  productId: string;
  priceGroup: string;
  name: string;
  prices: Prices;
  colors: Color[];
  representativeColorDisplayCode: string;
  genderName: string;
  genderCategory: string;
  rating?: Rating;
  sizes?: Size[];
  images?: {
    main?: Record<string, { image: string; model: any[] }>;
    chip?: Record<string, string>;
    sub?: Array<{ image?: string; video?: string; model: any[] }>;
  };
}

export interface ApiResponse {
  status: string;
  result: {
    items: Product[];
    pagination: {
      total: number;
      offset: number;
      limit: number;
      count: number;
    };
    aggregations?: any;
    relaxedQueries?: any[];
    relaxedQueryItems?: any[];
  };
}

export interface FilteredProduct {
  product: Product;
  availableSizes: AvailableSize[];
  discountPercentage: number;
}

export interface AvailableSize {
  sizeCode: string;
  sizeName: string;
  displayCode: string;
}

export interface StockInfo {
  statusCode: string;
  quantity: number;
  statusLocalized: string;
}

export interface L2Item {
  l2Id: string;
  size: {
    code: string;
    displayCode: string;
  };
  color: {
    code: string;
    displayCode: string;
  };
  sales: boolean;
}

export interface StockApiResponse {
  status: string;
  result: {
    l2s: L2Item[];
    stocks: Record<string, StockInfo>;
  };
}

export interface ProductLink {
  size: AvailableSize;
  url: string;
}

export interface Config {
  discountThreshold: number;
  gmailUser: string;
  gmailAppPassword: string;
  recipientEmail: string;
  storeIds: string[];
  genderId: string;
}

export const SIZE_CODES = {
  XS: "SMA002",
  S: "SMA003",
  M: "SMA004",
} as const;

export const SIZE_DISPLAY_CODES = {
  XS: "002",
  S: "003",
  M: "004",
} as const;

export const SIZE_NAMES = {
  "002": "XS",
  "003": "S",
  "004": "M",
} as const;
