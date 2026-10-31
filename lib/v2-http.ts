/** Do not present an unavailable service as an empty business dataset. */
export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    // Preserve the HTTP status on the thrown error so callers can branch on
    // authorization (403) separately from availability (5xx) without parsing
    // the message body.
    const error = new Error(body?.error || 'The service is unavailable. Please try again.');
    (error as { status?: number }).status = response.status;
    throw error;
  }
  if (!body) throw new Error('The service returned an unreadable response. Please try again.');
  return body as T;
}
