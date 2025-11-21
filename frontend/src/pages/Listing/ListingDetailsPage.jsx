// src/pages/Listing/ListingDetailsPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import styles from './ListingDetailsPage.module.css';
import { useAuth } from '../../context/useAuth';
import { fetchListingById } from '../../api/listings';
import { fetchBookings, createBooking, createReview } from '../../api/bookings';

export default function ListingDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { auth, isLoggedIn } = useAuth();

  // search range, if click from search page
  const searchRange = location.state?.searchRange || null;

  const [listing, setListing] = useState(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [error, setError] = useState('');

  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [bookStart, setBookStart] = useState('');
  const [bookEnd, setBookEnd] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // load listings
  useEffect(() => {
    if (!isLoggedIn) {
      // clear bookings history for user not log in
      setMyBookings([]);
    }
    let ignore = false;
    const load = async () => {
      setLoadingListing(true);
      setError('');
      try {
        const data = await fetchListingById(auth?.token, id);
        const l = data.listing || data;
        if (!ignore) {
          setListing(l);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load listing');
        }
      } finally {
        if (!ignore) setLoadingListing(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [id, auth]);

  // load all bookings for current user, if log in
  useEffect(() => {
    if (!isLoggedIn) return;
    let ignore = false;
    const loadBookings = async () => {
      setLoadingBookings(true);
      try {
        const data = await fetchBookings(auth.token);
        const all = data.bookings || [];
        if (!ignore) setMyBookings(all);
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoadingBookings(false);
      }
    };
    loadBookings();
    return () => {
      ignore = true;
    };
  }, [isLoggedIn, auth]);

  // current listing
  const myBookingsForThisListing = useMemo(() => {
    if (!listing || !auth?.email) return [];
    const listingId = listing.id || Number(id);
  
    return myBookings.filter((b) => {
      const sameListing = String(b.listingId) === String(listingId);
      const sameUser = b.owner === auth.email; 
      return sameListing && sameUser;
    });
  }, [myBookings, listing, id, auth]);
  

  // if booking is accepted, user can review for this listing
  const acceptedBookingForReview = useMemo(() => {
    return myBookingsForThisListing.find((b) => b.status === 'accepted');
  }, [myBookingsForThisListing]);

  // price for this booking
  const stayPriceInfo = useMemo(() => {
    if (!listing || !listing.price || !searchRange?.start || !searchRange?.end) {
      return null;
    }
    const start = new Date(searchRange.start);
    const end = new Date(searchRange.end);
    const msPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.max(0, Math.round((end - start) / msPerDay));
    if (nights <= 0) return null;
    const total = nights * Number(listing.price);
    return { nights, total };
  }, [listing, searchRange]);

  // submit booking
  // submit booking
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingMessage('');
    setBookingError('');
  
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
  
    if (!bookStart || !bookEnd) {
      setBookingError('Please choose both start and end dates.');
      return;
    }
  
    if (bookStart > bookEnd) {
      setBookingError('Start date must not be after end date.');
      return;
    }
  
    setBookingSubmitting(true);
    try {
      const payloadRange = { start: bookStart, end: bookEnd };
  
      // calculate nights & price
      const start = new Date(bookStart);
      const end = new Date(bookEnd);
      const msPerDay = 1000 * 60 * 60 * 24;
      const nights = Math.max(1, Math.round((end - start) / msPerDay));
      const totalPrice = nights * Number(listing.price);
  
      await createBooking(
        auth.token,
        listing.id || id,
        payloadRange,
        totalPrice
      );
  
      setBookingMessage('Booking request sent!');
      const data = await fetchBookings(auth.token);
      setMyBookings(data.bookings || []);
      setBookStart('');
      setBookEnd('');
    } catch (err) {
      setBookingError(err.message || 'Failed to create booking');
    } finally {
      setBookingSubmitting(false);
    }
  };
  

  // submit review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!acceptedBookingForReview) {
      setReviewError('You need at least one accepted booking to leave a review.');
      return;
    }
    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 0 || numericRating > 5) {
      setReviewError('Rating must be a number between 0 and 5.');
      return;
    }
    if (!comment.trim()) {
      setReviewError('Please write a comment.');
      return;
    }

    setReviewSubmitting(true);
    try {
      await createReview(
        auth.token,
        listing.id || id,
        acceptedBookingForReview.id,
        numericRating,
        comment.trim()
      );
      const data = await fetchListingById(auth.token, id);
      const l = data.listing || data;
      setListing(l);
      setRating('');
      setComment('');
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loadingListing) {
    return <div className={styles.container}>Loading listing…</div>;
  }

  if (error) {
    return <div className={styles.container}>Error: {error}</div>;
  }

  if (!listing) {
    return <div className={styles.container}>Listing not found.</div>;
  }

  const meta = listing.metadata || {};
  const images = meta.images || [];
  const allImages = [listing.thumbnail, ...images].filter(Boolean);
  const reviews = listing.reviews || [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / reviews.length
      : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{listing.title}</h1>
        <div className={styles.subInfo}>
          <span className={styles.address}>{listing.address}</span>
          <span className={styles.dot}>•</span>
          <span>
            ⭐ {avgRating.toFixed(1)} ({reviews.length} reviews)
          </span>
        </div>
      </div>

      {allImages.length > 0 && (
        <div className={styles.gallery}>
          {allImages.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={`Property image ${idx + 1}`}
              className={idx === 0 ? styles.mainImage : styles.thumbImage}
            />
          ))}
        </div>
      )}

      <div className={styles.contentRow}>
        <div className={styles.leftColumn}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Property details</h2>
            <div className={styles.chipsRow}>
              <span className={styles.chip}>{meta.propertyType || 'Unknown type'}</span>
              <span className={styles.chip}>
                {meta.numBeds ?? 0} beds · {meta.numBathrooms ?? 0} baths
              </span>
            </div>
            <p className={styles.text}>
              <strong>Price</strong>{' '}
              {stayPriceInfo ? (
                <>
                  ${stayPriceInfo.total} per stay ({stayPriceInfo.nights} nights) ·{' '}
                  <span className={styles.smallText}>
                    ${listing.price}/night
                  </span>
                </>
              ) : (
                <>${listing.price}/night</>
              )}
            </p>
            {meta.amenities?.length > 0 && (
              <>
                <h3 className={styles.subSectionTitle}>Amenities</h3>
                <ul className={styles.amenitiesList}>
                  {meta.amenities.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Reviews</h2>
            {reviews.length === 0 && (
              <p className={styles.text}>No reviews yet.</p>
            )}
            {reviews.map((r, idx) => (
              <div key={idx} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewRating}>⭐ {r.rating}</span>
                  {r.user && <span className={styles.reviewUser}>{r.user}</span>}
                </div>
                <p className={styles.reviewComment}>{r.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Book this listing</h2>
            {!isLoggedIn && (
              <p className={styles.textSmall}>
                You need to{' '}
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => navigate('/login')}
                >
                  log in
                </button>{' '}
                to make a booking.
              </p>
            )}
            <form onSubmit={handleBookingSubmit} className={styles.form}>
              <label className={styles.label}>
                Check-in
                <input
                  type="date"
                  className={styles.input}
                  value={bookStart}
                  onChange={(e) => setBookStart(e.target.value)}
                />
              </label>
              <label className={styles.label}>
                Check-out
                <input
                  type="date"
                  className={styles.input}
                  value={bookEnd}
                  onChange={(e) => setBookEnd(e.target.value)}
                />
              </label>

              {bookingError && (
                <div className={styles.errorBox}>{bookingError}</div>
              )}
              {bookingMessage && (
                <div className={styles.successBox}>{bookingMessage}</div>
              )}

              <button
                type="submit"
                className={styles.primaryButton}
                disabled={bookingSubmitting}
              >
                {bookingSubmitting ? 'Submitting…' : 'Request booking'}
              </button>
            </form>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>My bookings</h2>
            {loadingBookings && (
              <p className={styles.textSmall}>Loading bookings…</p>
            )}
            {!loadingBookings && myBookingsForThisListing.length === 0 && (
              <p className={styles.textSmall}>
                You have no bookings for this listing yet.
              </p>
            )}
            {!loadingBookings &&
              myBookingsForThisListing.map((b) => (
                <div key={b.id} className={styles.bookingItem}>
                  <div className={styles.bookingDates}>
                    {b.dateRange?.start} → {b.dateRange?.end}
                  </div>
                  <div className={styles.bookingStatus}>
                    Status: <strong>{b.status}</strong>
                  </div>
                </div>
              ))}
          </div>


          {acceptedBookingForReview && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Leave a review</h2>
              <form onSubmit={handleReviewSubmit} className={styles.form}>
                <label className={styles.label}>
                  Rating (0–5)
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    className={styles.input}
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  Comment
                  <textarea
                    className={styles.textarea}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </label>
                {reviewError && (
                  <div className={styles.errorBox}>{reviewError}</div>
                )}
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
