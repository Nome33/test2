
import React, { useState, useRef, useEffect } from 'react';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { Loader2, Settings, X, History, Rotate3d, RotateCcw, Image as ImageIcon, Camera, User, Box } from 'lucide-react';
import { ViewShiftMode } from '../types';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost';
  isLoading?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const IOSButton: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading,
  ...props 
}) => {
  const baseStyles = "relative w-full py-4 px-6 rounded-[1.2rem] font-bold text-[15px] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50";
  
  const variants = {
    primary: "bg-[#0d0d0d] text-white shadow-xl shadow-black/10 hover:bg-[#222]", 
    secondary: "bg-white/80 backdrop-blur-md text-[#1D1D1F] border border-white/50 shadow-sm hover:bg-white",
    glass: "bg-white/30 backdrop-blur-xl text-[#1D1D1F] border border-white/40 hover:bg-white/50 shadow-lg",
    ghost: "bg-transparent text-[#007AFF] hover:bg-blue-50/50"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </motion.button>
  );
};

export const IOSInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, subLabel?: string }> = ({ label, subLabel, className = "", ...props }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-baseline px-1">
      {label && <label className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider opacity-80">{label}</label>}
      {subLabel && <span className="text-[11px] text-[#86868B]">{subLabel}</span>}
    </div>
    <textarea 
      className={`glass-input w-full text-[#1D1D1F] px-4 py-3.5 rounded-2xl outline-none transition-all placeholder:text-[#86868B]/40 text-[16px] font-medium resize-none ${className}`}
      rows={3}
      {...(props as any)}
    />
  </div>
);

export const GlassCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`glass-panel rounded-[2rem] p-7 ${className}`}>
    {children}
  </div>
);

