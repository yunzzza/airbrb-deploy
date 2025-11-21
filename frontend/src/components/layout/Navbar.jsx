import { Link, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useAuth } from '../../context/useAuth';

export default function Navbar() {
  const { auth, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  // logout
  const handleLogout = () => {
    logout();
    navigate('/');   
  };
    
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>

        {/* logo, redirect to main page */}
        <Link to="/" className={styles.logo}>
            AirBrB
        </Link>

        {/* buttons and user info */}
        <div className={styles.buttonGroup}>
          {isLoggedIn ? (
            <>
              {/* user email */}
              {auth.email && (
                <span className={styles.userEmail}>{auth.email}</span>
              )}

              {/* view all listings） */}
              <Link to="/" className={styles.navButton}>
                All listings
              </Link>

              {/* view hosted listings */}
              <Link to="/host/listings" className={styles.navButton}>
                My listings
              </Link>

              {/* Logout button */}
              <button
                type="button"
                className={styles.navButton}
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.navButton}>
                Login
              </Link>
              <Link to="/register" className={styles.navButton}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
