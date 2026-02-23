# Deployment Guide

This guide covers deploying Bluebells & Thistles to staging and production environments using Terraform and GitHub Actions.

## Overview

**Deployment Architecture:**
```
Local Development
    ↓ (git push to feature branch)
GitHub Pull Request
    ↓ (CI runs tests)
Merge to main
    ↓ (auto-deploy)
Staging Environment
    ↓ (manual approval)
Production Environment
```

**Environments:**
- **Development**: Local machine (localhost)
- **Staging**: Auto-deployed from `main` branch
- **Production**: Manual deployment with approval

## Prerequisites

### Required Accounts

1. **Cloudflare Account** (free tier)
   - Sign up at https://dash.cloudflare.com/sign-up
   - Note your Account ID (found in dashboard)
   - Create API token with permissions:
     - Account: Cloudflare Pages (Edit)
     - Account: D1 (Edit)
     - Account: Workers Scripts (Edit)
     - Zone: DNS (Edit)

2. **GitHub Account**
   - Repository access
   - Admin permissions (for setting up Actions secrets)

3. **Terraform Cloud** (free tier, optional)
   - Sign up at https://app.terraform.io/
   - Create organization
   - Create workspaces for staging and production

4. **Domain Name**
   - Register domain (Namecheap, Cloudflare Registrar, etc.)
   - Add domain to Cloudflare (free)

### Required Secrets

Store these in GitHub Secrets (Settings → Secrets and variables → Actions):

```
CLOUDFLARE_API_TOKEN       # Cloudflare API token
CLOUDFLARE_ACCOUNT_ID      # Your Cloudflare account ID
CLOUDFLARE_ZONE_ID         # Zone ID for your domain
STRIPE_TEST_KEY            # Stripe test mode secret key (staging)
STRIPE_LIVE_KEY            # Stripe live mode secret key (production)
RESEND_API_KEY             # Resend API key for emails
TF_CLOUD_TOKEN             # Terraform Cloud token (if using)
```

## Initial Setup

### 1. Configure Terraform Backend

Choose between Terraform Cloud (recommended) or local state:

**Option A: Terraform Cloud (Recommended)**

```hcl
# terraform/environments/staging/backend.tf
terraform {
  backend "remote" {
    organization = "your-org-name"
    
    workspaces {
      name = "bluebells-staging"
    }
  }
}
```

**Option B: Local State (Not recommended for production)**

```hcl
# terraform/environments/staging/backend.tf
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
```

### 2. Configure Terraform Variables

Create `terraform.tfvars` files (these are gitignored):

```hcl
# terraform/environments/staging/terraform.tfvars
cloudflare_api_token  = "your-api-token"
cloudflare_account_id = "your-account-id"
cloudflare_zone_id    = "your-zone-id"
github_org            = "your-github-org"
stripe_secret_key     = "sk_test_..."
resend_api_key        = "re_..."
environment           = "staging"
domain                = "staging.bluebellsandthistles.com"
```

```hcl
# terraform/environments/production/terraform.tfvars
cloudflare_api_token  = "your-api-token"
cloudflare_account_id = "your-account-id"
cloudflare_zone_id    = "your-zone-id"
github_org            = "your-github-org"
stripe_secret_key     = "sk_live_..."  # LIVE KEY for production
resend_api_key        = "re_..."
environment           = "production"
domain                = "bluebellsandthistles.com"
```

**Security Note**: Never commit `terraform.tfvars` to Git. Store production secrets in a password manager.

### 3. Initialize Terraform

```bash
# Initialize staging environment
cd terraform/environments/staging
terraform init

# Initialize production environment
cd ../production
terraform init
```

### 4. Configure GitHub Environments

In GitHub repository settings:

1. Go to Settings → Environments
2. Create two environments:
   - **staging**: No protection rules (auto-deploy)
   - **production**: Add protection rules:
     - Required reviewers: Add yourself
     - Wait timer: 0 minutes (or add delay if desired)

3. Add environment-specific secrets:
   - Staging: `STRIPE_SECRET_KEY` = test key
   - Production: `STRIPE_SECRET_KEY` = live key

## Deployment Workflows

### Staging Deployment (Automatic)

Staging deploys automatically when you push to `main` branch:

