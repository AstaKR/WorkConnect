# WorkConnect Public Landing Page — Design Spec

## Summary of decisions

| Decision | Choice |
|---|---|
| Visual style | Dark & Premium (navy bg, indigo/cyan glow accents) |
| Page structure | Option C — Visual-first |
| Stats bar | Custom Roles & Approval Flows (not fixed "3 roles") |
| Who it's for | 5 use-case cards (Business, Individual, Developer, Remote, Startup) |
| Tech | React 19 + Tailwind v3 + Framer Motion + Lucide |

---

## 1. Route & File Structure

### New route
Add to `frontend/src/App.tsx` — **before** the login/signup routes, as a public unprotected route:

```tsx
import LandingPage from './pages/LandingPage';
// ...
<Route path="/" element={<LandingPage />} />
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<Signup />} />
```

Visitors who land on `/` see the landing page. Authenticated users navigating to `/` are **not** redirected away — the landing page is always accessible (consistent with typical SaaS behavior where you can revisit the marketing site).

### New files

```
frontend/src/pages/LandingPage.tsx          ← page root, assembles sections
frontend/src/components/landing/
  LandingNav.tsx                             ← sticky glass nav
  HeroSection.tsx                            ← cinematic hero + app preview
  StatsBar.tsx                               ← 4 stats
  FeaturesSection.tsx                        ← 6-card feature grid
  AISection.tsx                              ← split AI copy + chat preview
  AudienceSection.tsx                        ← 5 use-case cards (3+2 layout)
  FinalCTA.tsx                               ← centered CTA block
  LandingFooter.tsx                          ← 4-column footer
```

`LandingPage.tsx` simply imports and renders each section in order. No state, no API calls, no auth dependency.

---

## 2. Visual System

### Color tokens (Tailwind utilities)

| Role | Value | Tailwind class |
|---|---|---|
| Page background | `#070d1a` | `bg-[#070d1a]` |
| Surface 1 | `rgba(255,255,255,0.03)` | `bg-white/[0.03]` |
| Surface border | `rgba(255,255,255,0.06)` | `border-white/[0.06]` |
| Primary indigo | `#6366f1` | `text-indigo-500` |
| Primary glow | `#818cf8` | `text-indigo-400` |
| Cyan accent | `#06b6d4` | `text-cyan-500` |
| Heading text | `#f1f5f9` | `text-slate-100` |
| Body text | `#64748b` | `text-slate-500` |
| Muted text | `#475569` | `text-slate-600` |

### Gradient headline
```tsx
<span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
  AI-powered workspace
</span>
```

### Primary button
```tsx
<button className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold
  px-7 py-3.5 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.45)]
  hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(99,102,241,0.55)]
  transition-all duration-200 flex items-center gap-2">
```

### Secondary button
```tsx
<button className="bg-white/[0.04] border border-white/10 text-slate-400 font-semibold
  px-6 py-3.5 rounded-xl backdrop-blur-md
  hover:border-indigo-500/40 hover:text-indigo-400
  transition-all duration-200 flex items-center gap-2">
```

---

## 3. Section Breakdown

### 3.1 LandingNav

Sticky top bar with glass effect.

**Layout:** logo left · nav links center · actions right

**Logo:** `W` icon (indigo→cyan gradient square, glowing box-shadow) + "WorkConnect" in gradient text

**Nav links:** Features · Use Cases · AI · Docs · GitHub

**Actions:** Ghost "Sign In" button (links to `/login`) + primary "Get Started Free" button (links to `/signup`)

**Scroll behavior:** On scroll > 10px, add `border-b border-white/[0.06]` via state. Use `useEffect` scroll listener.

### 3.2 HeroSection

Full-viewport cinematic hero.

