# ADR-004: Database Choice - Cloudflare D1 (Distributed SQLite)

## Status

Accepted

## Context

Artisan Commerce requires a database to store:
- User accounts and authentication
- Projects (handmade items) with customizable options
- Patterns (digital products)
- Orders with queue position and lifecycle states
- Queue state and capacity calculations
- Reviews and ratings
- Merch inventory

The database must support:
- **ACID transactions** (critical for payment processing and queue management)
- **Relational data model** (complex joins for queue calculations, order history)
- **Low operational overhead** (solo/small team, limited DevOps resources)
- **Cost efficiency** (<10 orders/month, <10 concurrent users)
- **Integration with Cloudflare Workers** (chosen tech stack per ADR-002)

Traditional database options (PostgreSQL, MySQL, MongoDB) require:
- Separate database server ($15-50/month minimum)
- Connection pooling management
- Backup configuration
- Security hardening
- Monitoring and alerting

For a low-traffic application (<10 concurrent users, <10 orders/month), this overhead is excessive.

## Decision

Use **Cloudflare D1** (distributed SQLite-as-a-service) as the primary database.

### What is D1?

- **SQLite at the edge**: Standard SQLite database, distributed globally by Cloudflare
- **Serverless**: No database server to manage, scales automatically
- **Integrated with Workers**: Direct access from Cloudflare Workers with low latency
- **Free tier**: 5GB storage, 5M reads/day, 100k writes/day (far exceeds our needs)
- **Automatic replication**: Data replicated globally, reads from nearest location
- **Standard SQL**: Full SQLite syntax, familiar to most developers

### Database Schema Approach

```sql
-- Standard SQLite schema
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  queue_position INTEGER,
  total_cents INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_orders_queue ON orders(status, queue_position)
  WHERE status IN ('paid', 'in_queue', 'in_production');
```

### Migration Strategy

- **Tool**: Wrangler CLI (`wrangler d1 migrations`)
- **Files**: SQL migration files in `migrations/` directory
- **Versioning**: Sequential numbering (0001_initial.sql, 0002_add_patterns.sql)
- **Execution**: Applied via CI/CD pipeline before deployment

### Backup Strategy

- **Automatic**: Cloudflare handles replication and durability
- **Manual**: Periodic exports to R2 for disaster recovery
- **Frequency**: Daily exports via scheduled Worker
- **Retention**: 30 days of daily backups

## Rationale

### Why D1 Over PostgreSQL?

**Cost**:
- D1: $0 (free tier covers 100x our usage)
- Managed PostgreSQL: $15-30/month minimum
- Savings: $180-360/year

**Operational Overhead**:
- D1: Zero management, automatic scaling, built-in backups
- PostgreSQL: Connection pooling, backups, monitoring, security patches
- Time savings: ~2-4 hours/month

**Performance**:
- D1: Runs at edge with Workers, no network latency
- PostgreSQL: Network round-trip to database server (10-50ms)
- D1 advantage: 10-50ms faster per query

**Integration**:
- D1: Native Workers binding, simple API
- PostgreSQL: Requires connection library, pooling, error handling
- D1 advantage: Less code, fewer dependencies

**Scalability**:
- D1: Auto-scales reads globally
- PostgreSQL: Vertical scaling only (upgrade instance size)
- D1 advantage: Better for global users

### Why D1 Over MongoDB?

**Data Model**:
- Queue calculations require complex joins and transactions
- Relational model is clearer for order lifecycle
- SQLite is more familiar to most developers

**Cost**:
- D1: Free
- MongoDB Atlas: $9/month minimum (shared cluster)
- Savings: $108/year

**Transactions**:
- D1: Full ACID transactions (critical for payments)
- MongoDB: Limited transaction support in free tier
- D1 advantage: Better for financial data

### Why D1 Over Local SQLite (on server)?

**Availability**:
- D1: Globally distributed, automatic failover
- Local SQLite: Single point of failure
- D1 advantage: Higher availability

**Scalability**:
- D1: Reads scale globally
- Local SQLite: Limited to single server
- D1 advantage: Better for growth

**Backups**:
- D1: Automatic replication
- Local SQLite: Manual backup scripts required
- D1 advantage: Less operational work

**Edge Integration**:
- D1: Native Workers binding
- Local SQLite: Would require separate API server
- D1 advantage: Simpler architecture

### Addressing D1 "Beta" Status

