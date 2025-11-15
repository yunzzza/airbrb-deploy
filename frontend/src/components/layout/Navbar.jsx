import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>

        {/* Logo */}
        <Link to="/" className={styles.logo}>
          AirBrB
        </Link>

        {/* login and sign up buttons */}
        <div className={styles.buttonGroup}>
          <Link to="/login" className={styles.navButton}>
            Login
          </Link>

          <Link to="/register" className={styles.navButton}>
            Sign up
          </Link>
        </div>

      </div>
    </nav>
  );
}
