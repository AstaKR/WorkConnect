import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Send, Plus, AlertCircle } from 'lucide-react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import ExpandedTaskItem from '../components/ExpandedTaskItem';
import MinimizedTaskItem from '../components/MinimizedTaskItem';

interface Task {
  id: number;
  job: string;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  action_plan?: string;
  order: number;
  place_of_work?: string;
}

export default function NewReport() {
  const [report, setReport] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusedTaskId, setFocusedTaskId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, setValue } = useForm();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get('/reports/today/');
        const data = res.data.data;
        setReport(data);
        setTasks(data.tasks || []);
        // Auto-focus first task on load
        if (data.tasks && data.tasks.length > 0) {
          setFocusedTaskId(data.tasks[0].id);
        }
        setValue('place_of_work', data.place_of_work);
        setValue('notes', data.notes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [setValue]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update order values
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  };

  const handleAddTask = () => {
    const newTaskId = Date.now();
    const newTask: Task = {
      id: newTaskId,
      job: '',
      priority: 'Medium',
      status: 'Pending',
      order: tasks.length,
      place_of_work: report?.place_of_work || 'Corporate Office',
    };
    setTasks((prev) => [...prev, newTask]);
    // Auto-focus new task
    setFocusedTaskId(newTaskId);
  };

  const handleUpdateTask = (id: number, update: any) => {
    // Handle both the discriminated union format from ExpandedTaskItem
    // and any generic update object
    const updateObj = update.field
      ? { [update.field]: update.value }
      : update;
    setTasks(tasks.map((t) => (t.id === id ? { ...t, ...updateObj } : t)));
  };

  const handleRemoveTask = (id: number) => {
    setTasks(tasks.filter((t) => t.id !== id));
    // If removed task was focused, focus next or previous
    if (focusedTaskId === id) {
      const remainingTasks = tasks.filter((t) => t.id !== id);
      if (remainingTasks.length > 0) {
        setFocusedTaskId(remainingTasks[0].id);
      } else {
        setFocusedTaskId(null);
      }
    }
  };

  const handleTaskFocus = (taskId: number) => {
    setFocusedTaskId(taskId);
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    // Only unfocus if clicking on the background, not on task items
    if (e.target === e.currentTarget) {
      setFocusedTaskId(null);
    }
  };

  const saveReport = async (data: any, submit = false) => {
    if (submitting) return;

    // Validate: check for empty tasks
    const emptyTasks = tasks.filter(t => !t.job.trim());
    if (emptyTasks.length > 0) {
      alert(`⚠️ ${emptyTasks.length} task(s) have no description. Please fill in all task titles before saving.`);
      return;
    }

    setSubmitting(true);
    try {
      if (submit) {
        // Submit: single atomic request (details + tasks + submit)
        await axios.post(`/reports/${report.id}/submit_all/`, {
          place_of_work: data.place_of_work,
          notes: data.notes,
          tasks,
        });
        navigate('/employee/dashboard');
      } else {
        // Draft save: update details first, then bulk save tasks
        await axios.patch(`/reports/${report.id}/`, {
          place_of_work: data.place_of_work,
          notes: data.notes,
        });
        const res = await axios.post(`/reports/${report.id}/save_tasks/`, { tasks });
        if (res.data.success) setTasks(res.data.data);
        alert('Draft saved successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><AlertCircle className="animate-pulse w-8 h-8 text-primary mx-auto" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Today's Report</h1>
          <p className="text-gray-500 mt-1">Log your tasks and submit at the end of the day.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSubmit((d) => saveReport(d, false))} disabled={submitting} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Save className="w-4 h-4" /> {submitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={handleSubmit((d) => saveReport(d, true))} disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl">
        <h2 className="text-lg font-bold mb-4">General Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Place of Work</label>
            <select {...register('place_of_work')} className="w-full border-gray-200 border rounded-xl p-3 bg-white focus:ring-primary focus:border-primary">
              <option value="Corporate Office">Corporate Office</option>
              <option value="Work From Home">Work From Home</option>
              <option value="Field Work">Field Work</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / End of Day Summary</label>
            <textarea {...register('notes')} className="w-full border-gray-200 border rounded-xl p-3 bg-white focus:ring-primary focus:border-primary" rows={3} placeholder="Any blockers or notes?" />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Tasks</h2>
          <button onClick={handleAddTask} className="text-sm font-medium text-primary bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 transition-colors">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2" onClick={handleClickOutside}>
              {tasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No tasks added yet. Click 'Add Task' to begin.
                </p>
              ) : (
                <AnimatePresence mode="popLayout">
                  {tasks.map((task) =>
                    focusedTaskId === task.id ? (
                      <ExpandedTaskItem
                        key={task.id}
                        task={task}
                        onUpdate={handleUpdateTask}
                        onRemove={handleRemoveTask}
                      />
                    ) : (
                      <MinimizedTaskItem
                        key={task.id}
                        task={task}
                        onClick={handleTaskFocus}
                      />
                    )
                  )}
                </AnimatePresence>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </motion.div>
    </div>
  );
}
