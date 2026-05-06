# Individual Account & Two-Path Signup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-path signup flow (Organization vs Personal) with a new `account_type` field on the backend, a new Individual dashboard, and individual-aware sidebar navigation.

**Architecture:** New `account_type` CharField on Django `User` model distinguishes `'organization'` from `'individual'` accounts. Individual users get `role='employee'` and are routed to `/individual/dashboard` after login. `ProtectedRoute` short-circuits for individual users (full access to all routes including System Settings / AI keys). The sidebar `visibleItems` function gains an `accountType` parameter to show all Settings items for individual users while hiding management pages.

**Tech Stack:** Django 6 + DRF, React 19 + TypeScript, Zod, react-hook-form, Framer Motion, Lucide React, Zustand, Vitest + @testing-library/react

---

## File Map

| Action | File |
|---|---|
| Modify | `backend/accounts/models.py` |
| Auto-generate | `backend/accounts/migrations/` (via makemigrations) |
| Modify | `backend/accounts/serializers.py` |
| Modify | `frontend/src/store/useAuthStore.ts` |
| Rewrite | `frontend/src/pages/Signup.tsx` |
| Modify | `frontend/src/pages/Login.tsx` |
| Modify | `frontend/src/App.tsx` |
| Modify | `frontend/src/components/Layout.tsx` |
| Create | `frontend/src/pages/IndividualDashboard.tsx` |
| Create | `frontend/src/pages/__tests__/individualSignup.test.tsx` |

---

### Task 1: Backend — add `account_type` field + migration + serializers

**Files:**
- Modify: `backend/accounts/models.py`
- Modify: `backend/accounts/serializers.py`
- Auto-create: `backend/accounts/migrations/` (django generates this)

- [ ] **Step 1: Add `account_type` field to User model**

Open `backend/accounts/models.py`. Inside the `User` class, add the `ACCOUNT_TYPES` list and `account_type` field directly after the `ROLES` and `EMPLOYMENT_STATUS` declarations (around line 25):

```python
class User(AbstractBaseUser, PermissionsMixin):
    ROLES = [('employee', 'Employee'), ('manager', 'Manager'), ('ceo', 'CEO')]
    EMPLOYMENT_STATUS = [
        ('active', 'Active'),
        ('probation', 'Probation'),
        ('on_leave', 'On Leave'),
        ('resigned', 'Resigned'),
        ('terminated', 'Terminated'),
        ('retired', 'Retired'),
    ]
    ACCOUNT_TYPES = [
        ('organization', 'Organization'),
        ('individual', 'Individual'),
    ]

    # Core
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLES, default='employee')
    account_type = models.CharField(
        max_length=20,
        choices=ACCOUNT_TYPES,
        default='organization',
    )
    # ... rest of fields unchanged
```

- [ ] **Step 2: Run makemigrations and migrate**

```bash
cd backend
python manage.py makemigrations accounts --name user_account_type
python manage.py migrate
```

Expected output:
```
Migrations for 'accounts':
  accounts/migrations/000X_user_account_type.py
    - Add field account_type to user
Operations to perform:
  Apply all migrations: accounts, ...
Running migrations:
  Applying accounts.000X_user_account_type... OK
```

Existing users in the database get `account_type='organization'` (the field default). No data loss.

- [ ] **Step 3: Add `account_type` to `UserSerializer` fields list**

In `backend/accounts/serializers.py`, find the `UserSerializer` class. Add `'account_type'` to the `fields` list:

```python
class UserSerializer(serializers.ModelSerializer):
    preferences = UserPreferencesSerializer(read_only=True)
    manager_name = serializers.CharField(source='manager.full_name', read_only=True)
    manager_email = serializers.CharField(source='manager.email', read_only=True)
    profile_pic_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role', 'account_type', 'is_active',
            # Personal
            'profile_pic', 'profile_pic_url', 'dob', 'phone',
            'address', 'city', 'state', 'pincode',
            # Professional
            'employee_id', 'designation', 'grade', 'department',
            'manager', 'manager_name', 'manager_email',
            'employment_status', 'start_date', 'last_working_date',
            # Emergency
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            # Meta
            'date_joined', 'preferences',
        ]
        read_only_fields = ['id', 'date_joined', 'preferences', 'profile_pic_url', 'manager_name', 'manager_email']
```

