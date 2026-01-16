import { Config } from '../types/product';

export function loadConfig(): Config {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const recipientEmail = process.env.RECIPIENT_EMAIL;

  if (!gmailUser) {
    throw new Error('GMAIL_USER environment variable is required');
  }

  if (!gmailAppPassword) {
    throw new Error('GMAIL_APP_PASSWORD environment variable is required');
  }

  if (!recipientEmail) {
    throw new Error('RECIPIENT_EMAIL environment variable is required');
  }

  const discountThreshold = process.env.DISCOUNT_THRESHOLD
    ? parseInt(process.env.DISCOUNT_THRESHOLD, 10)
    : 70;

  if (isNaN(discountThreshold) || discountThreshold < 0 || discountThreshold > 100) {
    throw new Error('DISCOUNT_THRESHOLD must be a number between 0 and 100');
  }

  const storeId = process.env.STORE_ID || '120126';
  const genderId = process.env.GENDER_ID || '37609';

  return {
    discountThreshold,
    gmailUser,
    gmailAppPassword,
    recipientEmail,
    storeId,
    genderId,
  };
}
