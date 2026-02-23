# Bluebells & Thistles

> A transparent, capacity-managed platform for made-to-order artisan crafts

[![CI](https://github.com/funkybooboo/bluebellsandthistles/actions/workflows/ci.yml/badge.svg)](https://github.com/funkybooboo/bluebellsandthistles/actions/workflows/ci.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)

---

## What Is It?

Bluebells & Thistles is a made-to-order artisan crafts marketplace that brings transparency to handmade production. Unlike traditional e-commerce platforms, it manages finite production capacity through a queue-based system, giving customers realistic delivery estimates and artisans control over their workload. The platform supports crochet, knitting, cross stitch, embroidery, and sewn goods, along with digital pattern sales.

**Web-based platform** with mobile-responsive design - accessible from any device without native apps.

**Core Principles**: Cheap, Convenient, Secure, Portable, LLM-Friendly

## Technology Stack

Built on a modern serverless edge architecture optimized for cost, portability, and AI-assisted development:

- **Frontend**: Next.js 14 App Router (TypeScript) deployed to Cloudflare Pages
- **Backend**: Hono on Cloudflare Workers (serverless functions at the edge)
- **Database**: Drizzle ORM + Cloudflare D1 (distributed SQLite, multi-tenant ready)
- **File Storage**: Cloudflare R2 (S3-compatible object storage)
- **Infrastructure**: Terraform (Infrastructure as Code)
- **CI/CD**: GitHub Actions with SLSA Level 3 provenance
- **Testing**: TDD with Vitest + Playwright (85%+ coverage target)
- **Monorepo**: pnpm workspaces with comprehensive adapter pattern

**Monthly Cost**: ~$1-5 (domain + transaction fees) - everything else runs on free tiers.

**Key Features**:
- Zero vendor lock-in (comprehensive adapter pattern for all external services)
- Multi-tenant architecture (ready for white-label SaaS expansion)
- LLM-optimized tech stack (maximum AI-assisted development velocity)
- SLSA Level 3 supply chain security
- 12-Factor App compliant

See [ADR-002](./plans/decisions/ADR-002-tech-stack.md) and [ADR-006](./plans/decisions/ADR-006-nextjs-app-router.md) for detailed technology decisions.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/funkybooboo/bluebellsandthistles.git
cd bluebellsandthistles

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Start development servers
pnpm run dev
```

The app will be available at:
- Frontend: http://localhost:3000 (Next.js)
- API: http://localhost:8787 (Cloudflare Workers)

**Next Steps:**
- **Quick Start**: See [Getting Started](./docs/02-getting-started.md) (5 minutes)
- **Detailed Setup**: See [Local Development Guide](./docs/developer/local-development.md) (complete guide)
- **Comprehensive Roadmap**: See [Roadmap](./plans/ROADMAP-COMPREHENSIVE.md) (all decisions and milestones)
- **Deployment**: See [Deployment Guide](./docs/developer/deployment.md)

## Documentation

| | |
|---|---|
| [Introduction](./docs/01-introduction.md) | What this project is and the values behind it |
| [Getting Started](./docs/02-getting-started.md) | Setup, configuration, and your first run |
| [Architecture](./docs/03-architecture.md) | How the project is structured and why |
| [Code Standards](./docs/04-code-standards.md) | Naming, style, and enforcement |
| [Testing](./docs/05-testing.md) | Philosophy, strategy, and how to run tests |
| [Contributing](./docs/06-contributing.md) | How to get involved |
| [Git Workflow](./docs/07-git-workflow.md) | Branching, commits, and pull requests |
| [Design Patterns](./docs/08-design-patterns.md) | Patterns used in this project and when to apply them |
| [Feature Development](./docs/09-feature-development-loop.md) | End-to-end process from idea to production |
| [Documentation Standards](./docs/10-documentation-standards.md) | How to write and maintain docs |

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

## License

[GPL-3.0](./LICENSE)
