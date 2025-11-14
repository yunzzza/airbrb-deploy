import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // handle submit
  const handleSubmit = (e) => {
    e.preventDefault(); 

    // check if input is empty
    if (!email || !password) {
      setError('Email or Password can not be empty');
      return;
    }

    // if email and password are wrong
    setError('email or password are wrong');
  };

  return (
    <div style={{ maxWidth: '360px', margin: '40px auto' }}>
      <h1>Login</h1>

      {/* show error information */}
      {error && (
        <div style={{
          background: '#ffe0e0',
          color: '#900',
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* login form */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Input your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Password</label>
          <input
            type="password"
            placeholder="Input your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          login
        </button>
      </form>
    </div>
  );
}
