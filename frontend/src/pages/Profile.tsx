import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Briefcase, Lock, Check, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', department: user?.department || '' });
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  const saveProfile = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await api.patch('/auth/me/', profile);
      setUser(res.data.data);
      setMsg('Profile updated successfully!');
    } catch { setMsg('Failed to update profile.'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    setPwMsg(''); setPwError('');
    if (passwords.new_password !== passwords.confirm) { setPwError('Passwords do not match.'); return; }
    if (passwords.new_password.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
    setChangingPw(true);
    try {
      await api.post('/auth/me/password/', { old_password: passwords.old_password, new_password: passwords.new_password });
      setPwMsg('Password changed successfully!');
      setPasswords({ old_password: '', new_password: '', confirm: '' });
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally { setChangingPw(false); }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {user?.full_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">{user?.full_name}</p>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
            user?.role === 'ceo' ? 'bg-purple-100 text-purple-700' :
            user?.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
          }`}>{user?.role}</span>
        </div>
      </div>

      {/* Profile form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl space-y-4">
        <h2 className="font-bold text-gray-900">Personal Information</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email (read-only)</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={user?.email} readOnly
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={profile.department} onChange={e => setProfile({ ...profile, department: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>

        {msg && (
          <p className={`text-sm flex items-center gap-1 ${msg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
            {msg.includes('success') && <Check className="w-4 h-4" />} {msg}
          </p>
        )}

        <button onClick={saveProfile} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-medium disabled:opacity-70 transition-all">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Changes
        </button>
      </motion.div>

      {/* Password change */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6 rounded-2xl space-y-4">
        <h2 className="font-bold text-gray-900">Change Password</h2>

        {['old_password', 'new_password', 'confirm'].map((field, i) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field === 'old_password' ? 'Current Password' : field === 'new_password' ? 'New Password' : 'Confirm New Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="password" value={(passwords as any)[field]}
                onChange={e => setPasswords({ ...passwords, [field]: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        ))}

        {pwError && <p className="text-sm text-red-500">{pwError}</p>}
        {pwMsg && <p className="text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" />{pwMsg}</p>}

        <button onClick={changePassword} disabled={changingPw}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-medium disabled:opacity-70 hover:bg-gray-700 transition-colors">
          {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          Update Password
        </button>
      </motion.div>
    </div>
  );
}
