import React, { useState } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type AIFeature = 'spell_check' | 'sentence_maker' | 'action_plan' | 'detect_priority';

const FEATURE_META: Record<AIFeature, { label: string; icon: string; title: string }> = {
  spell_check:     { label: 'Fix',      icon: '✨', title: 'Fix spelling & grammar' },
  sentence_maker:  { label: 'Improve',  icon: '💬', title: 'Improve to professional sentence' },
  action_plan:     { label: 'Plan',     icon: '🎯', title: 'Generate action plan' },
  detect_priority: { label: 'Priority', icon: '🔥', title: 'Auto-detect priority' },
};

interface AIAssistButtonProps {
  feature: AIFeature;
  onCall: () => Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'xs';
}

export default function AIAssistButton({
  feature, onCall, disabled = false, size = 'sm',
}: AIAssistButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const meta = FEATURE_META[feature];

  const handleClick = async () => {
    if (state === 'loading' || disabled) return;
    setState('loading');
    try {
      await onCall();
      setState('success');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2500);
    }
  };

  const sizeClass = size === 'xs'
    ? 'px-1.5 py-0.5 text-[10px] gap-0.5'
    : 'px-2 py-1 text-xs gap-1';

  const colorMap: Record<typeof state, string> = {
    idle:    'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100',
    loading: 'bg-violet-50 text-violet-400 border-violet-200 cursor-wait',
    success: 'bg-green-50  text-green-600  border-green-200',
    error:   'bg-red-50    text-red-500    border-red-200',
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled || state === 'loading'}
      title={meta.title}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center rounded-lg border font-medium transition-colors ${sizeClass} ${colorMap[state]} disabled:opacity-50`}
    >
      <AnimatePresence mode="wait">
        {state === 'loading' ? (
          <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader2 className="w-3 h-3 animate-spin" />
          </motion.span>
        ) : state === 'success' ? (
          <motion.span key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Check className="w-3 h-3" />
          </motion.span>
        ) : state === 'error' ? (
          <motion.span key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AlertCircle className="w-3 h-3" />
          </motion.span>
        ) : (
          <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {meta.icon}
          </motion.span>
        )}
      </AnimatePresence>
      <span>{state === 'error' ? 'Failed' : meta.label}</span>
    </motion.button>
  );
}
