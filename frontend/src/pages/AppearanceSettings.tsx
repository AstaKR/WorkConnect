import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Loader2, Palette, Monitor, Type, LayoutGrid,
  Sparkles, RotateCcw, ChevronDown, Info,
  PanelLeft, AlignLeft, AlignRight,
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { applyTheme } from '../utils/theme';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Prefs {
  theme: string;
  primary_color: string;
  accent_color: string;
  sidebar_color: string;
  background_color: string;
  font_size: string;
  layout_density: string;
  layout_style: string;
  sidebar_position: string;
}

const DEFAULT_PREFS: Prefs = {
  theme: 'ocean',
  primary_color: '#2563EB',
  accent_color: '#7C3AED',
  sidebar_color: '#1E293B',
  background_color: '#F8FAFC',
  font_size: 'md',
  layout_density: 'comfortable',
  layout_style: 'sidebar',
  sidebar_position: 'left',
};

// ── 15 Preset Themes ─────────────────────────────────────────────────────────
const THEMES = [
  { id: 'ocean',    name: 'Ocean Blue',  primary: '#2563EB', accent: '#7C3AED', sidebar: '#1E293B', bg: '#F8FAFC' },
  { id: 'forest',   name: 'Forest',      primary: '#059669', accent: '#0D9488', sidebar: '#134E2E', bg: '#F0FDF4' },
  { id: 'sunset',   name: 'Sunset',      primary: '#EA580C', accent: '#DB2777', sidebar: '#27101A', bg: '#FFF7ED' },
  { id: 'royal',    name: 'Royal',       primary: '#7C3AED', accent: '#EC4899', sidebar: '#1E1040', bg: '#FAF5FF' },
  { id: 'steel',    name: 'Steel',       primary: '#475569', accent: '#0EA5E9', sidebar: '#0F172A', bg: '#F1F5F9' },
  { id: 'rosegold', name: 'Rose Gold',   primary: '#BE185D', accent: '#F59E0B', sidebar: '#1C0B10', bg: '#FFF1F2' },
  { id: 'midnight', name: 'Midnight',    primary: '#818CF8', accent: '#34D399', sidebar: '#080D1A', bg: '#111827' },
  { id: 'aurora',   name: 'Aurora',      primary: '#06B6D4', accent: '#8B5CF6', sidebar: '#0C1624', bg: '#F0F9FF' },
  { id: 'crimson',  name: 'Crimson',     primary: '#DC2626', accent: '#F97316', sidebar: '#1A0808', bg: '#FEF2F2' },
  { id: 'earth',    name: 'Earth',       primary: '#92400E', accent: '#65A30D', sidebar: '#1C1208', bg: '#FFFBEB' },
  { id: 'cobalt',   name: 'Cobalt',      primary: '#1D4ED8', accent: '#0891B2', sidebar: '#0A1628', bg: '#EFF6FF' },
  { id: 'lavender', name: 'Lavender',    primary: '#9333EA', accent: '#EC4899', sidebar: '#1E0A2E', bg: '#F5F3FF' },
  { id: 'emerald',  name: 'Emerald',     primary: '#10B981', accent: '#F59E0B', sidebar: '#052E16', bg: '#ECFDF5' },
  { id: 'mono',     name: 'Monochrome',  primary: '#334155', accent: '#64748B', sidebar: '#0F172A', bg: '#F8FAFC' },
  { id: 'neon',     name: 'Neon Dark',   primary: '#A855F7', accent: '#22D3EE', sidebar: '#080B14', bg: '#0D1117' },
] as const;

// ── Layout Modes ──────────────────────────────────────────────────────────────
const LAYOUT_MODES = [
  { id: 'sidebar',  name: 'Full Sidebar',       desc: 'Classic sidebar navigation' },
  { id: 'compact',  name: 'Compact Sidebar',    desc: 'Icon-only slim sidebar' },
  { id: 'topnav',   name: 'Top Navigation',     desc: 'Horizontal nav bar on top' },
] as const;

