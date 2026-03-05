import "dotenv/config";
import { loadConfig } from "./utils/config";
import { fetchAllProducts, fetchProductStock } from "./api/client";
import { filterProducts, meetsDiscountThreshold } from "./services/filter";
import { sendNotificationEmail, sendErrorEmail } from "./services/email";
import { Config, Product } from "./types/product";

async function main() {
  let config: Config | undefined;

  try {
    console.log("=== Sale Notifier Started ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);

    config = loadConfig();
    console.log("Configuration loaded successfully");
    console.log(`Discount threshold: ${config.discountThreshold}%`);
    console.log(`Store IDs: ${config.storeIds.join(", ")}`);
    console.log(`Gender ID: ${config.genderId}`);

    console.log("\n--- Fetching Products from All Stores (in parallel) ---");
    const fetchPromises = config.storeIds.map((storeId) =>
      fetchAllProducts(storeId, config!.genderId).then((products) => ({
        storeId,
        products,
      })),
    );

    const storeResults = await Promise.allSettled(fetchPromises);
    const successfulResults: Array<{ storeId: string; products: Product[] }> =
      [];
    for (const result of storeResults) {
      if (result.status === "fulfilled") {
        successfulResults.push(result.value);
      } else {
        console.warn(`Store fetch failed: ${result.reason}`);
      }
    }

    if (successfulResults.length === 0) {
      throw new Error("All store fetches failed — no products to process");
    }

    const totalFetched = successfulResults.reduce(
      (sum, r) => sum + r.products.length,
      0,
    );
    console.log(`Total products fetched from all stores: ${totalFetched}`);

    console.log("\n--- Deduplicating Products ---");
    const uniqueProductsMap = new Map<
      string,
      { product: Product; storeId: string }
    >();
    for (const { storeId, products } of successfulResults) {
      for (const product of products) {
        if (!uniqueProductsMap.has(product.productId)) {
          uniqueProductsMap.set(product.productId, { product, storeId });
        }
      }
    }
    const uniqueEntries = Array.from(uniqueProductsMap.values());
    console.log(`Unique products after deduplication: ${uniqueEntries.length}`);

    console.log("\n--- Pre-filtering by Discount Threshold ---");
    const discountQualifyingEntries = uniqueEntries.filter(({ product }) =>
      meetsDiscountThreshold(product, config!.discountThreshold),
    );
    console.log(
      `Products meeting discount threshold (${config.discountThreshold}%): ${discountQualifyingEntries.length}`,
    );

    console.log("\n--- Checking Stock for Qualifying Products ---");
    const qualifyingProducts = await filterProducts(
      discountQualifyingEntries,
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

    console.log("\n=== Run Completed Successfully ===");
    process.exit(0);
  } catch (error) {
    console.error("\n=== Encountered an Error ===");
    console.error("Error details:", error);

    if (config) {
      try {
        console.log("\nAttempting to send error notification email...");
        const err =
          error instanceof Error ? error : new Error(String(error));
        await sendErrorEmail(err, config);
        console.log("Error notification email sent successfully");
      } catch (emailError) {
        console.error("Failed to send error notification email:", emailError);
      }
    }

    console.error("\n=== Execution Failed ===");
    process.exit(1);
  }
}

main();
