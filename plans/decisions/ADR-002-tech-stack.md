# ADR-002: Technology Stack - Cloudflare Serverless Edge Platform

## Status

Accepted

## Context

Bluebells & Thistles is a made-to-order artisan crafts marketplace with specific characteristics:

- **Low traffic**: <10 concurrent users, <10 orders/month initially
- **Real business**: Requires reliability and professional infrastructure
- **Solo/small team**: Limited DevOps resources, need managed solutions
- **Cost-sensitive**: Budget-conscious startup, want to minimize monthly costs
- **Long-term maintainability**: Prefer simple, well-documented solutions over complex setups
- **Learning opportunity**: Developer excited about modern serverless/edge architecture

The technology stack must balance cost, simplicity, scalability, and developer experience while supporting the core queue-based capacity management system.

## Decision

Adopt a **Cloudflare serverless edge platform** as the primary technology stack:

### Frontend
- **SvelteKit** with TypeScript
- **Adapter**: `@sveltejs/adapter-static` (static site generation)
- **Hosting**: Cloudflare Pages (global CDN)
- **Styling**: Tailwind CSS

### Backend
- **Cloudflare Workers** (serverless functions at the edge)
- **Language**: TypeScript
- **Runtime**: V8 isolates (not containers)

### Database
- **Cloudflare D1** (distributed SQLite-as-a-service)
- **Migrations**: Wrangler CLI with SQL migration files

### File Storage
- **Cloudflare R2** (S3-compatible object storage)
- **Usage**: Product images, pattern PDFs, user uploads

### Session Management
- **Cloudflare KV** (key-value store for sessions)

### Infrastructure as Code
- **Terraform** (primary IaC tool)
- **Wrangler** (Cloudflare-specific deployment tool)

### Supporting Services
- **Email**: Resend (free tier: 3000 emails/month)
- **Payments**: Stripe (pay-per-transaction)
- **DNS/SSL/DDoS**: Cloudflare (included)

### Development & Testing
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Linting**: Biome (fast linter + formatter)
- **CI/CD**: GitHub Actions
- **Version Control**: Git + GitHub

## Rationale

### Why Cloudflare Over Digital Ocean App Platform?

**Cost**: $1/month (domain only) vs $5-6/month
- Cloudflare free tiers cover 100x the expected traffic
- No minimum hosting costs
- Savings: $60-72/year

**IaC Quality**: Best-in-class Terraform provider
- Everything is API-first, designed for automation
- Excellent documentation and community support
- Native IaC via `wrangler.toml` + Terraform

**Scalability**: Infinite scale at no extra cost
- Handles 10 users or 10,000 users identically
- Global edge network (200+ locations)
- Auto-scaling with no configuration

**Performance**: Edge computing advantages
- Runs closest to users geographically
- Lower latency than single-region hosting
- Built-in CDN for all assets

**Learning Value**: Modern, cutting-edge architecture
- Serverless/edge is the future of web development
- Valuable skills for developer's career growth
- Aligns with developer's excitement to learn

### Why SvelteKit Over Next.js?

**Simplicity**: Clearer mental model
- Less "magic" than React/Next.js
- Easier to debug and understand
- Better for solo developer long-term

**Bundle Size**: 50-70% smaller JavaScript bundles
- Critical for edge deployment
- Faster page loads on slow connections
- Better Core Web Vitals scores

**Developer Experience**: More enjoyable to write
- Less boilerplate than React
- Better form handling (Superforms)
- Progressive enhancement built-in

**Static Export**: Better static site generation
- Cleaner adapter system
- Optimized for Cloudflare Pages

### Why Cloudflare D1 (SQLite) Over PostgreSQL?

**Cost**: Free (5GB storage, 5M reads/day) vs $15/month minimum
- Savings: $180/year

**Simplicity**: No database server to manage
- Zero operational overhead
- Automatic backups and replication
- No connection pooling complexity

**Performance**: Lower latency
- No network round-trip to separate database
- Runs at the edge with Workers
- Perfect for <1000 writes/day

**Familiarity**: Standard SQLite syntax
- Same SQL as local development
- Easy to test locally
- Well-documented and battle-tested

**Acceptable Tradeoffs**:
- D1 is "beta" but stable in practice (2+ years)
- Write throughput limits don't apply (<10 orders/month)
- Easy migration path to PostgreSQL if needed

### Why Cloudflare R2 Over Digital Ocean Spaces?

**Cost**: Free tier (10GB storage, 10GB egress/month) vs $5/month minimum
- Savings: $60/year

**Zero Egress Fees**: Unlike AWS S3
- No surprise bandwidth charges
- Predictable costs

**S3 Compatible**: Easy migration path
- Standard API, works with AWS SDK
- Can switch to Spaces/S3 if needed

## Consequences

### Positive

**Cost Efficiency**:
- Total monthly cost: ~$1 (just domain)
- 95% cost reduction vs traditional hosting
- Scales to 100x traffic with no cost increase

**Developer Experience**:
- Fast local development (Wrangler local mode)
- Excellent TypeScript support throughout
- Modern tooling and workflows

**Operations**:
- Zero server management
- Automatic scaling and failover
- Built-in DDoS protection and SSL

**Performance**:
- Global edge network
- Sub-100ms response times worldwide
- Automatic caching and optimization

