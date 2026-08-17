# Sale Notifier

Automated bot that monitors sale items and sends email notifications when qualifying products are found.

## Features

- Runs on demand via GitHub Actions
- Email notifications with product details and purchase links
- Configurable discount threshold
- Monitors specific sizes only
- Error notifications if bot encounters issues

## Setup

### 1. Configure GitHub Secrets

Go to **Settings → Secrets and variables → Actions → Secrets** and add:

| Secret | Required | Description |
|--------|----------|-------------|
| `GMAIL_USER` | Yes | Gmail address for sending emails |
| `GMAIL_APP_PASSWORD` | Yes | Gmail app-specific password (16 characters) |
| `RECIPIENT_EMAIL` | Yes | Email address to receive notifications |
| `API_BASE_URL` | Yes | API endpoint |
| `PRODUCT_BASE_URL` | Yes | Product page base URL |

### 2. Choose Product Categories (optional)

Go to **Settings → Secrets and variables → Actions → Variables** and add a repository variable:

| Variable | Default | Description |
|----------|---------|-------------|
| `CATEGORIES` | `men,women,kids` | Comma-separated list of categories to check. Any subset of `men`, `women`, `kids`. |

This applies to every run — both manual and the scheduled cron-job.org trigger (see [CRON_SETUP.md](CRON_SETUP.md)) — since neither passes per-run inputs. Edit the variable's value any time to change which categories are checked.

### 3. Trigger

Go to **Actions → Sale Notifier → Run workflow**.

### 4. Local Testing

```bash
cp .env.example .env
# fill in .env values
npm install
npm run dev
```

## Configuration

Set via environment variables or GitHub secrets:

| Variable | Default | Description |
|----------|---------|-------------|
| `DISCOUNT_THRESHOLD` | 55 | Minimum discount percentage |
| `STORE_IDS` | (4 stores) | Comma-separated store IDs |
| `CATEGORIES` | `men,women,kids` | Comma-separated categories: `men`, `women`, `kids` |

## How It Works

1. Fetches all sale products across configured stores in parallel
2. Deduplicates by product ID, tracking source store
3. Pre-filters by discount threshold
4. Checks per-store stock for target sizes (XS, S, M)
5. Sends digest email sorted by highest discount

## License

MIT
