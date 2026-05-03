import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Settings, Check, Loader2, Mail, Plus, Trash2,
  Cpu, Zap, BarChart2, TestTube, Upload, Server,
  Globe, KeyRound, ToggleLeft, Image,
} from 'lucide-react';
import axios from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import type { AIProvider, AIFeature, AIUsage, AIProviderCreate } from '../api/ai';
import {
  aiAdminGetProviders, aiAdminCreateProvider, aiAdminUpdateProvider,
  aiAdminDeleteProvider, aiAdminTestProvider,
  aiAdminGetFeatures, aiAdminUpdateFeatures, aiAdminGetUsage,
} from '../api/ai';

// ── Toggle component ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${checked ? 'bg-primary' : 'bg-gray-200'}`}
    >
      <span className={`inline-block w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 mt-0.5 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  const { icon, className, ...rest } = props;
  return (
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
      <input
        {...rest}
        className={`w-full border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 text-sm ${className ?? ''}`}
      />
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ icon, title, desc, children }: {
  icon: React.ReactNode; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SystemSettings() {
  const { user, setBranding } = useAuthStore();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    ai_provider: 'gemini', company_name: '', company_logo_url: '',
    gemini_api_key: '', maintenance_mode: false, require_location: false,
    smtp_host: '', smtp_port: 587, smtp_user: '', smtp_password: '', smtp_use_tls: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'advanced'>('general');

  // AI state
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [features, setFeatures] = useState<AIFeature[]>([]);
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [editingProvider, setEditingProvider] = useState<(Partial<AIProvider> & { api_key?: string }) | null>(null);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (user?.role !== 'ceo') { navigate('/employee/dashboard'); return; }
    const load = async () => {
      try {
        const res = await axios.get('/settings/');
        setSettings({
          ai_provider: res.data.data.ai_provider,
          company_name: res.data.data.company_name,
          company_logo_url: res.data.data.company_logo_url || '',
          gemini_api_key: res.data.data.has_gemini_key ? '********' : '',
          maintenance_mode: res.data.data.maintenance_mode || false,
          require_location: res.data.data.require_location || false,
          smtp_host: res.data.data.smtp_host || '',
          smtp_port: res.data.data.smtp_port || 587,
          smtp_user: res.data.data.smtp_user || '',
          smtp_password: res.data.data.has_smtp_password ? '********' : '',
          smtp_use_tls: res.data.data.smtp_use_tls !== false,
        });
        try {
          const [pr, fr, ur] = await Promise.all([aiAdminGetProviders(), aiAdminGetFeatures(), aiAdminGetUsage()]);
          setProviders(pr.data.data); setFeatures(fr.data.data); setUsage(ur.data.data);
        } catch { /* non-CEO */ }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('ai_provider', settings.ai_provider);
      fd.append('company_name', settings.company_name);
      if (settings.gemini_api_key && settings.gemini_api_key !== '********') fd.append('gemini_api_key', settings.gemini_api_key);
      if (settings.smtp_password && settings.smtp_password !== '********') fd.append('smtp_password', settings.smtp_password);
      fd.append('maintenance_mode', settings.maintenance_mode ? 'true' : 'false');
      fd.append('require_location', settings.require_location ? 'true' : 'false');
      fd.append('smtp_use_tls', settings.smtp_use_tls ? 'true' : 'false');
      fd.append('smtp_host', settings.smtp_host ?? '');
      fd.append('smtp_port', String(settings.smtp_port ?? 587));
      fd.append('smtp_user', settings.smtp_user ?? '');
      if (logoFile) fd.append('company_logo', logoFile);
      else if (settings.company_logo_url && !settings.company_logo_url.startsWith('blob:')) fd.append('company_logo_url', settings.company_logo_url);

      const res = await axios.patch('/settings/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        setSaved(true);
        setLogoFile(null);
        // Update branding in store so sidebar reflects new company name immediately
        setBranding({ name: settings.company_name, logo: settings.company_logo_url });
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e: any) {
      alert('Failed to save: ' + (e.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  const handleTestEmail = async () => {
    setSendingTest(true); setTestEmailStatus(null);
    try {
      const res = await axios.post('/settings/test-email/');
      setTestEmailStatus({ ok: res.data.success, msg: res.data.message });
    } catch (e: any) {
      setTestEmailStatus({ ok: false, msg: e.response?.data?.message || 'Test failed.' });
    } finally {
      setSendingTest(false);
      setTimeout(() => setTestEmailStatus(null), 8000);
    }
  };

  const TABS = [
    { key: 'general', label: 'General', icon: Building2 },
    { key: 'ai',      label: 'AI Engine', icon: Cpu },
    { key: 'advanced', label: 'Advanced', icon: Settings },
  ] as const;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Settings className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">System Configuration</h1>
            </div>
            <p className="text-sm text-gray-500">Manage global application settings, branding, and integrations.</p>
          </div>

          {/* Save button — always visible in header */}
          <button
            onClick={handleSave}
            disabled={saving || activeTab === 'ai'}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-primary to-accent text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* ── Saved banner ────────────────────────────────────────────── */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium"
            >
              <Check className="w-4 h-4" /> Settings saved successfully. Branding updated.
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm w-full sm:w-fit overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── General Tab ──────────────────────────────────────────────── */}
        {activeTab === 'general' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Organization */}
            <SectionCard
              icon={<Building2 className="w-4.5 h-4.5 text-blue-500" />}
              title="Organization"
              desc="Company name and branding shown across the platform"
            >
              <Field label="Company Name" hint="This appears in the sidebar and throughout the app">
                <Input
                  icon={<Globe className="w-4 h-4" />}
                  type="text"
                  value={settings.company_name}
                  onChange={e => setSettings({ ...settings, company_name: e.target.value })}
                  placeholder="e.g. Acme Corporation"
                />
              </Field>

              <Field label="Company Logo">
                <div className="flex items-start gap-4">
                  {/* Logo preview */}
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {settings.company_logo_url ? (
                      <img src={settings.company_logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Image className="w-7 h-7 text-gray-300" />
                    )}
                  </div>
                  {/* Upload */}
                  <div className="flex-1">
                    <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 cursor-pointer transition-colors w-fit text-sm font-medium text-gray-700">
                      <Upload className="w-4 h-4 text-gray-400" />
                      {logoFile ? logoFile.name : 'Choose file…'}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) { setLogoFile(file); setSettings({ ...settings, company_logo_url: URL.createObjectURL(file) }); }
                        }} />
                    </label>
                    <p className="text-xs text-gray-400 mt-2">PNG, JPG, SVG up to 2MB. Recommended: 200×200px</p>
                    {logoFile && (
                      <button onClick={() => { setLogoFile(null); setSettings({ ...settings, company_logo_url: '' }); }}
                        className="mt-1.5 text-xs text-red-400 hover:text-red-600 font-medium">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </Field>
            </SectionCard>


          </motion.div>
        )}

        {/* ── Advanced Tab ─────────────────────────────────────────────── */}
        {activeTab === 'advanced' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* System toggles */}
            <SectionCard
              icon={<ToggleLeft className="w-4.5 h-4.5 text-gray-500" />}
              title="System Controls"
              desc="Core operational flags for the platform"
            >
              <div className="space-y-4">
                {[
                  {
                    key: 'maintenance_mode' as const,
                    label: 'Maintenance Mode',
                    desc: 'Prevent non-admin users from accessing the system while you make updates.',
                    color: settings.maintenance_mode ? 'text-amber-700 bg-amber-50 border-amber-100' : '',
                  },
                  {
                    key: 'require_location' as const,
                    label: 'Require Location on Tasks',
                    desc: 'Employees must specify a work location for every task entry.',
                    color: '',
                  },
                ].map(item => (
                  <div key={item.key} className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${item.color || 'bg-gray-50 border-gray-100'}`}>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <Toggle checked={settings[item.key]} onChange={v => setSettings({ ...settings, [item.key]: v })} />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* SMTP */}
            <SectionCard
              icon={<Mail className="w-4.5 h-4.5 text-blue-500" />}
              title="Email / SMTP"
              desc="Configure outgoing email for report notifications and alerts"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="SMTP Host">
                  <Input
                    icon={<Server className="w-4 h-4" />}
                    type="text"
                    value={settings.smtp_host}
                    onChange={e => setSettings({ ...settings, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </Field>
                <Field label="SMTP Port">
                  <Input
                    type="number"
                    value={settings.smtp_port}
                    onChange={e => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 587 })}
                  />
                </Field>
                <Field label="Username / Email">
                  <Input
                    icon={<Mail className="w-4 h-4" />}
                    type="text"
                    value={settings.smtp_user}
                    onChange={e => setSettings({ ...settings, smtp_user: e.target.value })}
                    placeholder="alerts@company.com"
                  />
                </Field>
                <Field label="App Password">
                  <Input
                    icon={<KeyRound className="w-4 h-4" />}
                    type="password"
                    value={settings.smtp_password}
                    onChange={e => setSettings({ ...settings, smtp_password: e.target.value })}
                    placeholder="Enter password"
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Toggle checked={settings.smtp_use_tls} onChange={v => setSettings({ ...settings, smtp_use_tls: v })} />
                  <span className="text-sm font-medium text-gray-700">Use TLS Encryption</span>
                </label>

                <div className="flex items-center gap-3">
                  <AnimatePresence>
                    {testEmailStatus && (
                      <motion.span
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={`text-xs font-medium flex items-center gap-1 ${testEmailStatus.ok ? 'text-green-600' : 'text-red-500'}`}
                      >
                        {testEmailStatus.ok ? <Check className="w-3 h-3" /> : '✕'} {testEmailStatus.msg}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={handleTestEmail}
                    disabled={sendingTest}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors disabled:opacity-60"
                  >
                    {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    {sendingTest ? 'Sending…' : 'Send Test Email'}
                  </button>
                </div>
              </div>
            </SectionCard>

          </motion.div>
        )}

        {/* ── AI Engine Tab ─────────────────────────────────────────────── */}
        {activeTab === 'ai' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Providers */}
            <SectionCard
              icon={<Cpu className="w-4.5 h-4.5 text-violet-500" />}
              title="AI Providers"
              desc="Configure API keys and models for each provider"
            >
              <div className="space-y-2">
                {providers.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No providers configured. Add one to enable AI features.
                  </div>
                )}
                {providers.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.is_active ? 'bg-green-400 shadow-sm shadow-green-300' : 'bg-gray-300'}`} />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{p.display_name}</p>
                        <p className="text-xs text-gray-400 truncate">{p.model_name}</p>
                      </div>
                      {p.has_key && (
                        <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-bold flex-shrink-0">
                          KEY SET
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {testResult?.id === p.id && (
                        <span className={`text-xs font-medium mr-2 ${testResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                          {testResult.ok ? '✓ OK' : '✕ ' + testResult.msg}
                        </span>
                      )}
                      <button
                        onClick={async () => {
                          setTestingId(p.id);
                          try {
                            const r = await aiAdminTestProvider(p.id);
                            setTestResult({ id: p.id, ok: r.data.success, msg: r.data.message });
                          } catch (e: unknown) {
                            const msg = (typeof e === 'object' && e !== null && 'response' in e)
                              ? (e as any).response?.data?.message ?? 'Test failed'
                              : 'Test failed';
                            setTestResult({ id: p.id, ok: false, msg });
                          } finally {
                            setTestingId(null);
                            setTimeout(() => setTestResult(null), 5000);
                          }
                        }}
                        disabled={testingId === p.id}
                        className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Test connection"
                      >
                        {testingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setEditingProvider({ ...p }); setProviderModalOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Delete this provider?')) return;
                          try {
                            await aiAdminDeleteProvider(p.id);
                            setProviders(prev => prev.filter(x => x.id !== p.id));
                          } catch (e: unknown) {
                            alert((e as any)?.response?.data?.message ?? 'Delete failed');
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setEditingProvider({ provider_key: 'groq', model_name: '', display_name: '', base_url: '', is_active: true }); setProviderModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-500 hover:border-primary hover:text-primary transition-colors w-full justify-center"
              >
                <Plus className="w-4 h-4" /> Add Provider
              </button>
            </SectionCard>

            {/* Feature routing */}
            <SectionCard
              icon={<Zap className="w-4.5 h-4.5 text-yellow-500" />}
              title="Feature Routing"
              desc="Assign providers to individual AI features"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                      <th className="text-left pb-3 pl-1">Feature</th>
                      <th className="text-left pb-3">Enabled</th>
                      <th className="text-left pb-3">Primary Provider</th>
                      <th className="text-left pb-3">Fallback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {features.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 pl-1 font-medium text-gray-900">{f.display_name}</td>
                        <td className="py-2.5">
                          <Toggle checked={f.is_enabled} onChange={async v => {
                            await aiAdminUpdateFeatures([{ id: f.id, is_enabled: v }]);
                            setFeatures(prev => prev.map(x => x.id === f.id ? { ...x, is_enabled: v } : x));
                          }} />
                        </td>
                        <td className="py-2.5 pr-3">
                          <select
                            value={f.primary_provider ?? ''}
                            onChange={async e => {
                              const val = e.target.value ? Number(e.target.value) : null;
                              await aiAdminUpdateFeatures([{ id: f.id, primary_provider: val }]);
                              setFeatures(prev => prev.map(x => x.id === f.id ? { ...x, primary_provider: val } : x));
                            }}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:ring-primary"
                          >
                            <option value="">— None —</option>
                            {providers.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
                          </select>
                        </td>
                        <td className="py-2.5">
                          <select
                            value={f.fallback_provider ?? ''}
                            onChange={async e => {
                              const val = e.target.value ? Number(e.target.value) : null;
                              await aiAdminUpdateFeatures([{ id: f.id, fallback_provider: val }]);
                              setFeatures(prev => prev.map(x => x.id === f.id ? { ...x, fallback_provider: val } : x));
                            }}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white text-gray-500 focus:ring-primary"
                          >
                            <option value="">— None —</option>
                            {providers.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Usage stats */}
            {usage && (
              <SectionCard
                icon={<BarChart2 className="w-4.5 h-4.5 text-blue-500" />}
                title="Today's Usage"
                desc={`${usage.total} total AI calls today`}
              >
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { title: 'By Provider', data: usage.by_provider, keyField: 'provider_key', color: 'text-violet-600' },
                    { title: 'By Feature',  data: usage.by_feature,  keyField: 'feature_key',  color: 'text-blue-600' },
                  ].map(block => (
                    <div key={block.title} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{block.title}</p>
                      {block.data.length === 0
                        ? <p className="text-xs text-gray-400 italic">No calls today</p>
                        : (block.data as any[]).map((r: any) => (
                          <div key={r[block.keyField]} className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-700 capitalize">{String(r[block.keyField]).replaceAll('_', ' ')}</span>
                            <span className={`text-xs font-bold ${block.color}`}>{r.count}</span>
                          </div>
                        ))
                      }
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Provider Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {providerModalOpen && editingProvider && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setProviderModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                  <Cpu className="w-4.5 h-4.5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{editingProvider.id ? 'Edit Provider' : 'Add Provider'}</h3>
                  <p className="text-xs text-gray-400">Configure API credentials and model</p>
                </div>
              </div>

              <div className="space-y-4">
                <Field label="Provider Type">
                  <select
                    value={editingProvider.provider_key ?? 'groq'}
                    onChange={e => setEditingProvider(p => ({ ...p!, provider_key: e.target.value as AIProvider['provider_key'] }))}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="groq">Groq</option>
                    <option value="claude">Anthropic Claude</option>
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="ollama">Ollama (Local)</option>
                    <option value="custom">Custom Endpoint</option>
                  </select>
                </Field>
                <Field label="Display Name">
                  <Input type="text" value={editingProvider.display_name || ''} onChange={e => setEditingProvider(p => ({ ...p!, display_name: e.target.value }))} placeholder="e.g. Groq Fast" />
                </Field>
                <Field label="Model Name">
                  <Input type="text" value={editingProvider.model_name || ''} onChange={e => setEditingProvider(p => ({ ...p!, model_name: e.target.value }))} placeholder="e.g. llama-3.1-8b-instant" />
                </Field>
                {['ollama', 'custom'].includes(editingProvider.provider_key ?? '') && (
                  <Field label="Base URL">
                    <Input icon={<Globe className="w-4 h-4" />} type="text" value={editingProvider.base_url || ''} onChange={e => setEditingProvider(p => ({ ...p!, base_url: e.target.value }))} placeholder="http://localhost:11434" />
                  </Field>
                )}
                {editingProvider.provider_key !== 'ollama' && (
                  <Field label={`API Key${editingProvider.id ? ' (leave blank to keep)' : ''}`}>
                    <Input icon={<KeyRound className="w-4 h-4" />} type="password" value={editingProvider.api_key || ''} onChange={e => setEditingProvider(p => ({ ...p!, api_key: e.target.value }))} placeholder="Enter API key" />
                  </Field>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setProviderModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (editingProvider.id) {
                        const r = await aiAdminUpdateProvider(editingProvider.id, editingProvider);
                        setProviders(prev => prev.map(x => x.id === editingProvider.id ? r.data.data : x));
                      } else {
                        const r = await aiAdminCreateProvider(editingProvider as AIProviderCreate & { api_key?: string });
                        setProviders(prev => [...prev, r.data.data]);
                      }
                      setProviderModalOpen(false);
                    } catch (e: unknown) {
                      alert((e as any)?.response?.data?.message ?? 'Failed to save provider');
                    }
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {editingProvider.id ? 'Save Changes' : 'Add Provider'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
