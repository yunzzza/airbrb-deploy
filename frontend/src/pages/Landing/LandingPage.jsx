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
