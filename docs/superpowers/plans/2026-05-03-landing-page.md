# WorkConnect Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public dark-premium landing page at `/` that showcases WorkConnect to all visitor types before they sign up.

**Architecture:** Pure frontend — no backend changes. A new `LandingPage` component assembles 8 sub-components (`LandingNav`, `HeroSection`, `StatsBar`, `FeaturesSection`, `AISection`, `AudienceSection`, `FinalCTA`, `LandingFooter`) from a new `src/components/landing/` directory. The existing `/` route (currently a redirect to `/login`) is replaced with `<LandingPage />`.

**Tech Stack:** React 19 · TypeScript · Tailwind CSS v3 · Framer Motion · Lucide React · React Router v7

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Modify | `frontend/vite.config.ts` | Add vitest config |
| Modify | `frontend/package.json` | Add test script |
| Create | `frontend/src/test/setup.ts` | Testing library DOM matchers |
| Modify | `frontend/src/constants.ts` | Add `GITHUB_URL` |
| Create | `frontend/src/pages/LandingPage.tsx` | Page root — assembles all sections |
| Modify | `frontend/src/App.tsx` | Replace `/` redirect with `<LandingPage />` |
| Create | `frontend/src/components/landing/LandingNav.tsx` | Sticky glass nav with scroll border |
| Create | `frontend/src/components/landing/HeroSection.tsx` | Cinematic hero + app preview mockup |
| Create | `frontend/src/components/landing/StatsBar.tsx` | 4-stat strip |
| Create | `frontend/src/components/landing/FeaturesSection.tsx` | 6-card feature grid |
| Create | `frontend/src/components/landing/AISection.tsx` | Split copy + chat preview |
| Create | `frontend/src/components/landing/AudienceSection.tsx` | 5 use-case cards (3+2 layout) |
| Create | `frontend/src/components/landing/FinalCTA.tsx` | Centered CTA block |
| Create | `frontend/src/components/landing/LandingFooter.tsx` | 4-column dark footer |
| Create | `frontend/src/components/landing/__tests__/landing.test.tsx` | Smoke tests for all sections |

---

## Task 1: Test infrastructure + GITHUB_URL constant

**Files:**
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/package.json` (scripts section only)
- Create: `frontend/src/test/setup.ts`
- Modify: `frontend/src/constants.ts`

- [ ] **Step 1: Install test dependencies**

Run from `frontend/` directory:
```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN/frontend"
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```
Expected: packages install without error, `package-lock.json` updated.

- [ ] **Step 2: Add vitest config to vite.config.ts**

Replace the full contents of `frontend/vite.config.ts` with:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 3: Add test script to package.json**

In `frontend/package.json`, add `"test": "vitest"` to the `"scripts"` object:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest"
},
```

- [ ] **Step 4: Create test setup file**

Create `frontend/src/test/setup.ts`:
```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Add GITHUB_URL to constants**

Replace the full contents of `frontend/src/constants.ts` with:
```ts
export const APP_NAME = 'WorkConnect';
export const COMPANY_NAME = 'Nexaflow Technologies';
export const APP_TAGLINE = 'Smart Work Management Platform';
export const APP_VERSION = '2.0';
export const GITHUB_URL = 'https://github.com/workconnect/workconnect';
```

- [ ] **Step 6: Verify test runner works**

Run:
```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN/frontend"
npm test -- --run
```
Expected: `No test files found` or 0 tests run — **no errors**. If you see a setup/config error, fix it before continuing.

- [ ] **Step 7: Commit**

```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN"
git add frontend/vite.config.ts frontend/package.json frontend/package-lock.json frontend/src/test/setup.ts frontend/src/constants.ts
git commit -m "chore: add vitest test setup and GITHUB_URL constant"
```

---

## Task 2: LandingPage route scaffold

**Files:**
- Create: `frontend/src/pages/LandingPage.tsx`
- Modify: `frontend/src/App.tsx` (line 65)
- Create: `frontend/src/components/landing/__tests__/landing.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/landing/__tests__/landing.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN/frontend"
npm test -- --run
```
Expected: FAIL — `Cannot find module '../../../pages/LandingPage'`

- [ ] **Step 3: Create LandingPage.tsx skeleton**

Create `frontend/src/pages/LandingPage.tsx`:
```tsx
export default function LandingPage() {
  return (
    <div className="bg-[#070d1a] min-h-screen" data-testid="landing-page">
      {/* sections will be added in later tasks */}
    </div>
  );
}
```

- [ ] **Step 4: Update the App.tsx route**

In `frontend/src/App.tsx`, find line 65:
```tsx
<Route path="/" element={<Navigate to="/login" replace />} />
```
Replace it with:
```tsx
<Route path="/" element={<LandingPage />} />
```
And add the import at the top of the imports block:
```tsx
import LandingPage from './pages/LandingPage';
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN/frontend"
npm test -- --run
```
Expected: PASS — 2 tests passing.

- [ ] **Step 6: Smoke-check in browser**

```bash
npm run dev
```
Open `http://localhost:5173/`. Expected: dark background page with no content (no redirect to `/login`). Then check `http://localhost:5173/login` still works.

- [ ] **Step 7: Commit**

```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN"
git add frontend/src/pages/LandingPage.tsx frontend/src/App.tsx frontend/src/components/landing/__tests__/landing.test.tsx
git commit -m "feat: scaffold LandingPage at / route"
```

