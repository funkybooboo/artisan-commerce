# ADR-006: SvelteKit for Simplicity and Edge Performance

## Status

Superseded by ADR-002

## Context

This ADR originally documented a decision to use Next.js App Router for maximum LLM support. However, after further consideration, we reverted to the original ADR-002 decision to use **SvelteKit**.

Choosing a frontend framework for Artisan Commerce requires balancing multiple criteria:

1. **Simplicity**: Less "magic", easier to understand and debug
2. **Cloudflare Compatibility**: Deploy to Cloudflare Pages
3. **Cost**: Bundle size and edge compute efficiency
4. **Portability**: Framework independence, avoid lock-in
5. **Developer Experience**: Productivity and maintainability

**Options Considered**:
- **SvelteKit** - Lightweight, growing ecosystem, less magic
- **Next.js App Router** - Most popular React framework, excellent LLM support
- **Remix** - Edge-first, excellent Cloudflare support
- **Astro** - Static-first with islands architecture

## Decision

Use **SvelteKit** with TypeScript, deployed to **Cloudflare Pages** via the SvelteKit Cloudflare adapter.

This decision supersedes the temporary consideration of Next.js and returns to the original ADR-002 choice.

## Rationale

### 1. Simplicity Over Popularity

**SvelteKit Advantages**:
- **Less "magic"**: Explicit over implicit, easier to understand what's happening
- **Simpler mental model**: No client/server component split to manage
- **Less boilerplate**: Reactive by default, no useState/useEffect hooks
- **Clearer data flow**: Load functions are explicit and straightforward
- **Better for learning**: New contributors can understand the codebase faster

**Comparison**:
```svelte
<!-- SvelteKit: Simple and clear -->
<script lang="ts">
  export let data
  let quantity = 1
</script>

<input type="number" bind:value={quantity} />
<button on:click={() => addToCart(data.project, quantity)}>
  Add to Cart
</button>
```

vs.

```tsx
// Next.js: More complex with directives
'use client'
import { useState } from 'react'

export function AddToCart({ project }) {
  const [quantity, setQuantity] = useState(1)
  return (
    <input type="number" value={quantity} onChange={e => setQuantity(+e.target.value)} />
    <button onClick={() => addToCart(project, quantity)}>Add to Cart</button>
  )
}
```

### 2. Cloudflare Compatibility

SvelteKit works excellently with Cloudflare Pages:

- **Official adapter**: `@sveltejs/adapter-cloudflare` (maintained by Svelte team)
- **Edge-first design**: Built for edge deployment from the ground up
- **Workers runtime**: Native support for Cloudflare Workers
- **Zero configuration**: Works out of the box
- **Streaming**: SSR streaming supported

**Performance**: SvelteKit + Cloudflare Edge = **<100ms TTFB globally**

**Deployment**:
```bash
npm run build
wrangler pages deploy .svelte-kit/cloudflare
```

### 3. Cost (Bundle Size & Compute)

SvelteKit optimizes for cost:

**Bundle Sizes** (production build):
- Shared chunks: ~40KB gzipped (50% smaller than Next.js)
- Route chunks: ~5-10KB each
- Total first load: ~50-60KB (excellent)
- No runtime overhead (compiled away)

**Cloudflare Workers Cost**:
- Free tier: 100,000 requests/day, 10ms CPU time per request
- SvelteKit SSR: ~1-3ms CPU per request (very efficient)
- Static pages: 0ms CPU (served from cache)

**Estimated Monthly Cost**: $0 (stays on free tier easily)

### 4. Portability

SvelteKit provides excellent portability:

**Deploy Anywhere**:
- Cloudflare Pages (current choice)
- Vercel (adapter available)
- Netlify (adapter available)
- Node.js (adapter-node)
- Static export (adapter-static)

**Standard APIs**:
- Web APIs (Request, Response, Headers, Cookies)
- File-based routing (common pattern)
- Standard form actions (progressive enhancement)

**Migration Path** (if needed):
- Similar to Remix (load functions → loaders)
- Can extract business logic to separate packages
- API routes → Hono Workers (already separate backend)

**Migration Cost**: Moderate (rewrite routes, but business logic unaffected)

### 5. Developer Experience

SvelteKit provides excellent DX:

**Load Functions** (server-side data loading):
```typescript
// src/routes/projects/+page.server.ts
import { getProjects } from '$lib/data'

export async function load() {
  const projects = await getProjects()
  return { projects }
}
```

