import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AIAssistButton from './AIAssistButton';

interface Task {
  id: number;
  job: string;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  order: number;
  place_of_work?: string;
  action_plan?: string;
}

interface ExpandedTaskItemProps {
  task: Task;
  onUpdate: (id: number, field: string, value: any) => void;
  onRemove: (id: number) => void;
}

export default function ExpandedTaskItem({
  task,
  onUpdate,
  onRemove,
}: ExpandedTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <motion.div
      layout
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }} // spring curve
      className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm mb-3"
    >
      <div
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
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
            onChange={(e) => onUpdate(task.id, 'priority', e.target.value as 'High' | 'Medium' | 'Low')}
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
          <button
            type="button"
            data-testid="delete-button"
            onClick={() => onRemove(task.id)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        <div className="col-span-12 relative">
          <textarea
            value={task.action_plan || ''}
            onChange={(e) => onUpdate(task.id, 'action_plan', e.target.value)}
            placeholder="Action plan / notes..."
            rows={1}
            className="w-full text-sm border-gray-200 border rounded-lg p-2 pr-10 focus:ring-primary focus:border-primary"
          />
          <AIAssistButton
            feature="action_plan"
            onCall={async () => {
              // API call would happen here
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
