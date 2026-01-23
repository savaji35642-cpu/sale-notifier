import nodemailer from "nodemailer";
import { FilteredProduct, COLOR_CODE_TO_HEX } from "../types/product";
import { Config } from "../types/product";

export function createTransporter(config: Config) {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: config.gmailUser,
      pass: config.gmailAppPassword,
    },
  });
}

function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

export function generateProductLink(
  filteredProduct: FilteredProduct,
  sizeCode: string,
): string {
  const { product } = filteredProduct;
  const baseUrl = "https://www.uniqlo.com/de/en/products";
  const productId = product.productId;
  const priceGroup = product.priceGroup;
  const colorCode = product.representativeColorDisplayCode;

  return `${baseUrl}/${productId}/${priceGroup}?colorDisplayCode=${colorCode}&sizeDisplayCode=${sizeCode}`;
}

export function buildEmailHTML(
  products: FilteredProduct[],
  discountThreshold: number,
): string {
  const productRows = products
    .map((filteredProduct) => {
      const { product, availableSizes, discountPercentage } = filteredProduct;
      const basePrice = product.prices.base.value.toFixed(2);
      const promoPrice = product.prices.promo.value.toFixed(2);
      const currency = product.prices.base.currency.symbol;

      const representativeColor = product.colors.find(
        (c) => c.displayCode === product.representativeColorDisplayCode,
      );
      const colorCode = representativeColor?.code || "";
      const buttonColor = COLOR_CODE_TO_HEX[colorCode] || "#007bff";
      const textColor = isLightColor(buttonColor) ? "#000000" : "#ffffff";

      const sizeLinks = availableSizes
        .map((size) => {
          const url = generateProductLink(filteredProduct, size.sizeCode);
          return `<a href="${url}" style="display: inline-block; margin: 4px; padding: 8px 16px; background-color: ${buttonColor}; color: ${textColor}; text-decoration: none; border-radius: 4px; font-weight: bold;">${size.sizeName}</a>`;
        })
        .join("");

      const imageUrl =
        product.images?.main?.[product.representativeColorDisplayCode]?.image ||
        "";
      const imageTag = imageUrl
        ? `<img src="${imageUrl}" alt="${product.name}" style="max-width: 150px; height: auto; border-radius: 8px; margin-bottom: 12px;">`
        : "";

      return `
        <tr>
          <td style="padding: 20px; border-bottom: 1px solid #e0e0e0;">
            ${imageTag}
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">${product.name}</h3>
            <p style="margin: 8px 0;">
              <span style="text-decoration: line-through; color: #999; font-size: 16px;">${currency}${basePrice}</span>
              <span style="color: #e74c3c; font-weight: bold; font-size: 20px; margin-left: 12px;">${currency}${promoPrice}</span>
              <span style="background-color: #e74c3c; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; margin-left: 12px; font-size: 14px;">${discountPercentage}% OFF</span>
            </p>
            <p style="margin: 12px 0 4px 0; color: #666; font-size: 14px;">Available sizes:</p>
            <div style="margin-top: 8px;">
              ${sizeLinks}
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Uniqlo Sale Alert</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0; text-align: center;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 30px; text-align: center; background-color: #e74c3c; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: white; font-size: 28px;">🔥 Uniqlo Sale Alert</h1>
                  <p style="margin: 8px 0 0 0; color: white; font-size: 16px;">${
                    products.length
                  } product${
                    products.length !== 1 ? "s" : ""
                  } with ${discountThreshold}%+ discount</p>
                </td>
              </tr>
              ${productRows}
              <tr>
                <td style="padding: 20px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0; color: #666; font-size: 14px;">This is an automated notification from your Uniqlo Sale Notifier bot.</p>
                  <p style="margin: 8px 0 0 0; color: #999; font-size: 12px;">Prices and availability are subject to change.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendNotificationEmail(
  products: FilteredProduct[],
  config: Config,
): Promise<void> {
  try {
    const transporter = createTransporter(config);
    const htmlContent = buildEmailHTML(products, config.discountThreshold);
    const subject = `Uniqlo Sale Alert: ${products.length} products with ${config.discountThreshold}%+ discount`;

    await transporter.sendMail({
      from: config.gmailUser,
      to: config.recipientEmail,
      subject: subject,
      html: htmlContent,
    });

    console.log("Notification email sent successfully");
  } catch (error) {
    console.error("Failed to send notification email:", error);
  }
}

export async function sendErrorEmail(
  error: Error,
  config: Config,
): Promise<void> {
  const transporter = createTransporter(config);
  const timestamp = new Date().toISOString();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Uniqlo Bot Error</title>
    </head>
    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #e74c3c; margin-top: 0;">⚠️ Uniqlo Bot Error</h1>
        <p style="color: #666; font-size: 14px;"><strong>Timestamp:</strong> ${timestamp}</p>
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #856404;">Error Message:</h3>
          <p style="margin: 0; color: #856404; font-family: monospace;">${
            error.message
          }</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0;">Stack Trace:</h3>
          <pre style="margin: 0; font-size: 12px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;">${
            error.stack || "No stack trace available"
          }</pre>
        </div>
        <p style="color: #666; font-size: 14px;">The bot has stopped execution. Please investigate and resolve the issue.</p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: config.gmailUser,
    to: config.recipientEmail,
    subject: `Uniqlo Bot Error - ${timestamp}`,
    html: htmlContent,
  });

  console.log("Error notification email sent");
}