**Background layers (stacked):**
1. Base: `bg-[#070d1a]`
2. Radial gradient top: `bg-radial-gradient` centered at top, indigo glow
3. Grid texture: CSS `background-image` grid lines, masked radially (via inline style — Tailwind doesn't support this pattern)
4. Two floating orbs (absolutely positioned divs, indigo & cyan radial gradients, `pointer-events-none`)

**Content (centered, z-10):**
1. Badge: animated pulsing dot + "Open Source · AI-Powered · Free Forever"
2. H1: "The **AI-powered workspace** for every kind of work" (gradient on "AI-powered workspace")
3. Subtitle: secondary text, max-w-xl centered
4. CTA row: primary button "🚀 Get Started Free" + secondary "View on GitHub" (with GitHub SVG icon)
5. App preview: mock browser frame (dark `#0d1525`) with fake URL bar, sidebar + dashboard screenshot

**App preview details:**
- Frame: `rounded-[18px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-indigo-500/15`
- Title bar with 3 macOS dots + URL pill
- 2-column body: sidebar (200px) + main content
- Sidebar: logo, group headers, 8 nav items, active item highlighted with indigo bg
- Main: title, 4 KPI cards, 2 chart placeholders (bar chart + AI insight card)
- Glow blob below frame: blurred indigo ellipse

**Animations (Framer Motion):**
- Hero content: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}` with staggered children (0.1s delay each)
- App frame: `initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}`
- Badge dot: CSS `animate-pulse`

### 3.3 StatsBar

Thin band, 4 stats in a row separated by subtle dividers.

| Stat | Label | Sublabel |
|---|---|---|
| 100% | Open Source & Free | — |
| 4 | AI Providers | Claude · GPT-4 · Groq · Gemini |
| Custom | Roles & Approval Flows | You define who approves what |
| 15+ | Themes & Layouts | Make it yours |

Numbers rendered with gradient text (indigo→cyan). "Custom" is not a number — render it the same gradient style.

### 3.4 FeaturesSection

Center-aligned header + 3×2 card grid.

**Header:** section pill label + "Built for how real work gets done" + subtitle

**Cards (6):**
1. 📝 Work Reports — log, review, approve, export
2. 📋 Kanban Board — drag-and-drop visual task management
3. 📅 Team Calendar — events, deadlines, monthly/weekly view
4. 🛡️ Custom Roles & Approvals — define any role, multi-step approval chains
5. 📊 Smart Dashboards — KPIs per role, personal + team views
6. 🎨 Full Customization — 15+ themes, 3 layout modes

**Card style:** `bg-white/[0.02] border border-white/[0.05]` — cards share borders (gap:0, CSS grid) so they look like a unified dark panel with internal grid lines. Hover: `bg-indigo-500/[0.05]` with top-edge gradient highlight.

### 3.5 AISection

Two-column split: copy left, chat preview right.

**Left column:**
- Section pill "AI-Powered"
- H2: "Your AI assistant. Always in context."
- Body text about query/summarize/insight use cases
- Provider pills: 🤖 Claude · ✨ GPT-4 · ⚡ Groq · 🧠 Gemini

**Right column — AI chat preview:**
- Dark frosted panel, `border border-white/[0.07] rounded-[18px]`
- 4 messages alternating user/AI:
  - User: "How has my productivity looked this month?"
  - AI: "You've submitted 23 of 25 reports — 92% rate. Trending 14% above monthly average. 🎯"
  - User: "What should I focus on next week?"
  - AI: "3 overdue tasks on Kanban + Friday deadline for Q2 report. Want me to draft a weekly plan?"
- AI avatar: indigo→cyan gradient with `✦` glyph
- User avatar: `bg-white/[0.06]` with initials "K"

Note: the AI chat example shows **individual use** (personal productivity), not team management — because this section comes right after the "Individuals & Self-improvers" use case lands in the visitor's mind.

### 3.6 AudienceSection

**Header:** "Built for anyone who works" + subtitle

**Layout:** 3-column top row + 2-column bottom row

**Top row (3 cards):**

1. **🏢 Business Owners & Managers** (indigo accent)
   - Tagline: "Oversight & accountability"
   - 4 checkpoints: custom roles/approvals, real-time overview, multi-step approval flows, AI digest
   - Scenario: *"Ahmed runs a 40-person consulting firm. He sets up department leads as approvers, gets a daily AI summary, and never chases status updates again."*

2. **🙋 Individuals & Self-improvers** (amber accent)
   - Tagline: "Personal growth & workload clarity"
   - 4 checkpoints: daily logs → spot patterns, personal kanban, AI insights on own performance, weekly self-review
   - Scenario: *"Riya is a freelance designer. She logs her daily output, reviews her AI-generated weekly summary, and ships more because she can see what slows her down."*

3. **💻 Developers & IT Teams** (cyan accent)
   - Tagline: "Self-host & extend"
   - 4 checkpoints: MIT open source, REST API + JWT, pluggable AI providers, Docker-ready
   - Scenario: *"Tomas self-hosts WorkConnect for his agency, swaps in Claude for AI summaries, and adds a custom Slack webhook — all from the codebase he fully controls."*

**Bottom row (2 cards):**

4. **🌍 Remote & Distributed Teams** (green accent)
   - Tagline: "Async clarity across time zones"
   - 4 checkpoints: reports replace standups, shared kanban, async approval flows, AI team digest
   - Scenario: *"Sara manages a 12-person remote team across 4 time zones. Everyone logs daily, she reviews an AI digest each morning, and the team runs without a single sync call."*

5. **🚀 Startups & Small Teams** (purple accent)
   - Tagline: "Ship fast, stay organized"
   - 4 checkpoints: replace 3+ tools, free & open source, scales as team grows, custom roles from day one
   - Scenario: *"Lena's 6-person startup replaced Jira + Notion + spreadsheets with WorkConnect. One tool, one source of truth, half the overhead."*

**Card anatomy:**
- `bg-white/[0.03] border border-white/[0.06] rounded-[20px] p-8`
- Colored 2px top border per card using `::before` pseudo (or a div with `h-0.5`)
- Hover: subtle lift + indigo border tint
- Scenario box: inner frosted card with italic text, colored label

### 3.7 FinalCTA

Full-width centered section with background glow orb.

- H2: "Ready to take control of **your work**?" (gradient on "your work")
- Subtitle: "Free forever. Open source. No credit card. Start solo or invite your whole team."
- Two buttons: primary "🚀 Get Started Free" → `/signup`, secondary "View Source on GitHub" → GitHub link

### 3.8 LandingFooter

Dark `bg-[#050b16]`, 4-column grid.

**Columns:**
1. Brand: logo + tagline
2. Product: Features, AI Assistant, Roles & Approvals, Changelog
3. Resources: Documentation, API Reference, Self-Hosting, GitHub
4. Use Cases: For Teams, For Individuals, For Developers, For Startups

**Bottom bar:** copyright + 3 badges (MIT License · Django 6 + React 19 · AI-Powered)

Footer links go to `#` for now — they'll be wired up when documentation exists.

---

## 4. Responsiveness

This spec covers **desktop** (the primary target for a SaaS landing page). Mobile is out of scope for this iteration — a follow-up task can add responsive breakpoints.

---

## 5. Constraints & Out of Scope

- **No backend changes** — pure frontend page, no API calls
- **No authentication checks** — landing is always public
- **No pricing section** — WorkConnect is free/open source, not a paid SaaS; pricing is not applicable
- **No blog / changelog section** — out of scope for launch landing page
- **No animations beyond Framer Motion entrance animations** — no scroll-triggered animations, no parallax
- **Mobile responsiveness** — deferred to follow-up

---

## 6. Acceptance Criteria

- Visiting `/` renders the landing page (not a redirect to `/login`)
- All 8 sections render correctly in the dark premium style
- "Get Started Free" CTA links to `/signup`
- "Sign In" links to `/login`
- GitHub button links to the repo (use `https://github.com` placeholder until real URL is set in a constant)
- No TypeScript errors, no console errors
- Existing routes (`/login`, `/signup`, `/employee/dashboard`, etc.) are unaffected
