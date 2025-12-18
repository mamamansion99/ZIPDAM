import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/tokens';
import { TH } from '../lib/i18n';

interface SegmentedControlProps {
  activeTab: 'quick' | 'browse';
  onChange: (tab: 'quick' | 'browse') => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ activeTab, onChange }) => {
  return (
    <div className="px-4 py-3 sticky top-[108px] z-20 bg-zipdam-bg/95 backdrop-blur-sm border-b border-zipdam-border/50">
      <div className="bg-zipdam-surface2 rounded-xl p-1 flex relative border border-zipdam-border">
        <button
          onClick={() => onChange('quick')}
          className={cn(
            "flex-1 relative py-2 text-sm font-semibold rounded-lg z-10 transition-colors duration-200",
            activeTab === 'quick' ? "text-white" : "text-zipdam-muted"
          )}
        >
          {activeTab === 'quick' && (
            <motion.div
              layoutId="activeTabBg"
              className="absolute inset-0 bg-zipdam-gradient rounded-lg shadow-sm"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-1">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
             {TH.tabQuick}
          </span>
        </button>

        <button
          onClick={() => onChange('browse')}
          className={cn(
            "flex-1 relative py-2 text-sm font-semibold rounded-lg z-10 transition-colors duration-200",
            activeTab === 'browse' ? "text-white" : "text-zipdam-muted"
          )}
        >
          {activeTab === 'browse' && (
             <motion.div
              layoutId="activeTabBg"
              className="absolute inset-0 bg-zipdam-gradient rounded-lg shadow-sm"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-1">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
             </svg>
             {TH.tabBrowse}
          </span>
        </button>
      </div>
    </div>
  );
};