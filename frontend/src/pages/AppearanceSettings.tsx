import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Palette, Monitor, Type, LayoutGrid, Sparkles, RotateCcw, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

interface Prefs {
  theme: string;
  primary_color: string;
  accent_color: string;
  sidebar_color: string;
  background_color: string;
  font_size: string;
  layout_density: string;
}

const DEFAULT_PREFS: Prefs = {
  theme: 'light',
  primary_color: '#2563EB',
  accent_color: '#7C3AED',
  sidebar_color: '#1E293B',
  background_color: '#F8FAFC',
  font_size: 'md',
  layout_density: 'comfortable',
};

const PRESET_THEMES = [
  { name: 'Ocean Blue',  primary: '#2563EB', accent: '#7C3AED', sidebar: '#1E293B', bg: '#F8FAFC' },
  { name: 'Forest',      primary: '#059669', accent: '#0D9488', sidebar: '#134E2E', bg: '#F0FDF4' },
  { name: 'Sunset',      primary: '#EA580C', accent: '#DB2777', sidebar: '#27101A', bg: '#FFF7ED' },
  { name: 'Royal',       primary: '#7C3AED', accent: '#EC4899', sidebar: '#1E1040', bg: '#FAF5FF' },
  { name: 'Steel',       primary: '#475569', accent: '#0EA5E9', sidebar: '#0F172A', bg: '#F1F5F9' },
  { name: 'Rose Gold',   primary: '#BE185D', accent: '#F59E0B', sidebar: '#1C0B10', bg: '#FFF1F2' },
];

const applyPrefs = (prefs: Prefs) => {
  document.documentElement.style.setProperty('--color-primary', prefs.primary_color);
  document.documentElement.style.setProperty('--color-accent', prefs.accent_color);
  document.documentElement.style.setProperty('--color-sidebar', prefs.sidebar_color);
  document.documentElement.style.setProperty('--color-background', prefs.background_color);
  document.documentElement.style.fontSize =
    prefs.font_size === 'sm' ? '14px' : prefs.font_size === 'lg' ? '17px' : '16px';
};

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' } }),
};

export default function AppearanceSettings() {
  const { user, setUser } = useAuthStore();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    api.get('/settings/appearance/')
      .then(res => { setPrefs(res.data.data); applyPrefs(res.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const applyPreset = (p: typeof PRESET_THEMES[0]) => {
    const next = { ...prefs, primary_color: p.primary, accent_color: p.accent, sidebar_color: p.sidebar, background_color: p.bg };
    setPrefs(next);
    applyPrefs(next);
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const res = await api.patch('/settings/appearance/', prefs);
      applyPrefs(res.data.data);
      if (user) setUser({ ...user, preferences: res.data.data });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert('Failed to save appearance settings'); }
    finally { setSaving(false); }
  };

  const handleReset = () => { setPrefs(DEFAULT_PREFS); applyPrefs(DEFAULT_PREFS); };

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Palette className="w-8 h-8 text-primary" />
          Appearance
        </h1>
        <p className="text-gray-500 mt-1">Personalize the look and feel of the application.</p>
      </motion.div>

      {/* Live Preview Bar */}
      <motion.div
        custom={0} variants={sectionVariants} initial="hidden" animate="visible"
        className="rounded-2xl overflow-hidden shadow border border-gray-100"
        style={{ background: prefs.background_color }}
      >
        <div className="flex items-center gap-3 px-5 py-3" style={{ background: prefs.sidebar_color }}>
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs text-white/50 ml-2 font-mono">Live Preview</span>
        </div>
        <div className="flex h-20">
          <div className="w-12 shrink-0" style={{ background: prefs.sidebar_color }} />
          <div className="flex-1 p-4 flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow" style={{ background: prefs.primary_color }}>
              Primary
            </div>
            <div className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow" style={{ background: prefs.accent_color }}>
              Accent
            </div>
            <div className="text-xs text-gray-500 ml-auto">
              {prefs.font_size === 'sm' ? 'Small' : prefs.font_size === 'lg' ? 'Large' : 'Medium'} text · {prefs.layout_density}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Preset Themes */}
      <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible"
        className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <h2 className="font-bold text-gray-900">Quick Themes</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {PRESET_THEMES.map(p => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              title={p.name}
              className="group flex flex-col items-center gap-1.5 p-2 rounded-xl border border-gray-100 hover:border-primary hover:shadow-sm transition-all"
            >
              <div className="flex gap-0.5">
                <div className="w-4 h-6 rounded-l-md" style={{ background: p.sidebar }} />
                <div className="w-6 h-6 rounded-r-md" style={{ background: p.primary }} />
              </div>
              <span className="text-[10px] text-gray-500 group-hover:text-primary font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Color Customization */}
      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible"
        className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-gray-900">Custom Colors</h2>
        </div>
        <div className="space-y-1 divide-y divide-gray-50">
          {([
            { label: 'Primary Color', key: 'primary_color', desc: 'Buttons, links, highlights' },
            { label: 'Accent Color', key: 'accent_color', desc: 'Badges, tags, secondary highlights' },
            { label: 'Sidebar Color', key: 'sidebar_color', desc: 'Navigation bar background' },
            { label: 'Background Color', key: 'background_color', desc: 'Main content area background' },
          ] as const).map(({ label, key, desc }) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm cursor-pointer"
                  style={{ background: (prefs as any)[key] }}
                />
                <input
                  type="color" value={(prefs as any)[key]}
                  onChange={e => {
                    const next = { ...prefs, [key]: e.target.value };
                    setPrefs(next);
                    applyPrefs(next);
                  }}
                  className="w-10 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5 bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Display Options */}
      <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible"
        className="glass rounded-2xl p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-gray-900">Display Options</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
            <Type className="w-4 h-4" /> Font Size
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[{ val: 'sm', label: 'Small', size: 'text-xs' }, { val: 'md', label: 'Medium', size: 'text-sm' }, { val: 'lg', label: 'Large', size: 'text-base' }].map(opt => (
              <button key={opt.val}
                onClick={() => setPrefs(p => ({ ...p, font_size: opt.val }))}
                className={`py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${prefs.font_size === opt.val
                  ? 'border-primary bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'}`}
              >
                <span className={`font-semibold ${opt.size} ${prefs.font_size === opt.val ? 'text-primary' : 'text-gray-600'}`}>Aa</span>
                <span className="text-xs text-gray-500">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4" /> Layout Density
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: 'compact', label: 'Compact', desc: 'More content, less spacing' },
              { val: 'comfortable', label: 'Comfortable', desc: 'Relaxed, easy to scan' },
            ].map(opt => (
              <button key={opt.val}
                onClick={() => setPrefs(p => ({ ...p, layout_density: opt.val }))}
                className={`py-3 px-4 rounded-xl border-2 text-left transition-all ${prefs.layout_density === opt.val
                  ? 'border-primary bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'}`}
              >
                <p className={`text-sm font-semibold ${prefs.layout_density === opt.val ? 'text-primary' : 'text-gray-700'}`}>{opt.label}</p>
                <p className="text-xs text-gray-400">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Footer Actions */}
      <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible"
        className="flex items-center justify-between gap-4 pt-2">
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="text-green-600 text-sm flex items-center gap-1.5 font-medium"
            >
              <Check className="w-4 h-4" /> Appearance saved!
            </motion.span>
          )}
        </AnimatePresence>
        <div className="ml-auto flex gap-3">
          <button onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-70">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Appearance
          </button>
        </div>
      </motion.div>
    </div>
  );
}
