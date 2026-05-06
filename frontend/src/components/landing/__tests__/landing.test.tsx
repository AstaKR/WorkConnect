import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../../../pages/LandingPage';

describe('LandingPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

  it('renders without crashing', () => {
    renderPage();
    expect(document.body).toBeTruthy();
  });

  it('renders the landing page wrapper', () => {
    const { container } = renderPage();
    expect(container.firstChild).toBeTruthy();
  });
});

import LandingNav from '../LandingNav';

describe('LandingNav', () => {
  const renderNav = () =>
    render(
      <MemoryRouter>
        <LandingNav />
      </MemoryRouter>
    );

  it('renders the WorkConnect brand name', () => {
    renderNav();
    expect(screen.getByText('WorkConnect')).toBeInTheDocument();
  });

  it('renders Sign In link pointing to /login', () => {
    renderNav();
    const signIn = screen.getByRole('link', { name: /sign in/i });
    expect(signIn).toHaveAttribute('href', '/login');
  });

  it('renders Get Started Free link pointing to /signup', () => {
    renderNav();
    const cta = screen.getByRole('link', { name: /get started free/i });
    expect(cta).toHaveAttribute('href', '/signup');
  });
});
