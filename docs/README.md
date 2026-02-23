# Documentation

Everything you need to understand, build, and contribute to this project.

## Developer Guide

| # | Document | What it covers |
|---|----------|----------------|
| 01 | [Introduction](./01-introduction.md) | What this project is and the values behind it |
| 02 | [Getting Started](./02-getting-started.md) | Setup, config, and your first run |
| 03 | [Architecture](./03-architecture.md) | How the project is structured and why |
| 04 | [Code Standards](./04-code-standards.md) | Naming, style, error handling, and enforcement |
| 05 | [Testing](./05-testing.md) | Philosophy, pyramid, no-mocks policy, TDD |
| 06 | [Contributing](./06-contributing.md) | How to get involved |
| 07 | [Git Workflow](./07-git-workflow.md) | Branching, commits, PRs, and clean history |
| 08 | [Design Patterns](./08-design-patterns.md) | Adapters, DI, repository, result, and more |
| 09 | [Feature Development Loop](./09-feature-development-loop.md) | Story -> tests -> implement -> ship |
| 10 | [Documentation Standards](./10-documentation-standards.md) | How to write and maintain docs |
| 11 | [Architecture Decisions Summary](./11-architecture-decisions-summary.md) | Quick reference for all decisions |

## User Documentation

End-user guides live in [`user/`](./user/). Written for people who use the project, not people who build it.

| Document | What it covers |
|----------|----------------|
| [Getting Started](./user/getting-started.md) | Install, first run, basic usage, configuration |

## Developer Guides

Operational guides for developers working on the project. See [`developer/`](./developer/) for the complete index.

| Guide | What it covers |
|-------|----------------|
| [Local Development](./developer/local-development.md) | Setup, workflow, testing, debugging |
| [Deployment](./developer/deployment.md) | CI/CD, staging/production, rollback |
| [Tech Stack](./developer/tech-stack.md) | Technology decisions quick reference |

For feature-specific technical documentation (queue algorithm, pricing engine, etc.), see the [Developer Guides README](./developer/README.md).

---

> All documentation is plain text (Markdown), version controlled, and reviewed in pull requests.
> Update docs in the same PR as the code they describe.
