# Individual Account & Two-Path Signup — Design Spec

## Summary of decisions

| Decision | Choice |
|---|---|
| Signup layout | Layout C — two clickable cards at top, form morphs below |
| Backend differentiation | New `account_type` field on User: `'organization'` (default) \| `'individual'` |
| Individual user's Django `role` | `'employee'` (reuses existing permission logic) |
| Individual dashboard route | New `/individual/dashboard` page (separate from `/employee/dashboard`) |
| Individual sidebar | Simplified — no team/manager/approval nav items |
| Post-login routing | `account_type === 'individual'` → `/individual/dashboard` |

---

## 1. Backend Changes

### 1.1 User model — new `account_type` field

Add to `backend/accounts/models.py` on the `User` class:

```python
ACCOUNT_TYPES = [
    ('organization', 'Organization'),
    ('individual', 'Individual'),
]
account_type = models.CharField(
    max_length=20,
    choices=ACCOUNT_TYPES,
    default='organization',
)
```

No other model changes. Existing `role` field and logic remains untouched.
Individual users always have `role='employee'` and `account_type='individual'`.
Organization users have `role='employee'|'manager'|'ceo'` and `account_type='organization'`.

### 1.2 Serializers

**`UserSerializer`** — add `account_type` to `fields` list.

**`UserCreateSerializer`** — add `account_type` to `fields` list.
Individual registrations send `role='employee'` + `account_type='individual'`.
Organization registrations send their chosen `role` + `account_type='organization'`.

### 1.3 Migration

Run `python manage.py makemigrations accounts` + `python manage.py migrate`.
Existing users get `account_type='organization'` (the field default).

---

## 2. Frontend Changes

### 2.1 `useAuthStore` — update User type

Add `account_type: 'organization' | 'individual'` to the `User` interface in
`frontend/src/store/useAuthStore.ts`.

### 2.2 Signup page — `frontend/src/pages/Signup.tsx` (full rewrite)

**Layout C structure:**

```
┌─────────────────────────────────┐
│  WorkConnect logo + tagline     │
├────────────────┬────────────────┤
│ 🏢 Organization│  🙋 Personal   │  ← type picker cards (click to select)
│  Teams, mgrs   │  Solo & growth │
├────────────────┴────────────────┤
│  [form morphs based on choice]  │
│                                 │
│  ORG FORM:                      │
│  Full Name / Work Email /       │
│  Password / Role chips /        │
│  Department (optional)          │
│  ─ or ─                         │
│  INDIVIDUAL FORM:               │
│  Full Name / Email /            │
│  Password /                     │
│  "What are you tracking?"       │
│  chips (optional, cosmetic)     │
│                                 │
│  [Submit button]                │
└─────────────────────────────────┘
```

**Type picker cards:**
- Two side-by-side cards, each `flex: 1`
- Clicking activates that card (indigo border for Org, amber border for Individual)
- The matching form section renders below, the other is hidden

**Organization form fields:**
- `full_name` — text input
- `email` — email input
- `password` — password input
- `role` — 3-chip selector: Employee 👔 / Manager 🧑‍💼 / CEO 👑 (default: Employee)
- `department` — text input, optional

**Individual form fields:**
- `full_name` — text input
- `email` — email input
- `password` — password input
- `focus_areas` — chip multi-select: 💼 Work output / 🎯 Daily goals / 📚 Learning / 🏃 Habits / 🛠️ Freelance
  - **Cosmetic only** — not sent to backend (no backend field for this)
  - Purpose: makes signup feel intentional and personal

**Zod schemas (two separate):**

```ts
const orgSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['employee', 'manager', 'ceo']),
  department: z.string().optional(),
});

const individualSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});
```

**API payload on submit:**
- Org: `{ full_name, email, password, role, department?, account_type: 'organization' }`
- Individual: `{ full_name, email, password, role: 'employee', account_type: 'individual' }`

**Password validation** — frontend Zod min(8). Backend also enforces uppercase + digit requirements; surface backend errors as before.

**No type picker selected** — show a placeholder "Choose your account type above" state. Submit button is not rendered until a type is chosen.

### 2.3 Login routing — `frontend/src/pages/Login.tsx`

Replace the role-based routing block:

```ts
// Before
if (user.role === 'ceo') navigate('/ceo/dashboard');
else if (user.role === 'manager') navigate('/manager/dashboard');
else navigate('/employee/dashboard');

// After
if (user.account_type === 'individual') navigate('/individual/dashboard');
else if (user.role === 'ceo') navigate('/ceo/dashboard');
else if (user.role === 'manager') navigate('/manager/dashboard');
else navigate('/employee/dashboard');
```