// ── Mini Layout Preview ───────────────────────────────────────────────────────
function LayoutMiniPreview({ mode, prefs, size = 'md' }: {
  mode: string; prefs: Prefs; size?: 'sm' | 'md';
}) {
  const h = size === 'sm' ? 'h-[52px]' : 'h-[80px]';

  if (mode === 'topnav') {
    return (
      <div className={`w-full ${h} rounded-xl overflow-hidden flex flex-col border border-black/5`}
        style={{ background: prefs.background_color }}>
        {/* Top bar */}
        <div className="flex items-center gap-1.5 px-2 h-5 flex-shrink-0"
          style={{ background: prefs.sidebar_color }}>
          <div className="w-3 h-2 rounded-sm" style={{ background: prefs.primary_color, opacity: 0.9 }} />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-1.5 rounded-full flex-shrink-0"
              style={{ background: `${prefs.primary_color}${i === 1 ? '70' : '35'}`, width: i === 1 ? 14 : 10 }} />
          ))}
          <div className="ml-auto w-4 h-3 rounded" style={{ background: `${prefs.accent_color}60` }} />
        </div>
        {/* Content */}
        <div className="flex-1 p-2 flex flex-col gap-1.5">
          <div className="flex gap-2">
            <div className="h-2 rounded-full flex-1" style={{ background: `${prefs.primary_color}18` }} />
            <div className="h-2 w-8 rounded" style={{ background: prefs.primary_color, opacity: 0.75 }} />
          </div>
          <div className="grid grid-cols-3 gap-1 flex-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-lg"
                style={{ background: `${i % 2 === 0 ? prefs.accent_color : prefs.primary_color}18` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sidebarW = mode === 'compact' ? 'w-5' : 'w-10';

  return (
    <div className={`w-full ${h} rounded-xl overflow-hidden flex border border-black/5`}
      style={{ background: prefs.background_color }}>
      {/* Sidebar */}
      <div className={`${sidebarW} h-full flex flex-col items-center py-2 gap-1.5 flex-shrink-0`}
        style={{ background: prefs.sidebar_color }}>
        <div className="w-3 h-3 rounded-full" style={{ background: prefs.primary_color }} />
        {[1, 2, 3].map(i => (
          <div key={i} className={`rounded-full ${mode === 'compact' ? 'w-2.5 h-1.5' : 'w-4 h-1.5'}`}
            style={{ background: `${prefs.primary_color}${i === 1 ? '70' : '35'}` }} />
        ))}
      </div>
      {/* Content */}
      <div className="flex-1 p-2 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <div className="h-2 flex-1 rounded-full" style={{ background: `${prefs.primary_color}18` }} />
          <div className="h-2 w-8 rounded" style={{ background: prefs.primary_color, opacity: 0.8 }} />
        </div>
        <div className="grid grid-cols-2 gap-1 flex-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg"
              style={{ background: `${i % 2 === 0 ? prefs.accent_color : prefs.primary_color}18` }} />
          ))}
        </div>
        {size !== 'sm' && (
          <div className="h-2 w-3/4 rounded-full" style={{ background: `${prefs.accent_color}25` }} />
        )}
      </div>
    </div>
  );
}

// ── Fields the backend actually accepts (no layout_style / sidebar_position) ──
const toApiPayload = (p: Prefs) => ({
  theme:            p.theme,
  primary_color:    p.primary_color,
  accent_color:     p.accent_color,
  sidebar_color:    p.sidebar_color,
  background_color: p.background_color,
  font_size:        p.font_size,
  layout_density:   p.layout_density,
});

