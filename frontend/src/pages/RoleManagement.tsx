import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Plus, Edit2, Trash2, X, Loader2, Check, ChevronDown,
  Users, Lock, Unlock, AlertTriangle, Info, Save, RefreshCw,
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Module {
  key: string; label: string; icon: string; perms: string[];
}
interface Role {
  id: number; name: string; description: string; color: string; icon: string;
  is_system: boolean; system_role_key: string | null;
  permissions: Record<string, string[]>; user_count: number;
  created_at: string; updated_at: string;
}

const PERM_LABELS: Record<string, string> = {
  view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete',
  submit: 'Submit', reopen: 'Reopen', approve: 'Approve', reject: 'Reject',
  export: 'Export', deactivate: 'Deactivate', reset_password: 'Reset Pwd',
  excel: 'Excel', csv: 'CSV', pdf: 'PDF',
};

const COLOR_OPTIONS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B',
  '#EF4444', '#6B7280', '#EC4899', '#14B8A6',
];
const ICON_OPTIONS = ['👤', '👔', '🏛️', '🛡️', '🔑', '⚡', '🎯', '🔧', '📊', '🌟'];

const EMPTY_ROLE: Partial<Role> = {
  name: '', description: '', color: '#3B82F6', icon: '👤', permissions: {},
};

