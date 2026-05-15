import { describe, expect, it } from 'vitest';
import { LogicException, LogicExceptionKind } from '@/services/api/logic.exception';

describe('LogicException', () => {
  it('is an Error instance with correct fields', () => {
    const err = new LogicException(LogicExceptionKind.NotFound);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(LogicException);
    expect(err.name).toBe('LogicException');
    expect(err.kind).toBe(LogicExceptionKind.NotFound);
    expect(err.message).toMatch(/NotFound/);
  });
});
