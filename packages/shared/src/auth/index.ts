/**
 * Auth utilities -- JWT helpers for magic link and session tokens.
 */

export {
  AuthError,
  signMagicLinkToken,
  signSessionToken,
  verifyMagicLinkToken,
  verifySessionToken,
} from './jwt.js'
