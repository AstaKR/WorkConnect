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
