# Getting Started

This guide walks you through setting up the project locally from scratch.

## Prerequisites

Before you begin, make sure you have the following installed:

- [mise](https://mise.jdx.dev/getting-started.html) -- Task runner and environment manager for this project
- [Git](https://git-scm.com/) -- Version control

**Note:** The technology stack (programming language, framework, database) will be determined in a future architecture decision record. For now, the project contains documentation and planning materials only.

```bash
# Verify your setup
mise --version
git --version
```

---

## Installation

**1. Clone the repository:**

```bash
git clone https://github.com/funkybooboo/bluebellsandthistles.git
cd bluebellsandthistles
```

**2. Install dependencies:**

```bash
mise run setup
```

**3. Configure your environment:**

```bash
cp .env.example .env
```

Open `.env` and fill in the required values. Every variable is documented in `.env.example`.

**4. Run the project:**

```bash
mise run dev
```

---

## Configuration

All configuration is done through environment variables. Never hardcode config values in source code.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_ENV` | No | `development` | Runtime environment (`development`, `test`, `production`) |
| `LOG_LEVEL` | No | `info` | Log verbosity (`debug`, `info`, `warn`, `error`) |
| `DATABASE_URL` | Yes | - | Database connection string |
| `STRIPE_SECRET_KEY` | Yes | - | Stripe API secret key for payment processing |
| `STRIPE_PUBLISHABLE_KEY` | Yes | - | Stripe API publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes | - | Stripe webhook signing secret |
| `EMAIL_SERVICE_API_KEY` | Yes | - | Email service API key for order notifications |
| `EMAIL_FROM_ADDRESS` | Yes | - | From address for system emails |
| `QUEUE_MAX_CAPACITY` | No | `100` | Maximum queue capacity (in weight units) |
| `QUEUE_WEEKLY_THROUGHPUT` | No | `10` | Weekly production throughput (weight units per week) |

**Note:** Specific environment variables will be finalized once the technology stack is chosen.

---

## Common Commands

| Command | Description |
|---------|-------------|
| `mise run setup` | Install dependencies and prepare the environment |
| `mise run dev` | Run the project in development mode |
| `mise run test` | Run all tests |
| `mise run validate` | Run all checks -- format, lint, type-check, test, build |
| `mise run build` | Build for production |
| `mise tasks ls` | Show all available commands |

---

## Project Structure

```
bluebellsandthistles/
|-- docs/             # Documentation
|-- plans/            # Roadmap, stories, decisions, retrospectives, vision
|-- .github/          # CI workflow and GitHub templates
|-- .env.example      # Environment variable reference
|-- mise.toml         # All development commands
|-- CHANGELOG.md      # Version history
`-- README.md
```

Source code directories will be added once the technology stack is determined.

---

## Troubleshooting

**Problem:** `mise` command not found
**Solution:** Install [mise](https://mise.jdx.dev/getting-started.html) -- the task runner used by this project.

**Problem:** Environment variable errors on startup
**Solution:** Make sure you've copied `.env.example` to `.env` and filled in all required values.

<!-- Add project-specific troubleshooting here as you discover common issues. -->

If you're stuck, [open an issue](https://github.com/funkybooboo/bluebellsandthistles/issues) with your environment details and what you tried.
