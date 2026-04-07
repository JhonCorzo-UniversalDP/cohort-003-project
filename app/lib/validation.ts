import { data } from "react-router";
import * as v from "valibot";

type ParseSuccess<T> = { success: true; data: T };
type ParseFailure = {
  success: false;
  errors: Record<string, string>;
};
type ParseResult<T> = ParseSuccess<T> | ParseFailure;

function buildFieldErrors(issues: v.BaseIssue<unknown>[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path?.[0]?.key;
    if (typeof key === "string" && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

/**
 * Converts FormData to a plain object, validates with a Valibot schema,
 * and returns either the parsed data or a field-error map (first error per field).
 */
export function parseFormData<T extends v.GenericSchema>(
  formData: FormData,
  schema: T
): ParseResult<v.InferOutput<T>> {
  const raw = Object.fromEntries(formData);
  const result = v.safeParse(schema, raw);

  if (result.success) {
    return { success: true, data: result.output };
  }

  return { success: false, errors: buildFieldErrors(result.issues) };
}

/**
 * Validates route params with a Valibot schema.
 * Throws a 400 response on failure (params are never user-correctable form errors).
 */
export function parseParams<T extends v.GenericSchema>(
  params: Record<string, string | undefined>,
  schema: T
): v.InferOutput<T> {
  const result = v.safeParse(schema, params);

  if (result.success) {
    return result.output;
  }

  throw data("Invalid parameters", { status: 400 });
}

/**
 * Parses a JSON request body with a Valibot schema.
 * Returns either the parsed data or a field-error map (first error per field).
 */
export async function parseJsonBody<T extends v.GenericSchema>(
  request: Request,
  schema: T
): Promise<ParseResult<v.InferOutput<T>>> {
  const raw = await request.json();
  const result = v.safeParse(schema, raw);

  if (result.success) {
    return { success: true, data: result.output };
  }

  return { success: false, errors: buildFieldErrors(result.issues) };
}
