import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './ListingFormPage.module.css';
import { useAuth } from '../../context/AuthContext';
import { fetchListingById, updateListing } from '../../api/listings';

export default function EditListingPage() {
  const { auth, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loaded, setLoaded] = useState(false);

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [beds, setBeds] = useState('');
  const [amenities, setAmenities] = useState('');
  const [imageDataUrls, setImageDataUrls] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const load = async () => {
      try {
        const data = await fetchListingById(auth.token, id);
        const listing = data.listing || data;
        const meta = listing.metadata || {};

        setTitle(listing.title || '');
        setAddress(listing.address || '');
        setPrice(String(listing.price ?? meta.price ?? ''));
        setThumbnailDataUrl(listing.thumbnail || meta.thumbnail || '');
        setPropertyType(meta.propertyType || '');
        setBathrooms(String(meta.numBathrooms ?? ''));
        setBeds(String(meta.numBeds ?? ''));
        setAmenities((meta.amenities || []).join(', '));
        setImageDataUrls(meta.images || []);
        setLoaded(true);
      } catch (err) {
        setError(err.message || 'Failed to load listing');
      }
    };

    load();
  }, [auth, id, isLoggedIn]);

  const handleThumbnailChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setThumbnailDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImagesChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) {
      return;
    }

    const readers = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            resolve(null);
          }
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((results) => {
      const valid = results.filter((r) => typeof r === 'string');
      setImageDataUrls((prev) => [...prev, ...valid]);
    });
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageDataUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !address || !price || !propertyType) {
      setError('Title, address, price, and property type are required.');
      return;
    }

    setError('');
    setSubmitting(true);

    const payload = {
      title,
      address,
      price: Number(price),
      thumbnail: thumbnailDataUrl || '/default.png',
      metadata: {
        propertyType,
        numBathrooms: Number(bathrooms) || 0,
        numBeds: Number(beds) || 0,
        amenities: amenities
          ? amenities.split(',').map((a) => a.trim())
          : [],
        images: imageDataUrls,
      },
    };

    try {
      await updateListing(auth.token, id, payload);
      navigate('/host/listings');
    } catch (err) {
      setError(err.message || 'Failed to update listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/host/listings');
  };

  if (!loaded && !error) {
    return <div className={styles.container}>Loading…</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Edit listing</h1>

      {error && <div className={styles.error}>{error}</div>}
