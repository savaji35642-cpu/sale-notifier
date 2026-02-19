import "dotenv/config";
import { loadConfig } from "./utils/config";
import { fetchAllProducts, fetchProductStock } from "./api/uniqlo";
import { filterProducts, meetsDiscountThreshold } from "./services/filter";
import { sendNotificationEmail, sendErrorEmail } from "./services/email";
import { Config, Product } from "./types/product";

async function main() {
  let config: Config | undefined;

  try {
    console.log("=== Uniqlo Sale Notifier Started ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);

    config = loadConfig();
    console.log("Configuration loaded successfully");
    console.log(`Discount threshold: ${config.discountThreshold}%`);
    console.log(`Store IDs: ${config.storeIds.join(", ")}`);
    console.log(`Gender ID: ${config.genderId}`);

    console.log("\n--- Fetching Products from All Stores (in parallel) ---");
    const fetchPromises = config.storeIds.map(async (storeId) => {
      console.log(`Starting fetch from store ${storeId}...`);
      const storeProducts = await fetchAllProducts(storeId, config!.genderId);
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
    const uniqueProductsMap = new Map<string, Product>();
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
    const discountQualifyingProducts = uniqueProducts.filter((product) =>
      meetsDiscountThreshold(product, config!.discountThreshold),
    );
    console.log(
      `Products meeting discount threshold (${config.discountThreshold}%): ${discountQualifyingProducts.length}`,
    );

    console.log("\n--- Checking Stock for Qualifying Products ---");
    const qualifyingProducts = await filterProducts(
      discountQualifyingProducts,
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
    } else {
      console.log("\n--- No Qualifying Products ---");
      console.log("No email will be sent");
    }

    console.log("\n=== Bot Run Completed Successfully ===");
    process.exit(0);
  } catch (error) {
    console.error("\n=== Bot Encountered an Error ===");
    console.error("Error details:", error);

    if (config) {
      try {
        console.log("\nAttempting to send error notification email...");
        await sendErrorEmail(error as Error, config);
        console.log("Error notification email sent successfully");
      } catch (emailError) {
        console.error("Failed to send error notification email:", emailError);
      }
    }

    console.error("\n=== Bot Execution Failed ===");
    process.exit(1);
  }
}

main();