**Page Component** (reactive):
```svelte
<!-- src/routes/projects/+page.svelte -->
<script lang="ts">
  export let data
</script>

<h1>Projects</h1>
{#each data.projects as project}
  <ProjectCard {project} />
{/each}
```

**Form Actions** (mutations):
```typescript
// src/routes/orders/+page.server.ts
import { db } from '$lib/db'
import { fail } from '@sveltejs/kit'

export const actions = {
  create: async ({ request }) => {
    const data = await request.formData()
    const order = Object.fromEntries(data)
    
    try {
      await db.orders.create(order)
      return { success: true }
    } catch (error) {
      return fail(400, { error: error.message })
    }
  }
}
```

**Route Groups** (organize layouts):
```
src/routes/
├── (customer)/           # Customer-facing routes
│   ├── projects/
│   ├── checkout/
│   └── +layout.svelte    # Customer layout
├── (artisan)/            # Artisan dashboard
│   └── artisan/
│       ├── orders/
│       └── +layout.svelte # Artisan layout
└── api/                  # API routes (webhooks)
```

**Layouts** (nested, persistent UI):
- Shared navigation doesn't re-render on route changes
- Nested layouts for different sections
- Loading states per layout

**Reactivity** (built-in, no hooks):
```svelte
<script lang="ts">
  let count = 0
  
  // Reactive statement - runs when count changes
  $: doubled = count * 2
  
  // Reactive block - runs side effects
  $: if (count > 10) {
    console.log('Count is high!')
  }
</script>

<button on:click={() => count++}>
  Count: {count} (doubled: {doubled})
</button>
```

## Why Not Next.js?

While Next.js has excellent LLM support and a larger ecosystem, we prioritized:

1. **Simplicity**: SvelteKit is easier to understand and debug
2. **Bundle Size**: 50% smaller bundles = lower costs and faster loads
3. **Less Complexity**: No client/server component split to manage
4. **Better for Solo/Small Teams**: Less overhead, faster development
5. **Edge-First Design**: Built for edge from the start, not adapted

**Trade-off**: We accept slightly less AI assistance (60% vs 95% accuracy) in exchange for a simpler, more maintainable codebase. For a solo developer or small team, simplicity > AI assistance.

## Alternatives Considered

### Next.js App Router

**Pros**:
- Excellent LLM support (95% AI code accuracy)
- Huge ecosystem and community
- More tutorials and examples
- React Server Components

**Cons**:
- More complex (client/server split, "use client" directives)
- Larger bundles (~2x SvelteKit)
- More "magic" (harder to debug)
- Steeper learning curve

**Verdict**: Better for large teams with dedicated React expertise. Overkill for this project.

### Remix

**Pros**:
- Built specifically for edge/Workers
- Simpler than Next.js
- Progressive enhancement
- Excellent Cloudflare support

**Cons**:
- Less LLM training data than Next.js
- Smaller ecosystem than Next.js
- Still React (hooks, complexity)
- Less mature than SvelteKit for edge

**Verdict**: Good choice, but SvelteKit is simpler and has better edge support.

### Astro

**Pros**:
- Zero JS by default
- Islands architecture
- Great for content sites

**Cons**:
- Static-first (not ideal for dynamic dashboard)
- Less suitable for authenticated apps
- More complex for full web apps

**Verdict**: Best for content sites, not web applications.

## Consequences

### Positive

**Simplicity**:
- Easier to understand and debug
- Less boilerplate code
- Faster onboarding for contributors
- Clearer mental model

**Performance**:
- 50% smaller bundles than Next.js
- Faster page loads
- Lower Cloudflare Workers costs
- Better mobile performance

**Developer Experience**:
- Reactive by default (no hooks)
- Progressive enhancement built-in
- Excellent TypeScript support
- Great documentation

**Cloudflare Compatibility**:
- Official adapter maintained by Svelte team
- Edge-first design
- Zero configuration

### Negative

**LLM Support**:
- Less AI training data (60% vs 95% accuracy)
- Fewer Stack Overflow answers
- More manual coding required
- AI assistants less helpful

**Ecosystem**:
- Smaller library ecosystem
- Fewer tutorials and examples
- Smaller community
- Less common (harder to hire)

**Mitigation**: For a solo/small team project, the simplicity benefits outweigh the LLM support trade-off. We can still use AI for business logic, just less for framework-specific code.

