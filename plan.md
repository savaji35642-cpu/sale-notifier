# Uniqlo Sale Notifier - Technical Specification

## Overview
A 24/7 automated bot that monitors Uniqlo's German store for men's sale items with 70%+ discounts in sizes XS, S, or M, and sends email notifications every 30 minutes when qualifying products are found.

## Core Requirements

### 1. Monitoring Schedule
- **Frequency**: Every 30 minutes, 24/7
- **Target URL**: https://www.uniqlo.com/de/en/feature/sale/men
- **API Endpoint**: https://www.uniqlo.com/de/api/commerce/v5/en/products
- **Store**: German store (storeId=120126)
- **Gender**: Men's products (genderId=37609)

### 2. Product Filtering Criteria

#### Size Requirements
- **Excluded Sizes**: L, XL, XXL, 3XL (SMA005, SMA006, SMA007, SMA008)
- **Accepted Sizes**: Any size not in the excluded list (e.g. XS, S, M, XXS, inch sizes, one-size)
- **Availability**: Must be in stock and purchasable
- **API Filter**: `inventoryCondition=1` (includes both online and physical store inventory)
- **Color**: Any color acceptable

#### Discount Calculation
- **Threshold**: 70% or greater discount
- **Formula**: `((base.value - promo.value) / base.value) * 100 >= 70`
- **Price Fields**:
  - `prices.base.value` = original price
  - `prices.promo.value` = discounted price
- **Configuration**: Discount threshold stored as environment variable for easy adjustment
- **Note**: `discountPercentage` field may be null, always calculate from base/promo values

### 3. Data Handling

#### Pagination Strategy
- **Approach**: Fetch ALL pages of sale items
- **API Parameters**: 
  - `offset`: Starting position (0, 36, 72, ...)
  - `limit`: 36 items per page
- **Rate Limiting**: Add reasonable delay between page requests (e.g., 1-2 seconds)
- **Termination**: Continue until API returns no more items

#### State Management
- **No persistence**: No database or state tracking
- **Stateless operation**: Each run is independent
- **Duplicate notifications**: Acceptable - user receives full list every 30 minutes if products qualify

### 4. Email Notifications

#### Delivery Service
- **Provider**: Gmail SMTP (free)
- **Rate Limit**: ~100-500 emails/day (sufficient for 48 runs/day)
- **Failure Handling**: Skip notification if email service fails or hits rate limit

#### Email Structure
- **Format**: Single digest email per run
- **Subject**: `Uniqlo Sale Alert: X products with 70%+ discount` (X = count)
- **Empty Results**: Send nothing if no products qualify

#### Email Content (per product)
- Product name
- Original price (€)
- Sale price (€)
- Discount percentage
- Purchase links (one per available size in XS/S/M)

#### Product Link Format
```
https://www.uniqlo.com/de/en/products/{productId}/{priceGroup}?colorDisplayCode={colorCode}&sizeDisplayCode={sizeCode}
```

**Example**:
```
https://www.uniqlo.com/de/en/products/E470077-000/00?colorDisplayCode=09&sizeDisplayCode=004
```

**Fields from API**:
- `productId`: e.g., "E470077-000"
- `priceGroup`: e.g., "00"
- `colorDisplayCode`: Representative color code (e.g., "09")
- `sizeDisplayCode`: Size code (002=XS, 003=S, 004=M)

### 5. Error Handling & Monitoring

#### Error Scenarios
- API down or unreachable
- Malformed API response
- API structure changes
- Network timeouts
- Email service failures

#### Error Response
- **Action**: Send error notification email to user
- **Bot Behavior**: Stop execution (fail the GitHub Action run)
- **Error Email Content**: Include error details and timestamp

#### Health Check
- **Type**: Simple health monitoring
- **Implementation**: Log successful runs to GitHub Actions logs
- **Optional**: Weekly summary email (if easy to implement)

### 6. Technical Stack

#### Runtime Environment
- **Platform**: GitHub Actions (free tier)
- **Language**: TypeScript/Node.js
- **Scheduler**: GitHub Actions cron syntax
- **Cost**: $0 (completely free)

#### Key Dependencies
- **HTTP Client**: axios or node-fetch for API requests
- **Email**: nodemailer with Gmail SMTP
- **Type Safety**: TypeScript with strict mode

#### Configuration (Environment Variables)
- `DISCOUNT_THRESHOLD`: Discount percentage threshold (default: 70)
- `GMAIL_USER`: Gmail address for sending notifications
- `GMAIL_APP_PASSWORD`: Gmail app-specific password
- `RECIPIENT_EMAIL`: Email address to receive notifications
- `STORE_ID`: Uniqlo store ID (default: 120126)
- `GENDER_ID`: Gender category ID (default: 37609)

### 7. API Response Structure

