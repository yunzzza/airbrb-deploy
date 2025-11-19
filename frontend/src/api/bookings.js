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


// Create a new AirBrB booking for a particular listing
export async function createBooking(token, listingId, dateRange) {
  const res = await fetch(`${BASE_URL}/bookings/new/${listingId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ dateRange }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create booking');
  }
  return data;
}


// Post a new listing review
export async function createReview(
  token,
  listingId,
  bookingId,
  rating,
  comment
) {
  const res = await fetch(
    `${BASE_URL}/listings/${listingId}/review/${bookingId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rating, comment }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create review');
  }
  return data;
}