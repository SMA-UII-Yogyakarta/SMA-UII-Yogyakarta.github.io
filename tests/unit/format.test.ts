import { describe, test, expect } from 'bun:test';
import { fmtDate } from '../../src/lib/format';

describe('Format utilities', () => {
  test('fmtDate formats timestamp correctly', () => {
    const timestamp = new Date('2024-01-15').getTime();
    const result = fmtDate(timestamp);
    expect(result).toBe('15 Jan 2024');
  });

  test('fmtDate handles null', () => {
    const result = fmtDate(null);
    expect(result).toBe('-');
  });

  test('fmtDate handles undefined', () => {
    const result = fmtDate(undefined);
    expect(result).toBe('-');
  });
});
