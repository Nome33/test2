import React, { useState, useRef, useEffect } from 'react';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { Loader2, Settings, X, History, Rotate3D, RotateCcw } from 'lucide-react';

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
  // iOS 26 Button Styles
  const baseStyles = "relative w-full py-4 px-6 rounded-[1.2rem] font-bold text-[15px] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed tracking-tight";
  
  const variants = {
    primary: "bg-[#0d0d0d] text-white shadow-xl shadow-black/10 hover:bg-[#222] hover:shadow-2xl hover:shadow-black/20 border border-white/10", 
    secondary: "bg-white/80 backdrop-blur-md text-[#1D1D1F] border border-white/50 shadow-sm hover:bg-white hover:shadow-md",
    glass: "bg-white/30 backdrop-blur-xl text-[#1D1D1F] border border-white/40 hover:bg-white/50 shadow-lg shadow-black/5",
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
    <input 
      className={`glass-input w-full text-[#1D1D1F] px-4 py-3.5 rounded-2xl outline-none transition-all placeholder:text-[#86868B]/40 text-[16px] font-medium ${className}`}
      {...props}
    />
  </div>
);

// Slider Component
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
    <div className="space-y-3 select-none">
       <div className="flex justify-between items-center px-1">
        {label && <label className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">{label}</label>}
        {valueDisplay && <span className="text-[13px] font-semibold text-[#1D1D1F] font-mono">{valueDisplay}</span>}
      </div>
      <div className="relative w-full h-8 flex items-center group">
        <input 
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-black/5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.15)] [&::-webkit-slider-thumb]:border-[0.5px] [&::-webkit-slider-thumb]:border-black/5 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 transition-all"
        />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-[#0d0d0d] rounded-l-full pointer-events-none"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
    </div>
  );
}

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
            className={`flex-1 relative z-10 py-2.5 text-[13px] font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              isActive ? 'text-black scale-100' : 'text-[#86868B] hover:text-[#1D1D1F] hover:scale-95'
            }`}
          >
            {option.icon}
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

// --- BLUE LEMON LOGO ---
const BlueLemonLogo = () => (
  <div className="flex items-center gap-3 select-none hover:scale-105 transition-transform duration-300 origin-left cursor-pointer">
    {/* Icon: Lemon with Sun Rays */}
    <div className="relative w-10 h-10 text-black drop-shadow-sm">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Lemon Outline with Nub */}
        <path 
          d="M50 8 C73.196 8 92 26.804 92 50 C92 73.196 73.196 92 50 92 C32.5 92 17.5 81.5 11 66.5 C9.5 69 5 68 5 62 C5 58 8 26.804 8 50 C8 26.804 26.804 8 50 8Z" 
          stroke="currentColor" 
          strokeWidth="8" 
          strokeLinecap="round"
          className="origin-center"
        />
        {/* Radial Rays - Adjusted for thicker strokes */}
        <g stroke="currentColor" strokeWidth="8" strokeLinecap="round">
          <line x1="50" y1="26" x2="50" y2="38" /> {/* Top */}
          <line x1="50" y1="74" x2="50" y2="62" /> {/* Bottom */}
          <line x1="26" y1="50" x2="38" y2="50" /> {/* Left */}
          <line x1="74" y1="50" x2="62" y2="50" /> {/* Right */}
          <line x1="33" y1="33" x2="41" y2="41" /> {/* Top Left */}
          <line x1="67" y1="33" x2="59" y2="41" /> {/* Top Right */}
          <line x1="33" y1="67" x2="41" y2="59" /> {/* Bottom Left */}
          <line x1="67" y1="67" x2="59" y2="59" /> {/* Bottom Right */}
        </g>
      </svg>
    </div>
    
    {/* Typography: BLUE LEMON - Resized and Stacked */}
    <div className="flex flex-col justify-center leading-none tracking-tightest">
      <span className="font-[900] text-[16px] tracking-wide text-[#1D1D1F]">BLUE</span>
      <span className="font-[900] text-[16px] tracking-wide text-[#1D1D1F]">LEMON</span>
    </div>
  </div>
);