// ─── Permission Toggle Matrix ─────────────────────────────────────────────────
function PermissionMatrix({
  modules, permissions, onChange, readOnly,
}: {
  modules: Module[]; permissions: Record<string, string[]>;
  onChange: (perms: Record<string, string[]>) => void; readOnly: boolean;
}) {
  const toggle = (moduleKey: string, perm: string) => {
    if (readOnly) return;
    const current = permissions[moduleKey] || [];
    const next = current.includes(perm)
      ? current.filter(p => p !== perm)
      : [...current, perm];
    onChange({ ...permissions, [moduleKey]: next });
  };

  const toggleAll = (moduleKey: string, perms: string[]) => {
    if (readOnly) return;
    const current = permissions[moduleKey] || [];
    const allOn = perms.every(p => current.includes(p));
    onChange({ ...permissions, [moduleKey]: allOn ? [] : [...perms] });
  };

  return (
    <div className="space-y-1">
      {modules.map(mod => {
        const active = permissions[mod.key] || [];
        const allOn = mod.perms.every(p => active.includes(p));
        const someOn = active.length > 0 && !allOn;
        return (
          <div key={mod.key}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${active.length > 0 ? 'bg-blue-50/70' : 'hover:bg-gray-50'}`}>
            <span className="text-lg leading-none w-7 text-center flex-shrink-0">{mod.icon}</span>
            <span className="w-40 text-sm font-medium text-gray-700 flex-shrink-0">{mod.label}</span>

            {/* Module-level toggle */}
            <button
              type="button"
              disabled={readOnly}
              onClick={() => toggleAll(mod.key, mod.perms)}
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                allOn ? 'bg-primary border-primary text-white' :
                someOn ? 'bg-primary/20 border-primary/40 text-primary' :
                'bg-white border-gray-200 text-gray-300 hover:border-gray-300'
              } ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              title="Toggle all">
              {allOn ? <Check className="w-4 h-4" /> : someOn ? <span className="w-2 h-2 rounded-full bg-primary" /> : <span className="w-2 h-2 rounded-full bg-gray-200" />}
            </button>

            {/* Individual permission chips */}
            <div className="flex flex-wrap gap-1.5 flex-1">
              {mod.perms.map(perm => {
                const on = active.includes(perm);
                return (
                  <button key={perm} type="button" disabled={readOnly}
                    onClick={() => toggle(mod.key, perm)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all select-none ${
                      on
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-primary/50 hover:text-primary/70'
                    } ${readOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    {PERM_LABELS[perm] || perm}
                  </button>
                );
              })}
            </div>

            {active.length > 0 && (
              <span className="text-xs text-primary font-semibold flex-shrink-0 w-14 text-right">
                {active.length}/{mod.perms.length}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Role Card ────────────────────────────────────────────────────────────────
function RoleCard({ role, onEdit, onDelete, isCEO }: {
  role: Role; onEdit: (r: Role) => void; onDelete: (r: Role) => void; isCEO: boolean;
}) {
  const totalPerms = Object.values(role.permissions).flat().length;
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Color bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: role.color }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: role.color + '20', border: `2px solid ${role.color}30` }}>
              {role.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base">{role.name}</h3>
                {role.is_system && (
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold uppercase tracking-wider rounded-full">
                    System
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{role.description || 'No description'}</p>
            </div>
          </div>

          {isCEO && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => onEdit(role)}
                className="p-2 rounded-xl text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
                <Edit2 className="w-4 h-4" />
              </button>
              {!role.is_system && (
                <button onClick={() => onDelete(role)}
                  className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span className="font-semibold text-gray-700">{role.user_count}</span> user{role.user_count !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span className="font-semibold text-gray-700">{totalPerms}</span> permission{totalPerms !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: role.color }} />
            {Object.keys(role.permissions).filter(k => (role.permissions[k] || []).length > 0).length} modules
          </span>
        </div>

        {/* Permission module pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(role.permissions)
            .filter(([, perms]) => perms.length > 0)
            .slice(0, 6)
            .map(([mod, perms]) => (
              <span key={mod} className="px-2 py-0.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-full text-[11px] font-medium">
                {mod.replace(/_/g, ' ')} ({perms.length})
              </span>
            ))}
          {Object.keys(role.permissions).filter(k => role.permissions[k]?.length > 0).length > 6 && (
            <span className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded-full text-[11px]">
              +{Object.keys(role.permissions).filter(k => role.permissions[k]?.length > 0).length - 6} more
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RoleManagement() {
  const { user: me } = useAuthStore();
  const isCEO = me?.role === 'ceo';

  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; data: Partial<Role>; isNew: boolean }>({
    open: false, data: { ...EMPTY_ROLE }, isNew: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, modsRes] = await Promise.all([
        api.get('/auth/roles/'),
        api.get('/auth/roles/modules/'),
      ]);
      const list = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data.results || [];
      setRoles(list);
      setModules(modsRes.data.data || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openNew = () => {
    setModal({ open: true, data: { ...EMPTY_ROLE, permissions: {} }, isNew: true });
    setError('');
  };

  const openEdit = (r: Role) => {
    setModal({ open: true, data: { ...r }, isNew: false });
    setError('');
  };

  const closeModal = () => {
    setModal({ open: false, data: { ...EMPTY_ROLE }, isNew: true });
    setError('');
  };

  const setField = (name: string, value: any) =>
    setModal(m => ({ ...m, data: { ...m.data, [name]: value } }));

  const handleSave = async () => {
    if (!modal.data.name?.trim()) { setError('Role name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (modal.isNew) {
        await api.post('/auth/roles/', modal.data);
      } else {
        await api.patch(`/auth/roles/${modal.data.id}/`, {
          name: modal.data.name, description: modal.data.description,
          color: modal.data.color, icon: modal.data.icon,
          permissions: modal.data.permissions,
        });
      }
      closeModal(); fetchAll();
    } catch (err: any) {
      const d = err.response?.data;
      if (typeof d === 'object' && d !== null) {
        const msgs = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' | ');
        setError(msgs || 'Failed to save role');
      } else { setError(d?.message || 'Failed to save role'); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.delete(`/auth/roles/${deleteConfirm.id}/`);
      setDeleteConfirm(null); fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete role');
    } finally { setDeleting(false); }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.post('/auth/roles/seed/');
      fetchAll();
    } catch { alert('Failed to seed system roles'); }
    finally { setSeeding(false); }
  };

  const d = modal.data;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          </div>
          <p className="text-gray-500 ml-14">
            Define access levels and permissions for each role in your organization.
          </p>
        </div>

        {isCEO && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleSeed} disabled={seeding}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 shadow-sm transition-all">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Seed System Roles
            </button>
            <button onClick={openNew}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all text-sm">
              <Plus className="w-4 h-4" /> New Role
            </button>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <strong>System Roles</strong> (Employee, Manager, CEO) are built-in and protected — only their permissions can be edited.
          Create <strong>Custom Roles</strong> for specialized access like HR, Auditor, or Branch Manager.
        </div>
      </div>

      {/* Role grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-purple-300" />
          </div>
          <p className="text-gray-500 font-medium mb-2">No roles defined yet</p>
          <p className="text-gray-400 text-sm mb-6">Start by seeding the system roles or create a custom role.</p>
          {isCEO && (
            <button onClick={handleSeed} disabled={seeding}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-md">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Seed System Roles
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map(r => (
            <RoleCard key={r.id} role={r} onEdit={openEdit} onDelete={setDeleteConfirm} isCEO={isCEO} />
          ))}
        </div>
      )}

      {/* ── Role Edit/Create Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {modal.open && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-6">

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: (d.color || '#3B82F6') + '20' }}>
                    {d.icon || '👤'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {modal.isNew ? 'Create New Role' : `Edit — ${d.name}`}
                    </h2>
                    {!modal.isNew && d.is_system && (
                      <p className="text-xs text-purple-600 font-medium flex items-center gap-1 mt-0.5">
                        <Lock className="w-3 h-3" /> System role — name is protected
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                  </div>
                )}

                {/* Basic info */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Role Name *</label>
                    <input value={d.name || ''} onChange={e => setField('name', e.target.value)}
                      disabled={!modal.isNew && !!d.is_system}
                      placeholder="e.g. Branch Manager, HR Executive"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400" />
                  </div>

                  {/* Color + Icon */}
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Color</label>
                      <div className="flex flex-wrap gap-1.5">
                        {COLOR_OPTIONS.map(c => (
                          <button key={c} type="button" onClick={() => setField('color', c)}
                            className={`w-7 h-7 rounded-lg border-2 transition-all ${d.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Icon</label>
                      <div className="relative group/icon">
                        <button type="button"
                          className="w-10 h-10 rounded-xl border border-gray-200 text-xl flex items-center justify-center hover:border-primary/50 transition-colors">
                          {d.icon || '👤'}
                        </button>
                        <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-gray-100 shadow-xl p-2 hidden group-hover/icon:flex flex-wrap gap-1 w-48 z-10">
                          {ICON_OPTIONS.map(em => (
                            <button key={em} type="button" onClick={() => setField('icon', em)}
                              className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-gray-100 ${d.icon === em ? 'bg-primary/10' : ''}`}>
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
                    <textarea value={d.description || ''} onChange={e => setField('description', e.target.value)}
                      rows={2} placeholder="What can users with this role do?"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary resize-none" />
                  </div>
                </div>

                {/* Permission Matrix */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" /> Permission Matrix
                    </h3>
                    <span className="text-xs text-gray-400">
                      {Object.values(d.permissions || {}).flat().length} permission(s) enabled
                    </span>
                  </div>
                  <div className="bg-gray-50/70 rounded-2xl border border-gray-100 p-3">
                    {modules.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-6">Loading modules...</p>
                    ) : (
                      <PermissionMatrix
                        modules={modules}
                        permissions={d.permissions || {}}
                        onChange={perms => setField('permissions', perms)}
                        readOnly={false}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                <div className="text-xs text-gray-400">
                  {!modal.isNew && d.is_system && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="w-3.5 h-3.5" /> System roles: only permissions, color, and description are editable
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold shadow-sm disabled:opacity-60 flex items-center gap-2 hover:shadow-md transition-all">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {modal.isNew ? 'Create Role' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Role</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to permanently delete <strong>"{deleteConfirm.name}"</strong>?
                This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
