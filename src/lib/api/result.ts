/**
 * The single shape every BiasLens JSON endpoint returns, and the single shape
 * every client parses. Defining it once keeps the HTTP contract from drifting
 * between producer (route handlers) and consumer (UI/hooks).
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
