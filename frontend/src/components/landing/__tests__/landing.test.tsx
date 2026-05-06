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

import HeroSection from '../HeroSection';

describe('HeroSection', () => {
  const renderHero = () =>
    render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>
    );

  it('renders the hero badge text', () => {
    renderHero();
    expect(screen.getByText(/open source.*ai-powered.*free forever/i)).toBeInTheDocument();
  });

  it('renders the gradient headline', () => {
    renderHero();
    expect(screen.getByText(/ai-powered workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/every kind of work/i)).toBeInTheDocument();
  });

  it('renders Get Started Free CTA linking to /signup', () => {
    renderHero();
    const links = screen.getAllByRole('link', { name: /get started free/i });
    expect(links[0]).toHaveAttribute('href', '/signup');
  });

  it('renders View on GitHub link', () => {
    renderHero();
    expect(screen.getByRole('link', { name: /view on github/i })).toBeInTheDocument();
  });

  it('renders the app preview URL', () => {
    renderHero();
    expect(screen.getByText('app.workconnect.io/dashboard')).toBeInTheDocument();
  });
});

import StatsBar from '../StatsBar';

describe('StatsBar', () => {
  it('renders all 4 stats', () => {
    render(<StatsBar />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('15+')).toBeInTheDocument();
  });

  it('shows custom roles messaging', () => {
    render(<StatsBar />);
    expect(screen.getByText(/roles & approval flows/i)).toBeInTheDocument();
    expect(screen.getByText(/you define who approves what/i)).toBeInTheDocument();
  });
});

import FeaturesSection from '../FeaturesSection';

describe('FeaturesSection', () => {
  it('renders the section heading', () => {
    render(<FeaturesSection />);
    expect(screen.getByText(/built for how real work gets done/i)).toBeInTheDocument();
  });

  it('renders all 6 feature cards', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Work Reports')).toBeInTheDocument();
    expect(screen.getByText('Kanban Board')).toBeInTheDocument();
    expect(screen.getByText('Team Calendar')).toBeInTheDocument();
    expect(screen.getByText('Custom Roles & Approvals')).toBeInTheDocument();
    expect(screen.getByText('Smart Dashboards')).toBeInTheDocument();
    expect(screen.getByText('Full Customization')).toBeInTheDocument();
  });
});

import AISection from '../AISection';

describe('AISection', () => {
  it('renders the AI section heading', () => {
    render(<AISection />);
    expect(screen.getByText(/your ai assistant/i)).toBeInTheDocument();
  });

  it('renders all 4 AI provider pills', () => {
    render(<AISection />);
    expect(screen.getByText(/claude.*anthropic/i)).toBeInTheDocument();
    expect(screen.getByText(/gpt-4.*openai/i)).toBeInTheDocument();
    expect(screen.getByText(/groq/i)).toBeInTheDocument();
    expect(screen.getByText(/gemini.*google/i)).toBeInTheDocument();
  });

  it('renders the chat preview with AI messages', () => {
    render(<AISection />);
    expect(screen.getByText(/how has my productivity/i)).toBeInTheDocument();
    expect(screen.getByText(/23 of 25 reports/i)).toBeInTheDocument();
  });
});

import AudienceSection from '../AudienceSection';

describe('AudienceSection', () => {
  it('renders the section heading', () => {
    render(<AudienceSection />);
    expect(screen.getByText(/built for anyone who works/i)).toBeInTheDocument();
  });

  it('renders all 5 audience cards', () => {
    render(<AudienceSection />);
    expect(screen.getByText('Business Owners & Managers')).toBeInTheDocument();
    expect(screen.getByText('Individuals & Self-improvers')).toBeInTheDocument();
    expect(screen.getByText('Developers & IT Teams')).toBeInTheDocument();
    expect(screen.getByText('Remote & Distributed Teams')).toBeInTheDocument();
    expect(screen.getByText('Startups & Small Teams')).toBeInTheDocument();
  });

  it('renders real-world scenario names', () => {
    render(<AudienceSection />);
    expect(screen.getByText(/ahmed/i)).toBeInTheDocument();
    expect(screen.getByText(/riya/i)).toBeInTheDocument();
    expect(screen.getByText(/tomas/i)).toBeInTheDocument();
  });
});

import FinalCTA from '../FinalCTA';

describe('FinalCTA', () => {
  it('renders the CTA heading', () => {
    render(<MemoryRouter><FinalCTA /></MemoryRouter>);
    expect(screen.getByText(/ready to take control/i)).toBeInTheDocument();
  });

  it('renders Get Started Free button linking to /signup', () => {
    render(<MemoryRouter><FinalCTA /></MemoryRouter>);
    const links = screen.getAllByRole('link', { name: /get started free/i });
    expect(links[0]).toHaveAttribute('href', '/signup');
  });

  it('renders GitHub source link', () => {
    render(<MemoryRouter><FinalCTA /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /view source on github/i })).toBeInTheDocument();
  });
});

import LandingFooter from '../LandingFooter';

describe('LandingFooter', () => {
  it('renders the brand name', () => {
    render(<LandingFooter />);
    expect(screen.getByText('WorkConnect')).toBeInTheDocument();
  });

  it('renders use-case footer links', () => {
    render(<LandingFooter />);
    expect(screen.getByText('For Individuals')).toBeInTheDocument();
    expect(screen.getByText('For Teams')).toBeInTheDocument();
    expect(screen.getByText('For Developers')).toBeInTheDocument();
  });

  it('renders MIT license badge', () => {
    render(<LandingFooter />);
    expect(screen.getByText('MIT License')).toBeInTheDocument();
  });
});