**Maintainability**:
- Everything as code (Terraform + Git)
- Comprehensive testing strategy
- Clear separation of concerns

### Negative

**Cold Starts**: 50-200ms wake-up time
- Acceptable for low-traffic use case
- Not noticeable with <10 concurrent users
- Mitigated by Cloudflare's fast isolates

**D1 Beta Status**: Not officially "production-ready"
- Risk: Breaking changes or service issues
- Mitigation: Easy migration to PostgreSQL if needed
- Reality: Widely used, stable for 2+ years

**Learning Curve**: New paradigm for traditional developers
- Serverless patterns differ from server-based apps
- Edge computing has different constraints
- Mitigation: Excellent documentation, developer is excited to learn

**Vendor Lock-in**: Cloudflare-specific features
- Workers use Cloudflare APIs
- D1 is Cloudflare-only (though SQLite underneath)
- Mitigation: Standard APIs where possible, migration path exists

### Risks and Mitigations

**Risk**: D1 has breaking changes or service issues
- **Mitigation**: Export data regularly, maintain migration scripts to PostgreSQL
- **Likelihood**: Low (stable for 2 years, Cloudflare has good track record)

**Risk**: Cloudflare pricing changes
- **Mitigation**: Free tier is generous, paid tier is still cheap, can migrate to Vercel/Netlify
- **Likelihood**: Low (Cloudflare's business model is enterprise, not nickel-and-diming)

**Risk**: Serverless constraints limit functionality
- **Mitigation**: Most constraints don't apply to this use case (low traffic, simple workflows)
- **Likelihood**: Low (queue calculations, payments, emails all work fine in Workers)

**Risk**: Developer struggles with new architecture
- **Mitigation**: Comprehensive documentation, active community, can fallback to App Platform
- **Likelihood**: Low (developer is excited to learn, has CS degree, comfortable with new tech)

## Alternatives Considered

### 1. Digital Ocean App Platform + PostgreSQL ($26/month)

**Pros**:
- Traditional architecture (easier for most developers)
- Managed PostgreSQL (proven, stable)
- Single vendor (simpler billing)

**Cons**:
- 26x more expensive ($312/year vs $12/year)
- Still requires IaC complexity (Terraform or .do/app.yaml)
- Single-region deployment (higher latency for global users)
- Overkill for <10 concurrent users

**Rejected**: Cost too high for the scale, no significant advantages

### 2. $4 Digital Ocean Droplet + Manual Management ($5/month)

**Pros**:
- Full control (SSH access, custom configuration)
- Cheapest managed server option
- Traditional server model

**Cons**:
- Manual security updates and maintenance
- No auto-scaling
- Single point of failure
- Requires Ansible/Puppet for proper IaC
- More DevOps overhead than Cloudflare

**Rejected**: IaC requirement makes this more complex than Cloudflare, not actually simpler

### 3. Vercel/Netlify Serverless ($0-20/month)

**Pros**:
- Similar serverless model to Cloudflare
- Excellent DX (developer experience)
- Good free tiers

**Cons**:
- More expensive than Cloudflare at scale
- Less control over infrastructure
- Weaker IaC story (less Terraform support)
- Database would still need separate provider

**Rejected**: Cloudflare offers better IaC, lower cost, and integrated database

### 4. AWS Lambda + RDS ($30+/month)

**Pros**:
- Industry standard
- Most mature serverless platform
- Excellent Terraform support

**Cons**:
- Significantly more expensive
- Complex pricing (many hidden costs)
- Steeper learning curve
- Overkill for this scale

**Rejected**: Cost and complexity far exceed requirements

## Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Set up repository structure
- [ ] Configure Terraform for Cloudflare
- [ ] Create D1 database and initial migrations
- [ ] Set up local development environment

### Phase 2: Core Infrastructure (Week 2)
- [ ] Implement SvelteKit frontend skeleton
- [ ] Create Worker API structure
- [ ] Set up R2 for file storage
- [ ] Configure KV for sessions

### Phase 3: CI/CD (Week 3)
- [ ] GitHub Actions for testing
- [ ] Automated staging deployments
- [ ] Production deployment workflow
- [ ] Database migration automation

### Phase 4: Monitoring & Documentation (Week 4)
- [ ] Error tracking setup
- [ ] Performance monitoring
- [ ] Complete developer documentation
- [ ] Deployment runbooks

## Success Criteria

This decision will be considered successful if:

1. **Cost**: Monthly infrastructure cost stays under $5 for first year
2. **Performance**: Page load times <2 seconds globally
3. **Reliability**: 99.9%+ uptime (Cloudflare SLA)
4. **Developer Experience**: Deployment takes <5 minutes from commit to live
5. **Maintainability**: New features can be added without infrastructure changes
6. **Scalability**: Can handle 10x traffic increase with no code changes

## References

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Terraform Cloudflare Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
- Internal: `plans/vision.md` - Project vision and requirements
- Internal: `docs/03-architecture.md` - Architecture principles

## Notes

- This decision was made on 2026-02-23
- Primary decision-maker: Development team (solo developer with CS background)
- Key factors: Cost optimization, IaC requirement, learning opportunity, low traffic scale
- Review date: After 6 months or when traffic exceeds 100 concurrent users
