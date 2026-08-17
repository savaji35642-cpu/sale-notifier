import { Config } from "../types/product";

const CATEGORY_TO_GENDER_ID: Record<string, string> = {
  men: "37609",
  women: "37608",
  kids: "37611",
};

export function loadConfig(): Config {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const recipientEmail = process.env.RECIPIENT_EMAIL;

  if (!gmailUser) {
    throw new Error("GMAIL_USER environment variable is required");
  }

  if (!gmailAppPassword) {
    throw new Error("GMAIL_APP_PASSWORD environment variable is required");
  }

  if (!recipientEmail) {
    throw new Error("RECIPIENT_EMAIL environment variable is required");
  }

  if (!process.env.API_BASE_URL) {
    throw new Error("API_BASE_URL environment variable is required");
  }

  if (!process.env.PRODUCT_BASE_URL) {
    throw new Error("PRODUCT_BASE_URL environment variable is required");
  }

  const discountThreshold = process.env.DISCOUNT_THRESHOLD
    ? parseInt(process.env.DISCOUNT_THRESHOLD, 10)
    : 55;

  if (
    isNaN(discountThreshold) ||
    discountThreshold < 0 ||
    discountThreshold > 100
  ) {
    throw new Error("DISCOUNT_THRESHOLD must be a number between 0 and 100");
  }

  const storeIdsEnv = process.env.STORE_IDS || "120126,107303,115747,113150";
  const storeIds = storeIdsEnv
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (storeIds.length === 0) {
    throw new Error("STORE_IDS must contain at least one store ID");
  }

  const categoriesEnv = process.env.CATEGORIES || "men,women,kids";
  const categories = categoriesEnv
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter((c) => c.length > 0);

  if (categories.length === 0) {
    throw new Error("CATEGORIES must contain at least one category");
  }

  const genderIds: string[] = [];
  for (const category of categories) {
    const genderId = CATEGORY_TO_GENDER_ID[category];
    if (!genderId) {
      throw new Error(
        `Unknown category "${category}" in CATEGORIES — valid options are: ${Object.keys(
          CATEGORY_TO_GENDER_ID,
        ).join(", ")}`,
      );
    }
    if (!genderIds.includes(genderId)) {
      genderIds.push(genderId);
    }
  }

  return {
    discountThreshold,
    gmailUser,
    gmailAppPassword,
    recipientEmail,
    storeIds,
    categories,
    genderIds,
  };
}
