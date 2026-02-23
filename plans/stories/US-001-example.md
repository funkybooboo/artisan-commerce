# US-001: Browse Projects Gallery

## Story

**As a** customer
**I want** to browse all available handmade projects in a gallery
**So that** I can discover items I want to order and see delivery estimates upfront

## Context

The projects gallery is the primary discovery mechanism for customers. It must be fast, filterable, and show key information (especially delivery estimates) without requiring users to click into each project.

This is the first user-facing feature and sets expectations for transparency and honesty.

## Acceptance Criteria

### AC1: View all projects in a gallery layout
**Given** I am a customer visiting the site
**When** I navigate to the Projects page
**Then** I see all active projects displayed as cards in a grid layout
**And** each card shows: image, name, starting price, current delivery estimate, and rating

### AC2: Filter projects by type
**Given** I am viewing the projects gallery
**When** I select a filter for project type (crochet, knitting, cross stitch, embroidery, sewn goods)
**Then** only projects of that type are displayed
**And** the filter selection persists if I navigate away and return

### AC3: Filter projects by material
**Given** I am viewing the projects gallery
**When** I select a filter for material (wool, cotton, acrylic, etc.)
**Then** only projects available in that material are displayed

### AC4: Filter projects by color
**Given** I am viewing the projects gallery
**When** I select a filter for color
**Then** only projects available in that color are displayed

### AC5: Filter projects by price range
**Given** I am viewing the projects gallery
**When** I set a price range filter (min and max)
**Then** only projects with starting prices within that range are displayed

### AC6: Sort projects
**Given** I am viewing the projects gallery
**When** I select a sort option (newest, popular, price low-to-high, price high-to-low, shortest delivery)
**Then** projects are reordered according to that criteria

### AC7: See delivery estimates on cards
**Given** I am viewing the projects gallery
**When** I look at a project card
**Then** I see the current estimated delivery time (e.g., "Delivers in 8-10 weeks")
**And** this estimate is calculated based on current queue state

### AC8: Add projects to favorites
**Given** I am a logged-in customer viewing the projects gallery
**When** I click the favorite icon on a project card
**Then** the project is added to my favorites
**And** the icon changes to indicate it's favorited

### AC9: View project details
**Given** I am viewing the projects gallery
**When** I click on a project card
**Then** I am taken to the project detail page for that project

## Business Rules

- BR1: Only active (non-disabled) projects are shown in the gallery
- BR2: Delivery estimates must be calculated in real-time based on current queue state
- BR3: Starting price is the base price before any option selections
- BR4: Filters can be combined (e.g., crochet + wool + blue)
- BR5: Favorites require authentication (show login prompt if not logged in)
- BR6: Empty states must be handled gracefully (no projects match filters)

## Technical Notes

- Consider pagination or infinite scroll for performance with many projects
- Cache delivery estimates with short TTL to reduce queue calculation overhead
- Filter state should be in URL query params for shareability
- Images should be optimized and lazy-loaded
- Mobile-responsive grid layout (1 column on mobile, 2-3 on tablet, 4+ on desktop)
- Touch-friendly filter controls for mobile users

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] E2E tests written for filtering, sorting, and favoriting
- [ ] Unit tests for filter logic and delivery estimate display
- [ ] Performance tested with 100+ projects
- [ ] Mobile responsive design tested on phone, tablet, desktop
- [ ] Touch interactions work properly on mobile devices
- [ ] Accessibility tested (keyboard navigation, screen readers)
- [ ] Documentation updated (user guide for browsing)
- [ ] CHANGELOG updated
- [ ] Code reviewed and merged
