const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function parseResponse(response) {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export async function apiRequest(path, { method = 'GET', token, data, formData } = {}) {
  const headers = new Headers();
  let body;

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (formData) {
    body = formData;
  } else if (data !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(data);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body,
  });

  if (!response.ok) {
    const errorPayload = await parseResponse(response).catch(() => ({}));
    const message =
      (errorPayload && errorPayload.message) || response.statusText || 'Error en la solicitud';
    const error = new Error(message);
    error.status = response.status;
    error.payload = errorPayload;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return parseResponse(response);
}

export function getApiUrl() {
  return API_URL;
}
