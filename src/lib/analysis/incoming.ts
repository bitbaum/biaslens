/**
 * The article a reader arrived with: `?u=` from a shared link or the
 * biaslens.orangecat.ch/https://… prefix, `url`/`text`/`title` from the
 * phone's share sheet (which often puts the link inside the text).
 */
export function incomingSource(
  params: Record<string, string | string[] | undefined>,
): string | null {
  for (const key of ['u', 'url', 'text', 'title']) {
    const raw = params[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    const match = value?.match(/https?:\/\/[^\s<>"']+/);
    if (!match) continue;
    try {
      const parsed = new URL(match[0]);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString();
    } catch {
      continue;
    }
  }
  return null;
}
