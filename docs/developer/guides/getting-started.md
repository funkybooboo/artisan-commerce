# Getting Started

**Quick 5-minute setup** to get Artisan Commerce running locally.

For detailed setup, testing, and debugging, see [Development Guide](./development.md).

---

## Prerequisites

- **[mise](https://mise.jdx.dev/getting-started.html)** - Task runner (installs Node.js automatically)
- **Git** - Version control

```bash
# Verify installation
mise --version
git --version
```

---

## Installation

### 1. Clone and Install

```bash
git clone https://github.com/funkybooboo/artisan-commerce.git
cd artisan-commerce
mise run setup
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and fill in required values
```

### 3. Start Development Servers

```bash
mise run dev
```

**Access**:
- Frontend: http://localhost:5173
- API: http://localhost:8787

---

## Common Commands

| Command | Description |
|---------|-------------|
| `mise run setup` | Install dependencies |
| `mise run dev` | Start dev servers |
| `mise run test` | Run tests |
| `mise run lint` | Run linter |
| `mise run build` | Build for production |
| `mise tasks ls` | Show all commands |

---

## Project Structure

```
artisan-commerce/
├── src/              # SvelteKit frontend
├── workers/          # Cloudflare Workers API
├── migrations/       # Database migrations
├── terraform/        # Infrastructure as Code
├── docs/             # Documentation
├── plans/            # Roadmap, ADRs, stories
└── .github/          # CI/CD workflows
```

---

## Troubleshooting

**Port already in use**  
Kill the process or change the port in your config.

**Environment variable errors**  
Ensure `.env` exists and all required values are filled in.

**Database migration errors**  
See [Development Guide](./development.md#database-migrations) for reset instructions.

**Still stuck?**  
[Open an issue](https://github.com/funkybooboo/artisan-commerce/issues) with your environment details.

---

## Next Steps

- Read [Architecture](../reference/architecture.md) to understand the system design
- Review [Code Standards](../standards/code-standards.md) before contributing
- See [Development Guide](./development.md) for detailed workflows
- Check [Roadmap](../../plans/roadmap.md) to see what we're building
