import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HostedListingsPage.module.css';
import { useAuth } from '../../context/useAuth';
import {
  fetchAllListings,
  fetchListingById,
  deleteListing,
  publishListing,
  unpublishListing,
} from '../../api/listings';
import { fetchBookings } from '../../api/bookings'; 
const MS_PER_DAY = 1000 * 60 * 60 * 24;


function computeProfitsForLast30Days(myListings, allBookings) {
  if (!myListings || !myListings.length) {
    return Array(31).fill(0);
  }
  const myIds = new Set(myListings.map((l) => String(l.id)));
  const profits = Array(31).fill(0);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  allBookings.forEach((b) => {
    // only count my listings and accept bookings
    if (!myIds.has(String(b.listingId))) return;
    if ((b.status || '').toLowerCase() !== 'accepted') return;

    const range = b.dateRange || {};
    if (!range.start || !range.end) return;

    const start = new Date(range.start);
    const end = new Date(range.end);
    // profit days
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const nights = Math.max(
      0,
      Math.round((endDay - startDay) / MS_PER_DAY)
    );
    if (nights <= 0) return;

    const totalPrice = Number(b.totalPrice ?? 0);
    if (!Number.isFinite(totalPrice) || totalPrice <= 0) return;

    const nightly = totalPrice / nights;
    // count profits for different days
    for (let i = 0; i < nights; i++) {
      const day = new Date(startDay.getTime() + i * MS_PER_DAY);
      const diffDays = Math.round((today - day) / MS_PER_DAY);
      if (diffDays >= 0 && diffDays <= 30) {
        profits[diffDays] += nightly;
      }
    }
  });
  return profits;
}


function ProfitGraph({ profits }) {
  const max = Math.max(...profits);
  const height = 160;
  const width = 380;
  const padding = { top: 10, right: 10, bottom: 28, left: 50 };
  const innerHeight = height - padding.top - padding.bottom;
  const innerWidth = width - padding.left - padding.right;
  const barCount = profits.length; 
  const barWidth = innerWidth / barCount || 1;

  // y ticks
  const yTicks = max > 0 ? [0, max / 2, max] : [0];

  return (
    <svg
      className={styles.profitSvg}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Profit over the last 30 days"
    >
      {/* Y label */}
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={height - padding.bottom}
        className={styles.axisLine}
      />

      {/* X label */}
      <line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={width - padding.right}
        y2={height - padding.bottom}
        className={styles.axisLine}
      />

      {/* Y values */}
      {profits.map((val, dayAgo) => {
        const barHeight = max > 0 ? (val / max) * innerHeight : 0;
        const x = padding.left + dayAgo * barWidth;
        const y = height - padding.bottom - barHeight;
        return (
          <rect
            key={dayAgo}
            x={x}
            y={y}
            width={Math.max(barWidth - 1, 1)}
            height={barHeight}
            className={styles.profitBar}
          />
        );
      })}

      {/* Y label details */}
      {yTicks.map((v) => {
        const ratio = max > 0 ? v / max : 0;
        const y = height - padding.bottom - ratio * innerHeight;
        return (
          <g key={v}>
            {/* Y values detail */}
            <text
              x={padding.left - 12}
              y={y + 4}
              textAnchor="end"
              className={styles.axisLabel}
            >
              ${v.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* X label */}
      {[0, 10, 20, 30].map((d) => {
        const x = padding.left + d * barWidth;
        const y = height - padding.bottom + 14;
        return (
          <text
            key={d}
            x={x}
            y={y}
            textAnchor="middle"
            className={styles.axisLabel}
          >
            {d}
          </text>
        );
      })}

      {/* X title: Days ago */}
      <text
        x={(padding.left + (width - padding.right)) / 2}
        y={height - 4}
        textAnchor="middle"
        className={styles.axisLabel}
      >
        Days ago
      </text>

      {/* Y title: profit($)*/}
      <text
        x={12}
        y={height / 2}
        textAnchor="middle"
        transform={`rotate(-90 12 ${height / 2})`}
        className={styles.axisLabel}
      >
        Profit ($)
      </text>
    </svg>
  );
}




export default function HostedListingsPage() {
  const { auth, isLoggedIn } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');         
  const [availabilityDraft, setAvailabilityDraft] = useState({});
  const navigate = useNavigate();
  const [profits, setProfits] = useState(Array(31).fill(0));

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

        try {
          const bookingsData = await fetchBookings(auth.token);
          const allBookings = bookingsData.bookings || bookingsData;
          const profitsArr = computeProfitsForLast30Days(fullMine, allBookings);
          setProfits(profitsArr);
        } catch (err) {
          console.error('Failed to load bookings for profit graph', err);
          setProfits(Array(31).fill(0));
        }

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

  const goToBookingsManage = (id) => {
    navigate(`/host/listings/${id}/bookings`);
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

      <div className={styles.profitSection}>
        <div className={styles.profitHeader}>
          <h2 className={styles.profitTitle}>Profit in last 30 days</h2>
          <span className={styles.profitSubtitle}>
            X: days ago (0 = today), Y: $ earned that day
          </span>
        </div>

        <ProfitGraph profits={profits} />

        {profits.every((v) => v === 0) && (
          <p className={styles.profitEmpty}>
            No accepted bookings in the last 30 days yet.
          </p>
        )}
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
                  onClick={() => goToBookingsManage(listing.id)}
                >
                  Manage bookings
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