```bash
# Make changes
git checkout -b feature/add-reviews
# ... make changes ...
git commit -m "feat: add review system"
git push origin feature/add-reviews

# Create PR, get it reviewed and merged
# GitHub Actions automatically:
# 1. Runs tests
# 2. Builds application
# 3. Applies Terraform changes
# 4. Deploys to staging
```

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
      
      - name: Terraform Apply
        run: |
          cd terraform/environments/staging
          terraform init
          terraform apply -auto-approve
        env:
          TF_VAR_cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          TF_VAR_stripe_secret_key: ${{ secrets.STRIPE_TEST_KEY }}
      
      - name: Deploy Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: workers/api
          command: deploy --env staging
      
      - name: Run Migrations
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: d1 migrations apply bluebells-db-staging --remote
```

### Production Deployment (Manual)

Production requires manual trigger and approval:

```bash
# 1. Tag a release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 2. Go to GitHub Actions
# 3. Select "Deploy Production" workflow
# 4. Click "Run workflow"
# 5. Enter version tag: v1.0.0
# 6. Approve deployment when prompted
```

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version tag to deploy (e.g., v1.0.0)'
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Requires approval
    
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version }}
      
      # Similar steps to staging, but with production environment
      - name: Terraform Apply
        run: |
          cd terraform/environments/production
          terraform init
          terraform apply -auto-approve
        env:
          TF_VAR_stripe_secret_key: ${{ secrets.STRIPE_LIVE_KEY }}
      
      # ... deploy steps
```

## Manual Deployment (From Local Machine)

For emergency deployments or when GitHub Actions is unavailable:

### Deploy Staging

```bash
# 1. Build application
npm run build

# 2. Apply Terraform
cd terraform/environments/staging
terraform plan  # Review changes
terraform apply # Apply changes

# 3. Deploy Worker
cd ../../..
cd workers/api
wrangler deploy --env staging

# 4. Run migrations
wrangler d1 migrations apply bluebells-db-staging --remote

# 5. Deploy Pages
wrangler pages deploy ../../build --project-name=bluebells-staging
```

### Deploy Production

```bash
# Same as staging, but use production environment
cd terraform/environments/production
terraform apply

cd ../../..
cd workers/api
wrangler deploy --env production

wrangler d1 migrations apply bluebells-db-prod --remote

wrangler pages deploy ../../build --project-name=bluebells-production
```

## Database Migrations

### Creating Migrations

```bash
# Create new migration
cd workers/api
wrangler d1 migrations create bluebells-db add_reviews_table

# Edit generated file
vim migrations/0003_add_reviews_table.sql
```

### Applying Migrations

**Staging:**
```bash
# Via GitHub Actions (automatic on deploy)
# Or manually:
wrangler d1 migrations apply bluebells-db-staging --remote
```

**Production:**
```bash
# ALWAYS backup first!
wrangler d1 execute bluebells-db-prod --remote --command ".backup backup-$(date +%Y%m%d-%H%M%S).db"

# Apply migration
wrangler d1 migrations apply bluebells-db-prod --remote

# Verify
wrangler d1 execute bluebells-db-prod --remote --command "SELECT COUNT(*) FROM reviews"
```

### Rolling Back Migrations

D1 doesn't support automatic rollback. Manual process:

```bash
# 1. Create rollback migration
wrangler d1 migrations create bluebells-db rollback_reviews_table

# 2. Write reverse SQL
# migrations/0004_rollback_reviews_table.sql
DROP TABLE IF EXISTS reviews;

# 3. Apply rollback
wrangler d1 migrations apply bluebells-db-prod --remote
```

## Monitoring Deployments

### Check Deployment Status

**Cloudflare Dashboard:**
- Pages: https://dash.cloudflare.com → Pages → bluebells-production
- Workers: https://dash.cloudflare.com → Workers & Pages → bluebells-api
- D1: https://dash.cloudflare.com → D1

**GitHub Actions:**
- Actions tab → Recent workflow runs
- Check logs for errors

### Verify Deployment

```bash
# Check staging
curl https://staging.bluebellsandthistles.com/api/health

# Check production
curl https://bluebellsandthistles.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-02-23T12:00:00Z",
  "database": "connected",
  "version": "1.0.0"
}
```

### View Logs

**Worker Logs (Real-time):**
```bash
# Staging
wrangler tail bluebells-api-staging

# Production
wrangler tail bluebells-api-production
```

**Pages Deployment Logs:**
- Cloudflare Dashboard → Pages → Deployment → View logs

**GitHub Actions Logs:**
- GitHub → Actions → Select workflow run → View logs

## Rollback Procedures

### Rollback Pages Deployment

```bash
# List recent deployments
wrangler pages deployments list --project-name=bluebells-production

# Rollback to specific deployment
wrangler pages deployments rollback <deployment-id> --project-name=bluebells-production
```

### Rollback Worker Deployment

