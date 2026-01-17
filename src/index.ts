import "dotenv/config";
import { loadConfig } from "./utils/config";
import { fetchAllProducts, fetchProductStock } from "./api/uniqlo";
import { filterProducts } from "./services/filter";
import { sendNotificationEmail, sendErrorEmail } from "./services/email";

async function main() {
  try {
    console.log("=== Uniqlo Sale Notifier Started ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);

    const config = loadConfig();
    console.log("Configuration loaded successfully");
    console.log(`Discount threshold: ${config.discountThreshold}%`);
    console.log(`Store IDs: ${config.storeIds.join(", ")}`);
    console.log(`Gender ID: ${config.genderId}`);

    console.log("\n--- Fetching Products from All Stores (in parallel) ---");
    const fetchPromises = config.storeIds.map(async (storeId) => {
      console.log(`Starting fetch from store ${storeId}...`);
      const storeProducts = await fetchAllProducts(storeId, config.genderId);
      console.log(
        `  Fetched ${storeProducts.length} products from store ${storeId}`,
      );
      return storeProducts;
    });

    const storeResults = await Promise.all(fetchPromises);
    const allProducts = storeResults.flat();
    console.log(
      `Total products fetched from all stores: ${allProducts.length}`,
    );

    console.log("\n--- Deduplicating Products ---");
    const uniqueProductsMap = new Map();
    for (const product of allProducts) {
      if (!uniqueProductsMap.has(product.productId)) {
        uniqueProductsMap.set(product.productId, product);
      }
    }
    const uniqueProducts = Array.from(uniqueProductsMap.values());
    console.log(
      `Unique products after deduplication: ${uniqueProducts.length}`,
    );

    console.log("\n--- Pre-filtering by Discount Threshold ---");
    const discountQualifyingProducts = uniqueProducts.filter((product) => {
      if (!product.prices || !product.prices.base || !product.prices.promo) {
        return false;
      }
      if (!product.prices.isDualPrice) {
        return false;
      }
      const basePrice = product.prices.base.value;
      const promoPrice = product.prices.promo.value;
      const discount = ((basePrice - promoPrice) / basePrice) * 100;
      return discount >= config.discountThreshold;
    });
    console.log(
      `Products meeting discount threshold (${config.discountThreshold}%): ${discountQualifyingProducts.length}`,
    );

    console.log("\n--- Checking Stock for Qualifying Products ---");
    const qualifyingProducts = await filterProducts(
      discountQualifyingProducts,
      config.discountThreshold,
      config.storeIds[0],
      fetchProductStock,
    );
    console.log(`Products meeting all criteria: ${qualifyingProducts.length}`);

    if (qualifyingProducts.length > 0) {
      console.log("\n--- Sending Notification Email ---");
      console.log("Qualifying products:");
      qualifyingProducts.forEach((fp, index) => {
        console.log(
          `  ${index + 1}. ${fp.product.name} - ${fp.discountPercentage}% off`,
        );
      });

      await sendNotificationEmail(qualifyingProducts, config);
      console.log("Email sent successfully");
    } else {
      console.log("\n--- No Qualifying Products ---");
      console.log("No email will be sent");
    }

    console.log("\n=== Bot Run Completed Successfully ===");
    process.exit(0);
  } catch (error) {
    console.error("\n=== Bot Encountered an Error ===");
    console.error("Error details:", error);

    try {
      const config = loadConfig();
      console.log("\nAttempting to send error notification email...");
      await sendErrorEmail(error as Error, config);
      console.log("Error notification email sent successfully");
    } catch (emailError) {
      console.error("Failed to send error notification email:", emailError);
    }

    console.error("\n=== Bot Execution Failed ===");
    process.exit(1);
  }
}

main();
