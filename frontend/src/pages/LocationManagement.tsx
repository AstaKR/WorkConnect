import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Plus, Trash2, Pencil, Search, Loader2, 
  Building2, Store, Factory, Package, Home, Globe,
  Check, X, AlertCircle, Upload, Download, FileText
} from 'lucide-react';
import api from '../api/axios';

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

const CATEGORY_ICONS: Record<string, any> = {
  office: Building2,
  store: Store,
  factory: Factory,
  warehouse: Package,
  remote: Home,
  other: Globe,
};

const EMOJI_OPTIONS = ['🏢', '🏪', '🏭', '📦', '🏠', '🌍', '🏛️', '📊', '🤝', '🚗', '✈️', '📍'];

export default function LocationManagement() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importCsv, setImportCsv] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('office');
  const [icon, setIcon] = useState('📍');
  const [saving, setSaving] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await api.get('/reports/locations/');
      const data = res.data.data || res.data.results || (Array.isArray(res.data) ? res.data : []);
      setLocations(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingLoc) {
        await api.patch(`/reports/locations/${editingLoc.id}/`, { name, category, icon });
      } else {
        await api.post('/reports/locations/', { name, category, icon });
      }
      fetchLocations();
      resetForm();
    } catch {
      alert('Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (loc: Location) => {
    if (!window.confirm(`Are you sure you want to delete "${loc.name}"? This location will no longer be available for reports.`)) return;
    try {
      await api.delete(`/reports/locations/${loc.id}/`);
      fetchLocations();
    } catch {
      alert('Failed to delete location');
    }
  };

  const handleExport = () => {
    const headers = ['name', 'category', 'icon', 'is_default'];
    const rows = locations.map(l => [l.name, l.category, l.icon, l.is_default]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `locations_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!importCsv.trim()) return;
    setImporting(true);
    try {
      const res = await api.post('/reports/locations/import/', { csv_data: importCsv });
      alert(res.data.message);
      fetchLocations();
      setShowImport(false);
      setImportCsv('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setImportCsv(event.target?.result as string);
    reader.readAsText(file);
  };

  const IMPORT_TEMPLATE = `name,category,icon
New Store,store,🏪
Main Factory,factory,🏭
Branch Office,office,🏢`;

  const resetForm = () => {
    setName('');
    setCategory('office');
    setIcon('📍');
    setEditingLoc(null);
    setShowAdd(false);
  };

  const startEdit = (loc: Location) => {
    setEditingLoc(loc);
    setName(loc.name);
    setCategory(loc.category);
    setIcon(loc.icon);
    setShowAdd(true);
  };

  const filtered = locations.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Locations</h1>
          <p className="text-gray-500 mt-1">Manage the stores, factories, and offices available for work reporting.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" /> Add New Location
          </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or category..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
        </div>
        <div className="hidden sm:flex items-center gap-6 px-4 border-l border-gray-100 text-sm">
          <div>
            <span className="text-gray-400">Total:</span>
            <span className="ml-2 font-bold text-gray-900">{locations.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Defined:</span>
            <span className="ml-2 font-bold text-primary">{locations.filter(l => !l.is_default).length}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-gray-500 font-medium">Loading locations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(loc => {
            const Icon = CATEGORY_ICONS[loc.category] || CATEGORY_ICONS.other;
            return (
              <motion.div 
                layout
                key={loc.id}
                className={`group relative bg-white border rounded-2xl p-5 transition-all hover:shadow-md ${loc.is_default ? 'border-gray-100' : 'border-blue-100 shadow-sm'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl shadow-inner">
                    {loc.icon}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEdit(loc)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(loc)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-gray-900">{loc.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-400 font-medium uppercase tracking-wider">
                      <Icon className="w-3 h-3" /> {CATEGORY_LABELS[loc.category] || loc.category}
                    </span>
                    {loc.is_default ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-bold uppercase">System Default</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-bold uppercase">Defined</span>
                    )}
                  </div>
                </div>

                {!loc.is_default && (
                  <div className="absolute bottom-2 right-3">
                    <Check className="w-4 h-4 text-emerald-500 opacity-20" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-white/20"
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLoc ? 'Edit Location' : 'Add New Location'}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Emoji & Name */}
              <div className="flex gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Icon</label>
                  <div className="relative group/emoji">
                    <button className="w-14 h-14 rounded-2xl border-2 border-gray-100 bg-gray-50 text-2xl flex items-center justify-center hover:border-primary/30 transition-all">
                      {icon}
                    </button>
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 hidden group-hover/emoji:grid grid-cols-4 gap-1 z-10 w-40">
                      {EMOJI_OPTIONS.map(e => (
                        <button key={e} onClick={() => setIcon(e)} className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-lg ${icon === e ? 'bg-primary/10' : ''}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Location Name</label>
                  <input 
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Theni Store, Factory A"
                    className="w-full h-14 px-4 border-2 border-gray-100 rounded-2xl focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => {
                    const Icon = CATEGORY_ICONS[val] || CATEGORY_ICONS.other;
                    return (
                      <button 
                        key={val}
                        onClick={() => setCategory(val)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${category === val ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-semibold">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {editingLoc && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    Editing this location will affect how it appears in both old and new reports. Use caution when renaming.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50/50 flex gap-3">
              <button onClick={resetForm} className="flex-1 py-3 px-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition-all">
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-accent text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {editingLoc ? 'Update Location' : 'Save Location'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden"
          >
            <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Import Locations</h2>
                <p className="text-sm text-gray-500 mt-0.5">Upload a CSV file to bulk add locations.</p>
              </div>
              <button onClick={() => { setShowImport(false); setImportCsv(''); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Template */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-2">
                  <FileText className="w-4 h-4" /> CSV Template
                </div>
                <pre className="text-[11px] text-blue-600 font-mono overflow-x-auto">
                  {IMPORT_TEMPLATE}
                </pre>
                <button 
                  onClick={() => navigator.clipboard.writeText(IMPORT_TEMPLATE)}
                  className="mt-3 text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Copy Template
                </button>
              </div>

              {/* Upload area */}
              <div 
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-gray-50 transition-all"
              >
                <input type="file" ref={fileRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">CSV files only</p>
                </div>
              </div>

              {importCsv && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Preview (CSV Data)</p>
                  <textarea 
                    value={importCsv} 
                    onChange={e => setImportCsv(e.target.value)}
                    className="w-full h-32 text-xs font-mono p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              <button 
                onClick={() => { setShowImport(false); setImportCsv(''); }}
                className="flex-1 py-3 px-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                disabled={importing || !importCsv.trim()}
                className="flex-1 py-3 px-4 bg-primary text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Run Import
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
