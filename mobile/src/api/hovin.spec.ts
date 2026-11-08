import { afterEach, describe, expect, it } from 'vitest';
import { resolveOrigin } from './hovin';

const KEY = 'EXPO_PUBLIC_HOVIN_API_ORIGIN';

afterEach(() => {
  delete process.env[KEY];
  vi_stubDev(false);
});

function vi_stubDev(value: boolean) {
  (globalThis as Record<string, unknown>).__DEV__ = value;
}

describe('HOVIN API origin — fail closed', () => {
  it('stops requests when no origin is configured instead of falling back to production', () => {
    delete process.env[KEY];
    const state = resolveOrigin();
    expect(state.ok).toBe(false);
    if (!state.ok) {
      expect(state.code).toBe('HOVIN_API_ORIGIN_NOT_CONFIGURED');
      expect(state.message).toMatch(/will not fall back/i);
    }
  });

  it('stops requests on an invalid origin', () => {
    process.env[KEY] = 'not a url';
    const state = resolveOrigin();
    expect(state.ok).toBe(false);
    if (!state.ok) expect(state.code).toBe('HOVIN_API_ORIGIN_INVALID');
  });

  it('refuses plain HTTP to a public host even in development', () => {
    vi_stubDev(true);
    process.env[KEY] = 'http://api.example.com';
    const state = resolveOrigin();
    expect(state.ok).toBe(false);
    if (!state.ok) expect(state.code).toBe('HOVIN_API_ORIGIN_INSECURE');
  });

  it('accepts an explicit HTTPS origin', () => {
    process.env[KEY] = 'https://staging.example.com';
    const state = resolveOrigin();
    expect(state).toEqual({ ok: true, origin: 'https://staging.example.com' });
  });

  it('allows a private HTTP origin only under the development bundler', () => {
    vi_stubDev(true);
    process.env[KEY] = 'http://127.0.0.1:3000';
    expect(resolveOrigin()).toEqual({ ok: true, origin: 'http://127.0.0.1:3000' });
  });

  it('rejects a private HTTP origin outside development', () => {
    vi_stubDev(false);
    process.env[KEY] = 'http://127.0.0.1:3000';
    const state = resolveOrigin();
    expect(state.ok).toBe(false);
    if (!state.ok) expect(state.code).toBe('HOVIN_API_ORIGIN_INSECURE');
  });
});
