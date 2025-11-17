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

      {!error && (
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Title</label>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Address</label>
            <input
              className={styles.input}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className={styles.inlineRow}>
            <div className={`${styles.field} ${styles.fieldHalf}`}>
              <label className={styles.label}>Price per night ($)</label>
              <input
                className={styles.input}
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className={`${styles.field} ${styles.fieldHalf}`}>
              <label className={styles.label}>Property type</label>
              <input
                className={styles.input}
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inlineRow}>
            <div className={`${styles.field} ${styles.fieldHalf}`}>
              <label className={styles.label}>Bathrooms</label>
              <input
                className={styles.input}
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
              />
            </div>
            <div className={`${styles.field} ${styles.fieldHalf}`}>
              <label className={styles.label}>Total beds</label>
              <input
                className={styles.input}
                type="number"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Thumbnail image</label>
            <input
              className={styles.input}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
            />
            {thumbnailDataUrl && (
              <div className={styles.thumbnailPreviewWrapper}>
                <img
                  src={thumbnailDataUrl}
                  alt="Thumbnail preview"
                  className={styles.thumbnailPreview}
                />
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Amenities (comma separated)
            </label>
            <textarea
              className={styles.textarea}
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Property images
            </label>
            <input
              className={styles.input}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
            />
            {imageDataUrls.length > 0 && (
              <div className={styles.imagesGrid}>
                {imageDataUrls.map((src, idx) => (
                  <div key={idx} className={styles.imageItem}>
                    <img
                      src={src}
                      alt={`Image ${idx + 1}`}
                      className={styles.imageThumb}
                    />
                    <button
                      type="button"
                      className={styles.imageRemoveBtn}
                      onClick={() => handleRemoveImage(idx)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.buttonRow}>
            <button
              type="submit"
              className={styles.button}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
