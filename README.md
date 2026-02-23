# Bluebells & Thistles

> A transparent, capacity-managed platform for made-to-order artisan crafts

[![CI](https://github.com/funkybooboo/bluebellsandthistles/actions/workflows/ci.yml/badge.svg)](https://github.com/funkybooboo/bluebellsandthistles/actions/workflows/ci.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)

---

## What Is It?

Bluebells & Thistles is a made-to-order artisan crafts marketplace that brings transparency to handmade production. Unlike traditional e-commerce platforms, it manages finite production capacity through a queue-based system, giving customers realistic delivery estimates and artisans control over their workload. The platform supports crochet, knitting, cross stitch, embroidery, and sewn goods, along with digital pattern sales.

## Getting Started

```bash
git clone https://github.com/funkybooboo/bluebellsandthistles.git
cd bluebellsandthistles
mise run setup
cp .env.example .env
mise run dev
```

See [Getting Started](./docs/02-getting-started.md) for full setup, configuration, and available commands.

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
