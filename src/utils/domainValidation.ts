/**
 * Domain validation utilities for HBPlus Auth.
 *
 * Enforces the exact allowed domain `hbplus.fit`.
 * Used as a frontend re-validation layer on top of Firebase's authenticated user.
 */

/** The exact domain that is permitted. */
export const ALLOWED_DOMAIN = 'hbplus.fit';

/**
 * Validates an email string against the exact allowed domain.
 *
 * Rules:
 *  - Exactly one '@' character.
 *  - Non-empty local part.
 *  - Domain matches the allowed domain case-insensitively (exact match, not substring).
 *
 * @param email - The email string to validate.
 * @returns `true` only if the email belongs to the exact allowed domain.
 *
 * @example
 *  accepts employee@hbplus.fit
 *  rejects employee@gmail.com
 *  rejects employee@fakehbplus.fit
 *  rejects employee@sub.hbplus.fit
 */
export function isValidAllowedDomain(email: string | null | undefined): boolean {
  if (typeof email !== 'string' || email.trim() === '') {
    return false;
  }

  const [localPart, domain] = email.split('@');

  // Requires exactly one '@' (split produces exactly 2 parts).
  if (localPart === undefined || domain === undefined) {
    return false;
  }

  // Requires a non-empty local part.
  if (localPart.trim() === '') {
    return false;
  }

  // Requires an exact, case-insensitive domain match. No substring/loose checks.
  return domain.trim().toLowerCase() === ALLOWED_DOMAIN;
}

/**
 * Extracts the domain part of an email for display/logging.
 */
export function getDomain(email: string | null | undefined): string {
  if (typeof email !== 'string') {
    return '';
  }
  const index = email.indexOf('@');
  return index === -1 ? email : email.slice(index + 1).toLowerCase();
}

/**
 * Normalizes an email (lowercase domain, trimmed).
 */
export function normalizeEmail(email: string): string {
  if (typeof email !== 'string' || email.trim() === '') {
    return email;
  }
  const [localPart, domain] = email.split('@');
  return `${localPart.trim()}@${domain.trim().toLowerCase()}`;
}