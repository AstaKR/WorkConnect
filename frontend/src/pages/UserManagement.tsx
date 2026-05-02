import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit2, UserX, UserCheck, X, Loader2, Camera,
  User, Briefcase, MapPin, Shield, AlertTriangle, ChevronDown,
  Download, Upload, Trash2, CheckSquare, Key, Eye, EyeOff, Check
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserFull {
  id: number; email: string; full_name: string; role: string;
  profile_pic: string | null; profile_pic_url: string | null;
  dob: string; phone: string; address: string; city: string; state: string; pincode: string;
  employee_id: string; designation: string; grade: string; department: string;
  manager: number | null; manager_name: string; manager_email: string;
  employment_status: string; start_date: string; last_working_date: string;
  emergency_contact_name: string; emergency_contact_phone: string; emergency_contact_relation: string;
  is_active: boolean; date_joined: string;
}

const EMPTY: Partial<UserFull> = {
  full_name: '', email: '', role: 'employee', phone: '', dob: '',
  address: '', city: '', state: '', pincode: '',
  employee_id: '', designation: '', grade: '', department: '',
  manager: null, employment_status: 'active', start_date: '', last_working_date: '',
  emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  probation: 'bg-blue-100 text-blue-700',
  on_leave: 'bg-yellow-100 text-yellow-700',
  resigned: 'bg-orange-100 text-orange-700',
  terminated: 'bg-red-100 text-red-700',
  retired: 'bg-gray-100 text-gray-600',
};

const TABS = [
  { id: 'personal', label: 'Personal', icon: <User className="w-4 h-4" /> },
  { id: 'work', label: 'Work', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'address', label: 'Address', icon: <MapPin className="w-4 h-4" /> },
  { id: 'emergency', label: 'Emergency', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'account', label: 'Account', icon: <Shield className="w-4 h-4" /> },
];

