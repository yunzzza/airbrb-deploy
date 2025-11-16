import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // handle submit
  const handleSubmit = async (e) => {
    e.preventDefault(); 

    if (!email || !password) {
      setError('Email or Password cannot be empty');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
        await login(email, password);   //use login in authcontext, set token
        // login successfully, redirect to main page
        navigate('/');
      } catch (err) {
        setError(err.message || 'Login failed');
      } finally {
        setSubmitting(false);
      }

  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Login</h1>

      {/* show error */}
      {error && <div className={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input
            type="email"
            className={styles.input}
            placeholder="Input your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <input
            type="password"
            className={styles.input}
            placeholder="Input your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </div>

        <button type="submit" className={styles.button}>
          Login
        </button>
      </form>
    </div>
  );
}
