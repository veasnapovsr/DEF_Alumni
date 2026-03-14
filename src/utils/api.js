const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function createUrl(path) {
  return `${API_BASE}${path}`
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, headers = {}, token, isFormData = false } = options
  const requestHeaders = {
    ...headers,
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  if (body && !isFormData) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  let response

  try {
    response = await fetch(createUrl(path), {
      method,
      headers: requestHeaders,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Check that the API is running and that VITE_API_BASE_URL is configured correctly.')
  }

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : {}

  if (!response.ok) {
    if (response.status >= 500 && !payload.message) {
      throw new Error('The server is unavailable or returned an internal error.')
    }

    throw new Error(payload.message || 'Request failed.')
  }

  return payload
}

export function getAssetUrl(path) {
  if (!path) {
    return ''
  }

  if (/^(?:https?:|data:|blob:)/i.test(path)) {
    return path
  }

  return createUrl(path)
}
