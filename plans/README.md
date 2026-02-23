# Plans

Project planning, decisions, and history.

| Directory | What lives here |
|-----------|----------------|
| [`vision.md`](./vision.md) | Original project concept and detailed vision from ChatGPT brainstorming |
| [`roadmap.md`](./roadmap.md) | **Start here** - High-level versioned milestones and feature backlog for quick reference |
| [`ROADMAP-COMPREHENSIVE.md`](./ROADMAP-COMPREHENSIVE.md) | **Deep dive** - Complete technical implementation details with all decisions and business rules |
| [`stories/`](./stories/) | User stories with acceptance criteria |
| [`specs/`](./specs/) | Technical specifications for complex features |
| [`decisions/`](./decisions/) | Architecture Decision Records (ADRs) |
| [`retrospectives/`](./retrospectives/) | Sprint and release retrospectives |

**When to use which roadmap:**
- **Quick check**: Use `roadmap.md` to see what's done, in progress, or planned
- **Implementation**: Use `ROADMAP-COMPREHENSIVE.md` for detailed specs and acceptance criteria
- **Both are maintained** and serve different purposes

## How to Use This Directory

**Starting a new feature?**
1. Write a user story in `stories/` -- define the problem and acceptance criteria first
2. If the implementation is complex, write a technical spec in `specs/`
3. If you're making a significant architectural decision, write an ADR in `decisions/`

**Finishing a release?**
Write a retrospective in `retrospectives/` -- what went well, what didn't, what to change.

**Looking for context on a past decision?**
Check `decisions/` -- every significant architectural choice should be documented there.
