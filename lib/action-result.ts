export type ActionResult<T = undefined> =
  | { success: true; data: T; warning?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/** `warning` reports a degraded side effect (e.g. geocoding rate limited) that did not fail the write. */
export function ok<T>(data: T, warning?: string): ActionResult<T> {
  return warning ? { success: true, data, warning } : { success: true, data };
}

export function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return fieldErrors ? { success: false, error, fieldErrors } : { success: false, error };
}
