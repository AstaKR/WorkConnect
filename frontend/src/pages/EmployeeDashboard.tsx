import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'framer-motion';
import { PlusCircle, FileText, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { format } from 'date-fns';

const LOCAL_TODAY = format(new Date(), 'yyyy-MM-dd');

export default function EmployeeDashboard() {
  const { user, branding } = useAuthStore();
  const [todayReport, setTodayReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayReport = async () => {
      try {
        // Use local date string to avoid server timezone mismatch
        const response = await axios.get(`/reports/date/${LOCAL_TODAY}/`);
        setTodayReport(response.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayReport();
  }, []);

  const tasksCompleted = todayReport?.tasks?.filter((t: any) => t.status === 'Completed').length || 0;
  const totalTasks = todayReport?.tasks?.length || 0;
  const progress = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
              {branding.name}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's your work summary for {format(new Date(), 'EEEE, MMMM do')}.</p>
        </div>
        
        <Link to="/employee/report">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-primary/20 hover:shadow-lg transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Update Today's Report</span>
          </motion.button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass p-6 rounded-2xl flex flex-col items-center justify-center space-y-3 relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100 rounded-full blur-2xl opacity-50"></div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-gray-500 font-medium">Tasks Completed</h3>
          <p className="text-4xl font-bold text-gray-900">{tasksCompleted} <span className="text-xl text-gray-400 font-normal">/ {totalTasks}</span></p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass p-6 rounded-2xl flex flex-col items-center justify-center space-y-3 relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-100 rounded-full blur-2xl opacity-50"></div>
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-gray-500 font-medium">Today's Progress</h3>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-primary to-accent h-2.5 rounded-full"
            ></motion.div>
          </div>
          <p className="font-bold text-gray-700">{progress}%</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass p-6 rounded-2xl flex flex-col items-center justify-center space-y-3 relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-100 rounded-full blur-2xl opacity-50"></div>
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-gray-500 font-medium">Status</h3>
          <div className={`px-4 py-1 rounded-full font-medium ${todayReport?.is_submitted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {todayReport?.is_submitted ? 'Submitted' : 'Draft'}
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Today's Tasks</h2>
          <Link to="/employee/history" className="text-sm text-primary font-medium hover:underline">View History</Link>
        </div>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl w-full"></div>
            ))}
          </div>
        ) : todayReport?.tasks?.length > 0 ? (
          <div className="space-y-3">
            {todayReport.tasks.map((task: any) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-white/50 border border-gray-100 rounded-xl hover:shadow-sm transition-all">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{task.job}</span>
                  <span className="text-xs text-gray-500 mt-1">{task.action_plan}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    task.priority === 'High' ? 'bg-red-100 text-red-700' : 
                    task.priority === 'Medium' ? 'bg-orange-100 text-orange-700' : 
                    'bg-green-100 text-green-700'
                  }`}>
                    {task.priority}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    task.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                    task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 mb-4">No tasks added yet for today.</p>
            <Link to="/employee/report">
              <button className="text-primary font-medium hover:text-accent">Add your first task →</button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
