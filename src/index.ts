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
    console.log(`Store ID: ${config.storeId}`);
    console.log(`Gender ID: ${config.genderId}`);

    console.log("\n--- Fetching Products ---");
    const products = await fetchAllProducts(config.storeId, config.genderId);
    console.log(`Total products fetched: ${products.length}`);

    console.log("\n--- Filtering Products with Stock Check ---");
    const qualifyingProducts = await filterProducts(
      products,
      config.discountThreshold,
      config.storeId,
      fetchProductStock
    );
    console.log(`Products meeting criteria: ${qualifyingProducts.length}`);

    if (qualifyingProducts.length > 0) {
      console.log("\n--- Sending Notification Email ---");
      console.log("Qualifying products:");
      qualifyingProducts.forEach((fp, index) => {
        console.log(
          `  ${index + 1}. ${fp.product.name} - ${fp.discountPercentage}% off`
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
