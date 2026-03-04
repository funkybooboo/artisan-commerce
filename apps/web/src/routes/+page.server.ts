import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  try {
    // Fetch API health check
    const response = await fetch('http://localhost:8787/health')
    const apiHealth = await response.json()

    return {
      apiHealth,
    }
  } catch (error) {
    console.error('Failed to fetch API health:', error)
    return {
      apiHealth: null,
    }
  }
}