export const NavBar: React.FC<{ onSettingsClick: () => void; onHistoryClick: () => void }> = ({ onSettingsClick, onHistoryClick }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 h-24 flex justify-between items-center px-8 lg:px-12 pointer-events-none">
    {/* 
      iOS 26 Floating Navbar Concept: 
      Instead of a full bar, we let the fluid background show through.
      We use a very subtle gradient mesh behind the logo area if needed, but here we keep it clean.
    */}
    
    <div className="pointer-events-auto pt-2">
       <BlueLemonLogo />
    </div>
    
    <div className="flex items-center gap-3 pointer-events-auto pt-2">
      <button 
        onClick={onHistoryClick}
        className="glass-panel w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/80 transition-colors text-[#1D1D1F] p-0"
        title="生成历史"
      >
        <History className="w-5 h-5" />
      </button>
      <button 
        onClick={onSettingsClick}
        className="glass-panel flex items-center gap-2 px-6 h-12 rounded-full hover:bg-white/80 transition-colors text-sm font-bold text-[#1D1D1F] p-0"
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

// --- Cube Controller Component ---
export const CubeController: React.FC<{
  rotation: { x: number; y: number };
  onChange: (rot: { x: number; y: number }) => void;
  onReset?: () => void;
}> = ({ rotation, onChange, onReset }) => {
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startRot = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number, clientY: number) => {
    isDragging.current = true;
    startPos.current = { x: clientX, y: clientY };
    startRot.current = { ...rotation };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;

    // Adjust sensitivity
    const newY = startRot.current.y + deltaX * 0.5;
    const newX = startRot.current.x - deltaY * 0.5;

    onChange({ x: newX, y: newY });
  };

  const handleEnd = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchEnd = () => handleEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []); 

  // Holographic Wireframe Style for iOS 26
  const faceStyle = "absolute w-full h-full border border-white/20 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm flex items-center justify-center text-[10px] font-bold text-white/60 shadow-inner select-none tracking-widest";
  const size = 120; // Cube size in px

  return (
    <div 
      className="relative w-full h-[240px] bg-[#1a1a1a] rounded-[1.5rem] flex items-center justify-center overflow-hidden cursor-move shadow-inner border border-white/5"
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      ref={containerRef}
    >
      {/* Background Grid for Futuristic feel */}
      <div className="absolute inset-0 opacity-20" 
           style={{ backgroundImage: 'radial-gradient(circle, #444 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
      />

      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <div className="bg-white/10 backdrop-blur px-2 py-1 rounded-md text-[10px] text-white/80 font-mono border border-white/10">
           X: {Math.round(rotation.x)}°
        </div>
        <div className="bg-white/10 backdrop-blur px-2 py-1 rounded-md text-[10px] text-white/80 font-mono border border-white/10">
           Y: {Math.round(rotation.y)}°
        </div>
      </div>
      
      {/* Reset Button */}
      {onReset && (
        <button 
          onClick={(e) => { e.stopPropagation(); onReset(); }}
          className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 backdrop-blur p-2 rounded-full text-white/80 transition-colors border border-white/10"
          title="重置视角"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}

      <div className="absolute bottom-4 text-[10px] text-white/30 font-medium pointer-events-none tracking-widest uppercase">
         Drag to Rotate
      </div>

      <div 
        style={{
          width: size,
          height: size,
          transformStyle: 'preserve-3d',
          transform: `perspective(800px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: isDragging.current ? 'none' : 'transform 0.1s ease-out'
        }}
        className="relative"
      >
        {/* Front (Z+) */}
        <div className={faceStyle} style={{ transform: `translateZ(${size/2}px)` }}>FRONT</div>
        
        {/* Back (Z-) */}
        <div className={faceStyle} style={{ transform: `rotateY(180deg) translateZ(${size/2}px)` }}>BACK</div>
        
        {/* Right (X+) */}
        <div className={faceStyle} style={{ transform: `rotateY(90deg) translateZ(${size/2}px)`, background: 'rgba(0,122,255,0.1)' }}>RIGHT</div>
        
        {/* Left (X-) */}
        <div className={faceStyle} style={{ transform: `rotateY(-90deg) translateZ(${size/2}px)`, background: 'rgba(255,59,48,0.1)' }}>LEFT</div>
        
        {/* Top (Y+) */}
        <div className={faceStyle} style={{ transform: `rotateX(90deg) translateZ(${size/2}px)`, background: 'rgba(52,199,89,0.1)' }}>TOP</div>
        
        {/* Bottom (Y-) */}
        <div className={faceStyle} style={{ transform: `rotateX(-90deg) translateZ(${size/2}px)` }}>BOTTOM</div>
      </div>
    </div>
  );
};