import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ListingBookingsPage.module.css';
import { useAuth } from '../../context/AuthContext';
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
 