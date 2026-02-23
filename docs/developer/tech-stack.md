# Technology Stack Summary

**Last Updated**: 2026-02-23  
**Status**: Decided and Documented

This document provides a quick reference to the technology decisions made for Bluebells & Thistles. For detailed rationale, see the Architecture Decision Records (ADRs) in `plans/decisions/`.

---

## The Stack at a Glance

| Component | Technology | Cost | Why |
|-----------|-----------|------|-----|
| **Frontend** | SvelteKit + TypeScript | $0 | Simpler than React, smaller bundles, better DX |
| **Hosting** | Cloudflare Pages | $0 | Global CDN, auto-deploy from Git |
| **Backend API** | Cloudflare Workers | $0 | Serverless edge functions, 100k req/day free |
| **Database** | Cloudflare D1 (SQLite) | $0 | 5GB storage, 5M reads/day free, perfect for low traffic |
| **File Storage** | Cloudflare R2 | $0 | S3-compatible, 10GB storage + 10GB egress/month free |
| **Sessions** | Cloudflare KV | $0 | Key-value store, 100k reads/day free |
| **Email** | Resend | $0 | 3000 emails/month free |
| **Payments** | Stripe | $0 | Pay per transaction (2.9% + $0.30) |
| **IaC** | Terraform | $0 | Industry standard, excellent Cloudflare provider |
| **CI/CD** | GitHub Actions | $0 | 2000 minutes/month free |
| **Domain** | Namecheap/Cloudflare | $10/year | .com domain |
| **TOTAL** | | **~$1/month** | Just the domain! |

---

## Architecture Overview

```
User Browser
    ↓
Cloudflare Global Network (200+ locations)
    ↓
├── Pages (Static Assets) → SvelteKit HTML/CSS/JS
├── Workers (API) → TypeScript serverless functions
│   ↓
│   ├── D1 (Database) → SQLite at the edge
│   ├── R2 (Files) → Product images, PDFs
│   └── KV (Sessions) → User sessions
└── External Services
    ├── Stripe → Payment processing
    └── Resend → Email delivery
```

**Key Characteristics:**
- **Serverless**: No servers to manage, auto-scales
- **Edge-first**: Runs globally, close to users
- **Cost-optimized**: Free tiers cover 100x expected traffic
- **IaC-native**: Everything defined in Terraform + Git

---

## Why This Stack?

### Primary Requirements

✅ **<10 concurrent users, <10 orders/month** → Free tiers are perfect  
✅ **Real business** → Cloudflare has 99.9% SLA, enterprise-grade  
✅ **IaC with Terraform** → Best-in-class Cloudflare provider  
✅ **Long-term maintainability** → Fully managed, zero ops overhead  
✅ **Solo/small team** → No DevOps expertise needed  
✅ **Learning opportunity** → Modern serverless/edge architecture  
✅ **OK with cold starts** → 50-200ms acceptable for low traffic  

### Cost Comparison

| Stack | Monthly Cost | Annual Cost |
|-------|--------------|-------------|
| **Cloudflare (chosen)** | $1 | $12 |
| Digital Ocean App Platform | $5-6 | $60-72 |
| Traditional VPS + PostgreSQL | $20-30 | $240-360 |
| AWS Lambda + RDS | $30+ | $360+ |

**Savings**: $48-348/year vs alternatives

---

## Technology Decisions (ADRs)

All major decisions are documented as Architecture Decision Records:

### [ADR-001: Queue-Based Capacity Management](../plans/decisions/ADR-001-example.md)
- **Decision**: Implement queue system for production capacity
- **Why**: Core differentiator, enables transparent delivery estimates
- **Status**: Accepted

### [ADR-002: Technology Stack](../plans/decisions/ADR-002-tech-stack.md)
- **Decision**: Cloudflare serverless edge platform
- **Why**: Cheapest ($1/mo), best IaC, perfect for low traffic
- **Alternatives Considered**: App Platform, VPS, AWS, Vercel
- **Status**: Accepted

