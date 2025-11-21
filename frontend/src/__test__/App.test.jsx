import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { AuthContext } from '../context/AuthContext';

// mock auth context value used for all tests in this file.
const mockAuth = {
  auth: { token: null, email: '' },
  isLoggedIn: false,
  login: vi.fn(),
  logout: vi.fn(),
};

describe('App routing', () => {
  it('renders Navbar on home page', () => {
    // simulate the browser being at "/"
    window.history.pushState({}, 'Home', '/');

    // render the whole App
    render(
      <AuthContext.Provider value={mockAuth}>
        <App />
      </AuthContext.Provider>
    );

    // expect the Navbar 
    expect(screen.getByText(/AirBrB/i)).toBeInTheDocument();
  });

  it('renders Login page on /login', () => {
    // simulate the browser being at "/login"
    window.history.pushState({}, 'Login', '/login');

    render(
      <AuthContext.Provider value={mockAuth}>
        <App />
      </AuthContext.Provider>
    );

    // expect Login page 
    expect(
      screen.getByRole('heading', { name: /Login/i })
    ).toBeInTheDocument();
  });
});
