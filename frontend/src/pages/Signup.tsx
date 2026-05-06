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
