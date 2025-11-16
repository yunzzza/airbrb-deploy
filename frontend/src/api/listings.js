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