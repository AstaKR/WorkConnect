import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Save, Send, Plus, Trash2, GripVertical, AlertCircle, Wand2 } from 'lucide-react';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import AIAssistButton from '../components/AIAssistButton';

interface Task {
  id: number;
  job: string;
  priority: string;
  status: string;
  action_plan?: string;
  order: number;
  place_of_work?: string;
}

const SortableTaskItem = ({ task, onRemove, onUpdate }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm mb-3">
      <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-4">
          <input
            type="text"
            value={task.job}
            onChange={(e) => onUpdate(task.id, 'job', e.target.value)}
            placeholder="Task description"
            className="w-full text-sm border-gray-200 border rounded-lg p-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div className="col-span-12 md:col-span-3">
          <select
            value={task.priority}
            onChange={(e) => onUpdate(task.id, 'priority', e.target.value)}
            className="w-full text-sm border-gray-200 border rounded-lg p-2 focus:ring-primary focus:border-primary"
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
        <div className="col-span-12 md:col-span-3">
          <select
            value={task.status}
            onChange={(e) => onUpdate(task.id, 'status', e.target.value)}
            className="w-full text-sm border-gray-200 border rounded-lg p-2 focus:ring-primary focus:border-primary"
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div className="col-span-12 md:col-span-2 flex justify-end">
          <button type="button" onClick={() => onRemove(task.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        <div className="col-span-12 relative">
          <textarea
            value={task.action_plan || ''}
            onChange={(e) => onUpdate(task.id, 'action_plan', e.target.value)}
            placeholder="Action plan / notes"
            rows={1}
            className="w-full text-sm border-gray-200 border rounded-lg p-2 pr-10 focus:ring-primary focus:border-primary"
          />
          <AIAssistButton task={task.job} onResult={(plan) => onUpdate(task.id, 'action_plan', plan)} />
        </div>
      </div>
    </div>
  );
};

export default function NewReport() {
  const [report, setReport] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
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
    const newTask: Task = {
      id: Date.now(), // Temporary ID until saved
      job: '',
      priority: 'Medium',
      status: 'Pending',
      order: tasks.length, // always at the end
      place_of_work: report?.place_of_work || 'Corporate Office',
    };
    setTasks(prev => [...prev, newTask]); // append at bottom
  };

  const handleUpdateTask = (id: number, field: string, value: any) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleRemoveTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No tasks added yet. Click 'Add Task' to begin.</p>
              ) : (
                tasks.map(task => (
                  <SortableTaskItem key={task.id} task={task} onRemove={handleRemoveTask} onUpdate={handleUpdateTask} />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </motion.div>
    </div>
  );
}
