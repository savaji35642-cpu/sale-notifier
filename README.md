# Uniqlo Sale Notifier

Automated bot that monitors Uniqlo's German store for men's sale items with 70%+ discounts in sizes XS, S, or M, and sends email notifications every 30 minutes.

## Features

- 🔄 Runs automatically every 30 minutes via GitHub Actions
- 📧 Email notifications with product details and purchase links
- 🎯 Filters for 70%+ discounts (configurable)
- 👕 Monitors sizes XS, S, and M only
- 💰 Completely free to run (GitHub Actions + Gmail SMTP)
- 🚨 Error notifications if bot encounters issues

## Setup Instructions

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd uniqlo-sale-notifier
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Gmail App Password

1. Enable 2-Factor Authentication on your Gmail account
2. Go to [Google Account Security](https://myaccount.google.com/security)
3. Navigate to: **2-Step Verification** → **App passwords**
4. Generate a new app password for "Mail"
5. Copy the 16-character password

### 4. Configure Environment Variables

Create a `.env` file for local testing:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
RECIPIENT_EMAIL=recipient@example.com
DISCOUNT_THRESHOLD=70
```

### 5. Local Testing

```bash
npm run dev
```

This will:
- Fetch products from Uniqlo API
- Filter by discount threshold and sizes
- Send test email if qualifying products found

### 6. Deploy to GitHub Actions

#### Configure GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:
   - `GMAIL_USER`: Your Gmail address
   - `GMAIL_APP_PASSWORD`: Your Gmail app password
   - `RECIPIENT_EMAIL`: Email to receive notifications
   - `DISCOUNT_THRESHOLD`: (Optional) Default is 70

#### Enable GitHub Actions

1. Go to the **Actions** tab in your repository
2. Enable workflows if prompted
3. The bot will run automatically every 30 minutes
4. You can also trigger it manually using "Run workflow"

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GMAIL_USER` | Yes | - | Gmail address for sending emails |
| `GMAIL_APP_PASSWORD` | Yes | - | Gmail app-specific password (16 characters) |
| `RECIPIENT_EMAIL` | Yes | - | Email address to receive notifications |
| `DISCOUNT_THRESHOLD` | No | 70 | Minimum discount percentage (0-100) |
| `STORE_IDS` | No | 120126,107303,115747,113150 | Comma-separated list of Uniqlo store IDs |
| `GENDER_ID` | No | 37609 | Gender category ID (Men's) |

### Customization

To change the schedule, edit `.github/workflows/uniqlo-notifier.yml`:

```yaml
on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
```

Cron examples:
- `'0 * * * *'` - Every hour
- `'0 */2 * * *'` - Every 2 hours
- `'0 9,12,15,18 * * *'` - At 9am, 12pm, 3pm, 6pm

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── uniqlo-notifier.yml    # GitHub Actions workflow
├── src/
│   ├── api/
│   │   └── uniqlo.ts              # API client with pagination
│   ├── services/
│   │   ├── filter.ts              # Product filtering logic
│   │   └── email.ts               # Email service with HTML templates
│   ├── types/
│   │   └── product.ts             # TypeScript interfaces
│   ├── utils/
│   │   └── config.ts              # Configuration loader
│   └── index.ts                   # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

1. **Fetch Products**: Retrieves all sale products from Uniqlo API with pagination
2. **Filter Products**: 
   - Calculates discount: `((base - promo) / base) * 100`
   - Filters for 70%+ discount
   - Checks for XS/S/M size availability
3. **Send Email**: 
   - If qualifying products found: Sends digest email with all products
   - If no products: Skips email
   - If error: Sends error notification and stops bot

## Email Format

The notification email includes:
- Product name
- Product image
- Original price (strikethrough)
- Sale price (highlighted)
- Discount percentage badge
- Purchase links for each available size (XS, S, M)

## Troubleshooting

### Bot not running

- Check GitHub Actions tab for workflow runs
- Verify secrets are configured correctly
- Ensure repository is not archived

### Not receiving emails

- Check spam/junk folder
- Verify Gmail app password is correct
- Check GitHub Actions logs for errors
- Ensure 2FA is enabled on Gmail account

### API errors

- Uniqlo may have changed their API structure
- Check GitHub Actions logs for specific error messages
- You'll receive an error notification email

## Cost

**$0** - Completely free!

- GitHub Actions: 2,000 minutes/month free (private repos), unlimited for public repos
- Gmail SMTP: Free (up to 500 emails/day)

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
