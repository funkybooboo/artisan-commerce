# Business Rules

This document defines all business logic, workflows, and operational rules for Artisan Commerce.

**Last Updated**: 2026-02-23

---

## Table of Contents

1. [Queue System](#queue-system)
2. [Order Lifecycle](#order-lifecycle)
3. [Pricing](#pricing)
4. [Shipping](#shipping)
5. [Tax](#tax)
6. [Reviews](#reviews)
7. [Discount Codes](#discount-codes)
8. [Messages](#messages)
9. [Favorites](#favorites)
10. [Artisan Dashboard](#artisan-dashboard)

---

## Queue System

### Queue Weight Tiers

The queue system uses a 5-tier weight system to estimate production time:

| Tier | Weight | Examples |
|------|--------|----------|
| XSmall | 1 | Coasters, small accessories |
| Small | 2 | Hats, scarves |
| Medium | 4 | Baby blankets, small garments |
| Large | 6 | Sweaters, large blankets |
| XLarge | 8 | King-size blankets, complex projects |

**Assignment**: Artisan assigns tier when creating project (with guidelines in UI)

### Queue Calculation

```
estimated_delivery = (current_queue_weight / weekly_capacity) * 7 + production_time_weeks * 7 + shipping_days
```

**Example**:
- Current queue weight: 40
- Weekly capacity: 10
- New order weight: 5
- Production time: 2 weeks
- Shipping: 5 days

Calculation: `(40 / 10) * 7 + 2 * 7 + 5 = 28 + 14 + 5 = 47 days`

### Queue Position

- **Default**: Strict FIFO (first-in, first-out)
- **Manual Override**: Artisan can reorder via drag-and-drop kanban
- **Customer View**: Show position number + estimated delivery date

### Capacity Management

- **Weekly Capacity**: Artisan sets simple number input (e.g., 10 weight units/week)
- **Pause Button**: Vacation mode - stops accepting new orders
- **When Full**: Show waitlist with estimated availability date
- **Waitlist Storage**: Stored in user email preferences

### Notifications

- **Daily Digest**: Email sent only when queue position or delivery estimate changes
- **Smart Timing**: Send when change occurs OR max 1 week since last update
- **Opt-out**: Users can disable queue notifications in preferences

---

## Order Lifecycle

### States

1. **pending_payment** - Cart checked out, awaiting payment
2. **paid** - Payment successful, entering queue
3. **in_queue** - Waiting for production
4. **in_production** - Artisan working on it
5. **shipped** - Tracking number assigned
6. **delivered** - Confirmed delivery
7. **cancelled** - Customer or artisan cancelled
8. **refunded** - Payment refunded

### Modification Rules

| Time Window | Allowed Actions | Fee |
|-------------|----------------|-----|
| 0-12 hours | Free modifications (change options, add/remove items, cancel) | $0 |
| 12-24 hours | Not allowed (or $15 flat fee if artisan enables per-order override) | $15 (optional) |
| 24+ hours | Cancellation only | $15 flat fee |
| In production | Case-by-case artisan approval | Artisan decides (50-100% typical) |

### Cancellation Fees

- **0-12 hours**: Free
- **12+ hours**: $15 flat fee
- **In production**: Artisan decides (50-100% fee typical, or no refund)

### Multi-Item Orders

- **Shipping**: All items ship together when complete
- **Tracking**: Single tracking number for entire order
- **Queue**: Each item enters queue separately, order ships when all complete

### Custom Sizing

- **Input**: Text field in order item options
- **Example**: "Chest: 42in, Length: 28in, Sleeve: 24in"
- **Validation**: Artisan reviews before production

---

## Pricing

### Simple Additive Modifiers

```
final_price = base_price + material_modifier + size_modifier + custom_text_modifier
```

**Example**:
- Sweater base: $50
- Wool material: +$10
- XL size: +$5
- Custom text: +$8
- **Total**: $73

### Option Dependencies

Artisan can define conditional logic for options:

**Example**: If material=wool, only show colors: blue, red, green

**Storage**: JSON in `project_options.dependencies`

```json
{
  "material": {
    "wool": {
      "colors": ["blue", "red", "green"]
    },
    "cotton": {
      "colors": ["white", "black", "gray"]
    }
  }
}
```

---

## Shipping

### USPS Only (v1.0)

- **Rate Calculation**: Real-time via Shippo API
- **Label Generation**: Integrated via Shippo
- **Tracking**: Automatic tracking number assignment
- **Coverage**: Worldwide shipping supported

### Shipping Cost

- **Calculation**: At checkout based on destination
- **Rates**: Real-time USPS rates via Shippo
- **Display**: Show multiple service options (First Class, Priority, etc.)

---

## Tax

### Automatic Calculation

- **Provider**: Stripe Tax API
- **Timing**: Calculated at checkout
- **Storage**: Stored per order item (for accounting)
- **Fee**: 0.5% of tax collected (Stripe fee)

### Tax Compliance

- **US Sales Tax**: Automatic calculation based on destination
- **International**: VAT/GST calculated where applicable
- **Exemptions**: Not supported in v1.0

---

## Reviews

### Eligibility

- **Timing**: After delivery only
- **Verification**: Verified buyers only (must have received order)
- **One per order**: One review per order item

### Content

- **Star Rating**: 1-5 stars (required)
- **Text Comment**: Required, min 10 characters
- **Delivery Accuracy**: "Did it arrive on time?" (yes/no)
- **Photos**: No customer photo uploads in v1.0

### Moderation

- **Hide Review**: Artisan can hide with reason selection
- **Ban User**: Artisan can ban user from future reviews
- **Public Response**: Artisan can respond publicly to reviews
- **Edit**: Reviews cannot be edited after submission

---

## Discount Codes

### Artisan Management

- **Creation**: Artisan creates codes via dashboard
- **Types**: 
  - Percent off (e.g., 10%)
  - Fixed amount (e.g., $5)
- **Usage Limit**: One-time use only (usage_limit = 1)
- **Expiration**: Optional expiration date
- **Tracking**: Track usage (code_id, order_id, used_at)

### Application

- **Entry**: Customer enters code at checkout
- **Validation**:
  - Not expired
  - Not already used
  - Usage limit not reached
- **Application**: Discount applied to subtotal (before tax and shipping)

**Example**:
- Subtotal: $100
- Discount (10% off): -$10
- Shipping: $8
- Tax (8%): $7.84
- **Total**: $105.84

---

## Messages

### Order Messages

- **Location**: Threaded chat on order detail page
- **Participants**: Customer ↔ artisan conversation
- **Notifications**: Artisan preferences (instant, digest, dashboard only)
- **History**: Full message history visible to both parties

### Contact Form

- **Purpose**: General messages (no order required)
- **Storage**: Stored separately (type = 'contact')
- **Inbox**: Artisan sees in unified messages inbox

### Customer View

- **Unified Inbox**: Shows both order messages and contact form messages
- **Filtering**: Filter by type (order, contact)
- **Notifications**: Email notifications for new messages

---

## Favorites

### Features

- **Bookmark**: Save projects for later
- **Wishlist**: Shareable public URL
- **Notifications**: Email when favorited project:
  - Delivery time shortens
  - Goes on sale (future feature)
  - Capacity opens (if was full)

### Privacy

- **Public Wishlist**: Anyone with link can view
- **Private Option**: Not supported in v1.0

---

## Artisan Dashboard

### Landing Page

**Metrics Overview Cards**:
- Today's revenue
- Pending orders count
- Queue capacity utilization %
- Low stock alerts

**Quick Actions**:
- Create project
- View orders
- Manage queue
- View messages

### Kanban Board

**Columns**: 
- pending_payment
- paid
- in_queue
- in_production
- shipped
- delivered
- cancelled
- refunded

**Features**:
- Drag-and-drop to reorder queue or change status
- Filter by date range, customer, project type
- Bulk select for actions

### Customer Management

**Customer List**:
- Full customer list with search (name, email)
- Sort by: name, total spent, order count, last order date

**Customer Detail View**:
- Order history
- Reviews given
- Favorites
- Total spent
- Message history
- Reset customer password
- View/edit customer profile

### Analytics

**Charts**:
- Revenue (daily, weekly, monthly)
- Popular projects (by sales, by favorites)
- Queue saturation over time
- Customer acquisition metrics
- Average order value
- Repeat customer rate

**Export**: CSV export for all data

### Bulk Actions

**Select Multiple Orders**:
- Mark as shipped (with tracking numbers)
- Send template email to customers
- Export to CSV (for shipping labels)
- Change status

### Email Customer

**Template-Based Emails**:
- "Order delayed"
- "Custom request"
- "Thank you"
- Artisan can customize before sending

### Inventory Alerts

**Low Stock**:
- Email when merch stock drops below threshold
- Dashboard badge for low-stock items
- Configurable threshold per item

---

## Related Documents

- [Domain Model](./domain-model.md) - Entity specifications
- [Roadmap](./roadmap.md) - Feature implementation timeline
- [ADR-001](./decisions/ADR-001-example.md) - Queue system architecture
- [ADR-002](./decisions/ADR-002-tech-stack.md) - Technology stack