// ── Main Component ────────────────────────────────────────────────────────────
export default function AppearanceSettings() {
  const { user, setUser } = useAuthStore();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);

  useEffect(() => {
    // Use Zustand store as base (has layout_style, sidebar_position),
    // then overlay with API colors (primary_color, accent_color, etc.)
    const storedPrefs = user?.preferences as Partial<Prefs> | undefined;
    const base: Prefs = { ...DEFAULT_PREFS, ...storedPrefs };
    setPrefs(base);
    applyTheme(base);

    api.get('/settings/appearance/')
      .then(res => {
        if (!res.data?.data) return;
        // API only has color/font fields — keep layout_style etc from Zustand
        const merged: Prefs = { ...base, ...res.data.data };
        setPrefs(merged);
        applyTheme(merged);
        // Sync Zustand with API colors (so they match)
        if (user) setUser({ ...user, preferences: merged });
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Apply locally + save to API + update Zustand store */
  const savePrefs = async (next: Prefs, silent = false) => {
    setPrefs(next);
    applyTheme(next);
    if (!silent) setSaving(true);
    try {
      await api.patch('/settings/appearance/', toApiPayload(next));
      if (user) setUser({ ...user, preferences: next });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      // Even if API fails, persist to Zustand so refresh doesn't lose it
      if (user) setUser({ ...user, preferences: next });
      if (!silent) {
        setSaved(true); // show saved for local persistence
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const apply = (next: Prefs) => { setPrefs(next); applyTheme(next); };

  /** Preset click → auto-save immediately, no "Save" button needed */
  const applyPreset = (t: typeof THEMES[number]) => {
    const next: Prefs = { ...prefs, theme: t.id, primary_color: t.primary, accent_color: t.accent, sidebar_color: t.sidebar, background_color: t.bg };
    savePrefs(next);
  };

  const handleSave = () => savePrefs(prefs);

  const handleReset = () => savePrefs(DEFAULT_PREFS);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />
    </div>
  );

  const activeTheme = THEMES.find(t => t.id === prefs.theme);

  return (
    <div className="min-h-screen bg-gray-50/60">

      {/* ── Sticky Header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-extrabold text-gray-900">Appearance</h1>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
              Personalize your workspace — themes, layouts, typography
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {saved && (
                <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5" /> Saved!
                </motion.span>
              )}
            </AnimatePresence>
            <button onClick={handleReset} title="Reset to defaults"
              className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Live Preview ─────────────────────────────────────────────── */}
        <section>
          <SectionLabel icon={<Monitor className="w-4 h-4 text-primary" />} title="Live Preview" />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <LayoutMiniPreview mode={prefs.layout_style} prefs={prefs} size="md" />
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: prefs.primary_color }} />
                {activeTheme?.name ?? 'Custom Theme'}
              </span>
              <span>{LAYOUT_MODES.find(m => m.id === prefs.layout_style)?.name}</span>
              <span>{prefs.sidebar_position === 'right' && prefs.layout_style !== 'topnav' ? 'Right sidebar' : prefs.layout_style !== 'topnav' ? 'Left sidebar' : ''}</span>
            </div>
          </div>
        </section>

        {/* ── Preset Themes ────────────────────────────────────────────── */}
        <section>
          <SectionLabel
            icon={<Sparkles className="w-4 h-4 text-amber-500" />}
            title="Themes"
            badge={`${THEMES.length} presets`}
          />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {THEMES.map(t => {
                const isActive = prefs.theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => applyPreset(t)}
                    className={`relative group flex flex-col rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                      isActive
                        ? 'border-primary shadow-md shadow-primary/20 scale-[1.02]'
                        : 'border-gray-100 hover:border-gray-300 hover:scale-[1.01]'
                    }`}
                  >
                    {/* Mini visual preview */}
                    <div className="h-14 flex" style={{ background: t.bg }}>
                      {/* Sidebar strip */}
                      <div className="w-5 h-full flex flex-col items-center py-1.5 gap-1"
                        style={{ background: t.sidebar }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.primary }} />
                        <div className="w-2.5 h-1 rounded-full" style={{ background: `${t.primary}60` }} />
                        <div className="w-2.5 h-1 rounded-full" style={{ background: `${t.primary}35` }} />
                        <div className="w-2.5 h-1 rounded-full" style={{ background: `${t.primary}35` }} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 p-1.5 flex flex-col justify-between">
                        <div className="w-full h-1 rounded-full" style={{ background: `${t.primary}20` }} />
                        <div className="flex gap-1">
                          <div className="w-5 h-3 rounded" style={{ background: t.primary, opacity: 0.85 }} />
                          <div className="w-4 h-3 rounded" style={{ background: t.accent, opacity: 0.55 }} />
                        </div>
                      </div>
                    </div>
                    {/* Name label */}
                    <div className={`px-1 py-1.5 text-center ${isActive ? 'bg-primary/5' : 'bg-white group-hover:bg-gray-50/80'}`}>
                      <p className={`text-[9px] font-bold truncate leading-none ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                        {t.name}
                      </p>
                    </div>
                    {/* Active check badge */}
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-sm">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Color swatches row for quick reference */}
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-gray-400 font-medium">Active colors:</span>
              {[
                { label: 'Primary', color: prefs.primary_color },
                { label: 'Accent', color: prefs.accent_color },
                { label: 'Sidebar', color: prefs.sidebar_color },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded shadow-sm border border-black/10" style={{ background: color }} />
                  <span className="text-[10px] text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Layout Style ─────────────────────────────────────────────── */}
        <section>
          <SectionLabel icon={<PanelLeft className="w-4 h-4 text-primary" />} title="Layout Style" />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">

            {/* 3 layout mode cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LAYOUT_MODES.map(mode => {
                const isActive = prefs.layout_style === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => apply({ ...prefs, layout_style: mode.id })}
                    className={`relative flex flex-col gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                      isActive
                        ? 'border-primary bg-primary/3 shadow-sm shadow-primary/10'
                        : 'border-gray-100 hover:border-gray-200 bg-gray-50/40'
                    }`}
                  >
                    <LayoutMiniPreview mode={mode.id} prefs={prefs} size="sm" />
                    <div>
                      <p className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-gray-700'}`}>{mode.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{mode.desc}</p>
                    </div>
                    {isActive && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-sm">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sidebar position — only for sidebar/compact modes */}
            {prefs.layout_style !== 'topnav' && (
              <div className="border-t border-gray-50 pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2.5">Sidebar Position</p>
                <div className="flex gap-2">
                  {[
                    { id: 'left',  label: 'Left',  Icon: AlignLeft },
                    { id: 'right', label: 'Right', Icon: AlignRight },
                  ].map(({ id, label, Icon }) => {
                    const isActive = prefs.sidebar_position === id;
                    return (
                      <button
                        key={id}
                        onClick={() => apply({ ...prefs, sidebar_position: id })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                          isActive
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Custom Colors (collapsible) ───────────────────────────────── */}
        <section>
          <button
            onClick={() => setColorsOpen(v => !v)}
            className="w-full flex items-center justify-between py-1.5 group mb-1"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-gray-900">Custom Colors</span>
              <span className="text-xs text-gray-400">Fine-tune individual colors</span>
            </div>
            <motion.div animate={{ rotate: colorsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {colorsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {([
                    { label: 'Primary Color',    key: 'primary_color',    desc: 'Buttons, links, active states' },
                    { label: 'Accent Color',     key: 'accent_color',     desc: 'Badges, highlights, secondary elements' },
                    { label: 'Sidebar Color',    key: 'sidebar_color',    desc: 'Navigation background' },
                    { label: 'Background Color', key: 'background_color', desc: 'Main content area background' },
                  ] as const).map(({ label, key, desc }) => (
                    <div key={key} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm"
                          style={{ background: prefs[key] }} />
                        <input
                          type="color"
                          value={prefs[key]}
                          onChange={e => apply({ ...prefs, theme: 'custom', [key]: e.target.value })}
                          className="w-10 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5 bg-white"
                        />
                        <span className="text-[10px] font-mono text-gray-400 hidden sm:block w-14">
                          {prefs[key]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Typography & Density ─────────────────────────────────────── */}
        <section>
          <SectionLabel icon={<Type className="w-4 h-4 text-primary" />} title="Typography & Density" />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-5">

            {/* Font size */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2.5">Font Size</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 'sm', label: 'Small',  cls: 'text-xs' },
                  { val: 'md', label: 'Medium', cls: 'text-sm' },
                  { val: 'lg', label: 'Large',  cls: 'text-base' },
                ].map(opt => {
                  const active = prefs.font_size === opt.val;
                  return (
                    <button key={opt.val}
                      onClick={() => apply({ ...prefs, font_size: opt.val })}
                      className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                        active ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className={`font-bold ${opt.cls} ${active ? 'text-primary' : 'text-gray-600'}`}>Aa</span>
                      <span className="text-[10px] text-gray-500 font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Layout density */}
            <div className="border-t border-gray-50 pt-4">
              <p className="text-xs font-semibold text-gray-500 mb-2.5">Layout Density</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'compact',     label: 'Compact',     desc: 'More content, tighter spacing' },
                  { val: 'comfortable', label: 'Comfortable', desc: 'Relaxed, easy to scan' },
                ].map(opt => {
                  const active = prefs.layout_density === opt.val;
                  return (
                    <button key={opt.val}
                      onClick={() => apply({ ...prefs, layout_density: opt.val })}
                      className={`py-3 px-4 rounded-xl border-2 text-left transition-all ${
                        active ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <p className={`text-sm font-bold ${active ? 'text-primary' : 'text-gray-700'}`}>{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Density visual reference */}
            <div className="border-t border-gray-50 pt-4">
              <p className="text-[10px] text-gray-400 mb-2">Preview</p>
              <div className={`border border-gray-100 rounded-xl bg-gray-50 ${prefs.layout_density === 'compact' ? 'p-2' : 'p-4'}`}>
                <div className={`flex items-center gap-3 ${prefs.layout_density === 'compact' ? 'py-1.5' : 'py-2.5'} border-b border-gray-100`}>
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-2 w-24 bg-gray-200 rounded-full mb-1" />
                    <div className="h-1.5 w-16 bg-gray-100 rounded-full" />
                  </div>
                  <div className="h-5 w-12 rounded" style={{ background: `${prefs.primary_color}20` }} />
                </div>
                <div className={`flex items-center gap-3 ${prefs.layout_density === 'compact' ? 'py-1.5' : 'py-2.5'}`}>
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-2 w-20 bg-gray-200 rounded-full mb-1" />
                    <div className="h-1.5 w-12 bg-gray-100 rounded-full" />
                  </div>
                  <div className="h-5 w-12 rounded" style={{ background: `${prefs.accent_color}20` }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── About Section ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-6 rounded-2xl mt-6"
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" /> About
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">WorkConnect Version</p>
              <p className="text-lg font-semibold text-gray-900">v1.1.0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Release Date</p>
              <p className="text-sm text-gray-900">May 2026</p>
            </div>
          </div>
        </motion.div>

        {/* ── Bottom spacer ─────────────────────────────────────────────── */}
        <div className="h-6" />
      </div>
    </div>
  );
}

// ── Section Label helper ──────────────────────────────────────────────────────
function SectionLabel({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      {badge && <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{badge}</span>}
    </div>
  );
}