---

## Task 3: LandingNav

**Files:**
- Create: `frontend/src/components/landing/LandingNav.tsx`
- Modify: `frontend/src/components/landing/__tests__/landing.test.tsx` (add nav tests)
- Modify: `frontend/src/pages/LandingPage.tsx` (add nav)

- [ ] **Step 1: Write the failing tests**

Add to `frontend/src/components/landing/__tests__/landing.test.tsx` — append after the existing `describe` block:
```tsx
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
```

- [ ] **Step 2: Run to verify failure**

```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN/frontend"
npm test -- --run
```
Expected: FAIL — `Cannot find module '../LandingNav'`

- [ ] **Step 3: Create LandingNav.tsx**

Create `frontend/src/components/landing/LandingNav.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import { GITHUB_URL } from '../../constants';

const NAV_LINKS = ['Features', 'Use Cases', 'AI', 'Docs'];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 bg-[#070d1a]/85 backdrop-blur-xl h-16 flex items-center justify-between px-10 transition-all duration-200 ${
        scrolled ? 'border-b border-white/[0.06]' : ''
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-[0_0_18px_rgba(99,102,241,0.5)]">
          W
        </div>
        <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent font-extrabold text-base tracking-tight">
          WorkConnect
        </span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-7">
        {NAV_LINKS.map(link => (
          <a
            key={link}
            href={`#${link.toLowerCase().replace(' ', '-')}`}
            className="text-slate-400 text-sm font-medium hover:text-slate-100 transition-colors duration-150"
          >
            {link}
          </a>
        ))}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-slate-400 text-sm font-medium hover:text-slate-100 transition-colors duration-150"
        >
          <Github size={14} />
          GitHub
        </a>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        <Link
          to="/login"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 border border-white/[0.08] bg-white/[0.03] hover:border-indigo-500/50 hover:text-indigo-400 transition-all duration-150"
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className="px-5 py-2.5 rounded-[9px] text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_28px_rgba(99,102,241,0.55)] transition-all duration-150"
        >
          Get Started Free
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Add LandingNav to LandingPage.tsx**

Replace the full contents of `frontend/src/pages/LandingPage.tsx`:
```tsx
import LandingNav from '../components/landing/LandingNav';

export default function LandingPage() {
  return (
    <div className="bg-[#070d1a] min-h-screen" data-testid="landing-page">
      <LandingNav />
    </div>
  );
}
```

- [ ] **Step 5: Run tests — all pass**

```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN/frontend"
npm test -- --run
```
Expected: PASS — 5 tests passing.

- [ ] **Step 6: Commit**

```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN"
git add frontend/src/components/landing/LandingNav.tsx frontend/src/pages/LandingPage.tsx frontend/src/components/landing/__tests__/landing.test.tsx
git commit -m "feat: add LandingNav with sticky scroll behavior"
```

---

## Task 4: HeroSection

**Files:**
- Create: `frontend/src/components/landing/HeroSection.tsx`
- Modify: `frontend/src/components/landing/__tests__/landing.test.tsx`
- Modify: `frontend/src/pages/LandingPage.tsx`

- [ ] **Step 1: Write the failing tests**

Append to the test file:
```tsx
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
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run
```
Expected: FAIL — `Cannot find module '../HeroSection'`

- [ ] **Step 3: Create HeroSection.tsx**

