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

export const SIZE_CODE_TO_NAME: Record<string, string> = {
  // Standard clothing sizes (from API aggregation)
  SMA001: "XXS",
  SMA002: "XS",
  SMA003: "S",
  SMA004: "M",
  SMA005: "L",
  SMA006: "XL",
  SMA007: "XXL",
  SMA008: "3XL",

  // Inch sizes (from API aggregation)
  INS025: "25inch",
  INS028: "28inch",
  INS029: "29inch",
  INS030: "30inch",
  INS031: "31inch",
  INS032: "32inch",
  INS033: "33inch",
  INS034: "34inch",
  INS035: "35inch",
  INS036: "36inch",
  INS040: "40inch",

  // PLD sizes (from API aggregation)
  INA030: "30inch",
  INA032: "32inch",
  INA034: "34inch",
  PTB000: "-",

  // Special sizes (from API aggregation)
  MSC027: "42-46(27-29cm)",
  SIZ999: "One Size",
};

export const SIZE_NAMES = {
  "002": "XS",
  "003": "S",
  "004": "M",
} as const;

export const COLOR_CODE_TO_HEX: Record<string, string> = {
  COL00: "#ffffff",
  COL01: "#ffffff",
  COL02: "#dedede",
  COL03: "#dedede",
  COL04: "#dedede",
  COL05: "#dedede",
  COL06: "#dedede",
  COL07: "#dedede",
  COL08: "#dedede",
  COL09: "#3d3d3d",
  COL10: "#f5c0c9",
  COL11: "#f5c0c9",
  COL12: "#f5c0c9",
  COL13: "#eb3417",
  COL14: "#eb3417",
  COL15: "#eb3417",
  COL16: "#eb3417",
  COL17: "#eb3417",
  COL18: "#eb3417",
  COL19: "#eb3417",
  COL22: "#f3a72c",
  COL25: "#f3a72c",
  COL26: "#f3a72c",
  COL27: "#f3a72c",
  COL29: "#f3a72c",
  COL30: "#efebd4",
  COL31: "#efebd4",
  COL32: "#efebd4",
  COL33: "#714e36",
  COL34: "#714e36",
  COL35: "#714e36",
  COL36: "#714e36",
  COL37: "#714e36",
  COL38: "#714e36",
  COL39: "#714e36",
  COL41: "#ffff3f",
  COL42: "#ffff3f",
  COL46: "#ffff3f",
  COL47: "#ffff3f",
  COL48: "#ffff3f",
  COL51: "#387d1f",
  COL52: "#387d1f",
  COL53: "#387d1f",
  COL54: "#387d1f",
  COL55: "#387d1f",
  COL56: "#387d1f",
  COL57: "#387d1f",
  COL58: "#387d1f",
  COL59: "#387d1f",
  COL60: "#0003f9",
  COL61: "#0003f9",
  COL62: "#0003f9",
  COL63: "#0003f9",
  COL64: "#0003f9",
  COL65: "#0003f9",
  COL66: "#0003f9",
  COL67: "#0003f9",
  COL68: "#0003f9",
  COL69: "#0003f9",
  COL71: "#741a7c",
  COL72: "#741a7c",
  COL73: "#741a7c",
  COL77: "#741a7c",
  COL78: "#741a7c",
  COL79: "#741a7c",
};
