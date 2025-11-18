import { useEffect, useState } from 'react';
import styles from './LandingPage.module.css';
import { useAuth } from '../../context/AuthContext';
import { fetchAllListings, fetchListingById } from '../../api/listings';
import { fetchBookings } from '../../api/bookings';

function getAverageRating(listing) {
  const reviews = listing.reviews || [];
  if (!reviews.length) return 0;

  const sum = reviews.reduce((acc, r) => {
    const val = Number(r.rating);
    return acc + (Number.isFinite(val) ? val : 0);
  }, 0);

  return sum / reviews.length;
}

// check if listing is avaiable
function isAvailableForRange(listing, start, end) {
  if (!start || !end) return true; 

  const ranges = listing.availability || [];
  if (!ranges.length) return false;

  const startDate = new Date(start);
  const endDate = new Date(end);

  return ranges.some((r) => {
    if (!r.start || !r.end) return false;
    const rs = new Date(r.start);
    const re = new Date(r.end);
    // any ranges contain startDate is avaiable
    return rs <= startDate && re >= endDate;
  });
}

export default function LandingPage() {
  const { auth, isLoggedIn } = useAuth();

  const [allListings, setAllListings] = useState([]);
  const [displayedListings, setDisplayedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [bookedListingIds, setBookedListingIds] = useState(new Set());

  // search variables
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('none'); 

  const [minBeds, setMinBeds] = useState('');
  const [maxBeds, setMaxBeds] = useState('');

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // for order set
  const [order, setOrder] = useState('asc'); 


  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // fetch all listings firstly
        const data = await fetchAllListings();
        const list = data.listings;

        // details for published variable
        const fullList = await Promise.all(
            list.map(async (s) => {
            const detail = await fetchListingById(auth.token, s.id);
            const listing = detail.listing;
            return { ...listing, id: s.id };
            })
        );
  
        // only remain published listings
        const publishedOnly = fullList.filter((l) => l.published === true);
        
        setAllListings(publishedOnly);

        // Listings that involve bookings made by the customer firstly, if the user is logged in
        if (isLoggedIn) {
          try {
            const bookingsData = await fetchBookings(auth.token);
            const bookings = bookingsData.bookings || bookingsData;

            const myBookedIds = new Set(
              bookings
                .filter((b) =>
                  ['accepted', 'pending'].includes(
                    (b.status || '').toLowerCase()
                  )
                )
                .map((b) => b.listingId) 
            );
            setBookedListingIds(myBookedIds);
            applySearch(publishedOnly, myBookedIds, {
              searchText: '',
              activeFilter: 'none',
              order: 'asc',
              minBeds: '',
              maxBeds: '',
              minPrice: '',
              maxPrice: '',
              startDate: '',
              endDate: '',
            });
          } catch (err) {
            console.error(err);
            setBookedListingIds(new Set());
            applySearch(publishedOnly, new Set(), {
              searchText: '',
              activeFilter: 'none',
              order: 'asc',
              minBeds: '',
              maxBeds: '',
              minPrice: '',
              maxPrice: '',
              startDate: '',
              endDate: '',
            });
          }
        } else {
          // if not logged in, follow normal order
          applySearch(publishedOnly, new Set(), {
            searchText: '',
            activeFilter: 'none',
            order: 'asc',
            minBeds: '',
            maxBeds: '',
            minPrice: '',
            maxPrice: '',
            startDate: '',
            endDate: '',
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auth, isLoggedIn]);

  
  // apply search
  function applySearch(
    baseList = allListings,
    bookedIds = bookedListingIds,
    options = {}
  ) {
    const {
      searchText: text = searchText,
      activeFilter: filter = activeFilter,
      order: sortOrder = order,
      minBeds: bedsMin = minBeds,
      maxBeds: bedsMax = maxBeds,
      minPrice: priceMin = minPrice,
      maxPrice: priceMax = maxPrice,
      startDate: sDate = startDate,
      endDate: eDate = endDate,
    } = options;

    let list = [...baseList];

    // search by text
    const trimmed = text.trim().toLowerCase();
    if (trimmed) {
      const words = trimmed.split(/\s+/);
      list = list.filter((l) => {
        const hay = `${l.title || ''} ${l.address || ''}`.toLowerCase();
        // any word is contained in title or address matches
        return words.some((w) => hay.includes(w));
      });
    }

    // filter search
    if (filter === 'bedrooms') {
      const min = bedsMin ? Number(bedsMin) : null;
      const max = bedsMax ? Number(bedsMax) : null;

      list = list.filter((l) => {
        const meta = l.metadata || {};
        const beds = Number(meta.numBeds ?? 0);

        if (min !== null && beds < min) return false;
        if (max !== null && beds > max) return false;
        return true;
      });
    }

    if (filter === 'price') {
      const min = priceMin ? Number(priceMin) : null;
      const max = priceMax ? Number(priceMax) : null;

      list = list.filter((l) => {
        const price = Number(l.price ?? 0);
        if (min !== null && price < min) return false;
        if (max !== null && price > max) return false;
        return true;
      });
    }

    if (filter === 'date') {
      list = list.filter((l) => isAvailableForRange(l, sDate, eDate));
    }

    // bookings show firstly, then follow normal order to show remaining listings
    list.sort((a, b) => {
      const aBooked = bookedIds.has(a.id);
      const bBooked = bookedIds.has(b.id);

      // booking 
      if (isLoggedIn && aBooked !== bBooked) {
        return aBooked ? -1 : 1;
      }

      // remaining
      if (filter === 'bedrooms') {
        const aBeds = Number(a.metadata?.numBeds ?? 0);
        const bBeds = Number(b.metadata?.numBeds ?? 0);
        if (aBeds !== bBeds) {
          return sortOrder === 'asc' ? aBeds - bBeds : bBeds - aBeds;
        }
      } else if (filter === 'price') {
        const aPrice = Number(a.price ?? 0);
        const bPrice = Number(b.price ?? 0);
        if (aPrice !== bPrice) {
          return sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
        }
      } else if (filter === 'date') {
        // which is more early to be avaiable shows firstly
        const aFirst = (a.availability?.[0]?.start) || '';
        const bFirst = (b.availability?.[0]?.start) || '';
        if (aFirst && bFirst && aFirst !== bFirst) {
          return sortOrder === 'asc'
            ? aFirst.localeCompare(bFirst)
            : bFirst.localeCompare(aFirst);
        }
      } else if (filter === 'rating') {
        const aRating = getAverageRating(a);
        const bRating = getAverageRating(b);
        if (aRating !== bRating) {
          return sortOrder === 'asc'
            ? aRating - bRating
            : bRating - aRating;
        }
      }

      // follow title to order
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      return aTitle.localeCompare(bTitle);
    });

    setDisplayedListings(list);
  }

  const handleSearchClick = () => {
    applySearch();
  };

  const handleClear = () => {
    setSearchText('');
    setActiveFilter('none');
    setMinBeds('');
    setMaxBeds('');
    setMinPrice('');
    setMaxPrice('');
    setStartDate('');
    setEndDate('');
    setOrder('asc');
    // clear all search content and reuse order rules
    applySearch(allListings, bookedListingIds, {
      searchText: '',
      activeFilter: 'none',
      order: 'asc',
      minBeds: '',
      maxBeds: '',
      minPrice: '',
      maxPrice: '',
      startDate: '',
      endDate: '',
    });
  };


  if (loading) {
    return (
      <div className={styles.container}>
        <div>Loading listings...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Explore AirBrB</h1>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* search panel */}
      <div className={styles.searchPanel}>
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            placeholder="Search by title or city..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <select
            className={styles.filterSelect}
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="none">No extra filter</option>
            <option value="bedrooms">Beds range</option>
            <option value="date">Date range</option>
            <option value="price">Price range</option>
            <option value="rating">Review rating</option>
          </select>

          {activeFilter !== 'none' && (
            <select
              className={styles.orderSelect}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          )}
        </div>

        {/* different filter */}
        {activeFilter === 'bedrooms' && (
          <div className={styles.searchRow}>
            <input
              className={styles.numericInput}
              type="number"
              placeholder="Min beds"
              value={minBeds}
              onChange={(e) => setMinBeds(e.target.value)}
            />
            <input
              className={styles.numericInput}
              type="number"
              placeholder="Max beds"
              value={maxBeds}
              onChange={(e) => setMaxBeds(e.target.value)}
            />
          </div>
        )}