Create `frontend/src/components/landing/HeroSection.tsx`:
```tsx
import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GITHUB_URL } from '../../constants';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

export default function HeroSection() {
  return (
    <section
      className="relative min-h-[95vh] flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%), #070d1a',
      }}
    >
      {/* Background orbs */}
      <div
        className="pointer-events-none absolute -top-48 -left-36 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-36 -right-24 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 60%)' }}
      />
      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage:
            'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
        }}
      />

      {/* Badge */}
      <motion.div
        {...fadeUp(0)}
        className="relative z-10 inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-1.5 text-xs font-bold text-indigo-300 mb-8 tracking-wide"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-pulse" />
        Open Source · AI-Powered · Free Forever
      </motion.div>

      {/* Headline */}
      <motion.h1
        {...fadeUp(0.1)}
        className="relative z-10 font-black leading-[1.06] tracking-[-2.5px] text-slate-100 max-w-[820px] mb-4"
        style={{ fontSize: 'clamp(38px, 5.5vw, 72px)' }}
      >
        The{' '}
        <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          AI-powered workspace
        </span>
        <br />
        for every kind of work
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        {...fadeUp(0.2)}
        className="relative z-10 text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed"
      >
        Track work, manage tasks, run teams, and grow — all in one open-source platform built
        around how you actually work.
      </motion.p>

      {/* CTAs */}
      <motion.div
        {...fadeUp(0.3)}
        className="relative z-10 flex items-center gap-3.5 justify-center flex-wrap mb-16"
      >
        <Link
          to="/signup"
          className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-[0_0_30px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(99,102,241,0.55)] transition-all duration-200"
        >
          🚀 Get Started Free
        </Link>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold text-slate-400 bg-white/[0.04] border border-white/10 backdrop-blur-md hover:border-indigo-500/40 hover:text-indigo-400 transition-all duration-200"
        >
          <Github size={15} />
          View on GitHub
        </a>
      </motion.div>

      {/* App Preview */}
      <motion.div
        {...fadeUp(0.4)}
        className="relative z-10 w-full max-w-[960px] mx-auto"
      >
        <AppPreviewFrame />
        <div
          className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-3/4 h-20 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.25) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
      </motion.div>
    </section>
  );
}

function AppPreviewFrame() {
  const kpis = [
    { color: 'rgba(99,102,241,0.15)', value: '24', label: 'Team Members' },
    { color: 'rgba(6,182,212,0.15)', value: '156', label: 'Reports This Month' },
    { color: 'rgba(34,197,94,0.15)', value: '94%', label: 'Submission Rate' },
    { color: 'rgba(245,158,11,0.15)', value: '12', label: 'Pending Approval' },
  ];

  const barHeights = [40, 60, 82, 55, 95, 70, 100];

  return (
    <div
      className="bg-[#0d1525] rounded-[18px] overflow-hidden border border-indigo-500/15"
      style={{
        boxShadow:
          '0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Title bar */}
      <div className="bg-[#111827] px-4 py-3 flex items-center gap-2 border-b border-white/[0.04]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="flex-1 bg-white/[0.04] rounded-md py-1 px-3 text-[11px] text-slate-600 text-center border border-white/[0.04]">
          app.workconnect.io/dashboard
        </div>
      </div>

      {/* Body */}
      <div className="grid h-[320px]" style={{ gridTemplateColumns: '200px 1fr' }}>
        {/* Sidebar */}
        <div className="bg-[#0d1525] border-r border-white/[0.05] p-3 flex flex-col gap-0.5 overflow-hidden">
          <div className="flex items-center gap-2 px-2.5 py-2 mb-2">
            <div className="w-6 h-6 rounded-[7px] bg-gradient-to-br from-indigo-500 to-cyan-500 flex-shrink-0" />
            <span className="text-slate-200 font-bold text-xs">WorkConnect</span>
          </div>
          <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest px-2.5 pb-1">Dashboard</p>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] bg-indigo-500/[0.12] border border-indigo-500/15 text-indigo-300 text-[11px] font-medium">📊 CEO Dashboard</div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 text-[11px]">👤 My Dashboard</div>
          <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest px-2.5 pt-2 pb-1">Workspace</p>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 text-[11px]">📝 Work Reports</div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 text-[11px]">📋 Kanban Board</div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 text-[11px]">📅 Calendar</div>
          <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest px-2.5 pt-2 pb-1">Management</p>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 text-[11px]">👥 Team</div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 text-[11px]">🛡️ Roles & Approvals</div>
        </div>

        {/* Main content */}
        <div className="bg-[#0f172a] p-4 overflow-hidden">
          <p className="text-[13px] font-extrabold text-slate-200 mb-0.5">CEO Dashboard</p>
          <p className="text-[9px] text-slate-700 mb-3.5">Sunday, May 3, 2026 · Company overview</p>
          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {kpis.map(k => (
              <div key={k.label} className="bg-white/[0.03] rounded-[10px] p-2.5 border border-white/[0.05]">
                <div className="w-5 h-5 rounded-[5px] mb-1.5" style={{ background: k.color }} />
                <p className="text-[15px] font-black text-slate-200 leading-none">{k.value}</p>
                <p className="text-[9px] text-slate-700 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
          {/* Charts row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/[0.03] rounded-[10px] p-2.5 border border-white/[0.05]">
              <p className="text-[9px] font-bold text-slate-600 mb-2">Weekly Submissions</p>
              <div className="flex items-end gap-0.5 h-[54px]">
                {barHeights.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}%`,
                      background:
                        h >= 80
                          ? 'linear-gradient(180deg,#818cf8,#6366f1)'
                          : 'rgba(99,102,241,0.35)',
                      boxShadow: h >= 80 ? '0 0 8px rgba(99,102,241,0.5)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="bg-white/[0.03] rounded-[10px] p-2.5 border border-white/[0.05]">
              <p className="text-[9px] font-bold text-slate-600 mb-1.5">AI Insights</p>
              <p className="text-[9px] text-slate-600 leading-relaxed mb-1.5">
                "Productivity up 18% this week. 3 members have pending approvals."
              </p>
              <span className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-0.5 text-[9px] font-bold text-indigo-300">
                ✨ AI Generated
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add HeroSection to LandingPage.tsx**

Replace full contents of `frontend/src/pages/LandingPage.tsx`:
```tsx
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';

export default function LandingPage() {
  return (
    <div className="bg-[#070d1a] min-h-screen" data-testid="landing-page">
      <LandingNav />
      <HeroSection />
    </div>
  );
}
```

- [ ] **Step 5: Run tests — all pass**

```bash
npm test -- --run
```
Expected: PASS — 10 tests passing.

- [ ] **Step 6: Commit**

```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN"
git add frontend/src/components/landing/HeroSection.tsx frontend/src/pages/LandingPage.tsx frontend/src/components/landing/__tests__/landing.test.tsx
git commit -m "feat: add HeroSection with cinematic hero and app preview"
```

---

## Task 5: StatsBar

**Files:**
- Create: `frontend/src/components/landing/StatsBar.tsx`
- Modify: `frontend/src/components/landing/__tests__/landing.test.tsx`
- Modify: `frontend/src/pages/LandingPage.tsx`

- [ ] **Step 1: Write the failing tests**

