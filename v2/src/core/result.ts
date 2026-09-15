import type { ValidationResult } from './types';

export const ok = <T>(value: T): ValidationResult<T> => ({ ok: true, value });
export const fail = <T = never>(...errors: string[]): ValidationResult<T> => ({
  ok: false,
  errors,
});
