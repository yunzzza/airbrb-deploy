// src/pages/Listing/ListingDetailsPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import styles from './ListingDetailsPage.module.css';
import { useAuth } from '../../context/AuthContext';
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
    if (!listing) return [];
    const listingId = listing.id || Number(id);
    return myBookings.filter((b) => {
      return String(b.listingId) === String(listingId);
    });
  }, [myBookings, listing, id]);

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
      await createBooking(auth.token, listing.id || id, payloadRange);
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