Append to the test file:
```tsx
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
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run
```
Expected: FAIL — `Cannot find module '../StatsBar'`

- [ ] **Step 3: Create StatsBar.tsx**

Create `frontend/src/components/landing/StatsBar.tsx`:
```tsx
const STATS = [
  { value: '100%', label: 'Open Source & Free', sub: null },
  { value: '4', label: 'AI Providers', sub: 'Claude · GPT-4 · Groq · Gemini' },
  { value: 'Custom', label: 'Roles & Approval Flows', sub: 'You define who approves what' },
  { value: '15+', label: 'Themes & Layouts', sub: 'Make it yours' },
] as const;

export default function StatsBar() {
  return (
    <div className="border-t border-white/[0.05] border-b border-white/[0.05] bg-white/[0.02] py-12 px-8">
      <div className="max-w-[980px] mx-auto grid grid-cols-4 gap-4 text-center">
        {STATS.map((s, i) => (
          <div key={s.label} className={i < 3 ? 'border-r border-white/[0.06] pr-4' : ''}>
            <p className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent tracking-tight leading-none">
              {s.value}
            </p>
            <p className="text-slate-500 text-sm mt-1.5">{s.label}</p>
            {s.sub && <p className="text-slate-700 text-[11px] mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add StatsBar to LandingPage.tsx**

Replace full contents of `frontend/src/pages/LandingPage.tsx`:
```tsx
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import StatsBar from '../components/landing/StatsBar';

export default function LandingPage() {
  return (
    <div className="bg-[#070d1a] min-h-screen" data-testid="landing-page">
      <LandingNav />
      <HeroSection />
      <StatsBar />
    </div>
  );
}
```

- [ ] **Step 5: Run tests — all pass**

```bash
npm test -- --run
```
Expected: PASS — 12 tests passing.

- [ ] **Step 6: Commit**

```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN"
git add frontend/src/components/landing/StatsBar.tsx frontend/src/pages/LandingPage.tsx frontend/src/components/landing/__tests__/landing.test.tsx
git commit -m "feat: add StatsBar with custom roles messaging"
```

---

## Task 6: FeaturesSection

**Files:**
- Create: `frontend/src/components/landing/FeaturesSection.tsx`
- Modify: `frontend/src/components/landing/__tests__/landing.test.tsx`
- Modify: `frontend/src/pages/LandingPage.tsx`

- [ ] **Step 1: Write the failing tests**

Append to the test file:
```tsx
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
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run
```
Expected: FAIL — `Cannot find module '../FeaturesSection'`

- [ ] **Step 3: Create FeaturesSection.tsx**

Create `frontend/src/components/landing/FeaturesSection.tsx`:
```tsx
const FEATURES = [
  {
    icon: '📝',
    title: 'Work Reports',
    desc: 'Log daily activities. Managers review and approve. Full history with filters and export.',
  },
  {
    icon: '📋',
    title: 'Kanban Board',
    desc: 'Visual task management with drag-and-drop. Track work across custom stages in real time.',
  },
  {
    icon: '📅',
    title: 'Team Calendar',
    desc: 'Events, deadlines, and meetings with monthly/weekly views and team-wide visibility.',
  },
  {
    icon: '🛡️',
    title: 'Custom Roles & Approvals',
    desc: 'Create any role structure you need. Define who can view, submit, and approve — with multi-step approval chains.',
  },
  {
    icon: '📊',
    title: 'Smart Dashboards',
    desc: 'Real-time KPIs, personal progress charts, and team performance views — tailored to each role.',
  },
  {
    icon: '🎨',
    title: 'Full Customization',
    desc: '15+ themes, 3 layout modes, custom colors. Every workspace feels personal.',
  },
] as const;

