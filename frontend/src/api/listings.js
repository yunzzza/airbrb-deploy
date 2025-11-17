import backendConfig from '../../backend.config.json';
const BASE_URL = `http://localhost:${backendConfig.BACKEND_PORT}`; 

// fetch all listings
export async function fetchAllListings(token) {
    const res = await fetch(`${BASE_URL}/listings`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch listings');
    }
    return data; 
}


// create a new listing
export async function createListing(token, payload) {
    const res = await fetch(`${BASE_URL}/listings/new`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || 'Failed to create listing');
    }
    return data;
}

// update the details of a particular listing
export async function updateListing(token, id, payload) {
  const res = await fetch(`${BASE_URL}/listings/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update listing');
  }
  return data;
}

// collect all of the data pertaining to a particular listing
export async function fetchListingById(token, id) {
  const res = await fetch(`${BASE_URL}/listings/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch listing');
  }
  return data; 
}