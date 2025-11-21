import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/Auth/LoginPage';
import { AuthContext } from '../context/AuthContext';

// mock implementation of useNavigate 
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// render LoginPage with a given auth context value
function renderLogin(authValue) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('LoginPage component', () => {
  it('shows error when email or password missing', () => {
    const mockLogin = vi.fn();

    // render the page with a logged out state
    renderLogin({
      auth: { token: null, email: '' },
      isLoggedIn: false,
      login: mockLogin,
      logout: vi.fn(),
    });

    // click the Login button without filling fields
    fireEvent.click(
      screen.getByRole('button', { name: /Login/i })
    );

    // expect an error message and ensure login was not called
    expect(
      screen.getByText(/Email or Password cannot be empty/i)
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login and navigates on success', async () => {
    const mockLogin = vi.fn().mockResolvedValue({});

    renderLogin({
      auth: { token: null, email: '' },
      isLoggedIn: false,
      login: mockLogin,
      logout: vi.fn(),
    });

    // fill email and password
    fireEvent.change(screen.getByPlaceholderText(/Input your email/i), {
      target: { value: 'a@b.com' },
    });

    fireEvent.change(screen.getByPlaceholderText(/Input your password/i), {
      target: { value: '123456' },
    });

    // submit the login form
    fireEvent.click(
      screen.getByRole('button', { name: /Login/i })
    );

    // waitFor ensures that we wait for async login + navigate to finish
    await waitFor(() => {
      // login should be called 
      expect(mockLogin).toHaveBeenCalledWith('a@b.com', '123456');
      // after successful login, the user should be redirected to the home page
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
