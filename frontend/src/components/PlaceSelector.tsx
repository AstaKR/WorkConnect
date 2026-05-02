import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Plus, Trash2, Check, ChevronDown, Loader2, X, Pencil } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

interface Location {
  id: number;
  name: string;
  category: string;
  icon: string;
  is_default: boolean;
  is_custom: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  office: 'Office',
  store: 'Store',
  factory: 'Factory',
  warehouse: 'Warehouse',
  remote: 'Remote',
  other: 'Other',
};

const CATEGORY_ICONS: Record<string, string> = {
  office: '🏢', store: '🏪', factory: '🏭', warehouse: '📦', remote: '🏠', other: '📍',
};

const CATEGORY_COLORS: Record<string, string> = {
  office: 'bg-blue-50 text-blue-700 border-blue-200',
  store: 'bg-purple-50 text-purple-700 border-purple-200',
  factory: 'bg-orange-50 text-orange-700 border-orange-200',
  warehouse: 'bg-amber-50 text-amber-700 border-amber-200',
  remote: 'bg-green-50 text-green-700 border-green-200',
  other: 'bg-gray-50 text-gray-600 border-gray-200',
};

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function PlaceSelector({ value, onChange, disabled = false }: Props) {
  const { user } = useAuthStore();
  const isCEO = user?.role === 'ceo';
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('other');
  const [newIcon, setNewIcon] = useState('📍');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/locations/');
      const data = res.data.data || res.data.results || (Array.isArray(res.data) ? res.data : []);
      setLocations(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (open) fetchLocations(); }, [open, fetchLocations]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setAddMode(false); setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (loc: Location) => {
    onChange(loc.name);
    setOpen(false); setSearch(''); setAddMode(false);
  };

  const handleDelete = async (e: React.MouseEvent, loc: Location) => {
    e.stopPropagation();
    if (!window.confirm(`Remove "${loc.name}"?`)) return;
    await api.delete(`/reports/locations/${loc.id}/`);
    fetchLocations();
  };

  const handleAddOrUpdate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        const res = await api.patch(`/reports/locations/${editId}/`, {
          name: newName.trim(), category: newCategory, icon: newIcon,
        });
        setLocations(prev => prev.map(l => l.id === editId ? res.data : l));
        if (value === locations.find(l => l.id === editId)?.name) {
          onChange(res.data.name);
        }
      } else {
        const res = await api.post('/reports/locations/', {
          name: newName.trim(), category: newCategory, icon: newIcon,
        });
        setLocations(prev => [...prev, res.data]);
        onChange(res.data.name);
      }
      setNewName(''); setEditId(null); setAddMode(false);
    } catch { alert('Could not save location'); }
    finally { setSaving(false); }
  };

  const startEdit = (e: React.MouseEvent, loc: Location) => {
    e.stopPropagation();
    setEditId(loc.id);
    setNewName(loc.name);
    setNewCategory(loc.category);
    setNewIcon(loc.icon);
    setAddMode(true);
  };

  // Group by category
  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );
  const grouped = filtered.reduce<Record<string, Location[]>>((acc, loc) => {
    const cat = loc.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(loc);
    return acc;
  }, {});

  // Find current location object
  const current = locations.find(l => l.name === value);

  const EMOJI_OPTIONS = ['🏢', '🏪', '🏭', '📦', '🏠', '🌍', '🏛️', '📊', '🤝', '🚗', '✈️', '📍'];

    const [isAbove, setIsAbove] = useState(false);
    
    useEffect(() => {
        if (open && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setIsAbove(spaceBelow < 300); // If less than 300px below, open above
        }
    }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={`flex items-center gap-2.5 pl-3 pr-3 py-2 rounded-xl border text-sm font-medium transition-all min-w-[200px] ${
          disabled
            ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border-gray-200 text-gray-700 hover:border-primary/50 hover:shadow-sm cursor-pointer'
        } ${open ? 'border-primary ring-2 ring-primary/10 shadow-sm' : ''}`}
      >
        <span className="text-base leading-none">{current?.icon || '📍'}</span>
        <span className="flex-1 text-left truncate">{value || 'Select location'}</span>
        {current?.category && (
          <span className={`hidden sm:inline px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${CATEGORY_COLORS[current.category] || CATEGORY_COLORS.other}`}>
            {CATEGORY_LABELS[current.category] || current.category}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: isAbove ? -6 : 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isAbove ? -6 : 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-0 ${isAbove ? 'bottom-full mb-2' : 'top-full mt-2'} w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden`}
          >
            {/* Search bar */}
            <div className="px-3 pt-3 pb-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search locations..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>

            {/* Location list */}
            <div className="max-h-64 overflow-y-auto px-2 pb-2">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
                </div>
              ) : Object.keys(grouped).length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">No locations found</p>
              ) : (
                Object.entries(grouped).map(([cat, locs]) => (
                  <div key={cat}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2 pt-3 pb-1.5 flex items-center gap-1">
                      <span>{CATEGORY_ICONS[cat] || '📍'}</span> {CATEGORY_LABELS[cat] || cat}
                    </p>
                    {locs.map(loc => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleSelect(loc)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-all group ${
                          loc.name === value
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base leading-none">{loc.icon}</span>
                        <span className="flex-1 truncate">{loc.name}</span>
                        {loc.name === value && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                        
                        {isCEO && loc.is_custom && (
                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity ml-auto">
                            <button
                              type="button"
                              onClick={e => startEdit(e, loc)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
                              title="Edit location"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={e => handleDelete(e, loc)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                              title="Delete location"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {!loc.is_default && !search && (
                          <span className="text-[9px] px-1 py-0.5 bg-blue-50 text-blue-500 border border-blue-100 rounded font-bold uppercase tracking-tighter flex-shrink-0">
                            DEFINED
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Add location - Only for CEO */}
            {isCEO && (
              <div className="border-t border-gray-100 p-3 bg-gray-50/60">
                {!addMode ? (
                  <button
                    type="button"
                    onClick={() => { setAddMode(true); setEditId(null); setNewName(''); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-xl transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Location
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                      {editId ? 'Editing Location' : 'New Location'}
                    </p>
                    <div className="flex gap-2">
                      <div className="relative group/emoji">
                        <button type="button" className="w-10 h-10 rounded-xl border border-gray-200 bg-white text-xl flex items-center justify-center hover:border-primary/50 transition-colors">
                          {newIcon}
                        </button>
                        <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl border border-gray-100 shadow-xl p-2 hidden group-hover/emoji:flex flex-wrap gap-1 w-48 z-10">
                          {EMOJI_OPTIONS.map(e => (
                            <button key={e} type="button" onClick={() => setNewIcon(e)}
                              className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-colors hover:bg-gray-100 ${newIcon === e ? 'bg-primary/10' : ''}`}>
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        autoFocus
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddOrUpdate()}
                        placeholder="e.g. Theni Store..."
                        className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary/20 appearance-none bg-white"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{CATEGORY_ICONS[val]} {label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setAddMode(false); setEditId(null); setNewName(''); }}
                        className="flex-1 py-2 text-sm border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
                        Cancel
                      </button>
                      <button type="button" onClick={handleAddOrUpdate} disabled={saving || !newName.trim()}
                        className="flex-1 py-2 text-sm bg-gradient-to-r from-primary to-accent text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5 hover:shadow-md transition-all">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editId ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
