# Architecture Decision Records

Every significant architectural decision gets a record here. ADRs are short, permanent, and written at the time the decision is made.

**Format**: We follow the [ADR format by Joel Parker Henderson](https://github.com/joelparkerhenderson/architecture-decision-record)

**Naming**: `ADR-NNN-short-title.md` (e.g., `ADR-001-queue-system.md`)

**Immutability**: Never delete or edit a past ADR -- if a decision is reversed, write a new ADR that supersedes it.

For complete ADR guidelines, see [Project Standards](../../docs/developer/standards/project-standards.md#architecture-decision-records).

## Status Values

| Status | Meaning |
|--------|---------|
| `Proposed` | Under discussion, not yet decided |
| `Accepted` | Decision made, in effect |
| `Superseded by ADR-NNN` | Replaced by a later decision |
| `Deprecated` | No longer relevant |

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](./ADR-001-example.md) | Queue-Based Production Capacity Management | Accepted |
| [ADR-002](./ADR-002-tech-stack.md) | Technology Stack - Cloudflare Serverless | Accepted |
| [ADR-003](./ADR-003-infrastructure-as-code.md) | Infrastructure as Code with Terraform | Accepted |
| [ADR-004](./ADR-004-database-cloudflare-d1.md) | Database - Cloudflare D1 | Accepted |
| [ADR-005](./ADR-005-adapter-architecture.md) | Comprehensive Adapter Architecture | Accepted |
| [ADR-006](./ADR-006-sveltekit.md) | SvelteKit for Simplicity and Edge Performance | Accepted |

---

## ADR Template

```markdown
# ADR-NNN: [Short Title]

## Status

[Proposed | Accepted | Superseded by ADR-NNN | Deprecated]

## Context

[What situation prompted this decision? What options were available?]

## Decision

[What did we decide?]

## Rationale

- [Reason 1]
- [Reason 2]
- [Reason 3]

## Consequences

### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Tradeoff 1]
- [Tradeoff 2]

## Alternatives Considered

1. **[Option A]**: [Why it was rejected]
2. **[Option B]**: [Why it was rejected]
```
