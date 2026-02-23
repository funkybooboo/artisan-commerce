# Developer Documentation

Technical documentation for contributors and maintainers of Bluebells & Thistles.

## Architecture

See [Architecture](../03-architecture.md) for the overall system design and domain model.

## Core Systems

### Queue Management
- **Queue Calculation Algorithm** -- How delivery estimates are calculated based on capacity
- **Capacity Management** -- Setting and adjusting production throughput
- **Queue Weight System** -- How different projects impact the queue differently

### Pricing Engine
- **Pricing Rules** -- How material, color, and size options affect price
- **Price Calculation** -- Composable pricing rules and modifiers
- **Historical Pricing** -- Preserving prices at time of purchase

### Payment Processing
- **Stripe Integration** -- Checkout flow and webhook handling
- **Refund Logic** -- Cancellation fees and refund calculations
- **Payment Security** -- PCI compliance and data handling

### Order Lifecycle
- **State Machine** -- Order states from pending to delivered
- **Modification Windows** -- Time-based rules for changes and cancellations
- **Email Notifications** -- Triggered emails for order events

### User Roles & Permissions
- **Role-Based Access Control** -- User, Admin, SuperAdmin capabilities
- **Admin Dashboard** -- Queue management and order processing
- **SuperAdmin Tools** -- System configuration and analytics

## API Reference

API documentation will be added once the technology stack is chosen.

## Testing Strategy

- **Unit Tests** -- Business logic (queue calculations, pricing rules, state transitions)
- **Integration Tests** -- Database operations, Stripe integration, email sending
- **E2E Tests** -- User flows (browse, order, modify, cancel)

## Writing Developer Guides

- Write for someone who will read or modify the source code
- Explain the *why* behind design decisions, not just the *what*
- Document edge cases and error handling explicitly
- Include the testing strategy: which test files cover this feature
- Link to relevant ADRs if a significant decision was made

Add a file here for any feature complex enough to warrant explanation beyond inline comments.
Name files after the feature: `queue-algorithm.md`, `pricing-engine.md`, `order-state-machine.md`.