- [ ] **Step 4: Add `account_type` to `UserCreateSerializer` fields list**

In the same file, find `UserCreateSerializer` and add `'account_type'` to its `fields` list:

```python
class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'email', 'full_name', 'password', 'role', 'account_type',
            'dob', 'phone', 'address', 'city', 'state', 'pincode',
            'employee_id', 'designation', 'grade', 'department',
            'manager', 'employment_status', 'start_date', 'last_working_date',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
        ]
```

- [ ] **Step 5: Verify via Django shell**

```bash
cd backend
python manage.py shell -c "
from accounts.models import User
from accounts.serializers import UserCreateSerializer, UserSerializer
print('account_type field:', User._meta.get_field('account_type'))
print('UserCreateSerializer fields:', list(UserCreateSerializer().fields.keys()))
print('UserSerializer fields includes account_type:', 'account_type' in UserSerializer().fields)
"
```

Expected output:
```
account_type field: <django.db.models.fields.CharField: account_type>
UserCreateSerializer fields: ['email', 'full_name', 'password', 'role', 'account_type', ...]
UserSerializer fields includes account_type: True
```

- [ ] **Step 6: Commit**

```bash
git add backend/accounts/models.py backend/accounts/serializers.py backend/accounts/migrations/
git commit -m "feat(backend): add account_type field to User model and serializers"
```

---

### Task 2: Frontend store — add `account_type` to User type

**Files:**
- Modify: `frontend/src/store/useAuthStore.ts`

- [ ] **Step 1: Add `account_type` to the User interface**

Open `frontend/src/store/useAuthStore.ts`. Find the `User` interface and add `account_type`:

```typescript
interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'employee' | 'manager' | 'ceo';
  account_type: 'organization' | 'individual';
  department: string | null;
  employee_id: string | null;
  manager: number | null;
  phone: string | null;
  is_active: boolean;
  preferences: {
    theme: string;
    primary_color: string;
    accent_color: string;
    sidebar_color: string;
    background_color: string;
    font_size: string;
    layout_density: string;
    layout_style?: string;
    sidebar_position?: string;
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep -i "account_type" || echo "No account_type errors"
```

Expected: `No account_type errors`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/store/useAuthStore.ts
git commit -m "feat(frontend): add account_type to User type in auth store"
```

---

### Task 3: Rewrite Signup.tsx — two-path Layout C

**Files:**
- Rewrite: `frontend/src/pages/Signup.tsx`

- [ ] **Step 1: Write the new Signup.tsx**

Replace the entire content of `frontend/src/pages/Signup.tsx` with:

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Building2, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { APP_NAME } from '../constants';

// ── Schemas ───────────────────────────────────────────────────────────────────
const orgSchema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['employee', 'manager', 'ceo']),
  department: z.string().optional(),
});

const individualSchema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type OrgForm = z.infer<typeof orgSchema>;
type IndividualForm = z.infer<typeof individualSchema>;

type AccountType = 'organization' | 'individual' | null;

// ── Role chip ─────────────────────────────────────────────────────────────────
function RoleChip({
  label, emoji, value, selected, onClick,
}: {
  label: string; emoji: string; value: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all text-center ${
        selected
          ? 'border-primary bg-primary/8 text-primary font-bold'
          : 'border-gray-200 text-gray-500 hover:border-gray-300'
      }`}
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

