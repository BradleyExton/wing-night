import { describe, expect, it } from 'vitest';
import { getConnectionStatus } from '../connection';

describe('connection utils', () => {
  it('returns connected styles and label', () => {
    const status = getConnectionStatus(true);
    expect(status.label).toBe('Connected');
    expect(status.containerClass).toContain('bg-green');
    expect(status.dotClass).toBe('bg-green-500');
  });

  it('returns reconnecting styles and label', () => {
    const status = getConnectionStatus(false);
    expect(status.label).toBe('Reconnecting...');
    expect(status.containerClass).toContain('bg-red');
    expect(status.dotClass).toBe('bg-red-500');
  });
});