// ─── Field helpers ────────────────────────────────────────────────────────────
const F = ({ label, name, type = 'text', value, onChange, placeholder = '', readOnly = false }: any) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
    <input type={type} value={value ?? ''} onChange={e => onChange(name, e.target.value)}
      placeholder={placeholder} readOnly={readOnly}
      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
        readOnly ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100' : 'border-gray-200 bg-white'
      }`} />
  </div>
);

const S = ({ label, name, value, onChange, options }: any) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
    <div className="relative">
      <select value={value ?? ''} onChange={e => onChange(name, e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary appearance-none bg-white pr-8">
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UserManagement() {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<UserFull[]>([]);
  const [managers, setManagers] = useState<UserFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modal, setModal] = useState<{ open: boolean; data: Partial<UserFull>; isNew: boolean }>({ open: false, data: EMPTY, isNew: true });
  const [activeTab, setActiveTab] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [adminResetPwd, setAdminResetPwd] = useState('');
  const [adminResetConfirm, setAdminResetConfirm] = useState('');
  const [resettingPwd, setResettingPwd] = useState(false);
  const [pwdResetMsg, setPwdResetMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [showAdminReset, setShowAdminReset] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importCsv, setImportCsv] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ message: string; errors: string[] } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users/');
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      setUsers(list);
      setManagers(list.filter((u: UserFull) => u.role === 'manager' || u.role === 'ceo'));
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openNew = () => {
    setModal({ open: true, data: { ...EMPTY }, isNew: true });
    setActiveTab('personal'); setProfileFile(null); setProfilePreview(null); setPassword(''); setError('');
  };

  const openEdit = (u: UserFull) => {
    setModal({ open: true, data: { ...u }, isNew: false });
    setActiveTab('personal'); setProfileFile(null); setProfilePreview(null); setError('');
    setAdminResetPwd(''); setAdminResetConfirm(''); setPwdResetMsg(null); setShowAdminReset(false);
  };

  const closeModal = () => { setModal({ open: false, data: EMPTY, isNew: true }); setError(''); };

  const setField = (name: string, value: any) => setModal(m => ({ ...m, data: { ...m.data, [name]: value } }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const hasFile = !!profileFile;
      let payload: any;
      let config: any = {};

      if (hasFile) {
        payload = new FormData();
        Object.entries(modal.data).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== '' && k !== 'profile_pic' && k !== 'profile_pic_url') {
            payload.append(k, String(v));
          }
        });
        payload.append('profile_pic', profileFile!);
        if (modal.isNew && password) payload.append('password', password);
        config.headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        payload = { ...modal.data };
        delete payload.profile_pic;
        delete payload.profile_pic_url;
        if (modal.isNew) payload.password = password;
      }

      if (modal.isNew) {
        await api.post('/auth/users/', payload, config);
      } else {
        const { email, date_joined, manager_name, manager_email, ...rest } = payload;
        await api.patch(`/auth/users/${modal.data.id}/`, rest, config);
      }
      closeModal(); fetchUsers();
    } catch (err: any) {
      const d = err.response?.data?.data || err.response?.data;
      if (typeof d === 'object' && d !== null) {
        setError(Object.entries(d).map(([k, v]) => `${k}: ${(v as any[]).join(' ')}`).join(' | '));
      } else { setError(typeof d === 'string' ? d : 'Failed to save. Check all fields.'); }
    } finally { setSaving(false); }
  };

  const toggleActive = async (u: UserFull) => {
    try {
      if (u.is_active) await api.patch(`/auth/users/${u.id}/`, { is_active: false });
      else await api.patch(`/auth/users/${u.id}/`, { is_active: true });
      fetchUsers();
    } catch { alert('Failed to update user status'); }
  };

  const handleDelete = async (u: UserFull) => {
    if (!window.confirm(`Permanently delete ${u.full_name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/auth/users/${u.id}/`);
      fetchUsers();
    } catch { alert('Failed to delete user'); }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/auth/users/export/', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'users_export.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Export failed'); }
  };

  const handleImport = async () => {
    if (!importCsv.trim()) return;
    setImporting(true);
    try {
      const res = await api.post('/auth/users/import/', { csv_data: importCsv });
      setImportResult({ message: res.data.message, errors: res.data.errors || [] });
      fetchUsers();
    } catch (err: any) {
      setImportResult({ message: err.response?.data?.message || 'Import failed', errors: [] });
    } finally { setImporting(false); }
  };

  const handleAdminResetPassword = async () => {
    if (!adminResetPwd) return;
    if (adminResetPwd !== adminResetConfirm) { setPwdResetMsg({ text: 'Passwords do not match', ok: false }); return; }
    setResettingPwd(true); setPwdResetMsg(null);
    try {
      await api.post(`/auth/users/${modal.data.id}/set_password/`, { new_password: adminResetPwd });
      setPwdResetMsg({ text: 'Password reset successfully', ok: true });
      setAdminResetPwd(''); setAdminResetConfirm(''); setShowAdminReset(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      setPwdResetMsg({ text: msg, ok: false });
    } finally { setResettingPwd(false); }
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImportCsv(ev.target?.result as string);
    reader.readAsText(file);
  };

  const IMPORT_TEMPLATE = `full_name,email,password,role,employee_id,designation,grade,department,phone,employment_status
John Doe,john@company.com,TempPass@123,employee,EMP001,Engineer,L3,IT,9876543210,active
Jane Smith,jane@company.com,TempPass@123,manager,EMP002,Team Lead,L5,IT,9876543211,active`;

  const filtered = users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.employee_id || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' || u.employment_status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const d = modal.data;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">{users.length} total members · {users.filter(u => u.is_active).length} active</p>
        </div>
        <div className="flex items-center gap-2">
          {me?.role === 'ceo' && (
            <>
              <button onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all shadow-sm">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button onClick={() => { setShowImport(true); setImportCsv(''); setImportResult(null); }}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all shadow-sm">
                <Upload className="w-4 h-4" /> Import CSV
              </button>
            </>
          )}
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all text-sm">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, ID..."
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl w-full text-sm focus:ring-2 focus:ring-primary bg-white shadow-sm" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary">
          <option value="all">All Roles</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="ceo">CEO</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="probation">Probation</option>
          <option value="on_leave">On Leave</option>
          <option value="resigned">Resigned</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-gray-500 font-semibold border-b border-gray-100 text-xs uppercase tracking-wide">
              <tr>
                <th className="py-3.5 px-5">Employee</th>
                <th className="py-3.5 px-5">Role / Grade</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5">Manager</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Joined</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Loading members...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No members found.</td></tr>
              ) : filtered.map(u => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={`hover:bg-gray-50/50 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      {u.profile_pic_url ? (
                        <img src={u.profile_pic_url} alt={u.full_name}
                          className="w-9 h-9 rounded-xl object-cover border border-gray-100 shadow-sm" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{u.full_name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                        {u.employee_id && <p className="text-xs text-gray-400"># {u.employee_id}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      u.role === 'ceo' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>{u.role}</span>
                    {u.grade && <p className="text-xs text-gray-400 mt-1">{u.grade} · {u.designation || ''}</p>}
                  </td>
                  <td className="py-4 px-5 text-gray-700">{u.department || <span className="text-gray-300">—</span>}</td>
                  <td className="py-4 px-5">
                    {u.manager_name ? (
                      <div>
                        <p className="text-sm font-medium text-gray-800">{u.manager_name}</p>
                        <p className="text-xs text-gray-400">{u.manager_email}</p>
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[u.employment_status] || 'bg-gray-100 text-gray-600'}`}>
                      {u.employment_status?.replace('_', ' ')}
                    </span>
                    {!u.is_active && <span className="block text-xs text-red-400 mt-0.5">Deactivated</span>}
                  </td>
                  <td className="py-4 px-5 text-gray-500 text-xs">
                    {u.start_date || new Date(u.date_joined).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-5 text-right">
                    {u.id !== me?.id && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)}
                          className="p-2 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleActive(u)}
                          className={`p-2 rounded-xl transition-colors ${u.is_active ? 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-600' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
                          title={u.is_active ? 'Deactivate' : 'Reactivate'}>
                          {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        {me?.role === 'ceo' && (
                          <button onClick={() => handleDelete(u)}
                            className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete Permanently">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal.open && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-4">

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {/* Profile pic */}
                  <div className="relative">
                    {profilePreview || d.profile_pic_url ? (
                      <img src={profilePreview || d.profile_pic_url!} alt="Profile"
                        className="w-12 h-12 rounded-xl object-cover border-2 border-primary/20" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {(d.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors">
                      <Camera className="w-3 h-3" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{modal.isNew ? 'Add New Member' : `Edit — ${d.full_name}`}</h2>
                    {!modal.isNew && <p className="text-xs text-gray-400">{d.email}</p>}
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 px-2 pt-2">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors mr-1 ${
                      activeTab === tab.id ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6 space-y-4 min-h-[340px]">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl">{error}</div>
                )}

                {/* ── Personal Tab ── */}
                {activeTab === 'personal' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <F label="Full Name *" name="full_name" value={d.full_name} onChange={setField} placeholder="John Doe" />
                    </div>
                    <F label="Date of Birth" name="dob" type="date" value={d.dob} onChange={setField} />
                    <F label="Phone Number" name="phone" value={d.phone} onChange={setField} placeholder="+91 98765 43210" />
                  </div>
                )}

                {/* ── Work Tab ── */}
                {activeTab === 'work' && (
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Employee ID" name="employee_id" value={d.employee_id} onChange={setField} placeholder="EMP001" />
                    <F label="Designation / Title" name="designation" value={d.designation} onChange={setField} placeholder="Software Engineer" />
                    <F label="Grade / Level" name="grade" value={d.grade} onChange={setField} placeholder="L3, Senior, etc." />
                    <F label="Department" name="department" value={d.department} onChange={setField} placeholder="IT, Finance..." />
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Reporting Manager</label>
                      <div className="relative">
                        <select value={d.manager ?? ''} onChange={e => setField('manager', e.target.value ? Number(e.target.value) : null)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary appearance-none bg-white pr-8">
                          <option value="">— No Manager —</option>
                          {managers.filter(m => m.id !== d.id).map(m => (
                            <option key={m.id} value={m.id}>{m.full_name} ({m.email})</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <S label="Employment Status" name="employment_status" value={d.employment_status} onChange={setField}
                      options={[
                        { value: 'active', label: 'Active' }, { value: 'probation', label: 'Probation' },
                        { value: 'on_leave', label: 'On Leave' }, { value: 'resigned', label: 'Resigned' },
                        { value: 'terminated', label: 'Terminated' }, { value: 'retired', label: 'Retired' },
                      ]} />
                    <div />
                    <F label="Start / Joining Date" name="start_date" type="date" value={d.start_date} onChange={setField} />
                    <F label="Last Working Date" name="last_working_date" type="date" value={d.last_working_date} onChange={setField} />
                  </div>
                )}

                {/* ── Address Tab ── */}
                {activeTab === 'address' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Street Address</label>
                      <textarea value={d.address ?? ''} onChange={e => setField('address', e.target.value)}
                        rows={2} placeholder="House No., Street, Area..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary resize-none" />
                    </div>
                    <F label="City" name="city" value={d.city} onChange={setField} placeholder="Chennai" />
                    <F label="State" name="state" value={d.state} onChange={setField} placeholder="Tamil Nadu" />
                    <F label="Pincode" name="pincode" value={d.pincode} onChange={setField} placeholder="600001" />
                  </div>
                )}

                {/* ── Emergency Tab ── */}
                {activeTab === 'emergency' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 p-3 bg-orange-50 border border-orange-100 rounded-xl text-xs text-orange-700">
                      Emergency contact details are only visible to HR and management.
                    </div>
                    <F label="Contact Name" name="emergency_contact_name" value={d.emergency_contact_name} onChange={setField} placeholder="Jane Doe" />
                    <F label="Relationship" name="emergency_contact_relation" value={d.emergency_contact_relation} onChange={setField} placeholder="Spouse, Parent..." />
                    <div className="col-span-2">
                      <F label="Contact Phone" name="emergency_contact_phone" value={d.emergency_contact_phone} onChange={setField} placeholder="+91 98765 43210" />
                    </div>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <F label="Email Address *" name="email" type="email" value={d.email} onChange={setField}
                        readOnly={!modal.isNew} placeholder="employee@company.com" />
                      {!modal.isNew && <p className="text-xs text-gray-400 mt-1">Email cannot be changed after account creation.</p>}
                    </div>
                    {modal.isNew && (
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Password *</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                          placeholder="Min 8 chars, upper+lower+digit"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary" />
                      </div>
                    )}
                    <div className="col-span-2">
                      <S label="Role / Access Level" name="role" value={d.role} onChange={setField}
                        options={[
                          { value: 'employee', label: 'Employee — Can submit daily reports' },
                          { value: 'manager', label: 'Manager — Can approve team reports' },
                          ...(me?.role === 'ceo' ? [{ value: 'ceo', label: 'CEO — Full system access' }] : []),
                        ]} />
                    </div>
                    {me?.role === 'ceo' && (
                      <div className="col-span-2 p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-700">
                        <strong>CEO Note:</strong> You can assign any role including CEO. Use with caution.
                      </div>
                    )}

                    {/* ── Admin Password Reset (edit mode only) ── */}
                    {!modal.isNew && (
                      <div className="col-span-2">
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <button type="button"
                            onClick={() => { setShowAdminReset(v => !v); setPwdResetMsg(null); }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors">
                            <Key className="w-4 h-4 text-amber-500" />
                            Reset User Password
                            <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showAdminReset ? 'rotate-180' : ''}`} />
                          </button>
                          {showAdminReset && (
                            <div className="p-4 space-y-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500">Set a new password for this user. They will need to use it on next login.</p>
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">New Password</label>
                                <input type="password" value={adminResetPwd} onChange={e => setAdminResetPwd(e.target.value)}
                                  placeholder="Min 8 chars, upper+lower+digit"
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Confirm Password</label>
                                <input type="password" value={adminResetConfirm} onChange={e => setAdminResetConfirm(e.target.value)}
                                  placeholder="Repeat the new password"
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary" />
                              </div>
                              {pwdResetMsg && (
                                <div className={`flex items-center gap-2 text-xs p-2.5 rounded-lg ${pwdResetMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                  {pwdResetMsg.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                  {pwdResetMsg.text}
                                </div>
                              )}
                              <button type="button" onClick={handleAdminResetPassword}
                                disabled={resettingPwd || !adminResetPwd || !adminResetConfirm}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
                                {resettingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                Reset Password
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                <div className="flex gap-1">
                  {TABS.map((tab, i) => (
                    <div key={tab.id} className={`w-2 h-2 rounded-full transition-colors ${activeTab === tab.id ? 'bg-primary' : 'bg-gray-200'}`} />
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-medium shadow-sm disabled:opacity-70 flex items-center gap-2 hover:shadow-md transition-all">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {modal.isNew ? 'Create Member' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImport && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /><h2 className="font-bold text-gray-900">Import Members from CSV</h2></div>
                <button onClick={() => setShowImport(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                  <strong>Required columns:</strong> full_name, email, password (optional), role, employee_id, designation, grade, department, phone, employment_status
                </div>
                {importResult ? (
                  <div className={`p-4 rounded-xl border text-sm ${importResult.errors.length > 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                    <p className="font-semibold">{importResult.message}</p>
                    {importResult.errors.map((e, i) => <p key={i} className="text-xs mt-1 text-red-600">• {e}</p>)}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <button onClick={() => setImportCsv(IMPORT_TEMPLATE)} className="text-xs text-primary hover:underline">Load Template</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => csvRef.current?.click()} className="text-xs text-primary hover:underline">Upload File</button>
                      <input ref={csvRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvFile} />
                    </div>
                    <textarea value={importCsv} onChange={e => setImportCsv(e.target.value)}
                      rows={8} placeholder="Paste CSV data here or click 'Load Template'..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono focus:ring-2 focus:ring-primary resize-none" />
                  </>
                )}
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Close</button>
                {!importResult && (
                  <button onClick={handleImport} disabled={importing || !importCsv.trim()}
                    className="px-5 py-2 text-sm bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium disabled:opacity-40 flex items-center gap-2">
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Import
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