**Concern**: D1 is labeled "beta" by Cloudflare

**Reality**:
- In beta for 2+ years (since 2022)
- Widely used in production by many companies
- Cloudflare's track record: Workers were "beta" for years, now industry standard
- Active development and improvements

**Risk Assessment**:
- **Likelihood of breaking changes**: Low (SQLite is stable, API is simple)
- **Impact if issues occur**: Medium (can migrate to PostgreSQL)
- **Mitigation**: Regular backups, migration scripts ready

**Decision**: Risk is acceptable given cost savings and operational simplicity

## Consequences

### Positive

**Cost Efficiency**:
- Zero database costs (free tier)
- No connection pooling overhead
- No backup storage costs (included)

**Developer Experience**:
- Standard SQL (familiar to most developers)
- Simple API (no ORM complexity)
- Easy local development (Wrangler creates local SQLite)
- Fast iteration (no database server to restart)

**Performance**:
- Low latency (runs with Workers at edge)
- Automatic caching (Cloudflare handles)
- Fast reads globally (replicated)

**Operations**:
- Zero maintenance (Cloudflare manages)
- Automatic scaling (no capacity planning)
- Built-in monitoring (Cloudflare dashboard)

**Reliability**:
- Automatic replication (data durability)
- Global distribution (high availability)
- Cloudflare SLA (99.9%+)

### Negative

**Beta Status**:
- Not officially "production-ready" label
- Potential for breaking changes (though unlikely)
- Less mature than PostgreSQL/MySQL

**Write Limitations**:
- 100k writes/day free tier limit
- Single-writer model (writes go to primary region)
- Not suitable for high-write workloads

**Eventual Consistency**:
- Reads may be slightly stale (usually <60 seconds)
- Not suitable for real-time collaborative apps
- Acceptable for e-commerce (orders, inventory)