### [ADR-003: Infrastructure as Code](../plans/decisions/ADR-003-infrastructure-as-code.md)
- **Decision**: Terraform + Wrangler hybrid approach
- **Why**: Best IaC tool for Cloudflare, version-controlled infrastructure
- **Alternatives Considered**: Pulumi, Ansible, manual management
- **Status**: Accepted

### [ADR-004: Database Choice](../plans/decisions/ADR-004-database-cloudflare-d1.md)
- **Decision**: Cloudflare D1 (distributed SQLite)
- **Why**: Free, zero ops, perfect for relational data at low scale
- **Alternatives Considered**: PostgreSQL, MySQL, MongoDB, PlanetScale
- **Status**: Accepted

---

## Development Workflow

### Local Development
```bash
npm run dev
# → http://localhost:5173 (SvelteKit)
# → http://localhost:8787 (Workers)
# → Local D1 database in .wrangler/state/
```

### Testing
```bash
npm test              # All tests
npm run test:unit     # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
```

### Deployment
```bash
git push origin main  # Auto-deploys to staging
# Manual approval required for production
```

See [local-development.md](./local-development.md) for detailed setup.

---

## Deployment Pipeline

```
Feature Branch
    ↓ (PR created)
CI: Lint, Test, Build
    ↓ (PR merged to main)
Auto-deploy to Staging
    ↓ (Manual trigger)
Approval Required
    ↓
Deploy to Production
```

**Environments:**
- **Development**: Local (localhost)
- **Staging**: staging.bluebellsandthistles.com (auto-deploy)
- **Production**: bluebellsandthistles.com (manual approval)

See [deployment.md](./deployment.md) for deployment procedures.

---

## Repository Structure

```
bluebellsandthistles/
├── src/                      # SvelteKit frontend
│   ├── routes/              # Pages
│   └── lib/                 # Components, utilities
│
├── workers/
│   ├── api/                 # Main API Worker
│   │   ├── src/            # TypeScript source
│   │   ├── test/           # Tests
│   │   └── wrangler.toml   # Worker config
│   └── stripe-webhook/     # Stripe webhook handler
│
├── migrations/              # D1 database migrations
│   ├── 0001_initial.sql
│   └── 0002_add_patterns.sql
│
├── terraform/               # Infrastructure as Code
│   ├── environments/
│   │   ├── staging/
│   │   └── production/
│   └── modules/
│
├── .github/workflows/       # CI/CD pipelines
│   ├── ci.yml
│   ├── deploy-staging.yml
│   └── deploy-production.yml
│
├── docs/                    # Documentation
│   ├── local-development.md
│   ├── deployment.md
│   └── tech-stack.md (this file)
│
└── plans/decisions/         # Architecture Decision Records
    ├── ADR-001-queue-system.md
    ├── ADR-002-tech-stack.md
    ├── ADR-003-infrastructure-as-code.md
    └── ADR-004-database-cloudflare-d1.md
```

---

## Key Technologies Explained

### SvelteKit
- **What**: Modern web framework (like Next.js but simpler)
- **Why**: Smaller bundles, better DX, less magic than React
- **Use**: Frontend pages, routing, SSR

### Cloudflare Workers
- **What**: Serverless functions running at the edge (V8 isolates)
- **Why**: Fast cold starts (~50ms), runs globally, cheap
- **Use**: API endpoints, business logic, Stripe webhooks

### Cloudflare D1
- **What**: SQLite database distributed globally by Cloudflare
- **Why**: Free, zero ops, standard SQL, perfect for low traffic
- **Use**: Users, orders, projects, queue state
- **Note**: Still "beta" but stable (2+ years, widely used)

### Cloudflare R2
- **What**: S3-compatible object storage
- **Why**: Free tier (10GB), zero egress fees, S3 API
- **Use**: Product images, pattern PDFs, user uploads

