import backendConfig from '../../backend.config.json';
const BASE_URL = `http://localhost:${backendConfig.BACKEND_PORT}`; 

// fetch all listings
export async function fetchAllListings() {
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
  const headers = {
    'Content-Type': 'application/json',
  };
  // change token request for users who do not log in
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/listings/${id}`, {
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch listing');
  }
  return data; 
}

// delete listing
export async function deleteListing(token, id) {
  const res = await fetch(`${BASE_URL}/listings/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete listing');
  }
  return data;
}


// publish a particular listing
export async function publishListing(token, id, availability) {
  const res = await fetch(`${BASE_URL}/listings/publish/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ availability }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to publish listing');
  }
  return data;
}


// unpublish a particular listing
export async function unpublishListing(token, id) {
  const res = await fetch(`${BASE_URL}/listings/unpublish/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to unpublish listing');
  }
  return data;
}