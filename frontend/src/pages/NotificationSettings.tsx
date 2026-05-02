import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Mail, Clock, ShieldAlert, Check, Loader2,
  FileCheck, FileX, ClipboardList, AlertTriangle,
  Megaphone, AtSign, LogIn, BarChart2, ChevronDown,
  SendHorizonal
} from 'lucide-react';
import axios from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

type Prefs = Record<string, any>;

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' }
  }),
};

interface NotifGroup {
  id: string;
  label: string;
  color: string;
  icon: React.ReactNode;
  items: { key: string; title: string; desc: string; icon: React.ReactNode }[];
}

const GROUPS: NotifGroup[] = [
  {
    id: 'reports',
    label: 'Reports & Tasks',
    color: 'blue',
    icon: <FileCheck className="w-5 h-5 text-blue-500" />,
    items: [
      { key: 'notify_report_submitted', title: 'Report Submitted', desc: 'When someone on your team submits a daily report (managers & CEO only)', icon: <Mail className="w-4 h-4 text-blue-500" /> },
      { key: 'notify_report_approved', title: 'Report Approved', desc: 'When your manager approves your submitted report', icon: <FileCheck className="w-4 h-4 text-green-500" /> },
      { key: 'notify_report_rejected', title: 'Report Returned', desc: 'When your manager sends your report back for revision', icon: <FileX className="w-4 h-4 text-red-500" /> },
      { key: 'notify_report_shared', title: 'Report Shared', desc: 'When someone shares a report with you', icon: <ClipboardList className="w-4 h-4 text-purple-500" /> },
    ],
  },
  {
    id: 'reminders',
    label: 'Reminders & Alerts',
    color: 'orange',
    icon: <Clock className="w-5 h-5 text-orange-500" />,
    items: [
      { key: 'notify_pending_reminder', title: 'Pending Report Reminder', desc: 'Reminder at 6 PM if you haven\'t submitted your daily report', icon: <Clock className="w-4 h-4 text-orange-500" /> },
      { key: 'notify_no_report_alert', title: 'Missing Report Alert', desc: 'Alert at 7 PM if today\'s report is still missing', icon: <ShieldAlert className="w-4 h-4 text-red-500" /> },
      { key: 'notify_task_assigned', title: 'Task Assigned', desc: 'When a new task is assigned to you by a manager', icon: <ClipboardList className="w-4 h-4 text-teal-500" /> },
      { key: 'notify_task_overdue', title: 'Task Overdue', desc: 'When one of your assigned tasks passes its due date', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
    ],
  },
  {
    id: 'system',
    label: 'System & Security',
    color: 'purple',
    icon: <Bell className="w-5 h-5 text-purple-500" />,
    items: [
      { key: 'notify_weekly_summary', title: 'Weekly Summary Digest', desc: 'Performance summary email every Monday at 9 AM', icon: <BarChart2 className="w-4 h-4 text-purple-500" /> },
      { key: 'notify_announcements', title: 'Company Announcements', desc: 'Important company-wide announcements from management', icon: <Megaphone className="w-4 h-4 text-pink-500" /> },
      { key: 'notify_mentions', title: 'Mentions & Tags', desc: 'When someone tags you in a report or comment', icon: <AtSign className="w-4 h-4 text-indigo-500" /> },
      { key: 'notify_login_alert', title: 'New Login Alert', desc: 'Security alert when your account is accessed from a new device', icon: <LogIn className="w-4 h-4 text-gray-500" /> },
    ],
  },
];

const DIGEST_OPTIONS = [
  { val: 'none', label: 'Off', desc: 'No digest emails' },
  { val: 'daily', label: 'Daily', desc: 'Every morning at 8 AM' },
  { val: 'weekly', label: 'Weekly', desc: 'Every Monday at 9 AM' },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 shrink-0 ${on ? 'bg-primary' : 'bg-gray-200'}`}
    >
      <motion.span
        layout
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
        animate={{ x: on ? 24 : 4 }}
        transition={{ type: 'spring', stiffness: 700, damping: 35 }}
      />
    </button>
  );
}

export default function NotificationSettings() {
  const { user, setUser } = useAuthStore();
  const [preferences, setPreferences] = useState<Prefs>(user?.preferences || {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>('reports');

  useEffect(() => {
    if (user?.preferences) setPreferences(user.preferences);
  }, [user]);

  const handleToggle = (key: string) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.patch('/settings/appearance/', preferences);
      if (res.data.success) {
        setUser({ ...user!, preferences: res.data.data });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      alert('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const enableAll = () => {
    const updated = { ...preferences };
    GROUPS.forEach(g => g.items.forEach(i => { updated[i.key] = true; }));
    setPreferences(updated);
  };

  const disableAll = () => {
    const updated = { ...preferences };
    GROUPS.forEach(g => g.items.forEach(i => { updated[i.key] = false; }));
    setPreferences(updated);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-8 h-8 text-primary" />
          Notification Settings
        </h1>
        <p className="text-gray-500 mt-1">Choose what alerts and emails you receive from the system.</p>
      </motion.div>

      {/* Quick actions */}
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible"
        className="flex items-center gap-3">
        <button onClick={enableAll}
          className="text-xs font-medium px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
          Enable All
        </button>
        <button onClick={disableAll}
          className="text-xs font-medium px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
          Disable All
        </button>
      </motion.div>

      {/* Notification Groups */}
      {GROUPS.map((group, gi) => (
        <motion.div key={group.id} custom={gi + 1} variants={sectionVariants} initial="hidden" animate="visible"
          className="glass rounded-2xl overflow-hidden shadow-sm border border-gray-100">

          {/* Group Header */}
          <button
            className="w-full flex items-center justify-between p-5 hover:bg-white/70 transition-colors"
            onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                {group.icon}
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">{group.label}</p>
                <p className="text-xs text-gray-400">
                  {group.items.filter(i => preferences[i.key]).length}/{group.items.length} enabled
                </p>
              </div>
            </div>
            <motion.div animate={{ rotate: expandedGroup === group.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </motion.div>
          </button>

          {/* Group Items */}
          <AnimatePresence initial={false}>
            {expandedGroup === group.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {group.items.map(item => (
                    <div key={item.key}
                      className="flex items-center justify-between px-5 py-4 hover:bg-white/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500 max-w-xs">{item.desc}</p>
                        </div>
                      </div>
                      <Toggle on={!!preferences[item.key]} onToggle={() => handleToggle(item.key)} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {/* Email Digest Frequency */}
      <motion.div custom={GROUPS.length + 1} variants={sectionVariants} initial="hidden" animate="visible"
        className="glass rounded-2xl p-5 space-y-3 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-gray-900">Email Digest Frequency</h2>
        </div>
        <p className="text-sm text-gray-500">Receive a summary of activity instead of individual emails.</p>
        <div className="grid grid-cols-3 gap-2">
          {DIGEST_OPTIONS.map(opt => (
            <button key={opt.val}
              onClick={() => setPreferences(p => ({ ...p, email_digest: opt.val }))}
              className={`p-3 rounded-xl border-2 text-left transition-all ${preferences.email_digest === opt.val
                ? 'border-primary bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'}`}
            >
              <p className={`text-sm font-semibold ${preferences.email_digest === opt.val ? 'text-primary' : 'text-gray-700'}`}>{opt.label}</p>
              <p className="text-xs text-gray-400">{opt.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Save Bar */}
      <motion.div custom={GROUPS.length + 2} variants={sectionVariants} initial="hidden" animate="visible"
        className="flex items-center justify-between gap-4 pt-2">
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="text-green-600 text-sm flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4" /> Preferences saved!
            </motion.span>
          )}
        </AnimatePresence>
        <button onClick={handleSave} disabled={saving}
          className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-70">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizonal className="w-4 h-4" />}
          Save Preferences
        </button>
      </motion.div>
    </div>
  );
}
