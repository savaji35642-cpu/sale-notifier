# Cron-Job.org Setup Guide

Use **cron-job.org** to trigger the GitHub Actions workflow on a schedule with exact timing (GitHub's built-in cron can drift by 10+ minutes).

## Step 1: Create GitHub Personal Access Token

1. Go to **GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Set scope: ✅ `repo`
4. Copy the token immediately — you won't see it again

## Step 2: Create Account on Cron-Job.org

Register at https://cron-job.org and verify your email.

## Step 3: Create Cron Job

**Address:**
```
https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/actions/workflows/notifier.yml/dispatches
```

**Schedule:** Every 15 minutes (`*/15 * * * *`)

**Method:** POST

**Body:**
```json
{ "ref": "master" }
```

**Headers:**

| Name | Value |
|------|-------|
| `Accept` | `application/vnd.github+json` |
| `Authorization` | `Bearer YOUR_GITHUB_TOKEN` |
| `X-GitHub-Api-Version` | `2022-11-28` |

## Troubleshooting

- **401**: Token invalid or expired — regenerate
- **404**: Wrong repo URL or workflow filename
- **Workflow doesn't trigger**: Wrong branch in `ref` field

## Security

- Never commit your GitHub token
- Store it in a password manager
- Revoke immediately if compromised
