import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, parseISO } from 'date-fns';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    api.get('/reports/')
      .then(res => setReports(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Only show submitted reports on the calendar — drafts are hidden
  const reportMap = reports.reduce((acc: Record<string, any>, r: any) => {
    if (r.is_submitted) acc[r.date] = r;
    return acc;
  }, {});

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);
  const paddedDays = [...Array(startPadding).fill(null), ...days];

  const prev = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const next = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const monthStats = days.reduce((acc, day) => {
    const key = format(day, 'yyyy-MM-dd');
    if (reportMap[key]) acc.submitted++;
    return acc;
  }, { submitted: 0 });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Calendar</h1>
          <p className="text-gray-500 mt-1">Your daily report activity at a glance.</p>
        </div>
        <Link to="/employee/report/new">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-medium shadow-md">
            <PlusCircle className="w-4 h-4" /> Today's Report
          </motion.button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-4 rounded-2xl text-center">
          <p className="text-2xl font-bold text-green-600">{monthStats.submitted}</p>
          <p className="text-sm text-gray-500 mt-1">Submitted</p>
        </div>
        <div className="glass p-4 rounded-2xl text-center">
          <p className="text-2xl font-bold text-gray-400">{days.length - monthStats.submitted}</p>
          <p className="text-sm text-gray-500 mt-1">No Report</p>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={prev} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">{format(currentDate, 'MMMM yyyy')}</h2>
          <button onClick={next} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 animate-pulse">Loading calendar...</div>
        ) : (
          <div className="grid grid-cols-7">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="h-20 border-r border-b border-gray-50" />;
              const key = format(day, 'yyyy-MM-dd');
              const report = reportMap[key];
              const today = isToday(day);
              const inMonth = isSameMonth(day, currentDate);

              return (
                <motion.div key={key} whileHover={{ scale: 0.97 }}
                  onClick={() => report && setSelected(report)}
                  className={`h-20 border-r border-b border-gray-50 p-2 transition-colors ${
                    report ? 'cursor-pointer hover:bg-gray-50/70' : ''
                  } ${!inMonth ? 'opacity-30' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1.5 ${
                    today ? 'bg-primary text-white' : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  {report && (
                    <>
                      <div className="h-1.5 rounded-full mx-1 bg-green-400" />
                      <p className="text-xs mt-1 px-1 truncate font-medium text-green-600">
                        ✓ Submitted
                      </p>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-green-400 inline-block" /> Submitted</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> Today</span>
        </div>
      </div>

      {/* Report detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">
                {new Date(selected.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                ✓ Submitted
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{selected.place_of_work}</p>
            {selected.notes && <p className="text-sm text-gray-700 mb-4 bg-gray-50 p-3 rounded-lg">{selected.notes}</p>}
            {selected.tasks?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tasks ({selected.tasks.length})</p>
                {selected.tasks.slice(0, 4).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 truncate flex-1">{t.job}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                      t.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      t.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>{t.status}</span>
                  </div>
                ))}
                {selected.tasks.length > 4 && <p className="text-xs text-gray-400 text-center">+{selected.tasks.length - 4} more tasks</p>}
              </div>
            )}
            <button onClick={() => setSelected(null)} className="mt-4 w-full py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
