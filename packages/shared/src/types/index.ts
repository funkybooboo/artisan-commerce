/**
 * Shared TypeScript types used across the application.
 *
 * These are the canonical type definitions. Import from here to avoid duplication.
 */

/**
 * User role - either customer or artisan.
 */
export type Role = 'customer' | 'artisan'

/**
 * Physical address structure.
 */
export type Address = {
  street: string
  city: string
  state: string
  zip: string
  country: string
}
