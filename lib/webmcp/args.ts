import type { ToolArguments } from "./types";

/**
 * Schema constraints are advisory in the current draft, so arguments are
 * re-validated in code. Every failure throws a message that names the offending
 * property and the accepted values, which is what an agent needs to retry.
 */
export class ToolInputError extends Error {}

function fail(message: string): never {
  throw new ToolInputError(message);
}

export function optionalString(args: ToolArguments, key: string): string | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") fail(`"${key}" must be a string.`);
  return value;
}

export function requiredString(args: ToolArguments, key: string): string {
  const value = optionalString(args, key);
  if (value === undefined || value.trim() === "") fail(`"${key}" is required.`);
  return value;
}

export function optionalInteger(
  args: ToolArguments,
  key: string,
  min: number,
  max: number,
): number | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(`"${key}" must be a number.`);
  }
  const rounded = Math.round(value);
  if (rounded < min || rounded > max) {
    fail(`"${key}" must be between ${min} and ${max}, got ${rounded}.`);
  }
  return rounded;
}

export function requiredInteger(
  args: ToolArguments,
  key: string,
  min: number,
  max: number,
): number {
  const value = optionalInteger(args, key, min, max);
  if (value === undefined) fail(`"${key}" is required.`);
  return value;
}

export function optionalBoolean(args: ToolArguments, key: string): boolean | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") fail(`"${key}" must be true or false.`);
  return value;
}

export function optionalEnum<T extends string>(
  args: ToolArguments,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = optionalString(args, key);
  if (value === undefined) return undefined;
  if (!allowed.includes(value as T)) {
    fail(`"${key}" must be one of: ${allowed.join(", ")}. Got "${value}".`);
  }
  return value as T;
}

export function requiredEnum<T extends string>(
  args: ToolArguments,
  key: string,
  allowed: readonly T[],
): T {
  const value = optionalEnum(args, key, allowed);
  if (value === undefined) fail(`"${key}" is required and must be one of: ${allowed.join(", ")}.`);
  return value;
}

export function optionalEnumArray<T extends string>(
  args: ToolArguments,
  key: string,
  allowed: readonly T[],
): T[] | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) fail(`"${key}" must be an array.`);
  return value.map((entry, index) => {
    if (typeof entry !== "string" || !allowed.includes(entry as T)) {
      fail(
        `"${key}[${index}]" must be one of: ${allowed.join(", ")}. Got ${JSON.stringify(entry)}.`,
      );
    }
    return entry as T;
  });
}

export function optionalObjectArray(
  args: ToolArguments,
  key: string,
): ToolArguments[] | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) fail(`"${key}" must be an array of objects.`);
  return value.map((entry, index) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      fail(`"${key}[${index}]" must be an object.`);
    }
    return entry as ToolArguments;
  });
}

export function requiredObjectArray(
  args: ToolArguments,
  key: string,
): ToolArguments[] {
  const value = optionalObjectArray(args, key);
  if (value === undefined) fail(`"${key}" is required.`);
  return value;
}

export function toolError(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : String(cause);
  return JSON.stringify({ ok: false, error: message });
}

export function toolResult(payload: unknown): string {
  return JSON.stringify(payload, null, 2);
}
