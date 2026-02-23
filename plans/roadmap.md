# Roadmap

This document tracks what we're building, why, and in what order.

## Vision

Bluebells & Thistles becomes the standard for transparent, sustainable made-to-order craft businesses. Artisans manage their capacity honestly, customers receive realistic expectations, and the platform handles the complexity of queue management, payments, and order fulfillment. At its best, it proves that handmade commerce can be both profitable and humane.

**Platform Scope:** Web-only with mobile-responsive design. No native mobile apps planned.

## Status Legend

| Symbol | Meaning |
|--------|---------|
| [x] | Complete |
| [/] | In progress |
| [ ] | Planned |
| [?] | Future / under consideration |

---

## v0.1.0 -- Foundation [/]

**Goal:** Repository structure, documentation, and planning complete. Ready to start building.

- [x] Repository structure and tooling
- [x] Documentation framework customized for Bluebells & Thistles
- [x] Project vision and domain model documented
- [x] Architecture decision record for queue system
- [x] Initial user stories
- [ ] Technology stack decision (ADR)
- [ ] CI/CD pipeline configured
- [ ] Development environment setup instructions

**Done when:** A new contributor can understand the project vision, see the roadmap, and know what technology stack we're using.

---

## v0.2.0 -- Authentication & User Management [ ]

**Goal:** Users can create accounts and sign in. Role-based access control in place.

- [ ] User registration and email verification
- [ ] User login and session management
- [ ] Password reset flow
- [ ] Role-based access control (User, Admin, SuperAdmin)
- [ ] User profile and account settings
- [ ] Address book management
- [ ] Tests for all authentication flows

**Done when:** Users can create accounts, sign in, manage their profile, and the system enforces role-based permissions.

---

## v0.3.0 -- Core Entities (Projects & Patterns) [ ]

**Goal:** Admin can create and manage projects and patterns. Users can browse them.

- [ ] Project CRUD (admin only)
- [ ] Pattern CRUD (admin only)
- [ ] Project options system (material, color, size)
- [ ] Pricing rules engine
- [ ] Projects gallery with filtering and sorting
- [ ] Patterns gallery with filtering and sorting
- [ ] Project detail pages
- [ ] Pattern detail pages
- [ ] Favorites system
- [ ] Tests for all CRUD operations and business logic

**Done when:** Admin can create projects and patterns with options. Users can browse, filter, and favorite them.

---

## v0.4.0 -- Queue System [ ]

**Goal:** The core differentiator -- queue-based production capacity management.

- [ ] Queue entity and capacity configuration
- [ ] Queue calculation algorithm
- [ ] Queue weight system for projects
- [ ] Dynamic delivery estimate calculation
- [ ] Queue position tracking for orders
- [ ] Capacity limits (disable ordering when full)
- [ ] Admin queue dashboard
- [ ] Queue visualization for users
- [ ] Tests for queue calculations and edge cases

**Done when:** The queue system accurately calculates delivery estimates and enforces capacity limits.

---

## v0.5.0 -- Shopping Cart & Orders [ ]

**Goal:** Users can add items to cart and place orders (without payment yet).

- [ ] Shopping cart functionality
- [ ] Cart persistence (logged-in users)
- [ ] Order creation
- [ ] Order lifecycle state machine
- [ ] Order modification windows (12hr/24hr rules)
- [ ] Order cancellation with fee calculation
- [ ] Order history
- [ ] Email notifications for order events
- [ ] Tests for order lifecycle and business rules

**Done when:** Users can add items to cart, place orders, and modify/cancel within allowed windows.

---

## v0.6.0 -- Payment Integration [ ]

**Goal:** Stripe integration for checkout and refunds.

- [ ] Stripe account setup and configuration
- [ ] Checkout flow with Stripe
- [ ] Payment confirmation
- [ ] Webhook handling for payment events
- [ ] Refund processing
- [ ] Cancellation fee handling
- [ ] Payment security and PCI compliance
- [ ] Tests for payment flows (using Stripe test mode)

**Done when:** Users can complete purchases with real payment processing via Stripe.

---

## v0.7.0 -- Admin Tools [ ]

**Goal:** Admin dashboard for managing orders and queue.

- [ ] Admin order management interface
- [ ] Order details view with customer info
- [ ] Queue management dashboard
- [ ] Capacity adjustment tools
- [ ] Order status updates (mark as shipped, etc.)
- [ ] Email notifications for admins
- [ ] Refund and override tools
- [ ] Tests for admin workflows

**Done when:** Admin can manage the entire order lifecycle and queue from the dashboard.

---

## v0.8.0 -- Merch & Inventory [ ]

**Goal:** Traditional inventory-based products separate from handmade queue.

- [ ] Merch entity with inventory tracking
- [ ] Merch CRUD (admin)
- [ ] Merch gallery (users)
- [ ] Inventory management
- [ ] Backorder rules
- [ ] Merch orders (separate from queue)
- [ ] Tests for inventory logic

**Done when:** Admin can sell branded merchandise with traditional inventory management.

---

## v0.9.0 -- Reviews & Polish [ ]

**Goal:** Review system and UX improvements.

- [ ] Review system (verified buyers only)
- [ ] Photo uploads for reviews
- [ ] Delivery accuracy ratings
- [ ] Mobile-responsive design (all pages)
- [ ] Touch-friendly UI for tablets/phones
- [ ] Improved error messages and validation
- [ ] Performance optimization
- [ ] Edge case handling
- [ ] Test coverage >= 85%

**Done when:** Users can leave reviews, and the platform works beautifully on all screen sizes.

---

## v1.0.0 -- MVP Launch [ ]

**Goal:** Stable, documented, and ready for production use.

- [ ] All core features complete and tested
- [ ] Full user and developer documentation
- [ ] Security review and penetration testing
- [ ] Performance testing and optimization
- [ ] Deployment guide
- [ ] Monitoring and error tracking setup
- [ ] Legal pages (terms, privacy policy)
- [ ] Launch checklist complete

**Done when:** The platform is ready for real customers and real transactions.

---

## Backlog

Ideas that don't have a version yet. Promoted to a milestone when prioritized.

### High priority
- SuperAdmin analytics dashboard (revenue, popular patterns, queue saturation)
- Email notifications when queue capacity opens up
- Pattern-to-product integration (upsell: "Make it yourself or order one made")

### Medium priority
- Made-to-measure custom sizing
- Subscription queue (members get priority)
- Community page (user-submitted projects using patterns)
- Seasonal drops (limited ordering windows)
- Limited pattern releases (scarcity-based launches)
- Multi-color pricing complexity
- Gift orders with custom messages
- Wishlist sharing

### Low priority / nice to have
- Social media integration (share projects on Pinterest, Instagram)
- Referral program
- Loyalty points
- Live chat support
- Video tutorials for patterns
- Pattern difficulty ratings and time estimates
- Progressive Web App (PWA) for offline pattern access

---

## How to Use This Document

- Check off items as they're completed: `- [x]`
- Update status symbols as work progresses
- Add new milestones as the project evolves
- Move backlog items into milestones when they're prioritized
- Keep acceptance criteria realistic and measurable

## Related

- [Stories](./stories/) -- user stories with acceptance criteria
- [Decisions](./decisions/) -- architecture decision records
- [CHANGELOG](../CHANGELOG.md) -- what shipped in each release