#### Key Fields Used
```typescript
interface Product {
  l1Id: string;                    // Product ID
  productId: string;                // Full product ID (e.g., "E470077-000")
  priceGroup: string;               // Price group (e.g., "00")
  name: string;                     // Product name
  prices: {
    base: {
      currency: { code: string; symbol: string; };
      value: number;                // Original price
    };
    promo: {
      currency: { code: string; symbol: string; };
      value: number;                // Sale price
    };
    isDualPrice: boolean;
    discountPercentage: number | null;
  };
  colors: Array<{
    code: string;
    displayCode: string;
    name: string;
  }>;
  representativeColorDisplayCode: string;
  // Size/stock information in nested structure
}
```

### 8. Workflow Logic

#### Execution Flow
1. **Initialize**: Load environment variables and configuration
2. **Fetch Products**: 
   - Start with offset=0
   - Fetch page from API
   - Add delay (1-2 seconds)
   - Increment offset by 36
   - Repeat until no more items
3. **Filter Products**:
   - Calculate discount percentage
   - Check if >= threshold
   - Verify sizes XS/S/M are in stock
4. **Build Email**:
   - Format product list with all required details
   - Generate size-specific purchase links
   - Create HTML email template
5. **Send Notification**:
   - If products found: Send email with digest
   - If no products: Skip email
   - If error: Send error notification and fail
6. **Complete**: Log success and exit

#### Retry Logic
- No retries for API failures (send error email and stop)
- No retries for email failures (skip notification)

### 9. Future Considerations (Not Implemented Initially)

- Multi-region support (other Uniqlo stores)
- Women's/kids' categories
- Price range filters
- Product category filters
- Webhook notifications (Discord, Slack, etc.)
- Historical price tracking
- Database for seen products

### 10. Deployment

#### GitHub Actions Setup
- **File**: `.github/workflows/uniqlo-notifier.yml`
- **Cron Schedule**: `*/30 * * * *` (every 30 minutes)
- **Secrets Required**:
  - `GMAIL_USER`
  - `GMAIL_APP_PASSWORD`
  - `RECIPIENT_EMAIL`
  - `DISCOUNT_THRESHOLD` (optional, defaults to 70)

