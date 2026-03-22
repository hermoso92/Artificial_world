import { describe, it, expect } from 'vitest';
import { sanitizeContent, sanitizeObject } from './sanitizeSecrets.js';

describe('sanitizeSecrets', () => {
  it('sanitizeContent redacts JWT', () => {
    const input = 'token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    expect(sanitizeContent(input)).toContain('[REDACTED:JWT]');
    expect(sanitizeContent(input)).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  });

  it('sanitizeContent redacts GitHub token', () => {
    const input = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890';
    expect(sanitizeContent(input)).toBe('[REDACTED:GITHUB_TOKEN]');
  });

  it('sanitizeContent leaves normal text unchanged', () => {
    const input = 'Hello world, no secrets here.';
    expect(sanitizeContent(input)).toBe(input);
  });

  it('sanitizeObject sanitizes nested strings', () => {
    const input = { a: 1, b: 'token ghp_abcdefghijklmnopqrstuvwxyz1234567890', c: { d: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV' } };
    const out = sanitizeObject(input);
    expect(out.b).toContain('[REDACTED:GITHUB_TOKEN]');
    expect(out.b).not.toContain('ghp_');
    expect(out.c.d).toContain('[REDACTED:JWT]');
    expect(out.a).toBe(1);
  });

  it('sanitizeContent returns null/undefined as-is', () => {
    expect(sanitizeContent(null)).toBe(null);
    expect(sanitizeContent(undefined)).toBe(undefined);
  });
});
