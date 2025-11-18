import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HostedListingsPage.module.css';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAllListings,
  fetchListingById,
  deleteListing,
  publishListing,
  unpublishListing,
} from '../../api/listings';

export default function HostedListingsPage() {
  const { auth, isLoggedIn } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');         
  const [availabilityDraft, setAvailabilityDraft] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchAllListings();
        const all = data.listings;
        const mine = all.filter((l) => l.owner === auth.email);

        const fullMine = await Promise.all(
          mine.map(async (s) => {
            const detail = await fetchListingById(auth.token, s.id);
            const listing = detail.listing;
            return { ...listing, id: s.id };
          })
        );

        setListings(fullMine);
      } catch (err) {
        setError(err.message || 'Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auth, isLoggedIn, navigate]);

  const handleDelete = async (id) => {
    try {
      await deleteListing(auth.token, id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const handlePublish = async (id) => {
    const ranges = availabilityDraft[id] || [];

    if (!ranges.length) {
      setError('Please add at least one availability range');
      return;
    }

    const cleaned = [];
    for (const r of ranges) {
      if (!r.start || !r.end) {
        setError('Each availability range must have both start and end dates');
        return;
      }
      if (r.start > r.end) {
        setError('Start date must be before or equal to end date');
        return;
      }
      cleaned.push({ start: r.start, end: r.end });
    }

    try {
      setError('');
      await publishListing(auth.token, id, cleaned);
      setListings((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, published: true, availability: cleaned } : l
        )
      );
    } catch (err) {
      setError(err.message || 'Publish failed');
    }
  };

  const handleUnpublish = async (id) => {
    try {
      await unpublishListing(auth.token, id);
      setListings((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, published: false } : l
        )
      );
    } catch (err) {
      setError(err.message || 'Unpublish failed');
    }
  };

  const handleAvailabilityChange = (id, index, field, value) => {
    setAvailabilityDraft((prev) => {
      const current = prev[id] || [];
      const copy = [...current];
      if (!copy[index]) copy[index] = { start: '', end: '' };
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, [id]: copy };
    });
  };

  const addAvailabilityRange = (id) => {
    setAvailabilityDraft((prev) => {
      const current = prev[id] || [];
      return {
        ...prev,
        [id]: [...current, { start: '', end: '' }],
      };
    });
  };

  const removeAvailabilityRange = (id, index) => {
    setAvailabilityDraft((prev) => {
      const current = prev[id] || [];
      const copy = current.filter((_, i) => i !== index);
      return {
        ...prev,
        [id]: copy,
      };
    });
  };

  function getAverageRating(listing) {
    const reviews = listing.reviews || [];
    if (!reviews.length) return 0;

    const sum = reviews.reduce((acc, r) => {
      const val = Number(r.rating);
      return acc + (Number.isFinite(val) ? val : 0);
    }, 0);

    return sum / reviews.length;
  }

  const goToCreate = () => {
    navigate('/host/listings/new');
  };

  const goToEdit = (id) => {
    navigate(`/host/listings/${id}/edit`);
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      {/* show error */}
      {error && (
        <div className={styles.errorCard}>
          <span className={styles.errorMessage}>{error}</span>
          <button
            type="button"
            className={styles.errorClose}
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.headerRow}>
        <div className={styles.title}>My Hosted Listings</div>
        <button className={styles.createButton} onClick={goToCreate}>
          + Create new listing
        </button>
      </div>

      <div className={styles.list}>
        {listings.map((listing) => {
          const meta = listing.metadata;
          const beds = meta.numBeds;
          const bathrooms = meta.numBathrooms;
          const price = listing.price;
          const thumbnail = listing.thumbnail;
          const reviewCount = listing.reviews.length;
          const rating = getAverageRating(listing);
          const ranges = availabilityDraft[listing.id] || [];

          return (
            <div key={listing.id} className={styles.card}>
              <img
                src={thumbnail}
                alt={listing.title}
                className={styles.thumb}
              />
              <div className={styles.info}>
                <div className={styles.titleRow}>
                  <span>{listing.title}</span>
                </div>
                <div className={styles.meta}>
                  {meta.propertyType || 'Unknown type'} · {beds} beds ·{' '}
                  {bathrooms} baths
                </div>
                <div className={styles.rating}>
                  ⭐ {rating?.toFixed ? rating.toFixed(1) : rating} (
                  {reviewCount} reviews)
                </div>
                <span>${price}/night</span>
              </div>

              <div className={styles.actions}>
                {listing.published ? (
                  <button
                    className={styles.actionButton}
                    onClick={() => handleUnpublish(listing.id)}
                  >
                    Unpublish
                  </button>
                ) : (
                  <>
                    <div className={styles.availabilityBlock}>
                      {ranges.map((rng, idx) => (
                        <div key={idx} className={styles.rangeRow}>
                          <input
                            type="date"
                            className={styles.smallInput}
                            value={rng.start || ''}
                            onChange={(e) =>
                              handleAvailabilityChange(
                                listing.id,
                                idx,
                                'start',
                                e.target.value
                              )
                            }
                          />
                          <span className={styles.rangeSeparator}>→</span>
                          <input
                            type="date"
                            className={styles.smallInput}
                            value={rng.end || ''}
                            onChange={(e) =>
                              handleAvailabilityChange(
                                listing.id,
                                idx,
                                'end',
                                e.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            className={styles.rangeDeleteButton}
                            onClick={() =>
                              removeAvailabilityRange(listing.id, idx)
                            }
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        className={styles.addRangeButton}
                        onClick={() => addAvailabilityRange(listing.id)}
                      >
                        + Add availability range
                      </button>
                    </div>

                    <button
                      className={styles.actionButton}
                      onClick={() => handlePublish(listing.id)}
                    >
                      Publish
                    </button>
                  </>
                )}

                <button
                  className={styles.actionButton}
                  onClick={() => handleDelete(listing.id)}
                >
                  Delete
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => goToEdit(listing.id)}
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}

        {listings.length === 0 && (
          <div>You have no hosted listings yet.</div>
        )}
      </div>
    </div>
  );
}
