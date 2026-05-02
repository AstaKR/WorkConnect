import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Shield, Wand2, Building2, Check, Loader2, Mail, Plus, Trash2, Cpu, Zap, BarChart2, TestTube } from 'lucide-react';
import axios from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import type { AIProvider, AIFeature, AIUsage, AIProviderCreate } from '../api/ai';
import {
  aiAdminGetProviders, aiAdminCreateProvider, aiAdminUpdateProvider,
  aiAdminDeleteProvider, aiAdminTestProvider,
  aiAdminGetFeatures, aiAdminUpdateFeatures, aiAdminGetUsage,
} from '../api/ai';

export default function SystemSettings() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState({
    ai_provider: 'gemini',
    company_name: '',
    company_logo_url: '',
    gemini_api_key: '',
    maintenance_mode: false,
    require_location: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_use_tls: true,
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<null | { ok: boolean; msg: string }>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'advanced'>('general');
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [features, setFeatures] = useState<AIFeature[]>([]);
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [editingProvider, setEditingProvider] = useState<(Partial<AIProvider> & { api_key?: string }) | null>(null);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (user?.role !== 'ceo') {
      navigate('/employee/dashboard');
      return;
    }

    const fetchSettings = async () => {
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
        // Load AI data (CEO only — wrap in try/catch so non-CEO users don't see errors)
        try {
          const [providersRes, featuresRes, usageRes] = await Promise.all([
            aiAdminGetProviders(),
            aiAdminGetFeatures(),
            aiAdminGetUsage(),
          ]);
          setProviders(providersRes.data.data);
          setFeatures(featuresRes.data.data);
          setUsage(usageRes.data.data);
        } catch { /* non-CEO users will get 403, ignore */ }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();

      // Text / string fields
      formData.append('ai_provider', settings.ai_provider);
      formData.append('company_name', settings.company_name);

      // Only send keys/passwords if they were actually changed
      if (settings.gemini_api_key && settings.gemini_api_key !== '********') {
        formData.append('gemini_api_key', settings.gemini_api_key);
      }
      if (settings.smtp_password && settings.smtp_password !== '********') {
        formData.append('smtp_password', settings.smtp_password);
      }

      // Booleans — explicitly send as 'true' / 'false' strings Django can coerce
      formData.append('maintenance_mode', settings.maintenance_mode ? 'true' : 'false');
      formData.append('require_location', settings.require_location ? 'true' : 'false');
      formData.append('smtp_use_tls', settings.smtp_use_tls ? 'true' : 'false');

      // SMTP fields
      formData.append('smtp_host', settings.smtp_host ?? '');
      formData.append('smtp_port', String(settings.smtp_port ?? 587));
      formData.append('smtp_user', settings.smtp_user ?? '');

      // Logo file (only if a new one was selected)
      if (logoFile) {
        formData.append('company_logo', logoFile);
      } else if (settings.company_logo_url && !settings.company_logo_url.startsWith('blob:')) {
        // Preserve existing URL-based logo if not replaced
        formData.append('company_logo_url', settings.company_logo_url);
      }

      const res = await axios.patch('/settings/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setSaved(true);
        setLogoFile(null);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: any) {
      console.error('Save error:', err.response?.data || err.message);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setSendingTest(true);
    setTestEmailStatus(null);
    try {
      const res = await axios.post('/settings/test-email/');
      setTestEmailStatus({ ok: res.data.success, msg: res.data.message });
    } catch (err: any) {
      setTestEmailStatus({ ok: false, msg: err.response?.data?.message || 'Test failed. Check your SMTP settings and save first.' });
    } finally {
      setSendingTest(false);
      setTimeout(() => setTestEmailStatus(null), 8000);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">System Configuration</h1>
        <p className="text-gray-500 mt-1">Manage global application settings and API integrations.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl overflow-hidden shadow-sm">

        {/* Tab Bar */}
        <div className="flex border-b border-gray-100 px-6">
          {(['general', 'ai', 'advanced'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'ai' ? '🤖 AI Engine' : tab === 'general' ? '🏢 General' : '⚙️ Advanced'}
            </button>
          ))}
        </div>

        {activeTab === 'general' && (<>

        {/* Branding Section */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-1/3">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-gray-900">Organization</h2>
            </div>
            <p className="text-sm text-gray-500">Update company branding and general details.</p>
          </div>
          <div className="w-full md:w-2/3 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input 
                type="text" 
                value={settings.company_name}
                onChange={e => setSettings({...settings, company_name: e.target.value})}
                className="w-full border-gray-200 border rounded-xl p-3 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
              <div className="flex gap-4 items-center">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLogoFile(file);
                      setSettings({...settings, company_logo_url: URL.createObjectURL(file)});
                    }
                  }}
                  className="flex-1 border-gray-200 border rounded-xl p-2 focus:ring-primary focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {settings.company_logo_url && (
                  <div className="w-12 h-12 rounded-xl border border-gray-100 p-1 bg-white shrink-0 overflow-hidden flex items-center justify-center">
                    <img src={settings.company_logo_url} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* AI Integration Section */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-1/3">
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-bold text-gray-900">AI Engine</h2>
            </div>
            <p className="text-sm text-gray-500">Configure the AI provider used for smart suggestions and spelling checks.</p>
          </div>
          <div className="w-full md:w-2/3 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Active AI Provider</label>
              <select 
                value={settings.ai_provider}
                onChange={e => setSettings({...settings, ai_provider: e.target.value})}
                className="w-full border-gray-200 border rounded-xl p-3 focus:ring-primary focus:border-primary"
              >
                <option value="gemini">Google Gemini (Default)</option>
                <option value="claude">Anthropic Claude</option>
                <option value="openai">OpenAI GPT-4</option>
                <option value="groq">Groq Llama</option>
              </select>
            </div>
            
            {settings.ai_provider === 'gemini' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="password" 
                    value={settings.gemini_api_key}
                    onChange={e => setSettings({...settings, gemini_api_key: e.target.value})}
                    placeholder="Enter API Key"
                    className="w-full border-gray-200 border rounded-xl py-3 pl-10 pr-3 focus:ring-primary focus:border-primary"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Get your key from Google AI Studio. This is required for AI features to work.</p>
              </div>
            )}
          </div>
        </div>

        </>)}

        {activeTab === 'advanced' && (<>

        {/* Advanced Options Section */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-1/3">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900">Advanced Options</h2>
            </div>
            <p className="text-sm text-gray-500">Configure email settings and core operational rules.</p>
          </div>
          <div className="w-full md:w-2/3 space-y-6">
            
            {/* Toggles */}
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={settings.maintenance_mode} onChange={e => setSettings({...settings, maintenance_mode: e.target.checked})} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${settings.maintenance_mode ? 'bg-primary' : 'bg-gray-200'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.maintenance_mode ? 'translate-x-4' : ''}`}></div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Maintenance Mode</div>
                  <div className="text-xs text-gray-500">Prevent non-admin users from accessing the system.</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={settings.require_location} onChange={e => setSettings({...settings, require_location: e.target.checked})} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${settings.require_location ? 'bg-primary' : 'bg-gray-200'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.require_location ? 'translate-x-4' : ''}`}></div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Strict Location Tracking</div>
                  <div className="text-xs text-gray-500">Require employees to specify a location for every task.</div>
                </div>
              </label>
            </div>

            {/* SMTP Settings */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-200 pb-2">SMTP Configuration (Email Alerts)</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SMTP Host</label>
                  <input 
                    type="text" 
                    value={settings.smtp_host}
                    onChange={e => setSettings({...settings, smtp_host: e.target.value})}
                    placeholder="smtp.gmail.com"
                    className="w-full text-sm border-gray-200 border rounded-lg p-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SMTP Port</label>
                  <input 
                    type="number" 
                    value={settings.smtp_port}
                    onChange={e => setSettings({...settings, smtp_port: parseInt(e.target.value) || 587})}
                    className="w-full text-sm border-gray-200 border rounded-lg p-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SMTP Username</label>
                  <input 
                    type="text" 
                    value={settings.smtp_user}
                    onChange={e => setSettings({...settings, smtp_user: e.target.value})}
                    placeholder="alerts@company.com"
                    className="w-full text-sm border-gray-200 border rounded-lg p-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SMTP Password</label>
                  <input 
                    type="password" 
                    value={settings.smtp_password}
                    onChange={e => setSettings({...settings, smtp_password: e.target.value})}
                    placeholder="Enter Password"
                    className="w-full text-sm border-gray-200 border rounded-lg p-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input 
                  type="checkbox" 
                  checked={settings.smtp_use_tls}
                  onChange={e => setSettings({...settings, smtp_use_tls: e.target.checked})}
                  className="rounded text-primary focus:ring-primary border-gray-300"
                />
                <span className="text-xs font-medium text-gray-700">Use TLS Encryption</span>
              </label>

              {/* Test Email Button */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <button
                  onClick={handleTestEmail}
                  disabled={sendingTest}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors disabled:opacity-60"
                >
                  {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  {sendingTest ? 'Sending...' : 'Send Test Email'}
                </button>
                <AnimatePresence>
                  {testEmailStatus && (
                    <motion.span
                      initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className={`text-xs font-medium flex items-center gap-1.5 ${testEmailStatus.ok ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {testEmailStatus.ok ? <Check className="w-3.5 h-3.5" /> : '✕'}
                      {testEmailStatus.msg}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="p-6 bg-gray-50/50 flex items-center justify-end gap-4">
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="text-green-600 flex items-center gap-1.5 text-sm font-medium"
              >
                <Check className="w-4 h-4"/> Settings Saved!
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-6 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        </>)}

        {activeTab === 'ai' && (
          <div className="p-6 space-y-8">

            {/* Providers */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-violet-500" />
                  <h2 className="text-lg font-bold text-gray-900">Providers</h2>
                </div>
                <button
                  onClick={() => { setEditingProvider({ provider_key: 'groq', model_name: '', display_name: '', base_url: '', is_active: true }); setProviderModalOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-xl text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" /> Add Provider
                </button>
              </div>
              <div className="space-y-2">
                {providers.length === 0 && (
                  <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4 text-center">
                    No providers configured yet. Add one to enable AI features.
                  </p>
                )}
                {providers.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${p.is_active ? 'bg-green-400' : 'bg-gray-300'}`} />
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">{p.display_name}</span>
                        <span className="text-xs text-gray-400 ml-2">{p.model_name}</span>
                      </div>
                      {p.has_key && <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">🔑 Key set</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {testResult?.id === p.id && (
                        <span className={`text-xs font-medium ${testResult.ok ? 'text-green-600' : 'text-red-500'}`}>{testResult.msg}</span>
                      )}
                      <button onClick={async () => {
                        setTestingId(p.id);
                        try {
                          const r = await aiAdminTestProvider(p.id);
                          setTestResult({ id: p.id, ok: r.data.success, msg: r.data.message });
                        } catch (e: unknown) {
                          const msg = (typeof e === 'object' && e !== null && 'response' in e)
                            ? (e as {response?: {data?: {message?: string}}}).response?.data?.message ?? 'Test failed'
                            : 'Test failed';
                          setTestResult({ id: p.id, ok: false, msg });
                        } finally {
                          setTestingId(null);
                          setTimeout(() => setTestResult(null), 5000);
                        }
                      }} disabled={testingId === p.id} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Test connection">
                        {testingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditingProvider({ ...p }); setProviderModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                        ✏️
                      </button>
                      <button onClick={async () => {
                        if (!confirm('Delete this provider?')) return;
                        try {
                          await aiAdminDeleteProvider(p.id);
                          setProviders(prev => prev.filter(x => x.id !== p.id));
                        } catch (e: unknown) {
                          const msg = (typeof e === 'object' && e !== null && 'response' in e)
                            ? (e as {response?: {data?: {message?: string}}}).response?.data?.message ?? 'Delete failed'
                            : 'Delete failed';
                          alert(msg);
                        }
                      }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Routing */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-bold text-gray-900">Feature Routing</h2>
              </div>
              <div className="space-y-2">
                {features.map(f => (
                  <div key={f.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <label className="relative cursor-pointer">
                        <input type="checkbox" className="sr-only" checked={f.is_enabled}
                          onChange={async e => {
                            const checked = e.target.checked;
                            await aiAdminUpdateFeatures([{ id: f.id, is_enabled: checked }]);
                            setFeatures(prev => prev.map(x => x.id === f.id ? { ...x, is_enabled: checked } : x));
                          }} />
                        <div className={`block w-8 h-5 rounded-full transition-colors ${f.is_enabled ? 'bg-violet-500' : 'bg-gray-200'}`} />
                        <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${f.is_enabled ? 'translate-x-3' : ''}`} />
                      </label>
                      <span className="text-sm font-medium text-gray-900">{f.display_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={f.primary_provider ?? ''} onChange={async e => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        await aiAdminUpdateFeatures([{ id: f.id, primary_provider: val }]);
                        setFeatures(prev => prev.map(x => x.id === f.id ? { ...x, primary_provider: val } : x));
                      }} className="text-xs border border-gray-200 rounded-lg p-1.5">
                        <option value="">— No provider —</option>
                        {providers.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
                      </select>
                      <select value={f.fallback_provider ?? ''} onChange={async e => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        await aiAdminUpdateFeatures([{ id: f.id, fallback_provider: val }]);
                        setFeatures(prev => prev.map(x => x.id === f.id ? { ...x, fallback_provider: val } : x));
                      }} className="text-xs border border-gray-200 rounded-lg p-1.5 text-gray-400">
                        <option value="">— No fallback —</option>
                        {providers.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage */}
            {usage && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-bold text-gray-900">Today's Usage</h2>
                  <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 font-semibold">{usage.total} calls</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="text-xs font-bold text-gray-500 mb-2">By Provider</div>
                    {usage.by_provider.length === 0
                      ? <p className="text-xs text-gray-400">No calls yet today.</p>
                      : usage.by_provider.map(r => (
                        <div key={r.provider_key} className="flex justify-between text-xs py-1">
                          <span className="text-gray-700 font-medium capitalize">{r.provider_key}</span>
                          <span className="font-bold text-violet-600">{r.count}</span>
                        </div>
                      ))}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="text-xs font-bold text-gray-500 mb-2">By Feature</div>
                    {usage.by_feature.length === 0
                      ? <p className="text-xs text-gray-400">No calls yet today.</p>
                      : usage.by_feature.map(r => (
                        <div key={r.feature_key} className="flex justify-between text-xs py-1">
                          <span className="text-gray-700 font-medium">{r.feature_key.replaceAll('_', ' ')}</span>
                          <span className="font-bold text-blue-600">{r.count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </motion.div>

      {/* Provider Add/Edit Modal */}
      <AnimatePresence>
        {providerModalOpen && editingProvider && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setProviderModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4"
            >
              <h3 className="font-bold text-lg text-gray-900">{editingProvider.id ? 'Edit Provider' : 'Add Provider'}</h3>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Provider Type</label>
                <select value={editingProvider.provider_key ?? 'groq'}
                  onChange={e => setEditingProvider(p => ({ ...p!, provider_key: e.target.value as AIProvider['provider_key'] }))}
                  className="w-full border border-gray-200 rounded-xl p-2 text-sm">
                  <option value="groq">Groq</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="ollama">Ollama (Local)</option>
                  <option value="custom">Custom Endpoint</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Display Name</label>
                <input type="text" value={editingProvider.display_name || ''} onChange={e => setEditingProvider(p => ({ ...p!, display_name: e.target.value }))} className="w-full border border-gray-200 rounded-xl p-2 text-sm" placeholder="e.g. Groq Fast" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Model Name</label>
                <input type="text" value={editingProvider.model_name || ''} onChange={e => setEditingProvider(p => ({ ...p!, model_name: e.target.value }))} className="w-full border border-gray-200 rounded-xl p-2 text-sm" placeholder="e.g. llama-3.1-70b-versatile" />
              </div>
              {['ollama', 'custom'].includes(editingProvider.provider_key ?? '') && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Base URL</label>
                  <input type="text" value={editingProvider.base_url || ''} onChange={e => setEditingProvider(p => ({ ...p!, base_url: e.target.value }))} className="w-full border border-gray-200 rounded-xl p-2 text-sm" placeholder="http://localhost:11434" />
                </div>
              )}
              {editingProvider.provider_key !== 'ollama' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">API Key {editingProvider.id ? '(leave blank to keep existing)' : ''}</label>
                  <input type="password" value={editingProvider.api_key || ''} onChange={e => setEditingProvider(p => ({ ...p!, api_key: e.target.value }))} className="w-full border border-gray-200 rounded-xl p-2 text-sm" placeholder="Enter API key" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setProviderModalOpen(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Cancel</button>
                <button onClick={async () => {
                  try {
                    if (editingProvider.id) {
                      const r = await aiAdminUpdateProvider(editingProvider.id, editingProvider);
                      setProviders(prev => prev.map(x => x.id === editingProvider.id ? r.data.data : x));
                    } else {
                      const ep = editingProvider as AIProviderCreate & { api_key?: string };
                      const r = await aiAdminCreateProvider(ep);
                      setProviders(prev => [...prev, r.data.data]);
                    }
                    setProviderModalOpen(false);
                  } catch (e: unknown) {
                    const msg = (typeof e === 'object' && e !== null && 'response' in e)
                      ? (e as {response?: {data?: {message?: string}}}).response?.data?.message ?? 'Failed to save provider'
                      : 'Failed to save provider';
                    alert(msg);
                  }
                }} className="flex-1 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold">
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
