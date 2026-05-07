import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface Task {
  id: number;
  job: string;
  priority: string;
  status: string;
  order: number;
  place_of_work?: string;
}

interface MinimizedTaskItemProps {
  task: Task;
  onClick: (taskId: number) => void;
}

export default function MinimizedTaskItem({ task, onClick }: MinimizedTaskItemProps) {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'Low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      onClick={() => onClick(task.id)}
      className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:border-gray-200 cursor-pointer transition-all mb-2"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 line-clamp-1">
            {task.job}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${getPriorityStyles(task.priority)}`}>
          {task.priority}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
    </motion.div>
  );
}
