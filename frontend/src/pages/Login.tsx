import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Briefcase } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { APP_NAME, APP_TAGLINE, COMPANY_NAME } from '../constants';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [error, setError] = useState('');
  const [branding, setBranding] = useState({ name: APP_NAME, logo: '' });
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
          setBranding({
            name: APP_NAME,
            logo: res.data.data.company_logo_url || ''
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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-[100px] opacity-70"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-[100px] opacity-70"
      />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-tr from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg mb-4 p-1"
          >
            {branding.logo ? (
              <img src={branding.logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
            ) : (
              <Briefcase className="w-10 h-10 text-white" />
            )}
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{APP_NAME}</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-2">{COMPANY_NAME}</p>
          <p className="text-gray-500 text-center text-sm">{APP_TAGLINE}</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center border border-red-100"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('email')}
                type="email"
                className={`block w-full pl-10 pr-3 py-3 border ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-primary focus:border-primary'} rounded-xl focus:outline-none focus:ring-2 transition-shadow bg-white/50 backdrop-blur-sm`}
                placeholder="you@company.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <button type="button" onClick={() => setForgotPasswordOpen(true)} className="text-sm font-medium text-primary hover:text-accent transition-colors">Forgot password?</button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('password')}
                type="password"
                className={`block w-full pl-10 pr-3 py-3 border ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-primary focus:border-primary'} rounded-xl focus:outline-none focus:ring-2 transition-shadow bg-white/50 backdrop-blur-sm`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-medium text-white bg-gradient-to-r from-primary to-accent hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </motion.button>
          <p className="mt-8 text-center text-xs text-gray-400">
            Powered by <span className="font-semibold text-gray-600">{COMPANY_NAME}</span>
          </p>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary font-medium hover:text-accent transition-colors">Sign up</Link>
        </p>
      </motion.div>

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-4">Enter your email and we'll send you a new temporary password.</p>
            
            {resetStatus && (
              <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${resetStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {resetStatus.msg}
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none mb-4"
                required
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setForgotPasswordOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" disabled={resetting || !forgotEmail} className="px-4 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {resetting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send New Password
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
