/** Do not present an unavailable service as an empty business dataset. */
export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || 'The service is unavailable. Please try again.');
  if (!body) throw new Error('The service returned an unreadable response. Please try again.');
  return body as T;
}
