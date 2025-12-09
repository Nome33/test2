import React from 'react';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { Loader2, Settings, X, History } from 'lucide-react';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost';
  isLoading?: boolean;
}

export const IOSButton: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading,
  ...props 
}) => {
  // Light mode button styles
  const baseStyles = "relative w-full py-3.5 px-6 rounded-2xl font-semibold text-[15px] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#000000] text-white shadow-lg shadow-black/10 hover:bg-[#1D1D1F]", // Black for high contrast "Pro" feel
    secondary: "bg-[#E5E5EA] text-[#1D1D1F] hover:bg-[#D1D1D6]", // System Gray 5
    glass: "bg-white/40 backdrop-blur-md text-[#1D1D1F] border border-white/50 hover:bg-white/60",
    ghost: "bg-transparent text-[#007AFF] hover:bg-blue-50/50"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </motion.button>
  );
};

export const IOSInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, subLabel?: string }> = ({ label, subLabel, className = "", ...props }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-baseline px-1">
      {label && <label className="text-[13px] font-medium text-[#86868B] uppercase tracking-wide">{label}</label>}
      {subLabel && <span className="text-[11px] text-[#86868B]">{subLabel}</span>}
    </div>
    <input 
      className={`w-full bg-[#767680]/10 text-[#1D1D1F] px-4 py-3 rounded-xl border-none outline-none transition-all focus:bg-[#767680]/20 placeholder:text-[#86868B]/60 text-[15px] ${className}`}
      {...props}
    />
  </div>
);

// New Slider Component for Strength Control
export const IOSSlider: React.FC<{
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  label?: string;
  valueDisplay?: string;
}> = ({ value, min, max, step, onChange, label, valueDisplay }) => {
  return (
    <div className="space-y-2 select-none">
       <div className="flex justify-between items-center px-1">
        {label && <label className="text-[13px] font-medium text-[#86868B] uppercase tracking-wide">{label}</label>}
        {valueDisplay && <span className="text-[13px] font-semibold text-[#1D1D1F] font-mono">{valueDisplay}</span>}
      </div>
      <div className="relative w-full h-8 flex items-center">
        <input 
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-[#E5E5EA] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-[0.5px] [&::-webkit-slider-thumb]:border-black/5 transition-all"
        />
        {/* Progress Bar Visual */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-[#007AFF] rounded-l-full pointer-events-none"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
    </div>
  );
}

export const GlassCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`glass-panel rounded-[1.5rem] p-6 ${className}`}>
    {children}
  </div>
);

export const SegmentedControl: React.FC<{
  options: { label: string; value: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (val: any) => void;
}> = ({ options, value, onChange }) => {
  return (
    <div className="bg-[#E5E5EA] p-1 rounded-2xl flex relative">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 relative z-10 py-2 text-[13px] font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${
              isActive ? 'text-black' : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            {option.icon}
            {option.label}
            {isActive && (
              <motion.div
                layoutId="segmented-pill"
                className="absolute inset-0 bg-white rounded-[0.75rem] shadow-sm border-[0.5px] border-black/5 -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export const NavBar: React.FC<{ onSettingsClick: () => void; onHistoryClick: () => void }> = ({ onSettingsClick, onHistoryClick }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/70 backdrop-blur-xl border-b border-black/5 flex justify-between items-center px-6 lg:px-12">
    <div className="flex items-center gap-3">
       <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold font-mono tracking-tighter">
         N1
       </div>
       <span className="font-bold text-lg tracking-tight text-[#1D1D1F]">NOR ONE</span>
    </div>
    
    <div className="flex items-center gap-2">
      <button 
        onClick={onHistoryClick}
        className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-black/5 transition-colors text-[#1D1D1F]"
        title="生成历史"
      >
        <History className="w-5 h-5" />
      </button>
      <button 
        onClick={onSettingsClick}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] transition-colors text-sm font-medium text-[#1D1D1F]"
      >
        <Settings className="w-4 h-4" />
        <span>设置</span>
      </button>
    </div>
  </nav>
);

export const BottomSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}> = ({ isOpen, onClose, children, title }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md z-[70] bg-[#F2F2F7]/95 backdrop-blur-xl border-l border-white/20 shadow-2xl p-0 flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-black/5 bg-white/50">
              <h2 className="text-xl font-bold">{title}</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 transition-colors">
                <X className="w-5 h-5 text-[#1D1D1F]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};