#### Repository Structure
```
/
├── .github/
│   └── workflows/
│       └── uniqlo-notifier.yml
├── src/
│   ├── index.ts              # Main entry point
│   ├── api/
│   │   └── uniqlo.ts         # API client
│   ├── services/
│   │   ├── filter.ts         # Product filtering logic
│   │   └── email.ts          # Email service
│   ├── types/
│   │   └── product.ts        # TypeScript interfaces
│   └── utils/
│       └── config.ts         # Configuration loader
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Success Criteria

- ✅ Bot runs automatically every 30 minutes
- ✅ Correctly identifies products with 70%+ discount
- ✅ Filters for XS/S/M sizes only
- ✅ Sends email only when qualifying products exist
- ✅ Email contains all required product information
- ✅ Generates working purchase links for each size
- ✅ Handles errors gracefully with notifications
- ✅ Operates completely free on GitHub Actions
- ✅ No manual intervention required for normal operation

---

## Step-by-Step Implementation Plan

### Phase 1: Project Setup

#### Step 1.1: Initialize Project Structure
```bash
mkdir uniqlo-sale-notifier
cd uniqlo-sale-notifier
npm init -y
```

#### Step 1.2: Install Dependencies
```bash
npm install axios nodemailer
npm install -D typescript @types/node @types/nodemailer ts-node
```

#### Step 1.3: Configure TypeScript
Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

#### Step 1.4: Create Directory Structure
```bash
mkdir -p src/{api,services,types,utils}
mkdir -p .github/workflows
```

### Phase 2: Type Definitions

#### Step 2.1: Create Product Types (`src/types/product.ts`)
Define TypeScript interfaces for:
- `Product` - Main product interface
- `Price` - Price structure (base/promo)
- `Color` - Color information
- `ApiResponse` - API response wrapper
- `FilteredProduct` - Product with available sizes
- `ProductLink` - Product link with size info

Key interfaces:
```typescript
interface Product {
  l1Id: string;
  productId: string;
  priceGroup: string;
  name: string;
  prices: {
    base: { currency: { code: string; symbol: string }; value: number };
    promo: { currency: { code: string; symbol: string }; value: number };
    isDualPrice: boolean;
    discountPercentage: number | null;
  };
  representativeColorDisplayCode: string;
  // Add size/stock fields after API exploration
}
```

### Phase 3: Configuration Management

#### Step 3.1: Create Config Loader (`src/utils/config.ts`)
Load and validate environment variables:
- `DISCOUNT_THRESHOLD` (default: 70)
- `GMAIL_USER` (required)
- `GMAIL_APP_PASSWORD` (required)
- `RECIPIENT_EMAIL` (required)
- `STORE_ID` (default: 120126)
- `GENDER_ID` (default: 37609)

Implement validation to fail fast if required vars are missing.

#### Step 3.2: Create `.env.example`
Document all required environment variables with descriptions.

### Phase 4: API Client

#### Step 4.1: Create Uniqlo API Client (`src/api/uniqlo.ts`)

**Functions to implement:**

1. **`fetchProductPage(offset: number, limit: number)`**
   - Construct API URL with all required parameters
   - Add size filter: `sizeCodes=SMA002,SMA003,SMA004`
   - Include: `inventoryCondition=1`, `flagCodes=discount`
   - Handle HTTP errors and timeouts
   - Return typed response

2. **`fetchAllProducts()`**
   - Start with offset=0
   - Loop: fetch page, add to results, increment offset
   - Add 1-2 second delay between requests
   - Break when no more items returned
   - Return complete product list

3. **Error handling:**
   - Network errors
   - Invalid JSON responses
   - HTTP status codes (4xx, 5xx)
   - Timeout handling (30 second timeout per request)

### Phase 5: Product Filtering Logic

#### Step 5.1: Create Filter Service (`src/services/filter.ts`)

**Functions to implement:**

1. **`calculateDiscount(basePrice: number, promoPrice: number): number`**
   - Formula: `((base - promo) / base) * 100`
   - Handle edge cases (base = 0, promo > base)
   - Return rounded percentage

2. **`meetsDiscountThreshold(product: Product, threshold: number): boolean`**
   - Calculate discount from prices.base.value and prices.promo.value
   - Return true if >= threshold

3. **`extractAvailableSizes(product: Product): string[]`**
   - Parse product data to find available sizes
   - Filter for SMA002 (XS), SMA003 (S), SMA004 (M)
   - Check stock availability for each size
   - Return array of available size codes

4. **`filterProducts(products: Product[], threshold: number): FilteredProduct[]`**
   - Filter by discount threshold
   - Filter by size availability (must have at least one of XS/S/M)
   - Map to FilteredProduct with available sizes included
   - Return filtered list

### Phase 6: Email Service

#### Step 6.1: Create Email Service (`src/services/email.ts`)

**Functions to implement:**

1. **`createTransporter()`**
   - Configure nodemailer with Gmail SMTP
   - Host: smtp.gmail.com
   - Port: 587 (TLS) or 465 (SSL)
   - Auth: GMAIL_USER and GMAIL_APP_PASSWORD

2. **`generateProductLink(product: FilteredProduct, sizeCode: string): string`**
   - Format: `https://www.uniqlo.com/de/en/products/{productId}/{priceGroup}?colorDisplayCode={color}&sizeDisplayCode={size}`
   - Map size codes: 002=XS, 003=S, 004=M

3. **`buildEmailHTML(products: FilteredProduct[]): string`**
   - Create HTML email template
   - Header with count
   - Product list with:
     - Product name (bold)
     - Original price (strikethrough)
     - Sale price (bold, colored)
     - Discount percentage (badge)
     - Links for each available size (buttons)
   - Responsive design
   - Professional styling

