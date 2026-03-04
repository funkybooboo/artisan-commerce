<script lang="ts">
import type { LayoutData } from './$types'
import type { Snippet } from 'svelte'

const { children }: { children: Snippet } = $props()
</script>

<div class="app">
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/projects">Projects</a>
    </nav>
  </header>

  <main>
    {@render children()}
  </main>

  <footer>
    <p>&copy; 2026 Artisan Commerce</p>
  </footer>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  header {
    padding: 1rem;
    background: #f0f0f0;
  }

  nav {
    display: flex;
    gap: 1rem;
  }

  main {
    flex: 1;
    padding: 2rem;
  }

  footer {
    padding: 1rem;
    text-align: center;
    background: #f0f0f0;
  }
</style>
