import { describe, expect, it } from 'vitest';
import { ApiException, HttpException } from '@/utils/request';

describe('ApiException', () => {
  it('captures code and message', () => {
    const err = new ApiException(11, 'Not Found');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiException);
    expect(err.name).toBe('ApiException');
    expect(err.code).toBe(11);
    expect(err.message).toBe('Not Found');
  });
});

describe('HttpException', () => {
  it('captures status and synthesizes a message containing it', () => {
    const err = new HttpException(404, 'Not Found');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(HttpException);
    expect(err.name).toBe('HttpException');
    expect(err.status).toBe(404);
    expect(err.message).toMatch(/404/);
    expect(err.message).toMatch(/Not Found/);
  });
});
