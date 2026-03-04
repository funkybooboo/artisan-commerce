<script lang="ts">
import type { PageData } from './$types'

const { data }: { data: PageData } = $props()
</script>

<svelte:head>
  <title>Artisan Commerce</title>
  <meta name="description" content="Queue-based made-to-order artisan e-commerce platform" />
</svelte:head>

<section>
  <h1>Welcome to Artisan Commerce</h1>
  <p>Queue-based made-to-order artisan e-commerce platform</p>
  <p>Version: 0.1.0</p>

  {#if data.apiHealth}
    <div class="api-status">
      <h2>API Status</h2>
      <pre>{JSON.stringify(data.apiHealth, null, 2)}</pre>
    </div>
  {/if}
</section>

<style>
  section {
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .api-status {
    margin-top: 2rem;
    padding: 1rem;
    background: #f9f9f9;
    border-radius: 4px;
  }

  pre {
    overflow-x: auto;
  }
</style>
