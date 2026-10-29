const SERVER_URL = 'http://localhost:5000';
const API_URL = `${SERVER_URL}/api`;

export const photoUrl = (path) => `${SERVER_URL}${path}`;

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

export async function uploadPhotos(vehicleId, files) {
  const fd = new FormData();
  files.forEach((f) => fd.append('photos', f));
  const res = await fetch(`${API_URL}/vehicles/${vehicleId}/photos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    body: fd
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Photo upload failed');
  return data;
}