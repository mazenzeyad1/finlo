import { describe, expect, it } from '@jest/globals';
import 'reflect-metadata';
import { AuthController } from './auth.controller';
import { THROTTLER_LIMIT, THROTTLER_TTL } from '@nestjs/throttler/dist/throttler.constants';

describe('AuthController throttling', () => {
  const getThrottle = (methodName: keyof AuthController, scope: string) => {
    const handler = AuthController.prototype[methodName] as unknown as () => unknown;
    return {
      limit: Reflect.getMetadata(`${THROTTLER_LIMIT}${scope}`, handler),
      ttl: Reflect.getMetadata(`${THROTTLER_TTL}${scope}`, handler),
    };
  };

  it('limits signup attempts', () => {
    const { limit, ttl } = getThrottle('signUp', 'signup');
    expect(limit).toBe(5);
    expect(ttl).toBe(300);
  });

  it('limits signin bursts', () => {
    const { limit, ttl } = getThrottle('signIn', 'signin');
    expect(limit).toBe(10);
    expect(ttl).toBe(60);
  });

  it('limits verification link submissions', () => {
    const { limit, ttl } = getThrottle('verify', 'verify');
    expect(limit).toBe(1);
    expect(ttl).toBe(60);
  });

  it('limits verification resend attempts', () => {
    const { limit, ttl } = getThrottle('resend', 'verify-resend');
    expect(limit).toBe(1);
    expect(ttl).toBe(60);
  });

  it('limits forgot password flow', () => {
    const { limit, ttl } = getThrottle('forgot', 'forgot');
    expect(limit).toBe(5);
    expect(ttl).toBe(900);
  });

  it('limits password resets', () => {
    const { limit, ttl } = getThrottle('reset', 'reset');
    expect(limit).toBe(5);
    expect(ttl).toBe(300);
  });
});