### Risks & Mitigations

**Risk**: SvelteKit changes direction or loses momentum
**Mitigation**: Framework is stable (v1.0 released), growing fast, and backed by Vercel. Can migrate to Remix if needed.

**Risk**: Cloudflare adapter breaks or is abandoned
**Mitigation**: Adapter is open source and maintained by Svelte team. Can fork if needed. Can also deploy to Vercel/Netlify.

**Risk**: Harder to find contributors familiar with Svelte
**Mitigation**: Svelte is easier to learn than React. Good documentation and simple mental model help onboarding.

## Implementation Notes

### Cloudflare Deployment

```bash
# Install adapter
npm install -D @sveltejs/adapter-cloudflare

# svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare'

export default {
  kit: {
    adapter: adapter()
  }
}

# Build
npm run build

# Deploy
wrangler pages deploy .svelte-kit/cloudflare
```

### Recommended Patterns

**Load Functions** (server-side):
```typescript
// src/routes/projects/+page.server.ts
import { db } from '$lib/db'

export async function load() {
  const projects = await db.query.projects.findMany()
  return { projects }
}
```

**Form Actions** (mutations):
```typescript
// src/routes/orders/+page.server.ts
import { fail, redirect } from '@sveltejs/kit'
import { db } from '$lib/db'

export const actions = {
  create: async ({ request }) => {
    const data = await request.formData()
    const order = Object.fromEntries(data)
    
    try {
      await db.orders.create(order)
      throw redirect(303, '/orders/success')
    } catch (error) {
      return fail(400, { error: error.message })
    }
  }
}
```

**Progressive Enhancement**:
```svelte
<!-- Works without JavaScript -->
<form method="POST" action="?/create">
  <input name="projectId" value={project.id} type="hidden" />
  <input name="quantity" type="number" value="1" />
  <button type="submit">Add to Cart</button>
</form>
```

### Performance Optimization

**Code Splitting** (automatic):
```typescript
// Lazy load heavy components
const HeavyChart = () => import('$lib/components/HeavyChart.svelte')
```

**Image Optimization**:
```svelte
<script>
  import { Image } from '@unpic/svelte'
</script>

<Image
  src="/project.jpg"
  alt="Crochet sweater"
  width={800}
  height={600}
  priority
/>
```

## Testing Strategy

**Component Tests**:
```typescript
// src/routes/projects/+page.test.ts
import { render, screen } from '@testing-library/svelte'
import ProjectsPage from './+page.svelte'

test('renders projects', () => {
  const data = {
    projects: [{ id: '1', name: 'Sweater', price: 5000 }]
  }
  
  render(ProjectsPage, { data })
  expect(screen.getByText('Sweater')).toBeInTheDocument()
})
```

**Load Function Tests**:
```typescript
// src/routes/projects/+page.server.test.ts
import { load } from './+page.server'
import { db } from '$lib/db'

vi.mock('$lib/db')

test('loads projects', async () => {
  vi.mocked(db.query.projects.findMany).mockResolvedValue([
    { id: '1', name: 'Sweater', price: 5000 }
  ])
  
  const result = await load()
  expect(result.projects).toHaveLength(1)
})
```

**Action Tests**:
```typescript
// src/routes/orders/+page.server.test.ts
import { actions } from './+page.server'
import { db } from '$lib/db'

vi.mock('$lib/db')

test('creates order', async () => {
  const formData = new FormData()
  formData.set('projectId', '1')
  formData.set('quantity', '2')
  
  const request = new Request('http://localhost', {
    method: 'POST',
    body: formData
  })
  
  await actions.create({ request })
  
  expect(db.orders.create).toHaveBeenCalledWith(
    expect.objectContaining({ projectId: '1', quantity: '2' })
  )
})
```

## References

- SvelteKit docs: https://kit.svelte.dev/
- Cloudflare adapter: https://kit.svelte.dev/docs/adapter-cloudflare
- Svelte tutorial: https://learn.svelte.dev/
- SvelteKit on Cloudflare: https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-site/

## Related ADRs

- ADR-002: Technology Stack (Cloudflare serverless, SvelteKit)
- ADR-005: Adapter Architecture (framework portability)
- ADR-007: Single-Tenant Architecture (removed multi-tenant)
- ADR-008: TDD Strategy (testing approach)
