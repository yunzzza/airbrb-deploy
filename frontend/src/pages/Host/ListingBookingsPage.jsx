import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ListingBookingsPage.module.css';
import { useAuth } from '../../context/useAuth';
import { fetchListingById } from '../../api/listings';
import {
  fetchBookings,
  acceptBooking,
  declineBooking,
} from '../../api/bookings';

export default function ListingBookingsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth, isLoggedIn } = useAuth();

  const [listing, setListing] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // load listing and all bookings for this listing
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [listingRes, bookingsRes] = await Promise.all([
          fetchListingById(auth.token, id),
          fetchBookings(auth.token),
        ]);

        const l = listingRes.listing || listingRes;
        const allBookings = bookingsRes.bookings || bookingsRes;
        const listingId = l.id || Number(id);

        const forThisListing = allBookings.filter(
          (b) => String(b.listingId) === String(listingId),
        );

        if (!ignore) {
          setListing(l);
          setBookings(forThisListing);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load booking info');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [id, auth, isLoggedIn, navigate]);

  // How long has the listing been up online
  const daysOnline = useMemo(() => {
    if (!listing || !listing.postedOn) return null;
    const posted = new Date(listing.postedOn);
    const now = new Date();
    const diffMs = now - posted;
    if (!Number.isFinite(diffMs) || diffMs < 0) return null;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }, [listing]);

  // days this year and profit 
  const statsThisYear = useMemo(() => {
    const year = new Date().getFullYear();
    const yearStart = new Date(year, 0, 1);
    const nextYearStart = new Date(year + 1, 0, 1);
    const msPerDay = 1000 * 60 * 60 * 24;

    let totalDays = 0;
    let totalProfit = 0;

    bookings.forEach((b) => {
      if (b.status !== 'accepted') return;
      if (!b.dateRange?.start || !b.dateRange?.end) return;

      const start = new Date(b.dateRange.start);
      const end = new Date(b.dateRange.end);

      const bookingStart = start;
      const bookingEnd = end;

      // count all days
      const totalNights = Math.max(
        0,
        Math.round((bookingEnd - bookingStart) / msPerDay),
      );
      if (totalNights <= 0) return;

      // count how many das are in current year
      const s = bookingStart < yearStart ? yearStart : bookingStart;
      const e = bookingEnd > nextYearStart ? nextYearStart : bookingEnd;

      const nightsInYear = Math.max(0, Math.round((e - s) / msPerDay));
      if (nightsInYear <= 0) return;

      totalDays += nightsInYear;

      const price = Number(b.totalPrice ?? 0);
      if (price > 0) {
        // divided by rate of this year
        totalProfit += (price * nightsInYear) / totalNights;
      }
    });

    return {
      daysBooked: totalDays,
      profit: Math.round(totalProfit),
    };
  }, [bookings]);

  // booking request history
  const pendingBookings = useMemo(
    () => bookings.filter((b) => (b.status || '').toLowerCase() === 'pending'),
    [bookings],
  );

  const historyBookings = useMemo(
    () => bookings.filter((b) => (b.status || '').toLowerCase() !== 'pending'),
    [bookings],
  );

  // handle request: accpet or refuse
  const handleDecision = async (bookingId, action) => {
    try {
      setError('');
      if (action === 'accept') {
        await acceptBooking(auth.token, bookingId);
      } else {
        await declineBooking(auth.token, bookingId);
      }

      // update booking status
      const data = await fetchBookings(auth.token);
      const allBookings = data.bookings || data;
      const listingId = listing.id || Number(id);
      const forThisListing = allBookings.filter(
        (b) => String(b.listingId) === String(listingId),
      );
      setBookings(forThisListing);
    } catch (err) {
      setError(err.message || 'Failed to update booking');
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading booking data…</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  if (!listing) {
    return <div className={styles.container}>Listing not found.</div>;
  }

  const meta = listing.metadata || {};

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Booking management</h1>
          <p className={styles.subtitle}>
            {listing.title} · {meta.propertyType || 'Unknown type'}
          </p>
          {daysOnline != null && (
            <p className={styles.subtitle}>
              Online for <strong>{daysOnline}</strong> days
            </p>
          )}
        </div>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate('/host/listings')}
        >
          ← Back to my listings
        </button>
      </header>

      <section className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>This year overview</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Days booked this year</span>
            <span className={styles.summaryValue}>
              {statsThisYear.daysBooked}
            </span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Profit this year (approx)</span>
            <span className={styles.summaryValue}>
              ${statsThisYear.profit}
            </span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Total requests</span>
            <span className={styles.summaryValue}>{bookings.length}</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Pending booking requests</h2>
        {pendingBookings.length === 0 && (
          <p className={styles.textSmall}>No pending booking requests.</p>
        )}
        {pendingBookings.map((b) => (
          <div key={b.id} className={styles.bookingCard}>
            <div className={styles.bookingMain}>
              <div className={styles.bookingDates}>
                {b.dateRange?.start} → {b.dateRange?.end}
              </div>
              <div className={styles.bookingPrice}>
                Total: ${b.totalPrice ?? 0}
              </div>
            </div>
            <div className={styles.bookingMeta}>
              <span>Status: {b.status}</span>
              {b.guest && (
                <span>Guest: {b.guest}</span>
              )}
            </div>
            <div className={styles.bookingActions}>
              <button
                type="button"
                className={styles.acceptButton}
                onClick={() => handleDecision(b.id, 'accept')}
              >
                Accept
              </button>
              <button
                type="button"
                className={styles.declineButton}
                onClick={() => handleDecision(b.id, 'decline')}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Booking history</h2>
        {historyBookings.length === 0 && (
          <p className={styles.textSmall}>No booking history yet.</p>
        )}
        {historyBookings.map((b) => (
          <div key={b.id} className={styles.bookingCard}>
            <div className={styles.bookingMain}>
              <div className={styles.bookingDates}>
                {b.dateRange?.start} → {b.dateRange?.end}
              </div>
              <div className={styles.bookingPrice}>
                Total: ${b.totalPrice ?? 0}
              </div>
            </div>
            <div className={styles.bookingMeta}>
              <span>
                Status:{' '}
                <strong className={styles[`status_${b.status?.toLowerCase()}`]}>
                  {b.status}
                </strong>
              </span>
              {b.guest && (
                <span>Guest: {b.guest}</span>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