4. **`sendNotificationEmail(products: FilteredProduct[]): Promise<void>`**
   - Subject: `Uniqlo Sale Alert: ${products.length} products with 70%+ discount`
   - Generate HTML body
   - Send email via transporter
   - Handle email errors (log and skip, don't throw)

5. **`sendErrorEmail(error: Error): Promise<void>`**
   - Subject: `Uniqlo Bot Error - ${new Date().toISOString()}`
   - Include error message, stack trace, timestamp
   - Send to RECIPIENT_EMAIL
   - This should throw if it fails (critical error)

### Phase 7: Main Application Logic

#### Step 7.1: Create Main Entry Point (`src/index.ts`)

**Main execution flow:**

```typescript
async function main() {
  try {
    // 1. Load configuration
    const config = loadConfig();
    
    // 2. Fetch all products from API
    console.log('Fetching products from Uniqlo API...');
    const allProducts = await fetchAllProducts();
    console.log(`Fetched ${allProducts.length} total products`);
    
    // 3. Filter products by discount and size
    console.log('Filtering products...');
    const qualifyingProducts = filterProducts(
      allProducts, 
      config.discountThreshold
    );
    console.log(`Found ${qualifyingProducts.length} qualifying products`);
    
    // 4. Send notification if products found
    if (qualifyingProducts.length > 0) {
      console.log('Sending notification email...');
      await sendNotificationEmail(qualifyingProducts);
      console.log('Email sent successfully');
    } else {
      console.log('No qualifying products found, skipping email');
    }
    
    // 5. Success
    console.log('Bot run completed successfully');
    process.exit(0);
    
  } catch (error) {
    // 6. Error handling
    console.error('Bot encountered an error:', error);
    
    try {
      await sendErrorEmail(error as Error);
      console.log('Error notification sent');
    } catch (emailError) {
      console.error('Failed to send error email:', emailError);
    }
    
    process.exit(1);
  }
}

main();
```

### Phase 8: GitHub Actions Workflow

#### Step 8.1: Create Workflow File (`.github/workflows/uniqlo-notifier.yml`)

```yaml
name: Uniqlo Sale Notifier

on:
  schedule:
    # Run every 30 minutes
    - cron: '*/30 * * * *'
  workflow_dispatch: # Allow manual triggers

jobs:
  notify:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build TypeScript
        run: npm run build
      
      - name: Run notifier
        env:
          DISCOUNT_THRESHOLD: ${{ secrets.DISCOUNT_THRESHOLD || '70' }}
          GMAIL_USER: ${{ secrets.GMAIL_USER }}
          GMAIL_APP_PASSWORD: ${{ secrets.GMAIL_APP_PASSWORD }}
          RECIPIENT_EMAIL: ${{ secrets.RECIPIENT_EMAIL }}
          STORE_ID: '120126'
          GENDER_ID: '37609'
        run: npm start
```

#### Step 8.2: Update `package.json` Scripts
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "ts-node src/index.ts"
  }
}
```

### Phase 9: Testing & Validation

#### Step 9.1: Local Testing
1. Create `.env` file with test credentials
2. Run `npm run dev` to test locally
3. Verify API fetching works
4. Test with different discount thresholds
5. Verify email formatting and links

#### Step 9.2: API Response Exploration
1. Fetch actual API response
2. Identify size/stock fields in JSON
3. Update TypeScript interfaces accordingly
4. Implement size extraction logic

#### Step 9.3: Email Template Testing
1. Test HTML rendering in different email clients
2. Verify links work correctly
3. Test with 1 product, multiple products, many products
4. Ensure responsive design

### Phase 10: Deployment

#### Step 10.1: Setup GitHub Repository
1. Create new GitHub repository
2. Push code to repository
3. Make repository public (for free Actions minutes) or keep private

#### Step 10.2: Configure GitHub Secrets
Navigate to Settings > Secrets and variables > Actions, add:
- `GMAIL_USER`: Your Gmail address
- `GMAIL_APP_PASSWORD`: Gmail app-specific password
- `GMAIL_APP_PASSWORD`: Gmail app-specific password
- `RECIPIENT_EMAIL`: Email to receive notifications
- `DISCOUNT_THRESHOLD`: (optional) Default is 70

#### Step 10.3: Setup Gmail App Password
1. Enable 2FA on Gmail account
2. Go to Google Account > Security > 2-Step Verification > App passwords
3. Generate new app password for "Mail"
4. Copy password to GitHub secrets

#### Step 10.4: Enable GitHub Actions
1. Go to Actions tab in repository
2. Enable workflows if disabled
3. Manually trigger workflow to test
4. Verify cron schedule is active

### Phase 11: Monitoring & Maintenance

#### Step 11.1: Initial Monitoring
- Check GitHub Actions logs for first few runs
- Verify emails are received
- Confirm product links work
- Monitor for any errors

#### Step 11.2: Ongoing Maintenance
- Review Actions usage (should be well within free tier)
- Check email delivery success rate
- Update if Uniqlo changes API structure
- Adjust discount threshold as needed

### Phase 12: Documentation

#### Step 12.1: Create README.md
Include:
- Project description
- Setup instructions
- Environment variables documentation
- Gmail app password setup guide
- Deployment instructions
- Troubleshooting section

#### Step 12.2: Add Comments
- Document complex logic
- Explain API parameters
- Note any assumptions or limitations

---

## Implementation Checklist

- [ ] Phase 1: Project setup and dependencies
- [ ] Phase 2: TypeScript type definitions
- [ ] Phase 3: Configuration management
- [ ] Phase 4: API client implementation
- [ ] Phase 5: Product filtering logic
- [ ] Phase 6: Email service
- [ ] Phase 7: Main application logic
- [ ] Phase 8: GitHub Actions workflow
- [ ] Phase 9: Local testing and validation
- [ ] Phase 10: Deployment to GitHub
- [ ] Phase 11: Monitoring setup
- [ ] Phase 12: Documentation

## Estimated Timeline

- **Development**: 4-6 hours
- **Testing**: 1-2 hours
- **Deployment**: 30 minutes
- **Total**: 6-9 hours

## Next Steps

1. Start with Phase 1: Initialize project and install dependencies
2. Explore actual API response to understand size/stock data structure
3. Implement core functionality (Phases 2-7)
4. Test locally with real API calls
5. Deploy to GitHub Actions
6. Monitor first 24 hours of operation
