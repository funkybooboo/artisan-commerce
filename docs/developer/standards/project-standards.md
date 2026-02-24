# Project Standards

This document defines the standards and conventions we follow for documentation, security, and project governance.

**Last Updated**: 2026-02-23

---

## Table of Contents

1. [Architecture Decision Records](#architecture-decision-records)
2. [Changelog](#changelog)
3. [Supply Chain Security](#supply-chain-security)

---

## Architecture Decision Records

We document all significant architectural decisions using **Architecture Decision Records (ADRs)**.

**Format**: [ADR format by Joel Parker Henderson](https://github.com/joelparkerhenderson/architecture-decision-record)

**Location**: [`plans/decisions/`](../../../plans/decisions/)

**Naming Convention**: `ADR-NNN-short-title.md`
- Example: `ADR-001-queue-system.md`
- Sequential numbering starting from 001
- Kebab-case for title

**Immutability**: Never delete or edit a past ADR. If a decision is reversed, write a new ADR that supersedes it.

### ADR Template

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

### When to Write an ADR

Write an ADR when:
- Choosing between two non-obvious approaches
- Making a decision that will be hard to reverse
- Adopting or rejecting a technology, library, or pattern
- Establishing a convention others will follow

### Current ADRs

See [`plans/decisions/README.md`](../../../plans/decisions/README.md) for the complete index.

---

## Changelog

We maintain a changelog following **[Keep a Changelog](https://keepachangelog.com/)** format.

**Format**: [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/)

**Location**: [`CHANGELOG.md`](../../../CHANGELOG.md) (project root)

**Versioning**: We follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

### Changelog Structure

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features

### Changed
- Changes to existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security fixes

## [1.0.0] - 2026-MM-DD

### Added
- Initial release

[Unreleased]: https://github.com/funkybooboo/artisan-commerce/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/funkybooboo/artisan-commerce/releases/tag/v1.0.0
```

### Change Categories

| Category | When to Use |
|----------|-------------|
| **Added** | New features or capabilities |
| **Changed** | Changes to existing functionality |
| **Deprecated** | Features that will be removed in a future release |
| **Removed** | Features removed in this release |
| **Fixed** | Bug fixes |
| **Security** | Security fixes and vulnerability patches |

### Guiding Principles

1. **Changelogs are for humans** - Write for users, not machines
2. **Group similar changes** - Organize by category
3. **One entry per version** - Every release gets an entry
4. **Latest first** - Most recent version at the top
5. **Link versions** - Link to GitHub releases and diffs
6. **Use ISO dates** - Format: `YYYY-MM-DD` (e.g., `2026-02-23`)

### Unreleased Section

Keep an `[Unreleased]` section at the top to track upcoming changes:

- Helps contributors see what's coming
- Makes releases easier (just rename to version number)
- Encourages documenting changes as they happen

### When to Update

Update the changelog:
- **Immediately** when merging a PR with user-facing changes
- **In the same PR** as the code change
- **Before creating a release** (move Unreleased → version number)

### What NOT to Include

Don't include:
- Commit log dumps (noise)
- Minor documentation tweaks
- Code formatting changes
- Internal refactorings (unless they affect users)
- Dependency updates (unless they fix bugs or add features)

---

## Supply Chain Security

We follow **[SLSA Level 3](https://slsa.dev/)** (Supply-chain Levels for Software Artifacts) for build integrity.

**Standard**: [SLSA v1.0](https://slsa.dev/spec/v1.0/)

**Target Level**: SLSA Level 3

**Implementation**: GitHub Actions with provenance generation

### What is SLSA?

SLSA (Supply-chain Levels for Software Artifacts) is a security framework that prevents tampering, improves integrity, and secures packages and infrastructure.

**Levels**:
- **Level 1**: Documentation of build process
- **Level 2**: Tamper-resistant build service
- **Level 3**: Hardened builds with provenance (our target)
- **Level 4**: Hermetic, reproducible builds

### SLSA Level 3 Requirements

We implement:

1. ✅ **Build as Code** - Build defined in version control
2. ✅ **Provenance Generation** - Automated provenance for all builds
3. ✅ **Provenance Distribution** - Provenance available to consumers
4. ✅ **Hermetic Builds** - Builds isolated from external influence
5. ✅ **Parameterless Builds** - No user-provided parameters
6. ✅ **Ephemeral Environments** - Fresh build environment each time
7. ✅ **Isolated Builds** - Builds cannot access secrets

### Implementation

**GitHub Actions Workflow** (`.github/workflows/release.yml`):

```yaml
name: Release
on:
  push:
    tags: ['v*']

permissions:
  contents: write
  id-token: write  # Required for SLSA provenance

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: dist/

  provenance:
    needs: [build]
    permissions:
      actions: read
      id-token: write
      contents: write
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v1.9.0
    with:
      base64-subjects: "${{ needs.build.outputs.hashes }}"
      upload-assets: true

  release:
    needs: [build, provenance]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            build-artifacts/*
            *.intoto.jsonl
```

### Verification

Users can verify build provenance:

```bash
# Install slsa-verifier
go install github.com/slsa-framework/slsa-verifier/v2/cli/slsa-verifier@latest

# Verify provenance
slsa-verifier verify-artifact \
  --provenance-path artifact.intoto.jsonl \
  --source-uri github.com/funkybooboo/artisan-commerce \
  artifact.tar.gz
```

### Benefits

1. **Tamper Detection** - Detect if artifacts were modified
2. **Build Integrity** - Verify builds came from our repository
3. **Dependency Trust** - Track dependencies through the supply chain
4. **Compliance** - Meet security requirements for enterprise users
5. **Transparency** - Public record of build process

### Resources

- [SLSA Official Site](https://slsa.dev/)
- [SLSA Specification](https://slsa.dev/spec/v1.0/)
- [SLSA GitHub Generator](https://github.com/slsa-framework/slsa-github-generator)
- [Verifying Provenance](https://slsa.dev/spec/v1.0/verifying-artifacts)

---

## Related Documents

- [Git Workflow](./git-workflow.md) - Branching and commit conventions
- [Code Standards](./code-standards.md) - Coding conventions
- [Testing](./testing.md) - Testing philosophy
- [Contributing](../guides/contributing.md) - How to contribute
- [ADRs](../../../plans/decisions/) - All architecture decisions