export default function FeaturesSection() {
  return (
    <section id="features" className="py-[90px] px-8 max-w-[1040px] mx-auto">
      <div className="text-center">
        <span className="inline-block bg-indigo-500/[0.08] text-indigo-300 border border-indigo-500/20 rounded-full px-4 py-1 text-[11px] font-bold tracking-widest uppercase mb-4">
          Everything you need
        </span>
        <h2
          className="font-black tracking-[-1.5px] text-slate-100 mb-3.5 leading-[1.12]"
          style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}
        >
          Built for how real work gets done
        </h2>
        <p className="text-base text-slate-500 max-w-[520px] mx-auto leading-relaxed">
          From daily logs to team oversight — WorkConnect adapts to your workflow, not the other
          way around.
        </p>
      </div>
      <div
        className="mt-14 rounded-[20px] overflow-hidden border border-white/[0.05]"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px' }}
      >
        {FEATURES.map(f => (
          <div
            key={f.title}
            className="bg-white/[0.02] p-7 hover:bg-indigo-500/[0.05] transition-colors duration-200"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 bg-white/[0.04] border border-white/[0.06]">
              {f.icon}
            </div>
            <h3 className="text-[15px] font-bold text-slate-200 mb-2">{f.title}</h3>
            <p className="text-[13px] text-slate-500 leading-[1.55]">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add FeaturesSection to LandingPage.tsx**

Replace full contents of `frontend/src/pages/LandingPage.tsx`:
```tsx
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import StatsBar from '../components/landing/StatsBar';
import FeaturesSection from '../components/landing/FeaturesSection';

export default function LandingPage() {
  return (
    <div className="bg-[#070d1a] min-h-screen" data-testid="landing-page">
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
    </div>
  );
}
```

- [ ] **Step 5: Run tests — all pass**

```bash
npm test -- --run
```
Expected: PASS — 14 tests passing.

- [ ] **Step 6: Commit**

```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN"
git add frontend/src/components/landing/FeaturesSection.tsx frontend/src/pages/LandingPage.tsx frontend/src/components/landing/__tests__/landing.test.tsx
git commit -m "feat: add FeaturesSection with 6-card grid"
```

---

## Task 7: AISection

**Files:**
- Create: `frontend/src/components/landing/AISection.tsx`
- Modify: `frontend/src/components/landing/__tests__/landing.test.tsx`
- Modify: `frontend/src/pages/LandingPage.tsx`

- [ ] **Step 1: Write the failing tests**

Append to the test file:
```tsx
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
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run
```
Expected: FAIL — `Cannot find module '../AISection'`

- [ ] **Step 3: Create AISection.tsx**

Create `frontend/src/components/landing/AISection.tsx`:
```tsx
const PROVIDERS = [
  '🤖 Claude (Anthropic)',
  '✨ GPT-4 (OpenAI)',
  '⚡ Groq (Ultra-fast)',
  '🧠 Gemini (Google)',
] as const;

type Message = { role: 'user' | 'ai'; text: string };

const MESSAGES: Message[] = [
  { role: 'user', text: 'How has my productivity looked this month?' },
  {
    role: 'ai',
    text: "You've submitted 23 of 25 reports — 92% rate. Trending 14% above your monthly average. 🎯",
  },
  { role: 'user', text: 'What should I focus on next week?' },
  {
    role: 'ai',
    text: '3 overdue tasks on Kanban + Friday deadline for Q2 report. Want me to draft a weekly plan?',
  },
];

export default function AISection() {
  return (
    <section
      id="ai"
      className="relative py-[90px] px-8 overflow-hidden"
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px]"
        style={{
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-[1000px] mx-auto grid grid-cols-2 gap-[70px] items-center">
        {/* Copy */}
        <div>
          <span className="inline-block bg-indigo-500/[0.08] text-indigo-300 border border-indigo-500/20 rounded-full px-4 py-1 text-[11px] font-bold tracking-widest uppercase mb-4">
            AI-Powered
          </span>
          <h2
            className="font-black tracking-[-1.5px] text-slate-100 mb-4 leading-[1.12]"
            style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}
          >
            Your AI assistant.
            <br />
            Always in context.
          </h2>
          <p className="text-base text-slate-500 leading-relaxed">
            Ask about team performance, get work summaries, generate self-improvement insights,
            or automate repetitive analysis — without leaving your workspace.
          </p>
          <div className="flex gap-2 flex-wrap mt-7">
            {PROVIDERS.map(p => (
              <span
                key={p}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-xs font-semibold text-slate-500"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Chat preview */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-[18px] p-6 flex flex-col gap-3.5">
          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">
            AI Assistant
          </p>
          {MESSAGES.map((m, i) => (
            <div
              key={i}
              className={`flex gap-2.5 items-start ${m.role === 'ai' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-[8px] flex-shrink-0 flex items-center justify-center text-[11px] font-bold ${
                  m.role === 'ai'
                    ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-[0_0_10px_rgba(99,102,241,0.4)] text-white'
                    : 'bg-white/[0.06] border border-white/[0.08] text-slate-400'
                }`}
              >
                {m.role === 'ai' ? '✦' : 'K'}
              </div>
              <div
                className={`rounded-[10px] px-3.5 py-2.5 text-xs leading-relaxed max-w-[230px] ${
                  m.role === 'ai'
                    ? 'bg-indigo-500/[0.12] border border-indigo-500/20 text-indigo-200'
                    : 'bg-white/[0.05] border border-white/[0.07] text-slate-400'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add AISection to LandingPage.tsx**

Replace full contents of `frontend/src/pages/LandingPage.tsx`:
```tsx
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import StatsBar from '../components/landing/StatsBar';
import FeaturesSection from '../components/landing/FeaturesSection';
import AISection from '../components/landing/AISection';

export default function LandingPage() {
  return (
    <div className="bg-[#070d1a] min-h-screen" data-testid="landing-page">
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <AISection />
    </div>
  );
}
```

- [ ] **Step 5: Run tests — all pass**

```bash
npm test -- --run
```
Expected: PASS — 17 tests passing.

- [ ] **Step 6: Commit**

```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN"
git add frontend/src/components/landing/AISection.tsx frontend/src/pages/LandingPage.tsx frontend/src/components/landing/__tests__/landing.test.tsx
git commit -m "feat: add AISection with chat preview and provider pills"
```

---

## Task 8: AudienceSection

**Files:**
- Create: `frontend/src/components/landing/AudienceSection.tsx`
- Modify: `frontend/src/components/landing/__tests__/landing.test.tsx`
- Modify: `frontend/src/pages/LandingPage.tsx`

- [ ] **Step 1: Write the failing tests**

Append to the test file:
```tsx
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
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run
```
Expected: FAIL — `Cannot find module '../AudienceSection'`

- [ ] **Step 3: Create AudienceSection.tsx**

Create `frontend/src/components/landing/AudienceSection.tsx`:
```tsx
interface AudienceCard {
  id: string;
  emoji: string;
  title: string;
  tagline: string;
  topGradient: string;
  taglineClass: string;
  checkClass: string;
  desc: string;
  points: readonly string[];
  scenarioLabelClass: string;
  scenario: string;
}

const TOP_CARDS: AudienceCard[] = [
  {
    id: 'business',
    emoji: '🏢',
    title: 'Business Owners & Managers',
    tagline: 'Oversight & accountability',
    topGradient: 'from-indigo-500 to-indigo-400',
    taglineClass: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
    checkClass: 'bg-indigo-500/15 text-indigo-300',
    desc: "Run your organization from a single dashboard. Track every team member's work, define custom approval chains, and let AI surface what needs your attention.",
    points: [
      'Custom roles: define who approves what',
      'Real-time team performance overview',
      'Multi-step report approval flows',
      'AI digest of team activity',
    ],
    scenarioLabelClass: 'text-indigo-300',
    scenario:
      '"Ahmed runs a 40-person consulting firm. He sets up department leads as approvers, gets a daily AI summary, and never chases status updates again."',
  },
  {
    id: 'solo',
    emoji: '🙋',
    title: 'Individuals & Self-improvers',
    tagline: 'Personal growth & workload clarity',
    topGradient: 'from-amber-500 to-orange-400',
    taglineClass: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    checkClass: 'bg-amber-500/15 text-amber-300',
    desc: 'Use WorkConnect solo to track your own work, manage personal tasks, and let the AI coach you on your productivity patterns and growth over time.',
    points: [
      'Daily work logs → spot your patterns',
      'Personal kanban for task clarity',
      'AI insights on your own performance',
      'Weekly self-review & goal tracking',
    ],
    scenarioLabelClass: 'text-amber-300',
    scenario:
      '"Riya is a freelance designer. She logs her daily output, reviews her AI-generated weekly summary, and ships more because she can see what slows her down."',
  },
  {
    id: 'dev',
    emoji: '💻',
    title: 'Developers & IT Teams',
    tagline: 'Self-host & extend',
    topGradient: 'from-cyan-500 to-teal-400',
    taglineClass: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20',
    checkClass: 'bg-cyan-500/15 text-cyan-300',
    desc: 'Clone, deploy, and own it. Full Django + React source, a REST API, pluggable AI providers, and the freedom to adapt every part of the platform to your infrastructure.',
    points: [
      'Fully open source (MIT)',
      'REST API with JWT auth',
      'Pluggable AI: OpenAI, Claude, Groq, Gemini',
      'Docker-ready, deploy anywhere',
    ],
    scenarioLabelClass: 'text-cyan-300',
    scenario:
      '"Tomas self-hosts WorkConnect for his agency, swaps in Claude for AI summaries, and adds a custom Slack webhook — all from the codebase he fully controls."',
  },
];

const BOTTOM_CARDS: AudienceCard[] = [
  {
    id: 'remote',
    emoji: '🌍',
    title: 'Remote & Distributed Teams',
    tagline: 'Async clarity across time zones',
    topGradient: 'from-green-500 to-emerald-400',
    taglineClass: 'bg-green-500/10 text-green-300 border border-green-500/20',
    checkClass: 'bg-green-500/15 text-green-300',
    desc: "Keep everyone aligned without endless meetings. Work reports replace standups, the kanban shows team progress at a glance, and AI summaries keep remote members in sync.",
    points: [
      'Daily reports replace standups',
      'Shared kanban visible to whole team',
      'Async approval flows — no waiting',
      'AI-generated team digest for managers',
    ],
    scenarioLabelClass: 'text-green-300',
    scenario:
      '"Sara manages a 12-person remote team across 4 time zones. Everyone logs daily, she reviews an AI digest each morning, and the team runs without a single sync call."',
  },
  {
    id: 'startup',
    emoji: '🚀',
    title: 'Startups & Small Teams',
    tagline: 'Ship fast, stay organized',
    topGradient: 'from-purple-500 to-violet-400',
    taglineClass: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
    checkClass: 'bg-purple-500/15 text-purple-300',
    desc: "No need for multiple tools. Work reports, tasks, calendar and AI — all in one place. Start free, grow without limits, self-host when you're ready.",
    points: [
      'Replace 3+ tools with one platform',
      'Zero setup cost — free & open source',
      'Scales as your team grows',
      'Custom roles from day one',
    ],
    scenarioLabelClass: 'text-purple-300',
    scenario:
      '"Lena\'s 6-person startup replaced Jira + Notion + spreadsheets with WorkConnect. One tool, one source of truth, half the overhead."',
  },
];

function Card({ card }: { card: AudienceCard }) {
  return (
    <div className="relative bg-white/[0.03] border border-white/[0.06] rounded-[20px] p-8 hover:bg-indigo-500/[0.05] hover:border-indigo-500/20 hover:-translate-y-0.5 transition-all duration-250 overflow-hidden">
      {/* Colored top border */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.topGradient}`} />

      <span className="text-[28px] mb-3.5 block">{card.emoji}</span>
      <h3 className="text-[17px] font-extrabold text-slate-200 mb-2">{card.title}</h3>
      <span className={`inline-block text-[12px] font-semibold rounded-full px-3 py-1 mb-3 ${card.taglineClass}`}>
        {card.tagline}
      </span>
      <p className="text-[13px] text-slate-500 mb-5 leading-[1.65]">{card.desc}</p>

      <ul className="flex flex-col gap-2.5 mb-5">
        {card.points.map(point => (
          <li key={point} className="flex items-start gap-2.5 text-[13px] text-slate-500 font-medium leading-snug">
            <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 ${card.checkClass}`}>
              ✓
            </span>
            {point}
          </li>
        ))}
      </ul>

      {/* Scenario box */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5">
        <p className={`text-[9px] font-bold uppercase tracking-[0.1em] mb-1.5 ${card.scenarioLabelClass}`}>
          Use case
        </p>
        <p className="text-[12px] text-slate-600 leading-relaxed italic">{card.scenario}</p>
      </div>
    </div>
  );
}

export default function AudienceSection() {
  return (
    <section
      id="use-cases"
      className="py-[90px] px-8 bg-white/[0.01] border-t border-white/[0.04]"
    >
      <div className="max-w-[1040px] mx-auto">
        <div className="text-center mb-[52px]">
          <span className="inline-block bg-indigo-500/[0.08] text-indigo-300 border border-indigo-500/20 rounded-full px-4 py-1 text-[11px] font-bold tracking-widest uppercase mb-4">
            Who it's for
          </span>
          <h2
            className="font-black tracking-[-1.5px] text-slate-100 mb-4 leading-[1.12]"
            style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}
          >
            Built for anyone who works
          </h2>
          <p className="text-base text-slate-500 max-w-[520px] mx-auto leading-relaxed">
            Whether you're running a team, building solo, or just trying to stay on top of your
            own work — WorkConnect works for you.
          </p>
        </div>

        {/* Top row — 3 cards */}
        <div className="grid grid-cols-3 gap-[18px] mb-[18px]">
          {TOP_CARDS.map(card => (
            <Card key={card.id} card={card} />
          ))}
        </div>

        {/* Bottom row — 2 cards */}
        <div className="grid grid-cols-2 gap-[18px]">
          {BOTTOM_CARDS.map(card => (
            <Card key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add AudienceSection to LandingPage.tsx**

Replace full contents of `frontend/src/pages/LandingPage.tsx`:
```tsx
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import StatsBar from '../components/landing/StatsBar';
import FeaturesSection from '../components/landing/FeaturesSection';
import AISection from '../components/landing/AISection';
import AudienceSection from '../components/landing/AudienceSection';

export default function LandingPage() {
  return (
    <div className="bg-[#070d1a] min-h-screen" data-testid="landing-page">
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <AISection />
      <AudienceSection />
    </div>
  );
}
```

- [ ] **Step 5: Run tests — all pass**

```bash
npm test -- --run
```
Expected: PASS — 20 tests passing.

- [ ] **Step 6: Commit**

```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN"
git add frontend/src/components/landing/AudienceSection.tsx frontend/src/pages/LandingPage.tsx frontend/src/components/landing/__tests__/landing.test.tsx
git commit -m "feat: add AudienceSection with 5 use-case cards"
```

---

## Task 9: FinalCTA

**Files:**
- Create: `frontend/src/components/landing/FinalCTA.tsx`
- Modify: `frontend/src/components/landing/__tests__/landing.test.tsx`
- Modify: `frontend/src/pages/LandingPage.tsx`

- [ ] **Step 1: Write the failing tests**

Append to the test file:
```tsx
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
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run
```
Expected: FAIL — `Cannot find module '../FinalCTA'`

- [ ] **Step 3: Create FinalCTA.tsx**

Create `frontend/src/components/landing/FinalCTA.tsx`:
```tsx
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import { GITHUB_URL } from '../../constants';

export default function FinalCTA() {
  return (
    <section className="relative py-[110px] px-8 text-center overflow-hidden">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px]"
        style={{
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10">
        <h2
          className="font-black tracking-[-2px] text-slate-100 mb-4 leading-[1.1]"
          style={{ fontSize: 'clamp(30px, 4vw, 54px)' }}
        >
          Ready to take control of{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            your work?
          </span>
        </h2>
        <p className="text-[17px] text-slate-500 max-w-[480px] mx-auto mb-10 leading-relaxed">
          Free forever. Open source. No credit card. Start solo or invite your whole team.
        </p>
        <div className="flex gap-3.5 justify-center flex-wrap">
          <Link
            to="/signup"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-[0_0_30px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(99,102,241,0.55)] transition-all duration-200"
          >
            🚀 Get Started Free
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-[15px] font-semibold text-slate-400 bg-white/[0.04] border border-white/10 backdrop-blur-md hover:border-indigo-500/40 hover:text-indigo-400 transition-all duration-200"
          >
            <Github size={15} />
            View Source on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add FinalCTA to LandingPage.tsx**

Replace full contents of `frontend/src/pages/LandingPage.tsx`:
```tsx
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import StatsBar from '../components/landing/StatsBar';
import FeaturesSection from '../components/landing/FeaturesSection';
import AISection from '../components/landing/AISection';
import AudienceSection from '../components/landing/AudienceSection';
import FinalCTA from '../components/landing/FinalCTA';

export default function LandingPage() {
  return (
    <div className="bg-[#070d1a] min-h-screen" data-testid="landing-page">
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <AISection />
      <AudienceSection />
      <FinalCTA />
    </div>
  );
}
```

- [ ] **Step 5: Run tests — all pass**

```bash
npm test -- --run
```
Expected: PASS — 23 tests passing.

- [ ] **Step 6: Commit**

```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN"
git add frontend/src/components/landing/FinalCTA.tsx frontend/src/pages/LandingPage.tsx frontend/src/components/landing/__tests__/landing.test.tsx
git commit -m "feat: add FinalCTA section"
```

---

## Task 10: LandingFooter + final assembly

**Files:**
- Create: `frontend/src/components/landing/LandingFooter.tsx`
- Modify: `frontend/src/components/landing/__tests__/landing.test.tsx`
- Modify: `frontend/src/pages/LandingPage.tsx` (final version)

- [ ] **Step 1: Write the failing tests**

Append to the test file:
```tsx
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
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --run
```
Expected: FAIL — `Cannot find module '../LandingFooter'`

- [ ] **Step 3: Create LandingFooter.tsx**

Create `frontend/src/components/landing/LandingFooter.tsx`:
```tsx
import { GITHUB_URL } from '../../constants';

const FOOTER_COLS = [
  {
    heading: 'Product',
    links: ['Features', 'AI Assistant', 'Roles & Approvals', 'Changelog'],
  },
  {
    heading: 'Resources',
    links: ['Documentation', 'API Reference', 'Self-Hosting', 'GitHub'],
  },
  {
    heading: 'Use Cases',
    links: ['For Teams', 'For Individuals', 'For Developers', 'For Startups'],
  },
] as const;

const BADGES = ['MIT License', 'Django 6 + React 19', 'AI-Powered'] as const;

export default function LandingFooter() {
  return (
    <footer className="bg-[#050b16] border-t border-white/[0.05] px-8 pt-14 pb-8">
      <div className="max-w-[1000px] mx-auto">
        {/* Top grid */}
        <div className="grid gap-8 mb-10" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-[32px] h-[32px] rounded-[9px] bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-[0_0_14px_rgba(99,102,241,0.4)]">
                W
              </div>
              <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent font-extrabold text-base tracking-tight">
                WorkConnect
              </span>
            </div>
            <p className="text-[13px] text-slate-700 max-w-[240px] leading-relaxed">
              The open-source AI-powered workspace for individuals, teams, and organizations.
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-[12px] text-slate-600 hover:text-slate-400 transition-colors duration-150"
            >
              ⭐ Star on GitHub
            </a>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map(col => (
            <div key={col.heading}>
              <h4 className="text-slate-600 text-[12px] font-bold uppercase tracking-[0.08em] mb-3.5">
                {col.heading}
              </h4>
              {col.links.map(link => (
                <a
                  key={link}
                  href="#"
                  className="block text-slate-700 text-[13px] mb-2.5 hover:text-slate-400 transition-colors duration-150"
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.04] pt-6 flex items-center justify-between">
          <p className="text-[12px] text-slate-800">
            © 2026 WorkConnect. Open source under MIT License.
          </p>
          <div className="flex gap-2">
            {BADGES.map(b => (
              <span
                key={b}
                className="bg-white/[0.03] text-slate-700 border border-white/[0.05] rounded-md px-2.5 py-1 text-[11px] font-semibold"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Write the final LandingPage.tsx**

Replace full contents of `frontend/src/pages/LandingPage.tsx` with the complete assembled page:
```tsx
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import StatsBar from '../components/landing/StatsBar';
import FeaturesSection from '../components/landing/FeaturesSection';
import AISection from '../components/landing/AISection';
import AudienceSection from '../components/landing/AudienceSection';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="bg-[#070d1a] min-h-screen" data-testid="landing-page">
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <AISection />
      <AudienceSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
```

- [ ] **Step 5: Run all tests — full suite passes**

```bash
npm test -- --run
```
Expected: PASS — 26 tests passing, 0 failures.

- [ ] **Step 6: Visual check in browser**

```bash
npm run dev
```
Open `http://localhost:5173/`. Scroll through the page and verify:
- Dark navy background throughout
- Glowing indigo/cyan gradient accents on logo, buttons, and headline
- App preview visible in hero section
- Stats bar shows "Custom" for roles (not "3")
- All 5 audience cards visible (3 top + 2 bottom)
- Existing routes still work: `http://localhost:5173/login` and `http://localhost:5173/signup`

- [ ] **Step 7: TypeScript check**

```bash
npm run build
```
Expected: Build completes with 0 TypeScript errors.

- [ ] **Step 8: Commit**

```bash
cd "E:/PROJECTS/AI PROJECTS/ER_PLAN"
git add frontend/src/components/landing/LandingFooter.tsx frontend/src/pages/LandingPage.tsx frontend/src/components/landing/__tests__/landing.test.tsx
git commit -m "feat: add LandingFooter and complete landing page assembly"
```

---

## Done ✓

All 10 tasks complete. The public landing page is live at `/`. Summary of what was built:

- **10 files created**, 3 modified
- **26 tests** covering all sections and key CTA links
- **8 sections**: Nav → Hero → Stats → Features → AI → Audience → CTA → Footer
- **Dark premium style**: navy background, indigo/cyan glows, gradient text
- **Custom roles messaging** in StatsBar (not fixed "3 roles")
- **5 use-case audience cards** with real scenario descriptions
- **Zero backend changes**, existing routes unaffected
