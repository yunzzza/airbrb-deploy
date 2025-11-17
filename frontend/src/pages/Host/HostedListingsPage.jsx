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
        const data = await fetchAllListings(auth.token);
        const all = data.listings;
        const mine = all.filter((l) => l.owner === auth.email);

        const fullMine = await Promise.all(
          mine.map(async (s) => {
            const detail = await fetchListingById(auth.token, s.id);
            const listing = detail.listing || detail;
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
