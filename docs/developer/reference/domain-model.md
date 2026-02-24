# Domain Model

This document defines all entities, relationships, and data structures for Artisan Commerce.

**Last Updated**: 2026-02-23

---

## Table of Contents

1. [Architecture](#architecture)
2. [Core Entities](#core-entities)
3. [Supporting Entities](#supporting-entities)
4. [Relationships](#relationships)
5. [Database Schema](#database-schema)

---

## Architecture

### Single-Tenant Architecture

**One artisan business per application instance**:

- Each deployment serves a single artisan business
- No runtime multi-tenancy or tenant isolation needed
- Brand configuration via environment variables (.env)
- To serve multiple artisan businesses, fork the repository and deploy separate instances
- Database schema is simple - no tenant_id columns needed

**Example**: Your wife's shop "Bluebells & Thistles" runs on one instance. Another artisan "Cozy Crafts" would fork the repo and deploy their own instance with their own branding.

**Configuration**:
```bash
# .env for Bluebells & Thistles
BUSINESS_NAME="Bluebells & Thistles"
BUSINESS_DOMAIN="bluebellsandthistles.com"
BUSINESS_EMAIL="hello@bluebellsandthistles.com"
```

---

## Core Entities

### User

**Purpose**: Represents both customers and artisans in the system.

**Fields**:
- `id` (TEXT, PK): Unique identifier (UUID)
- `email` (TEXT, UNIQUE): User email address
- `name` (TEXT): Full name
- `phone` (TEXT, nullable): Phone number
- `role` (TEXT): Role type - `customer` or `artisan`
- `default_address` (JSON, nullable): Default shipping address
- `created_at` (INTEGER): Unix timestamp
- `updated_at` (INTEGER): Unix timestamp
- `last_login_at` (INTEGER, nullable): Unix timestamp

**Roles**:
- `customer`: Regular buyers
- `artisan`: Business owner/admin

**Example**:
```json
{
  "id": "usr_abc123",
  "email": "customer@example.com",
  "name": "Jane Doe",
  "phone": "+1234567890",
  "role": "customer",
  "default_address": {
    "street": "123 Main St",
    "city": "Salt Lake City",
    "state": "UT",
    "zip": "84101",
    "country": "US"
  },
  "created_at": 1708704000,
  "updated_at": 1708704000,
  "last_login_at": 1708704000
}
```

---

### Project (Made-to-Order Handmade Items)

**Purpose**: Represents handmade items that are made-to-order and enter the queue.

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `name` (TEXT): Project name
- `description` (TEXT): Full description
- `type` (TEXT): Project type - `crochet`, `knitting`, `embroidery`, `cross_stitch`, `sewn`
- `base_price` (INTEGER): Base price in cents
- `production_time_weeks` (INTEGER): Estimated production time
- `queue_tier` (TEXT): Queue weight tier - `xsmall`, `small`, `medium`, `large`, `xlarge`
- `pattern_id` (TEXT, FK, nullable): Linked pattern
- `enabled` (BOOLEAN): Whether project is visible/orderable
- `created_at` (INTEGER): Unix timestamp
- `updated_at` (INTEGER): Unix timestamp

**Queue Tiers**:
- `xsmall` = 1 weight unit (coasters, small accessories)
- `small` = 2 weight units (hats, scarves)
- `medium` = 4 weight units (baby blankets, small garments)
- `large` = 6 weight units (sweaters, large blankets)
- `xlarge` = 8 weight units (king-size blankets, complex projects)

---

### Pattern (Digital/Physical Products)

**Purpose**: Represents digital patterns (PDFs) or physical pattern books.

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `name` (TEXT): Pattern name
- `description` (TEXT): Full description
- `difficulty` (TEXT): Difficulty level - `beginner`, `intermediate`, `advanced`
- `price` (INTEGER): Price in cents
- `file_url` (TEXT): R2 storage URL for PDF
- `preview_urls` (JSON): Array of preview image URLs
- `enabled` (BOOLEAN): Whether pattern is visible/purchasable
- `created_at` (INTEGER): Unix timestamp
- `updated_at` (INTEGER): Unix timestamp

**Example**:
```json
{
  "preview_urls": [
    "https://r2.example.com/patterns/preview1.jpg",
    "https://r2.example.com/patterns/preview2.jpg"
  ]
}
```

---

### Order

**Purpose**: Represents a customer order containing one or more items.

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `customer_id` (TEXT, FK): Reference to user
- `status` (TEXT): Order status (see lifecycle below)
- `subtotal` (INTEGER): Subtotal in cents (before tax/shipping)
- `tax` (INTEGER): Tax amount in cents
- `shipping` (INTEGER): Shipping cost in cents
- `discount` (INTEGER): Discount amount in cents
- `total` (INTEGER): Total amount in cents
- `shipping_address` (JSON): Snapshot of shipping address
- `tracking_number` (TEXT, nullable): Shipping tracking number
- `payment_intent_id` (TEXT, nullable): Stripe payment intent ID
- `discount_code_id` (TEXT, FK, nullable): Applied discount code
- `modification_window_hours` (INTEGER): Hours for free modifications (default: 12)
- `queue_position` (INTEGER, nullable): Position in queue
- `estimated_delivery_date` (INTEGER, nullable): Unix timestamp
- `shipped_at` (INTEGER, nullable): Unix timestamp
- `delivered_at` (INTEGER, nullable): Unix timestamp
- `created_at` (INTEGER): Unix timestamp
- `updated_at` (INTEGER): Unix timestamp

**Status Lifecycle**:
1. `pending_payment` - Cart checked out, awaiting payment
2. `paid` - Payment successful, entering queue
3. `in_queue` - Waiting for production
4. `in_production` - Artisan working on it
5. `shipped` - Tracking number assigned
6. `delivered` - Confirmed delivery
7. `cancelled` - Customer or artisan cancelled
8. `refunded` - Payment refunded

---

### Order Item

**Purpose**: Individual items within an order.

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `order_id` (TEXT, FK): Reference to order
- `item_type` (TEXT): Type - `project`, `pattern`, `merch`
- `item_id` (TEXT): Reference to project/pattern/merch
- `quantity` (INTEGER): Quantity ordered
- `unit_price` (INTEGER): Price per unit in cents (snapshot)
- `selected_options` (JSON): Selected options (material, color, size, etc.)
- `tax_rate` (REAL): Tax rate applied (e.g., 0.08 for 8%)
- `tax_amount` (INTEGER): Tax amount in cents
- `subtotal` (INTEGER): Subtotal in cents (quantity * unit_price)
- `created_at` (INTEGER): Unix timestamp

**Example Options**:
```json
{
  "material": "wool",
  "color": "blue",
  "size": "large",
  "custom_text": "Happy Birthday!",
  "custom_measurements": "Chest: 42in, Length: 28in"
}
```

---

### Queue Entry

**Purpose**: Tracks orders in the production queue.

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `order_id` (TEXT, FK): Reference to order
- `position` (INTEGER): Position in queue (1-indexed)
- `weight` (INTEGER): Queue weight (based on project tier)
- `entered_at` (INTEGER): Unix timestamp when entered queue
- `estimated_completion_at` (INTEGER, nullable): Unix timestamp
- `created_at` (INTEGER): Unix timestamp
- `updated_at` (INTEGER): Unix timestamp

---

### Queue Config

**Purpose**: Global queue configuration (single row).

**Fields**:
- `id` (TEXT, PK): Always "default"
- `weekly_capacity` (INTEGER): Weight units per week
- `is_paused` (BOOLEAN): Vacation mode enabled
- `paused_reason` (TEXT, nullable): Reason for pause
- `updated_at` (INTEGER): Unix timestamp

---

## Supporting Entities

### Project Image

**Purpose**: Multiple images for a project.

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `project_id` (TEXT, FK): Reference to project
- `url` (TEXT): R2 storage URL
- `display_order` (INTEGER): Sort order (0-indexed)
- `created_at` (INTEGER): Unix timestamp

---

### Project Option

**Purpose**: Configurable options for projects (material, color, size, etc.).

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `project_id` (TEXT, FK): Reference to project
- `option_type` (TEXT): Type - `material`, `color`, `size`, `custom_text`
- `option_value` (TEXT): Value (e.g., "wool", "blue", "large")
- `price_modifier` (INTEGER): Price adjustment in cents
- `dependencies` (JSON, nullable): Conditional logic
- `created_at` (INTEGER): Unix timestamp

**Example Dependencies**:
```json
{
  "requires": {
    "material": "wool"
  },
  "available_colors": ["blue", "red", "green"]
}
```

---

### Merch (Inventory-Based Products)

**Purpose**: Traditional inventory-based products (not made-to-order).

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `name` (TEXT): Product name
- `description` (TEXT): Full description
- `price` (INTEGER): Price in cents
- `stock_quantity` (INTEGER): Current stock
- `low_stock_threshold` (INTEGER): Alert threshold
- `enabled` (BOOLEAN): Whether visible/purchasable
- `created_at` (INTEGER): Unix timestamp
- `updated_at` (INTEGER): Unix timestamp

---

### Review

**Purpose**: Customer reviews for completed orders.

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `customer_id` (TEXT, FK): Reference to user
- `project_id` (TEXT, FK): Reference to project
- `order_id` (TEXT, FK): Reference to order
- `rating` (INTEGER): Star rating (1-5)
- `comment` (TEXT): Review text
- `delivery_on_time` (BOOLEAN): Was delivery on time?
- `status` (TEXT): `visible` or `hidden`
- `hidden_reason` (TEXT, nullable): Reason for hiding
- `hidden_by` (TEXT, FK, nullable): Artisan who hid it
- `hidden_at` (INTEGER, nullable): Unix timestamp
- `created_at` (INTEGER): Unix timestamp

---

### Review Response

**Purpose**: Artisan responses to reviews.

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `review_id` (TEXT, FK): Reference to review
- `artisan_id` (TEXT, FK): Reference to user (artisan)
- `response_text` (TEXT): Response content
- `created_at` (INTEGER): Unix timestamp

---

### Message

**Purpose**: Order chat and contact form messages.

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `type` (TEXT): Message type - `order` or `contact`
- `order_id` (TEXT, FK, nullable): Reference to order (null for contact)
- `sender_id` (TEXT, FK): Reference to user
- `sender_type` (TEXT): `customer` or `artisan`
- `message` (TEXT): Message content
- `created_at` (INTEGER): Unix timestamp

---

### Favorite

**Purpose**: Customer wishlist/favorites.

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `customer_id` (TEXT, FK): Reference to user
- `project_id` (TEXT, FK): Reference to project
- `created_at` (INTEGER): Unix timestamp
- `notified_at` (INTEGER, nullable): Last notification timestamp

---

### Discount Code

**Purpose**: Promotional discount codes.

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `code` (TEXT, UNIQUE): Discount code (e.g., "SAVE10")
- `type` (TEXT): Type - `percent` or `fixed`
- `value` (INTEGER): Discount value (percent or cents)
- `usage_limit` (INTEGER): Max uses (default: 1)
- `expires_at` (INTEGER, nullable): Unix timestamp
- `created_by` (TEXT, FK): Reference to user (artisan)
- `created_at` (INTEGER): Unix timestamp

**Example**:
- Code: "SAVE10", Type: "percent", Value: 10 = 10% off
- Code: "FIVE", Type: "fixed", Value: 500 = $5 off

---

### Discount Code Usage

**Purpose**: Tracks discount code usage.

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `discount_code_id` (TEXT, FK): Reference to discount code
- `order_id` (TEXT, FK): Reference to order
- `used_at` (INTEGER): Unix timestamp

---

### Shipping Label

**Purpose**: Generated shipping labels.

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `order_id` (TEXT, FK): Reference to order
- `label_url` (TEXT): R2 storage URL for label PDF
- `tracking_number` (TEXT): Tracking number
- `carrier` (TEXT): Carrier - `usps` (only option in v1.0)
- `service` (TEXT): Service level (e.g., "Priority Mail")
- `cost` (INTEGER): Label cost in cents
- `created_at` (INTEGER): Unix timestamp

---

### Email Preference

**Purpose**: User email notification preferences.

**Fields**:
- `id` (TEXT, PK): Unique identifier
- `user_id` (TEXT, FK): Reference to user
- `preference_type` (TEXT): Preference type (see below)
- `enabled` (BOOLEAN): Whether enabled
- `updated_at` (INTEGER): Unix timestamp

**Preference Types**:
- `order_confirmation` - Order confirmation emails
- `order_shipped` - Shipping notifications
- `queue_position_changed` - Queue position updates
- `queue_capacity_opened` - Capacity available notifications
- `low_stock_alert` - Low stock alerts (artisan only)
- `marketing` - Marketing emails

---

### Analytics Cache

**Purpose**: Pre-calculated analytics for performance.

#### Daily Stats

**Fields**:
- `date` (TEXT, PK): Date (YYYY-MM-DD)
- `total_revenue` (INTEGER): Revenue in cents
- `order_count` (INTEGER): Number of orders
- `new_customer_count` (INTEGER): New customers
- `average_order_value` (INTEGER): AOV in cents
- `queue_capacity_utilization` (REAL): Utilization percentage (0-1)

#### Customer Stats

**Fields**:
- `customer_id` (TEXT, PK, FK): Reference to user
- `total_spent` (INTEGER): Lifetime value in cents
- `order_count` (INTEGER): Total orders
- `favorite_count` (INTEGER): Total favorites
- `review_count` (INTEGER): Total reviews
- `last_order_at` (INTEGER, nullable): Unix timestamp
- `updated_at` (INTEGER): Unix timestamp

---

## Relationships

### Entity Relationship Diagram

```
User (1) ----< (N) Order
User (1) ----< (N) Review
User (1) ----< (N) Favorite
User (1) ----< (N) Message
User (1) ----< (N) Email Preference

Project (1) ----< (N) Project Image
Project (1) ----< (N) Project Option
Project (1) ----< (N) Order Item
Project (1) ----< (N) Review
Project (1) ----< (N) Favorite
Project (N) ----< (1) Pattern (optional)

Order (1) ----< (N) Order Item
Order (1) ----< (1) Queue Entry (optional)
Order (1) ----< (N) Message
Order (1) ----< (1) Shipping Label (optional)
Order (N) ----< (1) Discount Code (optional)

Review (1) ----< (1) Review Response (optional)

Discount Code (1) ----< (N) Discount Code Usage
```

---

## Database Schema

### Example: Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'artisan')),
  default_address TEXT, -- JSON
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_login_at INTEGER
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Example: Projects Table

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('crochet', 'knitting', 'embroidery', 'cross_stitch', 'sewn')),
  base_price INTEGER NOT NULL,
  production_time_weeks INTEGER NOT NULL,
  queue_tier TEXT NOT NULL CHECK (queue_tier IN ('xsmall', 'small', 'medium', 'large', 'xlarge')),
  pattern_id TEXT,
  enabled BOOLEAN NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (pattern_id) REFERENCES patterns(id)
);

CREATE INDEX idx_projects_enabled ON projects(enabled);
CREATE INDEX idx_projects_type ON projects(type);
```

**Note**: Full schema will be implemented using Drizzle ORM. See `workers/api/src/db/schema.ts` for complete definitions.

---

## Related Documents

- [Business Rules](./business-rules.md) - Business logic and workflows
- [Roadmap](./roadmap.md) - Feature implementation timeline
- [ADR-004](./decisions/ADR-004-database-cloudflare-d1.md) - Database architecture
- [ADR-005](./decisions/ADR-005-adapter-architecture.md) - Adapter pattern