```bash
# Workers don't have built-in rollback
# Solution: Deploy previous version

# 1. Checkout previous version
git checkout v1.0.0

# 2. Build and deploy
cd workers/api
npm run build
wrangler deploy --env production
```

### Rollback Database Migration

See "Rolling Back Migrations" section above.

## Troubleshooting

### Deployment Fails: Terraform Error

```bash
# Error: Resource already exists
# Solution: Import existing resource

terraform import cloudflare_pages_project.app <project-id>
```

### Deployment Fails: Worker Build Error

```bash
# Error: Build failed
# Solution: Check build locally

cd workers/api
npm run build

# Fix errors, commit, push
```

### Deployment Fails: Migration Error

```bash
# Error: Migration already applied
# Solution: Check migration status

wrangler d1 migrations list bluebells-db-prod --remote

# If stuck, manually fix in D1 dashboard
```

### Site Not Updating After Deployment

```bash
# Cloudflare caching issue
# Solution: Purge cache

# In Cloudflare Dashboard:
# Caching → Configuration → Purge Everything

# Or via API:
curl -X POST "https://api.cloudflare.com/client/v4/zones/<zone-id>/purge_cache" \
  -H "Authorization: Bearer <api-token>" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### Database Connection Errors

```bash
# Error: Database not found
# Solution: Check D1 binding in wrangler.toml

# workers/api/wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "bluebells-db-prod"
database_id = "<correct-database-id>"  # Get from Terraform output
```

## Security Best Practices

### Secrets Management

- ✅ Store secrets in GitHub Secrets (encrypted)
- ✅ Use environment-specific secrets (staging vs production)
- ✅ Rotate API tokens regularly (every 90 days)
- ✅ Use Stripe test keys in staging, live keys in production
- ❌ Never commit secrets to Git
- ❌ Never log secrets in Worker code
- ❌ Never expose secrets in error messages

### Access Control

- ✅ Require PR reviews before merging to main
- ✅ Require approval for production deployments
- ✅ Use branch protection rules
- ✅ Limit who can approve production deployments
- ❌ Don't allow direct pushes to main
- ❌ Don't share API tokens between team members

### Deployment Safety

- ✅ Always test in staging first
- ✅ Backup production database before migrations
- ✅ Use blue-green deployments (Cloudflare handles this)
- ✅ Monitor deployments for errors
- ✅ Have rollback plan ready
- ❌ Don't deploy on Fridays (unless necessary)
- ❌ Don't skip testing in staging

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing locally
- [ ] Code reviewed and approved
- [ ] Staging deployment successful
- [ ] Staging tested manually
- [ ] Database migrations tested in staging
- [ ] No breaking changes to API
- [ ] Changelog updated
- [ ] Version tagged in Git

### During Deployment

- [ ] Terraform plan reviewed
- [ ] Database backup created (production only)
- [ ] Migrations applied successfully
- [ ] Worker deployed successfully
- [ ] Pages deployed successfully
- [ ] Health check returns 200 OK

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Key user flows tested manually
- [ ] Error rates normal (check logs)
- [ ] Performance metrics normal
- [ ] No customer complaints
- [ ] Team notified of deployment

## Continuous Integration (CI)

Every pull request triggers CI:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run check
      - run: npm test
      - run: npm run build
```

**CI must pass before merging to main.**

## Cost Monitoring

Monitor Cloudflare usage to stay within free tiers:

**Free Tier Limits:**
- Pages: Unlimited requests
- Workers: 100k requests/day
- D1: 5GB storage, 5M reads/day, 100k writes/day
- R2: 10GB storage, 10GB egress/month

**Check Usage:**
- Cloudflare Dashboard → Analytics
- Set up billing alerts (optional)

**Expected Usage (<10 orders/month):**
- Workers: ~1k requests/day
- D1: ~100 reads/day, ~10 writes/day
- R2: ~100MB storage, ~1GB egress/month

**Well within free tiers.**

## Related Documentation

- [local-development.md](./local-development.md) - Local development setup
- [ADR-003](../plans/decisions/ADR-003-infrastructure-as-code.md) - IaC decision
- [Architecture](./03-architecture.md) - System architecture
- [Testing](./05-testing.md) - Testing strategy

## Getting Help

- **Cloudflare Issues**: Check https://www.cloudflarestatus.com/
- **GitHub Actions Issues**: Check workflow logs
- **Terraform Issues**: Run `terraform plan` to debug
- **General Questions**: Open GitHub Discussion

## Emergency Contacts

- **On-call**: [Your contact info]
- **Cloudflare Support**: Enterprise only (we're on free tier)
- **Escalation**: [Team lead contact]
