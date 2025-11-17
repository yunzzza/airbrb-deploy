import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HostedListingsPage.module.css';
import { useAuth } from '../../context/AuthContext';
import { fetchAllListings } from '../../api/listings';

export default function HostedListingsPage() {
    const { auth, isLoggedIn } = useAuth();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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
        const all = data.listings || data; 
        const mine = all.filter(l => l.owner === auth.email);
        setListings(mine);
        } catch (err) {
        setError(err.message || 'Failed to load listings');
        } finally {
        setLoading(false);
        }
    };
    load();
    }, [auth, isLoggedIn, navigate]);

    const goToCreate = () => {
      navigate('/host/listings/new');
    };

    if (loading) return <div className={styles.container}>Loading...</div>;
    if (error) return <div className={styles.container}>{error}</div>;

    return (
        <div className={styles.container}>
          <div className={styles.headerRow}>
            <div className={styles.title}>My Hosted Listings</div>
            <button className={styles.createButton} onClick={goToCreate}>
              + Create new listing
            </button>
          </div>
    
          <div className={styles.list}>
            {listings.map((listing) => {
              const meta = listing.metadata || {}; 
              const beds = meta.numBeds || meta.beds || 0;
              const bathrooms = meta.numBathrooms || listing.numBathrooms || 0;
              const price = listing.price || meta.price || 0;
              const thumbnail = listing.thumbnail || meta.thumbnail;
              const rating = listing.rating || meta.rating || 0;
              const reviewCount = listing.reviews?.length || meta.numReviews || 0;
    
              // const draft = availabilityDraft[listing.id] || {};
    
              return (
                <div key={listing.id} className={styles.card}>
                  <img
                    src={thumbnail || ''}
                    alt={listing.title}
                    className={styles.thumb}
                  />
                  <div className={styles.info} onClick={() => goToEdit(listing.id)}>
                    <div className={styles.titleRow}>
                      <span>{listing.title}</span>
                      <span>${price}/night</span>
                    </div>
                    <div className={styles.meta}>
                      {meta.propertyType || 'Unknown type'} · {beds} beds · {bathrooms} baths
                    </div>
                    <div className={styles.rating}>
                      ⭐ {rating?.toFixed ? rating.toFixed(1) : rating} ({reviewCount} reviews)
                    </div>
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
                        {/* <input
                          type="date"
                          className={styles.smallInput}
                          value={draft.start || ''}
                          onChange={(e) =>
                            handleAvailabilityChange(listing.id, 'start', e.target.value)
                          }
                        /> */}
                        {/* <input
                          type="date"
                          className={styles.smallInput}
                          value={draft.end || ''}
                          onChange={(e) =>
                            handleAvailabilityChange(listing.id, 'end', e.target.value)
                          }
                        /> */}
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
                  </div>
                </div>
              );
            })}
    
            {listings.length === 0 && <div>You have no hosted listings yet.</div>}
          </div>
        </div>
      );
    

}