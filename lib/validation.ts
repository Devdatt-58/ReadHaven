import { z } from 'zod';

export interface BoundedIntOptions {
  defaultValue: number;
  min?: number;
  max?: number;
}

export interface PaginationOptions {
  defaultPage?: number;
  maxPage?: number;
  defaultPageSize?: number;
  maxPageSize?: number;
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function parseBoundedInt(
  rawValue: string | null | undefined,
  options: BoundedIntOptions
): number {
  const min = options.min ?? 1;
  const max = options.max ?? Number.MAX_SAFE_INTEGER;
  const fallback = clampInt(options.defaultValue, min, max);

  if (typeof rawValue !== 'string') {
    return fallback;
  }

  const normalized = rawValue.trim();
  if (!/^-?\d+$/.test(normalized)) {
    return fallback;
  }

  const parsed = Number.parseInt(normalized, 10);
  return clampInt(parsed, min, max);
}

export function parsePagination(
  searchParams: URLSearchParams,
  options: PaginationOptions = {}
): PaginationResult {
  const page = parseBoundedInt(searchParams.get('page'), {
    defaultValue: options.defaultPage ?? 1,
    min: 1,
    max: options.maxPage ?? 1000,
  });

  const pageSize = parseBoundedInt(searchParams.get('pageSize'), {
    defaultValue: options.defaultPageSize ?? 20,
    min: 1,
    max: options.maxPageSize ?? 100,
  });

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateWithSchema<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
  const parsed = schema.safeParse(data);
  if (parsed.success) {
    return {
      success: true as const,
      data: parsed.data,
    };
  }

  return {
    success: false as const,
    error: parsed.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
        return `${path}: ${issue.message}`;
      })
      .join('; '),
  };
}

function clampInt(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.floor(value), min), max);
}