export const SegmentedControl: React.FC<{
  options: { label: string; value: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (val: any) => void;
}> = ({ options, value, onChange }) => {
  return (
    <div className="bg-white/40 backdrop-blur-md p-1.5 rounded-[1.2rem] flex relative shadow-inner border border-white/50">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 relative z-10 py-2.5 text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${
              isActive ? 'text-black' : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            {isActive && option.icon}
            {option.label}
            {isActive && (
              <motion.div
                layoutId="segmented-pill"
                className="absolute inset-0 bg-white/90 rounded-[0.9rem] shadow-sm border-[0.5px] border-black/5 -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Static 3D Cube Component
 * Visual reference for subject orientation. Highlights active faces based on perspective.
 */
const Cube3D: React.FC<{ rotation: { x: number; y: number }, activeFaces?: string[] }> = ({ rotation, activeFaces = [] }) => {
  const size = 110;
  const half = size / 2;

  const getFaceClass = (faceName: string) => {
    const base = "absolute w-full h-full border flex flex-col items-center justify-center font-bold text-[9px] uppercase tracking-[0.1em] transition-all duration-500 ease-out";
    const isActive = activeFaces.includes(faceName);
    
    if (faceName === 'front') {
      return `${base} ${isActive ? 'bg-[#007AFF] border-white/60 text-white shadow-[0_0_30px_rgba(0,122,255,0.6)]' : 'bg-gradient-to-br from-[#007AFF] to-[#004C99] text-white/90 border-white/20 shadow-[inset_0_0_30px_rgba(0,0,0,0.3)]'}`;
    }
    
    return `${base} ${isActive ? 'bg-[#1c1c1e] border-[#007AFF]/60 text-white shadow-[0_0_30px_rgba(0,122,255,0.4)]' : 'bg-[#1c1c1e] text-white/40 border-white/10 shadow-[inset_0_0_30px_rgba(0,0,0,0.3)]'}`;
  };
  
  return (
    <div 
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
      className="relative pointer-events-none"
    >
      <div className={getFaceClass('front')} style={{ transform: `translateZ(${half}px)` }}>
        <User className="w-8 h-8 mb-2 opacity-90" />
        <span>正面</span>
      </div>
      <div className={getFaceClass('back')} style={{ transform: `rotateY(180deg) translateZ(${half}px)` }}>
        <span>背面</span>
      </div>
      <div className={getFaceClass('right')} style={{ transform: `rotateY(90deg) translateZ(${half}px)` }}>
        <span>右侧</span>
      </div>
      <div className={getFaceClass('left')} style={{ transform: `rotateY(-90deg) translateZ(${half}px)` }}>
        <span>左侧</span>
      </div>
      <div className={getFaceClass('top')} style={{ transform: `rotateX(90deg) translateZ(${half}px)` }}>
        <span>顶面</span>
      </div>
      <div className={getFaceClass('bottom')} style={{ transform: `rotateX(-90deg) translateZ(${half}px)` }}>
        <span>底面</span>
      </div>
    </div>
  );
};

export const CubeViewer: React.FC<{
  rotation: { x: number; y: number };
  activeFaces?: string[];
}> = ({ rotation, activeFaces = [] }) => {
  return (
    <div className="relative w-full h-[320px] bg-[#050505] rounded-[2.5rem] flex items-center justify-center overflow-hidden border border-white/5 shadow-2xl">
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="absolute top-6 left-7 z-10 flex gap-4 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[9px] text-white/20 uppercase font-black tracking-widest">PITCH</span>
          <span className="text-[14px] text-[#007AFF] font-mono font-bold">{rotation.x.toFixed(0)}°</span>
        </div>
        <div className="flex flex-col border-l border-white/10 pl-4">
          <span className="text-[9px] text-white/20 uppercase font-black tracking-widest">YAW</span>
          <span className="text-[14px] text-[#007AFF] font-mono font-bold">{rotation.y.toFixed(0)}°</span>
        </div>
      </div>

      <div className="relative flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
        <Cube3D rotation={rotation} activeFaces={activeFaces} />
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none opacity-40">
        <div className="flex items-center gap-3 text-[9px] font-black text-white uppercase tracking-[0.4em]">
           视角预览 (PREVIEW)
        </div>
      </div>
    </div>
  );
};

const BlueLemonLogo = () => (
  <div className="flex items-center gap-3 select-none hover:scale-105 transition-transform duration-300 origin-left cursor-pointer">
    <div className="relative w-10 h-10 text-black drop-shadow-sm">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M50 8 C73.196 8 92 26.804 92 50 C92 73.196 73.196 92 50 92 C32.5 92 17.5 81.5 11 66.5 C9.5 69 5 68 5 62 C5 58 8 26.804 8 50 C8 26.804 26.804 8 50 8Z" 
          stroke="currentColor" 
          strokeWidth="8" 
          strokeLinecap="round"
        />
        <g stroke="currentColor" strokeWidth="8" strokeLinecap="round">
          <line x1="50" y1="26" x2="50" y2="38" />
          <line x1="50" y1="74" x2="50" y2="62" />
          <line x1="26" y1="50" x2="38" y2="50" />
          <line x1="74" y1="50" x2="62" y2="50" />
          <line x1="33" y1="33" x2="41" y2="41" />
          <line x1="67" y1="33" x2="59" y2="41" />
          <line x1="33" y1="67" x2="41" y2="59" />
          <line x1="67" y1="67" x2="59" y2="59" />
        </g>
      </svg>
    </div>
    <div className="flex flex-col justify-center leading-none tracking-tight">
      <span className="font-[900] text-[16px] tracking-wide text-[#1D1D1F]">BLUE</span>
      <span className="font-[900] text-[16px] tracking-wide text-[#1D1D1F]">LEMON</span>
    </div>
  </div>
);

export const NavBar: React.FC<{ onSettingsClick: () => void; onHistoryClick: () => void }> = ({ onSettingsClick, onHistoryClick }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 h-24 flex justify-between items-center px-8 lg:px-12 pointer-events-none">
    <div className="pointer-events-auto">
       <BlueLemonLogo />
    </div>
    <div className="flex items-center gap-3 pointer-events-auto">
      <button 
        onClick={onHistoryClick}
        className="glass-panel w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/80 transition-colors text-[#1D1D1F]"
      >
        <History className="w-5 h-5" />
      </button>
      <button 
        onClick={onSettingsClick}
        className="glass-panel flex items-center gap-2 px-6 h-12 rounded-full hover:bg-white/80 transition-colors text-sm font-bold text-[#1D1D1F]"
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
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 35, stiffness: 350 }}
            className="fixed top-2 right-2 bottom-2 w-full max-w-md z-[70] bg-white/60 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-[2.5rem] p-0 flex flex-col overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-black/5 bg-white/20">
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
