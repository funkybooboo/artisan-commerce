/**
 * In-memory implementation of SentEmailStore.
 *
 * Holds sent email records so tests can inspect what the provider sent.
 * Pass an instance to InMemoryEmailProvider; hold a reference in the test
 * to call getAll(), getLast(), getCount(), and clear().
 */

import type { SentEmail, SentEmailStore } from './sent-email-store.js'

export class InMemoryEmailStore implements SentEmailStore {
  private emails: SentEmail[] = []

  record(email: SentEmail): void {
    this.emails.push(email)
  }

  getAll(): SentEmail[] {
    return this.emails
  }

  getLast(): SentEmail | undefined {
    return this.emails[this.emails.length - 1]
  }

  getCount(): number {
    return this.emails.length
  }

  clear(): void {
    this.emails = []
  }
}