**Vendor Lock-in**:
- D1 is Cloudflare-only (can't run elsewhere)
- Migration to PostgreSQL requires effort
- Mitigation: SQLite underneath, standard SQL

**Limited Tooling**:
- No GUI admin tools (pgAdmin equivalent)
- Wrangler CLI only for management
- Limited third-party integrations

### Risks and Mitigations

**Risk**: D1 has breaking API changes
- **Likelihood**: Low (API is simple and stable)
- **Impact**: Medium (code changes required)
- **Mitigation**: Pin Wrangler version, test updates in staging
- **Response**: Update code, test thoroughly, deploy gradually

**Risk**: D1 has service outage
- **Likelihood**: Low (Cloudflare has good uptime)
- **Impact**: High (site is down)
- **Mitigation**: Cloudflare SLA, automatic failover
- **Response**: Monitor Cloudflare status, communicate with users

**Risk**: Exceed free tier limits (100k writes/day)
- **Likelihood**: Very low (<10 orders/month = ~300 writes/month)
- **Impact**: Low (paid tier is cheap: $5/month for 1M writes)
- **Mitigation**: Monitor usage in Cloudflare dashboard
- **Response**: Upgrade to paid tier if needed

**Risk**: Need to migrate to PostgreSQL
- **Likelihood**: Low (only if traffic grows 100x)
- **Impact**: Medium (migration effort)
- **Mitigation**: Keep schema simple, avoid D1-specific features
- **Response**: Export data, import to PostgreSQL, update connection code

**Risk**: Data loss or corruption
- **Likelihood**: Very low (Cloudflare handles durability)
- **Impact**: High (business data lost)
- **Mitigation**: Daily backups to R2, test restore procedure
- **Response**: Restore from backup, investigate root cause

## Alternatives Considered

### 1. Managed PostgreSQL (DigitalOcean, Neon, Supabase)

**Pros**:
- Industry standard, proven at scale
- Rich ecosystem (ORMs, tools, extensions)
- Strong consistency guarantees
- Not "beta" labeled

**Cons**:
- $15-30/month minimum cost
- Requires connection pooling from Workers
- Higher latency (network round-trip)
- More operational overhead

**Rejected**: Cost and complexity far exceed needs for <10 orders/month

### 2. PlanetScale (Serverless MySQL)

**Pros**:
- Serverless (pay per query)
- Good free tier (1B reads/month)
- MySQL compatible

**Cons**:
- More expensive than D1 at scale
- Not integrated with Cloudflare Workers
- Requires HTTP API (slower than native binding)
- Foreign key constraints disabled

**Rejected**: D1 is cheaper and better integrated with Workers

### 3. MongoDB Atlas

**Pros**:
- Flexible schema (NoSQL)
- Good free tier (512MB)
- Managed service

**Cons**:
- Document model not ideal for relational data
- Weaker transaction support
- More expensive than D1
- Requires connection library

**Rejected**: Relational model is better fit for queue/order management

### 4. Turso (Distributed SQLite)

**Pros**:
- Similar to D1 (distributed SQLite)
- More mature (not beta)
- Good free tier

**Cons**:
- Not integrated with Cloudflare Workers
- Requires HTTP API (slower)
- Smaller ecosystem than Cloudflare
- Another vendor to manage

**Rejected**: D1's native Workers integration is more valuable

### 5. Durable Objects (Cloudflare's stateful Workers)

**Pros**:
- Strong consistency
- Integrated with Workers
- Can use SQLite in-memory

**Cons**:
- More complex to implement
- Not designed for primary database
- Limited query capabilities
- Higher cost at scale

**Rejected**: Overkill for this use case, D1 is simpler

## Implementation Guidelines

### Database Access Pattern

```typescript
// workers/api/src/lib/db.ts
export async function getProjects(env: Env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM projects WHERE active = 1 ORDER BY created_at DESC'
  ).all();
  return results;
}

export async function createOrder(order: CreateOrderInput, env: Env) {
  // Use transactions for consistency
  const result = await env.DB.batch([
    env.DB.prepare('INSERT INTO orders (user_id, total_cents) VALUES (?, ?)')
      .bind(order.userId, order.totalCents),
    env.DB.prepare('UPDATE queue SET current_load = current_load + ?')
      .bind(order.queueWeight),
  ]);
  return result;
}
```

### Migration Workflow

```bash
# Create new migration
wrangler d1 migrations create bluebells-db add_patterns_table

# Edit migration file
vim migrations/0002_add_patterns_table.sql

# Apply to local database
wrangler d1 migrations apply bluebells-db --local

# Test locally
npm run dev

# Apply to staging
wrangler d1 migrations apply bluebells-db-staging --remote

# Apply to production (via CI/CD)
wrangler d1 migrations apply bluebells-db-prod --remote
```

### Backup Script

```typescript
// workers/backup/src/index.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    // Export database to R2 daily
    const timestamp = new Date().toISOString().split('T')[0];
    const backup = await env.DB.dump();
    
    await env.BACKUPS.put(
      `backups/${timestamp}.db`,
      backup
    );
  }
}
```

## Migration Path (If Needed)

If traffic grows beyond D1's capabilities (unlikely for years):

1. **Export data**: `wrangler d1 execute --remote --command ".dump"`
2. **Create PostgreSQL instance**: Provision managed PostgreSQL
3. **Import data**: `psql < dump.sql` (with minor syntax adjustments)
4. **Update connection code**: Replace D1 binding with PostgreSQL client
5. **Test thoroughly**: Ensure all queries work
6. **Deploy**: Blue-green deployment to minimize downtime

**Estimated effort**: 1-2 days for migration, 1 week for testing

## Success Criteria

This decision will be considered successful if:

1. **Zero database costs**: Stay within free tier for first year
2. **No data loss**: Zero incidents of data corruption or loss
3. **Fast queries**: 95th percentile query time <50ms
4. **High availability**: 99.9%+ uptime (Cloudflare SLA)
5. **Easy development**: Developers can run full stack locally
6. **Simple operations**: Zero time spent on database maintenance

## Review and Evolution

- **Review date**: After 6 months or when traffic exceeds 50 concurrent users
- **Metrics to track**: Query performance, free tier usage, developer satisfaction
- **Trigger for migration**: Consistent >10k writes/day or need for advanced features

## References

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Wrangler D1 Commands](https://developers.cloudflare.com/workers/wrangler/commands/#d1)
- Internal: `ADR-002-tech-stack.md` - Overall technology stack
- Internal: `ADR-003-infrastructure-as-code.md` - IaC approach

## Notes

- This decision was made on 2026-02-23
- D1 has been in beta since 2022, widely used in production
- Free tier limits: 5GB storage, 5M reads/day, 100k writes/day
- Expected usage: <1GB storage, <1k reads/day, <100 writes/day (well within limits)
- Migration to PostgreSQL is straightforward if needed (SQLite is standard SQL)