// ── Focus chip ────────────────────────────────────────────────────────────────
function FocusChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
        selected
          ? 'border-amber-400 bg-amber-50 text-amber-700 font-semibold'
          : 'border-gray-200 text-gray-500 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label, icon, error, children,
}: {
  label: string; icon: React.ReactNode; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
        {children}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Signup() {
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [orgRole, setOrgRole] = useState<'employee' | 'manager' | 'ceo'>('employee');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const FOCUS_OPTIONS = ['💼 Work output', '🎯 Daily goals', '📚 Learning', '🏃 Habits', '🛠️ Freelance'];

  const orgForm = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: { role: 'employee' },
  });

  const individualForm = useForm<IndividualForm>({
    resolver: zodResolver(individualSchema),
  });

  const toggleFocus = (area: string) => {
    setFocusAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const onSubmitOrg = async (data: OrgForm) => {
    try {
      setError('');
      await axios.post('/api/auth/register/', {
        ...data,
        role: orgRole,
        account_type: 'organization',
      });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.data;
      if (msg?.email) setError(msg.email[0]);
      else if (msg?.password) setError(msg.password[0]);
      else setError(err.response?.data?.message || 'Registration failed. Try again.');
    }
  };

  const onSubmitIndividual = async (data: IndividualForm) => {
    try {
      setError('');
      await axios.post('/api/auth/register/', {
        ...data,
        role: 'employee',
        account_type: 'individual',
      });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.data;
      if (msg?.email) setError(msg.email[0]);
      else if (msg?.password) setError(msg.password[0]);
      else setError(err.response?.data?.message || 'Registration failed. Try again.');
    }
  };

  const inputCls = (hasError?: boolean) =>
    `w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
      hasError
        ? 'border-red-300 focus:ring-red-200'
        : 'border-gray-200 focus:ring-primary/20 focus:border-primary'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-10 px-4">
      {/* Ambient blobs */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-[120px] opacity-20"
        animate={{ opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-[120px] opacity-20"
        animate={{ opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 5, delay: 1.5, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10"
        data-testid="signup-card"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-tr from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <span className="text-white font-black text-lg">W</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">{APP_NAME}</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        {/* ── Type picker ────────────────────────────────────────────────── */}
        <div className="flex gap-3 mb-6" data-testid="type-picker">
          {/* Organization card */}
          <button
            type="button"
            data-testid="type-org"
            onClick={() => setAccountType('organization')}
            className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all cursor-pointer ${
              accountType === 'organization'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {accountType === 'organization' && (
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-primary to-accent" />
            )}
            <span className="text-3xl">🏢</span>
            <div className="text-center">
              <p className={`text-sm font-bold ${accountType === 'organization' ? 'text-primary' : 'text-gray-700'}`}>
                Organization
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">Teams &amp; approval chains</p>
            </div>
          </button>

          {/* Individual card */}
          <button
            type="button"
            data-testid="type-individual"
            onClick={() => setAccountType('individual')}
            className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all cursor-pointer ${
              accountType === 'individual'
                ? 'border-amber-400 bg-amber-50/50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-3xl">🙋</span>
            <div className="text-center">
              <p className={`text-sm font-bold ${accountType === 'individual' ? 'text-amber-600' : 'text-gray-700'}`}>
                Personal
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">Solo self-management</p>
            </div>
          </button>
        </div>

        {/* ── Placeholder (no type selected) ────────────────────────────── */}
        <AnimatePresence mode="wait">
          {accountType === null && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-gray-400"
              data-testid="form-placeholder"
            >
              <p className="text-4xl mb-3">👆</p>
              <p className="text-sm font-medium">Choose your account type above to get started</p>
            </motion.div>
          )}

          {/* ── Organization form ─────────────────────────────────────── */}
          {accountType === 'organization' && (
            <motion.form
              key="org-form"
              data-testid="org-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={orgForm.handleSubmit(onSubmitOrg)}
              className="space-y-4"
            >
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-100">
                Organization Account
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{error}</div>
              )}
              {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm border border-green-100">{success}</div>
              )}

              <Field label="Full Name" icon={<User className="w-4 h-4" />} error={orgForm.formState.errors.full_name?.message}>
                <input
                  {...orgForm.register('full_name')}
                  placeholder="Jane Smith"
                  className={inputCls(!!orgForm.formState.errors.full_name)}
                />
              </Field>

              <Field label="Work Email" icon={<Mail className="w-4 h-4" />} error={orgForm.formState.errors.email?.message}>
                <input
                  {...orgForm.register('email')}
                  type="email"
                  placeholder="you@company.com"
                  className={inputCls(!!orgForm.formState.errors.email)}
                />
              </Field>

              <Field label="Password" icon={<Lock className="w-4 h-4" />} error={orgForm.formState.errors.password?.message}>
                <input
                  {...orgForm.register('password')}
                  type="password"
                  placeholder="Min 8 chars, uppercase, number"
                  className={inputCls(!!orgForm.formState.errors.password)}
                />
              </Field>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Role</label>
                <div className="flex gap-2">
                  <RoleChip label="Employee" emoji="👔" value="employee" selected={orgRole === 'employee'} onClick={() => setOrgRole('employee')} />
                  <RoleChip label="Manager" emoji="🧑‍💼" value="manager" selected={orgRole === 'manager'} onClick={() => setOrgRole('manager')} />
                  <RoleChip label="CEO" emoji="👑" value="ceo" selected={orgRole === 'ceo'} onClick={() => setOrgRole('ceo')} />
                </div>
              </div>

              <Field label="Department (optional)" icon={<Building2 className="w-4 h-4" />}>
                <input
                  {...orgForm.register('department')}
                  placeholder="e.g. Engineering, Finance..."
                  className={inputCls()}
                />
              </Field>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={orgForm.formState.isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-primary to-accent shadow-md disabled:opacity-70 transition-all mt-2"
              >
                {orgForm.formState.isSubmitting
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : '🏢 Create Organization Account'
                }
              </motion.button>
            </motion.form>
          )}

          {/* ── Individual form ───────────────────────────────────────── */}
          {accountType === 'individual' && (
            <motion.form
              key="individual-form"
              data-testid="individual-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={individualForm.handleSubmit(onSubmitIndividual)}
              className="space-y-4"
            >
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-100">
                Personal Account — just for you
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{error}</div>
              )}
              {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm border border-green-100">{success}</div>
              )}

              <Field label="Full Name" icon={<User className="w-4 h-4" />} error={individualForm.formState.errors.full_name?.message}>
                <input
                  {...individualForm.register('full_name')}
                  placeholder="Riya Sharma"
                  className={inputCls(!!individualForm.formState.errors.full_name)}
                />
              </Field>

              <Field label="Email" icon={<Mail className="w-4 h-4" />} error={individualForm.formState.errors.email?.message}>
                <input
                  {...individualForm.register('email')}
                  type="email"
                  placeholder="you@email.com"
                  className={inputCls(!!individualForm.formState.errors.email)}
                />
              </Field>

              <Field label="Password" icon={<Lock className="w-4 h-4" />} error={individualForm.formState.errors.password?.message}>
                <input
                  {...individualForm.register('password')}
                  type="password"
                  placeholder="Min 8 chars, uppercase, number"
                  className={inputCls(!!individualForm.formState.errors.password)}
                />
              </Field>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What are you tracking?{' '}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_OPTIONS.map(area => (
                    <FocusChip
                      key={area}
                      label={area}
                      selected={focusAreas.includes(area)}
                      onClick={() => toggleFocus(area)}
                    />
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={individualForm.formState.isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-400 shadow-md disabled:opacity-70 transition-all mt-2"
              >
                {individualForm.formState.isSubmitting
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : '🙋 Create Personal Account'
                }
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:text-accent">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep "Signup" || echo "Signup: no errors"
```

Expected: `Signup: no errors`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Signup.tsx
git commit -m "feat(frontend): rewrite Signup with two-path Layout C (Organization + Personal)"
```

---

### Task 4: Update Login.tsx — individual routing

**Files:**
- Modify: `frontend/src/pages/Login.tsx` lines 60–62

- [ ] **Step 1: Update the post-login routing block**

In `frontend/src/pages/Login.tsx`, find lines 60–62:

```typescript
      // Role-based routing
      if (user.role === 'ceo') navigate('/ceo/dashboard');
      else if (user.role === 'manager') navigate('/manager/dashboard');
      else navigate('/employee/dashboard');
```

Replace with:

```typescript
      // Account-type and role-based routing
      if (user.account_type === 'individual') navigate('/individual/dashboard');
      else if (user.role === 'ceo') navigate('/ceo/dashboard');
      else if (user.role === 'manager') navigate('/manager/dashboard');
      else navigate('/employee/dashboard');
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep "Login" || echo "Login: no errors"
```

Expected: `Login: no errors`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Login.tsx
git commit -m "feat(frontend): route individual users to /individual/dashboard after login"
```

---

### Task 5: Update App.tsx — ProtectedRoute + individual route

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Import IndividualDashboard**

At the top of `frontend/src/App.tsx`, add the import after the existing page imports:

```typescript
import IndividualDashboard from './pages/IndividualDashboard';
```

- [ ] **Step 2: Replace ProtectedRoute**

Find the existing `ProtectedRoute` function (lines 27–36) and replace it entirely:

```typescript
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Individual users bypass role restrictions — they are their own admin
  if (user?.account_type === 'individual') return <>{children}</>;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'ceo') return <Navigate to="/ceo/dashboard" replace />;
    if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
    return <Navigate to="/employee/dashboard" replace />;
  }
  return <>{children}</>;
};
```

- [ ] **Step 3: Add individual dashboard route**

Inside `<Route element={<ProtectedLayout />}>`, add the individual dashboard route after the kanban route (around line 82):

```tsx
{/* Individual */}
<Route path="/individual/dashboard" element={<ProtectedRoute><IndividualDashboard /></ProtectedRoute>} />
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep "App\|IndividualDashboard" || echo "App: no errors"
```

Expected: `App: no errors`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): add individual dashboard route and update ProtectedRoute for individual accounts"
```

---

### Task 6: Create IndividualDashboard.tsx

**Files:**
- Create: `frontend/src/pages/IndividualDashboard.tsx`

- [ ] **Step 1: Create the file**

Create `frontend/src/pages/IndividualDashboard.tsx` with this content:

```tsx
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusCircle, History, Columns, Zap, TrendingUp,
  CalendarDays, Flame, ArrowRight, FileText,
} from 'lucide-react';
import axios from '../api/axios';
import { format, subDays } from 'date-fns';

