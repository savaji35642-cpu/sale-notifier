# Cron-Job.org Setup Guide

This guide explains how to set up **cron-job.org** to trigger your GitHub Actions workflow every 15 minutes with exact timing.

## Why This Solution?

GitHub Actions scheduled workflows (`cron`) are unreliable and can be delayed by 3-10+ minutes during high load. Using an external cron service with `workflow_dispatch` provides **exact 15-minute intervals**.

---

## Step 1: Create GitHub Personal Access Token

1. Go to **GitHub Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
   - Direct link: https://github.com/settings/tokens

2. Click **"Generate new token"** → **"Generate new token (classic)"**

3. Configure the token:
   - **Note**: `Uniqlo Notifier Cron Trigger`
   - **Expiration**: Choose `No expiration` or `1 year` (you'll need to renew if it expires)
   - **Scopes**: Check **only** these permissions:
     - ✅ `repo` (Full control of private repositories)
       - This includes `workflow` permission needed for `workflow_dispatch`

4. Click **"Generate token"**

5. **IMPORTANT**: Copy the token immediately and save it securely
   - Format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - You won't be able to see it again!

---

## Step 2: Register on Cron-Job.org

1. Go to https://cron-job.org/en/

2. Click **"Sign up for free"**

3. Create account with email and password

4. Verify your email address

5. Log in to your dashboard

---

## Step 3: Create Cron Job

1. In the cron-job.org dashboard, click **"Create cronjob"**

2. Configure the job:

   **Title:**

   ```
   Uniqlo Sale Notifier - Every 15 Minutes
   ```

   **Address (URL):**

   ```
   https://api.github.com/repos/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/actions/workflows/uniqlo-notifier.yml/dispatches
   ```

   **Replace:**
   - `YOUR_GITHUB_USERNAME` with your GitHub username
   - `YOUR_REPO_NAME` with your repository name (e.g., `game`)

   **Example:**

   ```
   https://api.github.com/repos/sawantakash321/game/actions/workflows/uniqlo-notifier.yml/dispatches
   ```

   **Schedule:**
   - Select **"Every 15 minutes"**
   - Or use custom: `*/15 * * * *`

   **Request method:**
   - Select **POST**

   **Request body:**

   ```json
   { "ref": "main" }
   ```

   **Note**: Change `"main"` to your default branch name if different (e.g., `"master"`)

   **Headers:**
   Add these three headers by clicking **"Add header"**:

   | Header Name            | Value                         |
   | ---------------------- | ----------------------------- |
   | `Accept`               | `application/vnd.github+json` |
   | `Authorization`        | `Bearer YOUR_GITHUB_TOKEN`    |
   | `X-GitHub-Api-Version` | `2022-11-28`                  |

   **Replace `YOUR_GITHUB_TOKEN`** with the token you created in Step 1

   **Example Authorization header:**

   ```
   Bearer ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   **Notifications:**
   - Enable **"Notify me on execution failures"**
   - This will email you if the cron job fails

3. Click **"Create cronjob"**

---

## Step 4: Test the Setup

1. In cron-job.org dashboard, find your newly created job

2. Click the **"Run now"** button (play icon) to test immediately

3. Go to your GitHub repository → **Actions** tab

4. You should see a new workflow run triggered by `workflow_dispatch`

5. Check the logs to ensure it runs successfully

---

## Step 5: Monitor & Verify

### First 24 Hours

- Check that workflow runs appear every 15 minutes in GitHub Actions
- Verify emails are being sent when products are found
- Monitor cron-job.org execution history for any failures

### Ongoing Monitoring

- **GitHub Actions**: Check the Actions tab periodically
- **Cron-job.org**: Review execution history and success rate
- **Email**: Ensure notifications are arriving as expected

---

## Troubleshooting

### Cron job returns 401 Unauthorized

- **Cause**: Invalid or expired GitHub token
- **Fix**: Generate a new token and update the Authorization header

### Cron job returns 404 Not Found

- **Cause**: Incorrect repository URL or workflow file name
- **Fix**: Verify the URL format and workflow file name (`uniqlo-notifier.yml`)

### Workflow doesn't trigger

- **Cause**: Wrong branch name in request body
- **Fix**: Change `{"ref":"main"}` to your actual default branch

### Cron job shows success but workflow doesn't run

- **Cause**: Token lacks `workflow` permission
- **Fix**: Regenerate token with `repo` scope (includes workflow permission)

### Rate limiting issues

- **Cause**: Too many API requests
- **Fix**: cron-job.org free tier should be sufficient for 15-minute intervals (96 requests/day)

---

## Security Notes

1. **Never commit your GitHub token** to the repository
2. Store the token securely (password manager recommended)
3. If token is compromised, revoke it immediately in GitHub settings
4. Use token expiration and rotate tokens periodically
5. The token has access to all your repositories - keep it secure

---

## Cost & Limits

### Cron-Job.org Free Tier

- ✅ Unlimited cron jobs
- ✅ 1-minute minimum interval
- ✅ Execution history
- ✅ Email notifications
- ✅ No credit card required

### GitHub Actions Free Tier

- ✅ 2,000 minutes/month for private repos
- ✅ Unlimited for public repos
- ✅ Each run takes ~1-2 minutes
- ✅ 96 runs/day × 2 minutes = 192 minutes/day = ~5,760 minutes/month
- ⚠️ If private repo, you'll use ~3x your free tier → consider making repo public

---

## Alternative: Make Repository Public

If you're hitting GitHub Actions limits with a private repository:

1. Go to repository **Settings** → **General**
2. Scroll to **Danger Zone**
3. Click **"Change visibility"** → **"Make public"**
4. This gives you **unlimited** GitHub Actions minutes

**Note**: Your code will be publicly visible, but your secrets (email credentials) remain private.

---

## Maintenance

### Token Expiration

If you set token expiration:

1. GitHub will email you before expiration
2. Generate a new token following Step 1
3. Update the Authorization header in cron-job.org

### Changing Schedule

To modify the interval:

1. Go to cron-job.org dashboard
2. Click **Edit** on your cron job
3. Change the schedule (e.g., every 30 minutes: `*/30 * * * *`)
4. Save changes

---

## Summary

✅ **Workflow modified** to use `workflow_dispatch` only  
✅ **Exact 15-minute intervals** via cron-job.org  
✅ **Free solution** with no infrastructure required  
✅ **Reliable execution** independent of GitHub's cron limitations

Your bot will now run **exactly every 15 minutes** instead of randomly!
