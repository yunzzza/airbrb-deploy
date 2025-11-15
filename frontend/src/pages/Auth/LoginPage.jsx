import { useState } from 'react';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // handle submit
  const handleSubmit = (e) => {
    e.preventDefault(); 

    if (!email || !password) {
      setError('Email or Password cannot be empty');
      return;
    }

    setError('Email or password are incorrect');
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
          />
        </div>

        <button type="submit" className={styles.button}>
          Login
        </button>
      </form>
    </div>
  );
}
