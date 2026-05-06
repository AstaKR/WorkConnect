import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Signup from '../Signup';
import IndividualDashboard from '../IndividualDashboard';

// Mock framer-motion to avoid animation issues in jsdom
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: new Proxy({}, {
      get: (_: unknown, tag: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ({ children, ...props }: any) => React.createElement(tag, props, children);
      },
    }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

// Mock axios to prevent real HTTP calls
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: {} }),
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

// Mock the internal axios instance used in IndividualDashboard
vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: { response: 'Great work this week!' } }),
  },
}));

// Mock useAuthStore for IndividualDashboard
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 1,
      full_name: 'Riya Sharma',
      email: 'riya@test.com',
      role: 'employee',
      account_type: 'individual',
      preferences: {},
    },
    branding: { name: '', logo: '' },
  }),
}));

// ── Signup tests ──────────────────────────────────────────────────────────────
describe('Signup — two-path layout', () => {
  const renderSignup = () =>
    render(<MemoryRouter><Signup /></MemoryRouter>);

  it('renders without crashing', () => {
    renderSignup();
    expect(document.body).toBeTruthy();
  });

  it('shows both type picker cards', () => {
    renderSignup();
    expect(screen.getByTestId('type-org')).toBeInTheDocument();
    expect(screen.getByTestId('type-individual')).toBeInTheDocument();
  });

  it('shows placeholder when no type is selected', () => {
    renderSignup();
    expect(screen.getByTestId('form-placeholder')).toBeInTheDocument();
  });

  it('org form appears when Organization card is clicked', () => {
    renderSignup();
    expect(screen.queryByTestId('org-form')).not.toBeInTheDocument();
    act(() => { fireEvent.click(screen.getByTestId('type-org')); });
    expect(screen.getByTestId('org-form')).toBeInTheDocument();
  });

  it('individual form appears when Personal card is clicked', () => {
    renderSignup();
    expect(screen.queryByTestId('individual-form')).not.toBeInTheDocument();
    act(() => { fireEvent.click(screen.getByTestId('type-individual')); });
    expect(screen.getByTestId('individual-form')).toBeInTheDocument();
  });

  it('org form does not show role field visible to individual users', () => {
    renderSignup();
    act(() => { fireEvent.click(screen.getByTestId('type-individual')); });
    expect(screen.queryByText('Your Role')).not.toBeInTheDocument();
  });

  it('org form shows role chips (Employee, Manager, CEO)', () => {
    renderSignup();
    act(() => { fireEvent.click(screen.getByTestId('type-org')); });
    expect(screen.getByText('Employee')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();
  });

  it('individual form shows focus area chips', () => {
    renderSignup();
    act(() => { fireEvent.click(screen.getByTestId('type-individual')); });
    expect(screen.getByText('💼 Work output')).toBeInTheDocument();
    expect(screen.getByText('🎯 Daily goals')).toBeInTheDocument();
  });

  it('individual form does not show department field', () => {
    renderSignup();
    act(() => { fireEvent.click(screen.getByTestId('type-individual')); });
    expect(screen.queryByPlaceholderText(/engineering.*finance/i)).not.toBeInTheDocument();
  });

  it('switching from org to individual hides org form and shows individual form', () => {
    renderSignup();
    act(() => { fireEvent.click(screen.getByTestId('type-org')); });
    expect(screen.getByTestId('org-form')).toBeInTheDocument();
    act(() => { fireEvent.click(screen.getByTestId('type-individual')); });
    expect(screen.queryByTestId('org-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('individual-form')).toBeInTheDocument();
  });

  it('sign in link points to /login', () => {
    renderSignup();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });
});

// ── IndividualDashboard tests ─────────────────────────────────────────────────
describe('IndividualDashboard', () => {
  const renderDashboard = () =>
    render(<MemoryRouter><IndividualDashboard /></MemoryRouter>);

  it('renders without crashing', () => {
    renderDashboard();
    expect(document.body).toBeTruthy();
  });

  it('shows a greeting with the user first name', () => {
    renderDashboard();
    expect(screen.getByText(/riya/i)).toBeInTheDocument();
  });

  it('renders the AI insight card', () => {
    renderDashboard();
    expect(screen.getByTestId('ai-insight-card')).toBeInTheDocument();
  });

  it("renders Log today's work quick action link to /employee/report/new", () => {
    renderDashboard();
    const link = screen.getByRole('link', { name: /log today/i });
    expect(link).toHaveAttribute('href', '/employee/report/new');
  });

  it('renders Open Kanban quick action link to /kanban', () => {
    renderDashboard();
    const link = screen.getByRole('link', { name: /open kanban/i });
    expect(link).toHaveAttribute('href', '/kanban');
  });

  it('renders Report history link to /employee/history', () => {
    renderDashboard();
    const links = screen.getAllByRole('link', { name: /history|view all/i });
    const historyLinks = links.filter(l => l.getAttribute('href') === '/employee/history');
    expect(historyLinks.length).toBeGreaterThan(0);
  });
});