### 2.4 ProtectedRoute — `frontend/src/App.tsx`

Update the fallback in `ProtectedRoute` to also handle `account_type === 'individual'`:

```ts
if (allowedRoles && user && !allowedRoles.includes(user.role)) {
  if (user.account_type === 'individual') return <Navigate to="/individual/dashboard" replace />;
  if (user.role === 'ceo') return <Navigate to="/ceo/dashboard" replace />;
  if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
}
```

Add the new individual route inside `<ProtectedLayout>`:

```tsx
<Route
  path="/individual/dashboard"
  element={
    <ProtectedRoute allowedRoles={['employee']}>
      <IndividualDashboard />
    </ProtectedRoute>
  }
/>
```

Individual users can also access existing shared routes (`/kanban`, `/employee/report`, `/employee/history`, `/employee/calendar`, `/settings/*`) — no changes needed there since they have `role='employee'`.

### 2.5 New page — `frontend/src/pages/IndividualDashboard.tsx`

A personal-focused dashboard. No team/manager/approval widgets.

**Sections:**

1. **Welcome header** — "Good morning, {name} 👋" + today's date
2. **Quick stats row (3 cards):**
   - Reports this month
   - Kanban tasks completed
   - Day streak (consecutive log days)
3. **AI Insight card** — "Your weekly summary" — calls same AI endpoint as employee dashboard, but prompt framed for personal use
4. **Recent Activity** — last 5 work log entries (links to `/employee/history`)
5. **Quick actions** — "Log today's work" → `/employee/report/new`, "Open Kanban" → `/kanban`

**No sections:** no manager approval status, no team member list, no approval chains.

**Visual style:** Uses existing Tailwind `glass`, `bg-background`, `text-primary` design tokens — consistent with the rest of the app.

### 2.6 Sidebar — `frontend/src/components/Layout.tsx`

The sidebar (or `Layout.tsx`) already shows navigation items. For individual users, hide team-only items:

- Hide: Manager Dashboard, CEO Dashboard, User Management, Role Management
- Show: Dashboard (→ `/individual/dashboard`), Work Log, Report History, Kanban, Calendar, Settings

Implementation: check `user.account_type === 'individual'` (or equivalently `user.role === 'employee' && user.account_type === 'individual'`) and filter nav items accordingly.

---

## 3. File Map

| Action | File |
|---|---|
| Modify | `backend/accounts/models.py` — add `account_type` field |
| Create | `backend/accounts/migrations/00XX_user_account_type.py` |
| Modify | `backend/accounts/serializers.py` — add `account_type` to both serializers |
| Modify | `frontend/src/store/useAuthStore.ts` — add `account_type` to User type |
| Rewrite | `frontend/src/pages/Signup.tsx` — two-path Layout C form |
| Modify | `frontend/src/pages/Login.tsx` — individual routing |
| Create | `frontend/src/pages/IndividualDashboard.tsx` — personal dashboard |
| Modify | `frontend/src/App.tsx` — add individual route + update ProtectedRoute fallback |
| Modify | `frontend/src/components/Layout.tsx` — hide team nav items for individual users |

---

## 4. Constraints & Out of Scope

- **No new API endpoints** — registration uses the existing `POST /api/auth/register/` endpoint
- **No separate individual feature set** — individual users access the same Kanban, Calendar, Report pages as employees; no new feature gating
- **focus_areas chips are cosmetic** — not persisted, purely UX on signup
- **No invite/team flow for individuals** — individual accounts are always solo; no team-join capability in this iteration
- **No account type switcher** — users cannot switch from individual to organization post-signup (future feature)
- **Mobile** — out of scope (consistent with landing page decision)

---

## 5. Acceptance Criteria

- Visiting `/signup` shows two cards (Organization, Personal) with no form visible until one is clicked
- Clicking Organization shows role chips (Employee/Manager/CEO) + department field
- Clicking Personal shows only name/email/password + optional focus chips; no role field visible
- Submitting org form sends `account_type: 'organization'` with the chosen role
- Submitting individual form sends `account_type: 'individual'` with `role: 'employee'`
- After individual registration + login, user lands on `/individual/dashboard`
- After org login, existing routing (ceo/manager/employee) is unchanged
- Individual dashboard shows personal stats, AI insight, recent activity, quick actions — no team widgets
- Sidebar for individual users hides manager/CEO/user management nav items
- Existing org users (pre-existing accounts without `account_type`) get `account_type='organization'` by migration default — no disruption
- No TypeScript errors, no console errors
