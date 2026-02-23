# ADR-001: Queue-Based Production Capacity Management

## Status

Accepted

## Context

Handmade crafts take time to produce, and artisans have finite capacity. Traditional e-commerce platforms handle this poorly:

- **Inventory-based systems** don't work -- each item is made-to-order, not pre-made
- **Unlimited ordering** overwhelms artisans and creates unrealistic delivery expectations
- **Manual capacity management** is error-prone and doesn't scale
- **Vague estimates** ("ships in 2-4 weeks") are dishonest and lead to disappointed customers

Customers deserve honest delivery estimates. Artisans deserve control over their workload. The platform needs a systematic way to manage finite production capacity.

## Decision

Implement a **queue-based production capacity management system** as the core architectural component of Artisan Commerce.

### How it works:

1. **Each project has a production time** (e.g., 4 weeks) and a **queue weight** (e.g., sweater = 4 units, coaster = 1 unit)
2. **Admin defines weekly capacity** (e.g., 10 weight units per week)
3. **Orders enter a queue** in FIFO order, adding their weight to the total queue load
4. **Delivery estimate** = `(current_queue_weight / weekly_capacity) + production_time + shipping_time`
5. **When queue reaches max capacity**, new orders are disabled until capacity opens up
6. **Customers see their queue position** and estimated delivery date
7. **Admin can adjust capacity** and reorder the queue if needed

## Rationale

- **Transparency**: Customers see exactly where they are in the queue and why delivery takes time
- **Honesty**: Estimates are based on actual capacity, not wishful thinking
- **Sustainability**: Artisans control their workload and avoid burnout
- **Scarcity**: Limited capacity creates urgency and perceived value
- **Predictability**: Both customers and artisans know what to expect

This is the core differentiator that makes Artisan Commerce different from Etsy, Shopify, or any other handmade marketplace.

## Consequences

### Positive
- Realistic delivery expectations reduce customer disappointment
- Artisans can manage their workload sustainably
- Queue visibility builds trust and sets expectations upfront
- Capacity limits prevent overwhelming the artisan
- The system is honest about what it can deliver

### Negative
- Customers may be frustrated when ordering is disabled (capacity full)
- Requires careful tuning of capacity and queue weights
- More complex than "unlimited orders" or simple inventory
- Delivery times may seem long compared to mass-produced goods (but that's honest)

### Risks
- Queue calculation must be accurate and performant
- Admin must actively manage capacity settings
- Edge cases (rush orders, cancellations, production delays) need careful handling

## Alternatives Considered

1. **Inventory-based system**: Rejected -- doesn't work for made-to-order items
2. **Unlimited orders with vague estimates**: Rejected -- dishonest and unsustainable
3. **Manual order acceptance**: Rejected -- doesn't scale, error-prone
4. **Seasonal drops only**: Rejected -- too restrictive, limits revenue
5. **Subscription priority queue**: Deferred to future version -- adds complexity

## Implementation Notes

- Queue calculation must be tested extensively (unit tests for edge cases)
- Admin dashboard must make capacity management intuitive
- User-facing queue position should update in real-time
- Consider caching delivery estimates for performance
- Email notifications when capacity opens up (future feature)

## References

- See `plans/vision.md` for the original concept
- See `docs/developer/README.md` for queue algorithm documentation (to be written)