### Terraform
- **What**: Infrastructure as Code tool
- **Why**: Industry standard, excellent Cloudflare provider
- **Use**: Provision all Cloudflare resources (Pages, Workers, D1, R2)

---

## Scaling Considerations

### Current Capacity (Free Tiers)
- **Workers**: 100k requests/day → ~3k requests/month expected
- **D1**: 5M reads/day, 100k writes/day → ~100 reads/day, ~10 writes/day expected
- **R2**: 10GB storage, 10GB egress/month → ~100MB storage, ~1GB egress expected
- **Pages**: Unlimited requests

**Headroom**: 100x current expected traffic

### When to Upgrade

**Trigger**: Consistent usage >50% of free tier limits

**Upgrade Path**:
1. **100 concurrent users**: Still within free tiers
2. **1000 concurrent users**: Upgrade to Workers Paid ($5/mo for 10M requests)
3. **10,000 concurrent users**: Consider PostgreSQL, separate API server

**Migration Path**: D1 → PostgreSQL is straightforward (SQLite export → PostgreSQL import)

---

## Risks and Mitigations

### Risk: D1 Beta Status
- **Likelihood**: Low (stable for 2+ years)
- **Impact**: Medium (breaking changes possible)
- **Mitigation**: Regular backups, migration scripts to PostgreSQL ready
- **Response**: Can migrate to managed PostgreSQL in 1-2 days if needed

### Risk: Cloudflare Service Outage
- **Likelihood**: Low (99.9% SLA)
- **Impact**: High (site down)
- **Mitigation**: Cloudflare has excellent uptime, automatic failover
- **Response**: Monitor status page, communicate with users

### Risk: Exceed Free Tier Limits
- **Likelihood**: Very low (<10 orders/month)
- **Impact**: Low (paid tiers are cheap)
- **Mitigation**: Monitor usage in Cloudflare dashboard
- **Response**: Upgrade to paid tier ($5-10/mo)

---

## Success Metrics

This stack will be considered successful if:

✅ **Cost**: Monthly infrastructure cost <$5 for first year  
✅ **Performance**: Page load times <2 seconds globally  
✅ **Reliability**: 99.9%+ uptime  
✅ **Developer Experience**: Deploy in <5 minutes from commit  
✅ **Maintainability**: Zero time spent on infrastructure maintenance  
✅ **Scalability**: Can handle 10x traffic with no code changes  

**Review Date**: After 6 months or when traffic exceeds 50 concurrent users

---

## Quick Reference Links

### Documentation
- [Local Development Guide](./local-development.md)
- [Deployment Guide](./deployment.md)
- [Architecture Principles](./03-architecture.md)
- [Testing Strategy](./05-testing.md)

### ADRs
- [ADR-001: Queue System](../plans/decisions/ADR-001-example.md)
- [ADR-002: Tech Stack](../plans/decisions/ADR-002-tech-stack.md)
- [ADR-003: Infrastructure as Code](../plans/decisions/ADR-003-infrastructure-as-code.md)
- [ADR-004: Database Choice](../plans/decisions/ADR-004-database-cloudflare-d1.md)

### External Resources
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [SvelteKit Docs](https://kit.svelte.dev/)
- [Terraform Cloudflare Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)

---

## Getting Help

- **Questions**: Open GitHub Discussion
- **Bugs**: Open GitHub Issue
- **Documentation**: Check `docs/` directory
- **ADRs**: See `plans/decisions/` for architectural decisions

---

## Summary

**Bluebells & Thistles runs on a modern serverless edge stack optimized for:**
- ✅ Low traffic (<10 concurrent users)
- ✅ Minimal cost (~$1/month)
- ✅ Zero operational overhead
- ✅ Infrastructure as Code (Terraform)
- ✅ Long-term maintainability
- ✅ Learning modern web architecture

**Everything is version-controlled, tested, and deployed via CI/CD.**

**Next Steps**: See [local-development.md](./local-development.md) to start building!
