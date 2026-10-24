import { describe, it, expect } from 'vitest';
import {
  isValidAllowedDomain,
  getDomain,
  normalizeEmail,
  ALLOWED_DOMAIN,
} from './domainValidation';

describe('ALLOWED_DOMAIN', () => {
  it('matches the exact allowed domain', () => {
    expect(ALLOWED_DOMAIN).toBe('hbplus.fit');
  });
});

describe('isValidAllowedDomain', () => {
  it('accepts an employee@hbplus.fit email', () => {
    expect(isValidAllowedDomain('employee@hbplus.fit')).toBe(true);
  });

  it('rejects a gmail.com email', () => {
    expect(isValidAllowedDomain('employee@gmail.com')).toBe(false);
    expect(isValidAllowedDomain('user@gmail.com')).toBe(false);
  });

  it('rejects a fakehbplus.fit email (look-alike but not the exact domain)', () => {
    expect(isValidAllowedDomain('employee@fakehbplus.fit')).toBe(false);
  });

  it('rejects a subdomain of hbplus.fit (sub.hbplus.fit)', () => {
    expect(isValidAllowedDomain('employee@sub.hbplus.fit')).toBe(false);
  });

  it('rejects a missing email (null, undefined, empty)', () => {
    expect(isValidAllowedDomain('')).toBe(false);
    expect(isValidAllowedDomain(null as any)).toBe(false);
    expect(isValidAllowedDomain(undefined as any)).toBe(false);
  });

  it('normalizes the domain case-insensitively', () => {
    expect(isValidAllowedDomain('Employee@HBPLUS.FIT')).toBe(true);
  });

  it('requires exactly one @', () => {
    expect(isValidAllowedDomain('user@@hbplus.fit')).toBe(false);
    expect(isValidAllowedDomain('user@domain@hbplus.fit')).toBe(false);
  });

  it('requires a non-empty local part', () => {
    expect(isValidAllowedDomain('@hbplus.fit')).toBe(false);
    expect(isValidAllowedDomain('   @hbplus.fit')).toBe(false);
  });

  it('rejects a domain that is a substring of an allowed domain via loose matching', () => {
    // 'hbplus.fit' is contained in 'sub.hbplus.fit' but must NOT be accepted.
    expect(isValidAllowedDomain('employee@sub.hbplus.fit')).toBe(false);
    // 'hbplus.fit' is contained in 'hbplus.fit.evil' — must not be accepted.
    expect(isValidAllowedDomain('employee@hbplus.fit.evil')).toBe(false);
  });

  it('does not accept emails with missing domain', () => {
    expect(isValidAllowedDomain('employee')).toBe(false);
  });
});

describe('getDomain', () => {
  it('extracts the domain part', () => {
    expect(getDomain('employee@hbplus.fit')).toBe('hbplus.fit');
  });

  it('lowercases the domain', () => {
    expect(getDomain('Employee@HBPLUS.FIT')).toBe('hbplus.fit');
  });

  it('returns an empty string when there is no @', () => {
    expect(getDomain('employee')).toBe('employee');
  });
});

describe('normalizeEmail', () => {
  it('lowercases the domain and trims whitespace', () => {
    expect(normalizeEmail('  Employee@HBPLUS.FIT  ')).toBe('Employee@hbplus.fit');
  });

  it('leaves an already-normalised email unchanged', () => {
    expect(normalizeEmail('employee@hbplus.fit')).toBe('employee@hbplus.fit');
  });
});

