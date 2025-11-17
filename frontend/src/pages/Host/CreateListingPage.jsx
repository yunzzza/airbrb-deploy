import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ListingFormPage.module.css';
import { useAuth } from '../../context/AuthContext';
import { createListing } from '../../api/listings';

export default function CreateListingPage() {
  const { auth, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

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

  // thumnail image
  const handleThumbnailChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setThumbnailDataUrl('');
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

  // property images
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

  // remove chosen property images
  const handleRemoveImage = (indexToRemove) => {
    setImageDataUrls((prev) =>
      prev.filter((_, idx) => idx !== indexToRemove)
    );
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
      await createListing(auth.token, payload);
      navigate('/host/listings');
    } catch (err) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/host/listings');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Create new listing</h1>

      {error && <div className={styles.error}>{error}</div>}

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
          <label className={styles.label}>Thumbnail image (optional)</label>
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
            Property images (optional)
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
            {submitting ? 'Creating…' : 'Create'}
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
    </div>
  );
}
