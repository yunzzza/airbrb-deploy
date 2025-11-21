import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { AuthContext } from '../context/AuthContext';

// mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// render Navbar
function renderWithAuth(ctxValue) {
  return render(
    <AuthContext.Provider value={ctxValue}>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('Navbar component', () => {
  it('shows Login & Sign up when logged out', () => {
    // simulate a logged-out user
    renderWithAuth({
      auth: { token: null, email: '' },
      isLoggedIn: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    // navbar should show Login and Sign up buttons
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign up/i)).toBeInTheDocument();
  });

  it('shows user email and logout when logged in', () => {
    // simulate a logged-in user
    renderWithAuth({
      auth: { token: 'abc', email: 'a@b.com' },
      isLoggedIn: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    // navbar should show the user email and a Logout button
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', () => {
    const mockLogout = vi.fn();
    // logged-in state as a logged in user
    renderWithAuth({
      auth: { token: 'abc', email: 'a@b.com' },
      isLoggedIn: true,
      login: vi.fn(),
      logout: mockLogout,
    });
    // click the Logout button
    fireEvent.click(screen.getByText(/Logout/i));
    // expect logout was triggered exactly once
    expect(mockLogout).toHaveBeenCalled();
  });
});