const LOCAL_TODAY = format(new Date(), 'yyyy-MM-dd');
const LAST_7 = format(subDays(new Date(), 6), 'yyyy-MM-dd');

function StatCard({
  label, value, icon, color,
}: {
  label: string; value: string | number; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function IndividualDashboard() {
  const { user } = useAuthStore();
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [reportCount, setReportCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const load = async () => {
      try {
        const [historyRes, monthRes] = await Promise.all([
          axios.get(`/reports/?date_from=${LAST_7}&date_to=${LOCAL_TODAY}`),
          axios.get(`/reports/?date_from=${format(subDays(new Date(), 29), 'yyyy-MM-dd')}&date_to=${LOCAL_TODAY}`),
        ]);

        const recent = Array.isArray(historyRes.data)
          ? historyRes.data
          : historyRes.data.results ?? [];
        setRecentReports(recent.slice(0, 5));

        const month = Array.isArray(monthRes.data)
          ? monthRes.data
          : monthRes.data.results ?? [];
        setReportCount(month.length);

        // Calculate streak — consecutive days with a report ending today
        const dates = recent.map((r: any) => r.date ?? r.created_at?.slice(0, 10)).filter(Boolean);
        let s = 0;
        for (let i = 0; i < 7; i++) {
          const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
          if (dates.includes(d)) s++;
          else break;
        }
        setStreak(s);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const fetchAI = async () => {
      setAiLoading(true);
      try {
        const res = await axios.post('/ai/query/', {
          query: `Give me a concise personal productivity summary for ${user?.full_name} based on their recent work reports. Focus on patterns, achievements, and one actionable suggestion. Keep it under 3 sentences.`,
        });
        setAiSummary(res.data?.response ?? res.data?.answer ?? '');
      } catch {
        setAiSummary('');
      } finally {
        setAiLoading(false);
      }
    };
    fetchAI();
  }, [user?.full_name]);

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Welcome header */}
      <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-gray-900">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <StatCard
          label="Reports this month"
          value={loading ? '—' : reportCount}
          icon={<FileText className="w-5 h-5 text-primary" />}
          color="bg-primary/10"
        />
        <StatCard
          label="Day streak 🔥"
          value={loading ? '—' : streak}
          icon={<Flame className="w-5 h-5 text-amber-500" />}
          color="bg-amber-50"
        />
        <StatCard
          label="Reports (last 7 days)"
          value={loading ? '—' : recentReports.length}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          color="bg-emerald-50"
        />
      </motion.div>

      {/* AI Insight */}
      <motion.div
        className="glass rounded-2xl p-6"
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.2 }}
        data-testid="ai-insight-card"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">AI Insight</p>
            <p className="text-xs text-gray-400">Your personal productivity summary</p>
          </div>
        </div>
        {aiLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Generating your summary...
          </div>
        ) : aiSummary ? (
          <p className="text-gray-700 text-sm leading-relaxed">{aiSummary}</p>
        ) : (
          <p className="text-gray-400 text-sm">Log some work reports to get AI-powered insights about your productivity patterns.</p>
        )}
      </motion.div>

      {/* Recent activity */}
      <motion.div
        className="glass rounded-2xl p-6"
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Activity</h2>
          <Link to="/employee/history" className="text-xs font-semibold text-primary hover:text-accent flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentReports.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No recent reports. Start logging your work!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentReports.map((report, idx) => (
              <div key={report.id ?? idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {report.date ?? report.created_at?.slice(0, 10) ?? 'Report'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {report.tasks?.length ?? 0} tasks · {report.status ?? 'submitted'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Link to="/employee/report/new"
          className="glass rounded-2xl p-5 flex items-center gap-3 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
            <PlusCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Log today's work</p>
            <p className="text-xs text-gray-400">Submit a report</p>
          </div>
        </Link>

        <Link to="/kanban"
          className="glass rounded-2xl p-5 flex items-center gap-3 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
            <Columns className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Open Kanban</p>
            <p className="text-xs text-gray-400">View your tasks</p>
          </div>
        </Link>

        <Link to="/employee/history"
          className="glass rounded-2xl p-5 flex items-center gap-3 hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
            <History className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Report history</p>
            <p className="text-xs text-gray-400">Browse past logs</p>
          </div>
        </Link>
      </motion.div>

    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep "IndividualDashboard" || echo "IndividualDashboard: no errors"
```

Expected: `IndividualDashboard: no errors`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/IndividualDashboard.tsx
git commit -m "feat(frontend): add IndividualDashboard page with stats, AI insight, recent activity"
```

---

### Task 7: Update Layout.tsx — individual nav filtering + badge

**Files:**
- Modify: `frontend/src/components/Layout.tsx`

- [ ] **Step 1: Add 'individual' to ROLE_BADGE**

Find the `ROLE_BADGE` constant (around line 71) and add the individual entry:

```typescript
const ROLE_BADGE: Record<string,{ label:string; cls:string }> = {
  ceo:        { label:'CEO',      cls:'bg-amber-400/20 text-amber-300 border border-amber-400/30' },
  manager:    { label:'Manager',  cls:'bg-blue-400/20 text-blue-300 border border-blue-400/30' },
  employee:   { label:'Employee', cls:'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' },
  individual: { label:'Personal', cls:'bg-violet-400/20 text-violet-300 border border-violet-400/30' },
};
```

- [ ] **Step 2: Update `visibleItems` to handle individual accounts**

Find the `visibleItems` function (around line 78) and replace it:

```typescript
function visibleItems(g: AnyGroup, role: string, accountType = 'organization') {
  // Individual users: show all settings (override ceo-only restriction),
  // reroute dashboard to /individual/dashboard, hide nothing else
  // (management group is already excluded at group level since role='employee')
  if (accountType === 'individual') {
    if (g.id === 'settings') {
      // show all 5 settings items including System Config and Locations
      return [...g.items] as any[];
    }
    // reroute "My Dashboard" to /individual/dashboard
    const base = g.items.filter(i => (i.roles as readonly string[]).includes(role));
    return base.map(i =>
      i.to === '/employee/dashboard' ? { ...i, to: '/individual/dashboard' } : i
    ) as any[];
  }
  return g.items.filter(i => (i.roles as readonly string[]).includes(role));
}
```

- [ ] **Step 3: Update `CompactSidebarContent` to pass accountType**

Find `CompactSidebarContent` (around line 165). Update the `role` and `groups` lines:

```typescript
function CompactSidebarContent({ isRight }: { isRight: boolean }) {
  const { user, logout, branding } = useAuthStore();
  const navigate = useNavigate();
  const initials = user?.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() ?? '?';
  const role = user?.role ?? 'employee';
  const accountType = user?.account_type ?? 'organization';
  const groups: AnyGroup[] = [...NAV_GROUPS.filter(g=>(g.roles as readonly string[]).includes(role)), SETTINGS_GROUP];
```

Then in the `groups.map` call inside the return, update the `visibleItems` call:

```typescript
      {groups.map(group => {
        const items = visibleItems(group, role, accountType);
        if (!items.length) return null;
        return <CompactGroupButton key={group.id} group={group} items={items as AnyGroup['items'][number][]} isRight={isRight} />;
      })}
```

- [ ] **Step 4: Update `FullSidebarContent` to pass accountType and use individual badge**

Find `FullSidebarContent` (around line 206). Update the variables block and badge usage:

```typescript
function FullSidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout, branding } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role ?? 'employee';
  const accountType = user?.account_type ?? 'organization';
  const badgeKey = accountType === 'individual' ? 'individual' : role;
  const rb = ROLE_BADGE[badgeKey] ?? ROLE_BADGE.employee;
  const initials = user?.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() ?? '?';
  const companyName = branding.name && branding.name !== APP_NAME ? branding.name : '';

  const allGroups: AnyGroup[] = [...NAV_GROUPS.filter(g=>(g.roles as readonly string[]).includes(role)), SETTINGS_GROUP];
```

Then update `visibleItems` call inside `allGroups.map`:

```typescript
        const items = visibleItems(group, role, accountType);
```

- [ ] **Step 5: Update `TopNavLayout` to pass accountType and use individual badge**

Find `TopNavLayout` (around line 466). Update the variables:

```typescript
  const role = user?.role ?? 'employee';
  const accountType = user?.account_type ?? 'organization';
  const badgeKey = accountType === 'individual' ? 'individual' : role;
  const rb = ROLE_BADGE[badgeKey] ?? ROLE_BADGE.employee;
```

Update `visibleItems` call inside `allGroups.map` in the nav render:

```typescript
              const items = visibleItems(group, role, accountType);
```

Also update `allGroups.flatMap` for `activeItem`:

```typescript
  const activeItem = allGroups.flatMap(g => visibleItems(g, role, accountType)).find(i => i.to === location.pathname);
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep "Layout" || echo "Layout: no errors"
```

Expected: `Layout: no errors`

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "feat(frontend): update sidebar to show full settings for individual users and Personal badge"
```

---

### Task 8: Tests

**Files:**
- Create: `frontend/src/pages/__tests__/individualSignup.test.tsx`

- [ ] **Step 1: Create the test file**

Create `frontend/src/pages/__tests__/individualSignup.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Signup from '../Signup';
import IndividualDashboard from '../IndividualDashboard';

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
    fireEvent.click(screen.getByTestId('type-org'));
    expect(screen.getByTestId('org-form')).toBeInTheDocument();
  });

  it('individual form appears when Personal card is clicked', () => {
    renderSignup();
    expect(screen.queryByTestId('individual-form')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('type-individual'));
    expect(screen.getByTestId('individual-form')).toBeInTheDocument();
  });

  it('org form does not show role field visible to individual users', () => {
    renderSignup();
    fireEvent.click(screen.getByTestId('type-individual'));
    expect(screen.queryByText('Your Role')).not.toBeInTheDocument();
  });

  it('org form shows role chips (Employee, Manager, CEO)', () => {
    renderSignup();
    fireEvent.click(screen.getByTestId('type-org'));
    expect(screen.getByText('Employee')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();
  });

  it('individual form shows focus area chips', () => {
    renderSignup();
    fireEvent.click(screen.getByTestId('type-individual'));
    expect(screen.getByText('💼 Work output')).toBeInTheDocument();
    expect(screen.getByText('🎯 Daily goals')).toBeInTheDocument();
  });

  it('individual form does not show department field', () => {
    renderSignup();
    fireEvent.click(screen.getByTestId('type-individual'));
    expect(screen.queryByPlaceholderText(/engineering.*finance/i)).not.toBeInTheDocument();
  });

  it('switching from org to individual hides org form and shows individual form', () => {
    renderSignup();
    fireEvent.click(screen.getByTestId('type-org'));
    expect(screen.getByTestId('org-form')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('type-individual'));
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

  it('renders Log today\'s work quick action link to /employee/report/new', () => {
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
```

- [ ] **Step 2: Run tests**

```bash
cd frontend
npm test
```

Expected output:
```
✓ frontend/src/pages/__tests__/individualSignup.test.tsx (12 tests)
  ✓ Signup — two-path layout (10)
  ✓ IndividualDashboard (5 [sic — 6])
Test Files: X passed
```

All tests pass. If any fail, fix the issue before continuing.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/__tests__/individualSignup.test.tsx
git commit -m "test(frontend): add Signup two-path and IndividualDashboard tests"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ account_type field → Task 1
- ✅ UserCreateSerializer + UserSerializer → Task 1
- ✅ Migration → Task 1
- ✅ useAuthStore User type → Task 2
- ✅ Signup Layout C rewrite → Task 3
- ✅ Login routing → Task 4
- ✅ ProtectedRoute individual bypass → Task 5
- ✅ /individual/dashboard route → Task 5
- ✅ IndividualDashboard page → Task 6
- ✅ Sidebar individual nav (visibleItems, badge) → Task 7
- ✅ Full settings access for individual (visibleItems settings override) → Task 7
- ✅ Tests → Task 8

**Acceptance criteria mapped:**
- ✅ `/signup` shows two cards, no form until clicked → Task 3
- ✅ Org form shows role chips + department → Task 3
- ✅ Individual form shows name/email/password + focus chips, no role → Task 3
- ✅ Org submit sends `account_type: 'organization'` → Task 3
- ✅ Individual submit sends `account_type: 'individual'`, `role: 'employee'` → Task 3
- ✅ Individual login → `/individual/dashboard` → Task 4
- ✅ Org login routing unchanged → Task 4
- ✅ Individual dashboard: personal stats, AI insight, recent activity, quick actions → Task 6
- ✅ Sidebar hides manager/CEO/user management for individual → Task 7 (management group already excluded by role='employee')
- ✅ Sidebar shows all 5 Settings links for individual → Task 7
- ✅ ProtectedRoute bypasses role for individual → Task 5
- ✅ Existing org users unaffected (migration default) → Task 1
