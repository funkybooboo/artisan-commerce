# Getting Started

This guide walks you through setting up the project locally from scratch.

> **For detailed setup, testing, and debugging**: See [Local Development Guide](./developer/local-development.md)

## Prerequisites

Before you begin, make sure you have the following installed:

- **[mise](https://mise.jdx.dev/getting-started.html)** - Task runner and environment manager
- **Git** ([download](https://git-scm.com/))

```bash
# Verify your setup
mise --version
git --version
```

**Note**: `mise` will automatically install Node.js and other required tools when you run `mise run setup`.

---

## Installation

**1. Clone the repository:**

```bash
git clone https://github.com/funkybooboo/artisan-commerce.git
cd artisan-commerce
```

**2. Install dependencies:**

```bash
mise run setup
```

This installs Node.js (if needed) and all project dependencies.

**3. Configure your environment:**

```bash
cp .env.example .env
```

Open `.env` and fill in the required values. Every variable is documented in `.env.example`.

**4. Run the development servers:**

```bash
mise run dev
```

This starts:
- Frontend: http://localhost:5173 (SvelteKit)
- API: http://localhost:8787 (Cloudflare Workers)

---

## Configuration

All configuration is done through environment variables. Never hardcode config values in source code.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Runtime environment |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | - | Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | Yes | - | Cloudflare API token |
| `STRIPE_SECRET_KEY` | Yes | - | Stripe secret key (use test key locally) |
| `STRIPE_PUBLISHABLE_KEY` | Yes | - | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes | - | Stripe webhook signing secret |
| `RESEND_API_KEY` | Yes | - | Resend API key for emails |

See [`.env.example`](../.env.example) for the complete list with descriptions.

---

## Common Commands

| Command | Description |
|---------|-------------|
| `mise run setup` | Install dependencies and prepare environment |
| `mise run dev` | Run development servers (frontend + API) |
| `mise run test` | Run all tests |
| `mise run lint` | Run linter |
| `mise run build` | Build for production |
| `mise tasks ls` | Show all available commands |

For more commands, see [Local Development Guide](./developer/local-development.md#useful-commands-reference).

---

## Project Structure

```
artisan-commerce/
├── src/              # SvelteKit frontend
├── workers/          # Cloudflare Workers (API)
├── migrations/       # Database migrations
├── terraform/        # Infrastructure as Code
├── docs/             # Documentation
├── plans/            # Roadmap, ADRs, stories
└── .github/          # CI/CD workflows
```

For detailed structure, see [Local Development Guide](./developer/local-development.md#project-structure).

---

## Troubleshooting

**Problem:** Port already in use  
**Solution:** Kill the process using the port or change the port in your config.

**Problem:** Environment variable errors  
**Solution:** Make sure you've copied `.env.example` to `.env` and filled in all required values.

**Problem:** Database migration errors  
**Solution:** Reset your local database (see [Local Development Guide](./developer/local-development.md#resetting-local-database)).

For detailed troubleshooting, see [Local Development Guide](./developer/local-development.md#common-issues).

If you're stuck, [open an issue](https://github.com/funkybooboo/artisan-commerce/issues) with your environment details and what you tried.
