import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Zap, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { APP_NAME, APP_TAGLINE } from '../constants';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [error, setError] = useState('');
  const [branding, setBranding] = useState({ name: '', logo: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await axios.get('/api/settings/public/');
        if (res.data.success) {
          const d = res.data.data;
          setBranding({
            name: d.company_name || '',
            logo: d.company_logo_url || '',
          });
        }
      } catch (err) { /* silent fail */ }
    };
    fetchBranding();
  }, []);

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      // Use absolute URL since this doesn't need auth token
      const response = await axios.post('/api/auth/login/', data);
      
      const { access, refresh, user } = response.data;
      setAuth(access, refresh, user);
      
      // Role-based routing
      if (user.role === 'ceo') navigate('/ceo/dashboard');
      else if (user.role === 'manager') navigate('/manager/dashboard');
      else navigate('/employee/dashboard');
      
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setResetting(true);
    setResetStatus(null);
    try {
      const res = await axios.post('/api/auth/forgot-password/', { email: forgotEmail });
      setResetStatus({ msg: res.data.message, type: 'success' });
      setTimeout(() => {
        setForgotPasswordOpen(false);
        setResetStatus(null);
        setForgotEmail('');
      }, 3000);
    } catch (err: any) {
      setResetStatus({ msg: err.response?.data?.message || 'Failed to reset password', type: 'error' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">

      {/* ── Left decorative panel (hidden on mobile) ─────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex-col items-center justify-center p-12">
        {/* blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative text-center">
          {/* App icon */}
          <div className="w-20 h-20 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-6 shadow-2xl backdrop-blur-sm overflow-hidden">
            {branding.logo
              ? <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
              : <Zap className="w-10 h-10 text-white" />
            }
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">{APP_NAME}</h2>
          {branding.name && (
            <p className="text-white/60 text-sm font-semibold uppercase tracking-widest mb-4">{branding.name}</p>
          )}
          <p className="text-white/50 text-sm max-w-xs mx-auto leading-relaxed">{APP_TAGLINE}</p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {['Daily Reports', 'Task Tracking', 'Team Analytics', 'Role Management'].map(f => (
              <span key={f} className="px-3 py-1 bg-white/10 border border-white/15 text-white/70 text-xs font-medium rounded-full">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: login form ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Mobile bg blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl lg:hidden" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl lg:hidden" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Mobile logo — only shown on small screens */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg mb-3 overflow-hidden p-1">
              {branding.logo
                ? <img src={branding.logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                : <Zap className="w-8 h-8 text-white" />
              }
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">{APP_NAME}</h1>
            {branding.name && (
              <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mt-0.5">{branding.name}</p>
            )}
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 mt-1 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm border border-red-100 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@company.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-200 focus:ring-primary/20 focus:border-primary'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <button type="button" onClick={() => setForgotPasswordOpen(true)}
                  className="text-xs font-semibold text-primary hover:text-accent transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-3 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-200 focus:ring-primary/20 focus:border-primary'
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-primary to-accent shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-2"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </motion.button>
          </form>

          {/* Sign up */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:text-accent transition-colors">Sign up</Link>
          </p>

          {/* Footer */}
          {branding.name && (
            <p className="text-center text-xs text-gray-400 mt-8">
              Powered by <span className="font-semibold text-gray-600">{branding.name}</span>
            </p>
          )}
        </motion.div>
      </div>

      {/* ── Forgot Password Modal ─────────────────────────────────────── */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-4">Enter your email — we'll send a new temporary password.</p>

            {resetStatus && (
              <div className={`p-3 rounded-xl mb-4 text-sm font-medium border ${
                resetStatus.type === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-600 border-red-100'
              }`}>
                {resetStatus.msg}
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div className="relative mb-4">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                  required />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setForgotPasswordOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={resetting || !forgotEmail}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-primary to-accent text-white rounded-xl font-semibold shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2 transition-all">
                  {resetting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Reset
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
