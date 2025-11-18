import backendConfig from '../../backend.config.json';
const BASE_URL = `http://localhost:${backendConfig.BACKEND_PORT}`; 

// Get a list of the meta-data for all AirBrB bookings
export async function fetchBookings(token) {
  const res = await fetch(`${BASE_URL}/bookings`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch bookings');
  }

  return data;
}
