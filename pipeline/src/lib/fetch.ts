const DEFAULT_USER_AGENT = 'Pierrammer-data-pipeline/1.0 (+https://github.com/Qwetsh/Pierrammer)'

export interface FetchWithRetryOptions {
  retries?: number
  backoffMs?: number
  timeoutMs?: number
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  opts: FetchWithRetryOptions = {},
): Promise<Response> {
  const retries = opts.retries ?? 5
  const backoffMs = opts.backoffMs ?? 1000
  const timeoutMs = opts.timeoutMs ?? 30000

  const headers = new Headers(init.headers)
  if (!headers.has('user-agent')) headers.set('user-agent', DEFAULT_USER_AGENT)

  let lastErr: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, { ...init, headers, signal: controller.signal })

      // 5xx and 429 are retryable; other non-OK statuses bubble up to the caller
      if (!res.ok && (res.status >= 500 || res.status === 429)) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }

      return res
    } catch (e) {
      lastErr = e
      if (attempt === retries) break
      const wait = backoffMs * Math.pow(2, attempt)
      const reason = e instanceof Error ? e.message : String(e)
      console.warn(`  ⚠️  fetch ${url} échoué (tentative ${attempt + 1}/${retries + 1}): ${reason} — nouvel essai dans ${wait}ms`)
      await new Promise((r) => setTimeout(r, wait))
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastErr
}
