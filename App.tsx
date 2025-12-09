import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Sparkles, 
  Box, 
  Image as ImageIcon, 
  Download, 
  RefreshCw, 
  Wand2,
  X,
  Zap,
  Star,
  Palette,
  AlertCircle,
  Scan,
  Maximize2,
  Sliders,
  Settings2,
  Cpu,
  Layers,
  Monitor,
  Smartphone,
  Square,
  History,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { generateEditedImage } from './services/geminiService';
import { IOSButton, GlassCard, SegmentedControl, NavBar, BottomSheet, IOSInput, IOSSlider } from './components/Components';
import { EditMode, ProcessingState, ImageState, AiModel, VolcengineConfig, Resolution, AspectRatio, EngineType, HistoryItem } from './types';

export default function App() {
  const [images, setImages] = useState<ImageState>({ original: null, generated: null });
  const [engine, setEngine] = useState<EngineType>('GEMINI');
  
  // Gemini State
  const [geminiMode, setGeminiMode] = useState<EditMode>(EditMode.BACKGROUND);
  const [geminiModel, setGeminiModel] = useState<AiModel>('gemini-2.5-flash-image');
  
  // Seedream State (Simplified)
  // Fidelity/Scale/Seed removed from UI, keeping defaults internally or simplified
  
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [prompt, setPrompt] = useState('');
  
  // Global Config
  const [resolution, setResolution] = useState<Resolution>('2K'); // Default to 2K for better quality
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  
  // Volcengine Config State
  const [volcConfig, setVolcConfig] = useState<VolcengineConfig>({
    apiKey: '',
    endpointId: ''
  });

  const [status, setStatus] = useState<ProcessingState>({ 
    isLoading: false, 
    error: null, 
    step: 'idle' 
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load Config
    const savedConfig = localStorage.getItem('aura_volc_config');
    if (savedConfig) {
      try {
        setVolcConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Failed to parse saved config");
      }
    }

    // Load History
    const savedHistory = localStorage.getItem('aura_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  const handleVolcConfigChange = (key: keyof VolcengineConfig, value: string) => {
    const newConfig = { ...volcConfig, [key]: value };
    setVolcConfig(newConfig);
    localStorage.setItem('aura_volc_config', JSON.stringify(newConfig));
  };

  const addToHistory = (generatedImg: string) => {
    if (!images.original) return;
    
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      original: images.original,
      generated: generatedImg,
      prompt: prompt,
      engine: engine,
      resolution: resolution,
      aspectRatio: aspectRatio
    };

    setHistory(prev => {
      // Keep max 10 items to prevent localStorage overflow
      const updated = [newItem, ...prev].slice(0, 10);
      try {
        localStorage.setItem('aura_history', JSON.stringify(updated));
      } catch (e) {
        // If quota exceeded, try saving just the new one or handle error
        console.warn("Storage quota exceeded for history");
        return [newItem]; // Emergency fallback
      }
      return updated;
    });
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    setImages({ original: item.original, generated: item.generated });
    setPrompt(item.prompt);
    setEngine(item.engine);
    setResolution(item.resolution);
    setAspectRatio(item.aspectRatio);
    setShowHistory(false);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('aura_history', JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('aura_history');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages({ original: event.target?.result as string, generated: null });
        setStatus({ ...status, step: 'idle', error: null });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!images.original || !prompt) return;

    setStatus({ isLoading: true, error: null, step: 'processing' });
    
    // Hardcoded defaults for Seedream since UI controls were removed
    // High fidelity/consistency default
    const calculatedStrength = 0.35; // Previously derived from fidelity

    try {
      const result = await generateEditedImage(
        images.original, 
        prompt, 
        geminiMode, 
        engine === 'GEMINI' ? geminiModel : 'external-seedream',
        volcConfig,
        { 
          resolution, 
          aspectRatio, 
          strength: calculatedStrength,
          seed: -1,
          scale: 7.5
        }
      );
      setImages(prev => ({ ...prev, generated: result }));
      setStatus({ isLoading: false, error: null, step: 'completed' });
      addToHistory(result);
    } catch (err: any) {
      let errorMessage = err.message || "生成失败，请重试。";
      if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
        errorMessage = "API 权限被拒绝。请检查 Key 或切换模型。";
      }
      setStatus({ 
        isLoading: false, 
        error: errorMessage, 
        step: 'idle' 
      });
    }
  };

  const downloadImage = () => {
    if (images.generated) {
      const link = document.createElement('a');
      link.href = images.generated;
      link.download = `nor-one-render-${Date.now()}.png`;
      link.click();
    }
  };

  const reset = () => {
    setImages({ original: null, generated: null });
    setPrompt('');
    setStatus({ isLoading: false, error: null, step: 'idle' });
  };

  // Gemini Presets
  const geminiPresets = [
    { label: "纯净白底", prompt: "Minimalist white studio background, soft diffuse lighting, high end product photography", mode: EditMode.BACKGROUND },
    { label: "自然日光", prompt: "Outdoor nature sunlight, dappled shadows from trees, fresh aesthetic", mode: EditMode.BACKGROUND },
    { label: "质感增强", prompt: "Enhance texture and clarity, studio lighting correction, 8k resolution", mode: EditMode.GENERAL },
  ];

  const applyGeminiPreset = (p: typeof geminiPresets[0]) => {
    setGeminiMode(p.mode);
    setPrompt(p.prompt);
  };

  return (
    <div className="min-h-screen pt-20 pb-10 flex flex-col items-center">
      
      <NavBar onSettingsClick={() => setShowSettings(true)} onHistoryClick={() => setShowHistory(true)} />

      {/* Settings Panel */}
      <BottomSheet 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        title="系统配置"
      >
        <div className="space-y-8">
           <div className="bg-[#F2F2F7] rounded-xl p-4 border border-black/5 space-y-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">火山引擎 (Seedream) 密钥</span>
              </div>
              
              <IOSInput 
                label="API Key" 
                value={volcConfig.apiKey}
                onChange={(e) => handleVolcConfigChange('apiKey', e.target.value)}
                type="password"
                placeholder="请输入 sk-..."
              />
              
              <IOSInput 
                label="接入点 ID (Endpoint)" 
                subLabel="需支持图生图 (Img2Img)"
                value={volcConfig.endpointId}
                onChange={(e) => handleVolcConfigChange('endpointId', e.target.value)}
                placeholder="请输入 ep-2025..."
              />
            </div>
            {engine === 'GEMINI' && (
              <div className="p-4 text-sm text-gray-500 bg-gray-50 rounded-xl">
                 分辨率和画幅比例设置在 Gemini 模式下由模型自动决定。
              </div>
            )}
        </div>
      </BottomSheet>

      {/* History Panel */}
      <BottomSheet 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)}
        title="生成历史"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2 px-1">
             <span className="text-xs font-bold text-[#86868B] uppercase tracking-wide">最近 {history.length} 条记录</span>
             {history.length > 0 && (
               <button onClick={clearHistory} className="text-xs font-medium text-red-500 hover:text-red-600">
                 清除全部
               </button>
             )}
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-12 text-[#86868B]">
              <History className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>暂无生成记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => restoreHistoryItem(item)}
                  className="bg-white rounded-xl p-3 border border-black/5 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors group relative overflow-hidden"
                >
                   <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                     <img src={item.generated} className="w-full h-full object-cover" alt="History" />
                   </div>
                   <div className="flex-1 min-w-0 flex flex-col justify-center">
                     <p className="text-[13px] font-medium text-[#1D1D1F] line-clamp-2 leading-snug mb-1">
                       {item.prompt}
                     </p>
                     <div className="flex items-center gap-2 text-[10px] text-[#86868B]">
                       <span className={`px-1.5 py-0.5 rounded-md ${item.engine === 'SEEDREAM' ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                         {item.engine === 'SEEDREAM' ? 'Seedream' : 'Gemini'}
                       </span>
                       <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                   </div>
                   
                   <button 
                     onClick={(e) => deleteHistoryItem(item.id, e)}
                     className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                   </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Main Content Area - PC Layout */}
      <main className="w-full max-w-7xl px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 h-[calc(100vh-120px)]">
        
        {/* Left Column: Canvas/Preview (Shared) */}
        <div className="flex flex-col h-full">
          {/* Engine Switcher at Top of Canvas */}
          <div className="mb-4 flex justify-center">
             <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-black/5 inline-flex gap-1">
                <button
                  onClick={() => setEngine('GEMINI')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                    engine === 'GEMINI' 
                    ? 'bg-[#1D1D1F] text-white shadow-md' 
                    : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5'
                  }`}
                >
                  Gemini Studio
                </button>
                <button
                  onClick={() => setEngine('SEEDREAM')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                    engine === 'SEEDREAM' 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-[#86868B] hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  Seedream Pro
                </button>
             </div>
          </div>

          <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-black/5 overflow-hidden relative flex items-center justify-center group">
            <AnimatePresence mode="wait">
              {!images.original ? (
                <motion.div
                   key="empty"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="text-center cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-24 h-24 bg-[#F2F2F7] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-[#86868B]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1D1D1F] mb-2">上传人物/产品图</h3>
                  <p className="text-[#86868B]">点击或拖拽图片到此处</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  className="relative w-full h-full p-8 flex items-center justify-center bg-[#F2F2F7]/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div 
                    className="relative shadow-2xl rounded-lg overflow-hidden transition-all duration-500 max-h-full max-w-full"
                    style={{
                      aspectRatio: aspectRatio.replace(':', '/'),
                    }}
                  >
                     <img 
                       src={images.generated || images.original} 
                       className="w-full h-full object-cover"
                       alt="Preview"
                     />
                     {status.isLoading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center">
                          <div className={`w-12 h-12 border-4 rounded-full animate-spin mb-4 ${engine === 'SEEDREAM' ? 'border-orange-500/20 border-t-orange-500' : 'border-[#007AFF]/20 border-t-[#007AFF]'}`} />
                          <span className={`text-sm font-semibold ${engine === 'SEEDREAM' ? 'text-orange-600' : 'text-[#007AFF]'}`}>
                             {engine === 'SEEDREAM' ? 'Seedream 正在渲染...' : 'Gemini 正在计算...'}
                          </span>
                        </div>
                     )}
                  </div>
                  
                  {/* Floating Action Bar */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                     {images.generated && (
                       <>
                        <button onClick={() => setImages(prev => ({ ...prev, generated: null }))} className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg text-sm font-medium hover:bg-white transition-colors flex items-center gap-2">
                          <RefreshCw className="w-4 h-4" /> 重置
                        </button>
                        <button onClick={downloadImage} className={`text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium transition-colors flex items-center gap-2 ${engine === 'SEEDREAM' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#007AFF] hover:bg-blue-600'}`}>
                          <Download className="w-4 h-4" /> 保存
                        </button>
                       </>
                     )}
                     <button onClick={reset} className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg hover:bg-red-50 text-red-500 transition-colors" title="清除所有">
                       <X className="w-4 h-4" />
                     </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Controls - DYNAMIC Based on Engine */}
        <div className="h-full overflow-y-auto pb-4 scrollbar-hide">
          <div className="flex flex-col gap-6">
            
            {/* Engine Specific Header */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">
                {engine === 'GEMINI' ? 'NOR ONE' : 'SEEDREAM'}
              </h1>
              <p className="text-[#86868B] font-medium">
                {engine === 'GEMINI' ? '智能快捷渲染 (Gemini Powered)' : '人物一致性渲染 (Immersity)'}
              </p>
            </div>

            {/* --- GEMINI CONTROLS --- */}
            {engine === 'GEMINI' && (
              <>
                <div className="space-y-3">
                   <label className="text-xs font-bold text-[#86868B] uppercase tracking-wide">模型选择</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setGeminiModel('gemini-2.5-flash-image')}
                        className={`p-3 rounded-xl border text-left transition-all ${geminiModel === 'gemini-2.5-flash-image' ? 'bg-white border-[#007AFF] ring-1 ring-[#007AFF]' : 'border-transparent bg-white/50 hover:bg-white'}`}
                      >
                         <div className="font-semibold text-sm">Flash (Nano)</div>
                         <div className="text-[10px] text-gray-500">快速 • 1K</div>
                      </button>
                      <button
                        onClick={() => setGeminiModel('gemini-3-pro-image-preview')}
                        className={`p-3 rounded-xl border text-left transition-all ${geminiModel === 'gemini-3-pro-image-preview' ? 'bg-white border-purple-500 ring-1 ring-purple-500' : 'border-transparent bg-white/50 hover:bg-white'}`}
                      >
                         <div className="font-semibold text-sm">Pro (Vision)</div>
                         <div className="text-[10px] text-gray-500">高清 • 4K</div>
                      </button>
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-xs font-bold text-[#86868B] uppercase tracking-wide">编辑模式</label>
                   <SegmentedControl
                      value={geminiMode}
                      onChange={setGeminiMode}
                      options={[
                        { label: '场景化', value: EditMode.BACKGROUND, icon: <ImageIcon className="w-4 h-4" /> },
                        { label: '画质增强', value: EditMode.GENERAL, icon: <Box className="w-4 h-4" /> },
                        { label: '创意重绘', value: EditMode.CREATIVE, icon: <Palette className="w-4 h-4" /> },
                      ]}
                   />
                </div>

                <div className="bg-white rounded-[1.5rem] p-5 border border-black/5 shadow-sm space-y-4">
                   <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-[#86868B] uppercase tracking-wide">提示词</label>
                      <span className="text-[10px] text-[#007AFF] font-medium cursor-pointer" onClick={() => setPrompt('')}>清空</span>
                   </div>
                   <textarea
                     value={prompt}
                     onChange={(e) => setPrompt(e.target.value)}
                     className="w-full bg-[#F2F2F7] rounded-xl p-3 text-[15px] min-h-[100px] outline-none focus:ring-2 focus:ring-[#007AFF]/20 resize-none"
                     placeholder="描述你想要的画面..."
                   />
                   <div className="flex flex-wrap gap-2">
                      {geminiPresets.map(p => (
                        <button key={p.label} onClick={() => applyGeminiPreset(p)} className="px-3 py-1.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-lg text-xs font-medium text-[#1D1D1F]">
                          {p.label}
                        </button>
                      ))}
                   </div>
                </div>
              </>
            )}

            {/* --- SEEDREAM CONTROLS --- */}
            {engine === 'SEEDREAM' && (
              <div className="space-y-6">
                
                {/* Prompting */}
                <div className="bg-white rounded-[1.5rem] p-5 border border-black/5 shadow-sm space-y-4">
                   <label className="text-xs font-bold text-[#86868B] uppercase tracking-wide flex items-center gap-2">
                     <Cpu className="w-3 h-3" /> 画面描述 (Prompt)
                   </label>
                   <textarea
                     value={prompt}
                     onChange={(e) => setPrompt(e.target.value)}
                     className="w-full bg-[#F2F2F7] rounded-xl p-3 text-[15px] min-h-[100px] outline-none focus:ring-2 focus:ring-orange-500/20 resize-none font-mono text-sm"
                     placeholder="例如：站在未来城市的街道上，霓虹灯光..."
                   />
                </div>

                {/* Dimensions Control - MOVED HERE */}
                <div className="bg-white rounded-[1.5rem] p-5 border border-black/5 shadow-sm space-y-6">
                   <div className="flex items-center gap-2 text-[#1D1D1F] pb-2 border-b border-black/5">
                      <Scan className="w-4 h-4" />
                      <span className="text-sm font-bold">画幅与尺寸 (Canvas)</span>
                   </div>

                   {/* Aspect Ratio */}
                   <div className="space-y-3">
                      <label className="text-xs font-bold text-[#86868B] uppercase tracking-wide">比例</label>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { val: '1:1', icon: <Square className="w-3 h-3" /> },
                          { val: '16:9', icon: <Monitor className="w-3 h-3" /> },
                          { val: '9:16', icon: <Smartphone className="w-3 h-3" /> },
                          { val: '4:3', icon: <Box className="w-3 h-3" /> },
                          { val: '3:4', icon: <Box className="w-3 h-3 rotate-90" /> }
                        ].map((item) => (
                           <button
                            key={item.val}
                            onClick={() => setAspectRatio(item.val as AspectRatio)}
                            className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[10px] font-semibold transition-all border ${
                              aspectRatio === item.val 
                              ? 'bg-[#1D1D1F] border-black text-white shadow-md' 
                              : 'bg-white border-black/5 text-[#86868B] hover:bg-[#F2F2F7]'
                            }`}
                           >
                             {item.icon}
                             {item.val}
                           </button>
                        ))}
                      </div>
                   </div>

                   {/* Resolution */}
                   <div className="space-y-3">
                       <label className="text-xs font-bold text-[#86868B] uppercase tracking-wide">清晰度</label>
                       <div className="grid grid-cols-3 gap-2">
                         {(['1K', '2K', '4K'] as Resolution[]).map(res => (
                           <button
                            key={res}
                            onClick={() => setResolution(res)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                              resolution === res 
                              ? 'bg-orange-500 border-orange-600 text-white shadow-md' 
                              : 'bg-white border-black/5 text-[#86868B] hover:bg-[#F2F2F7]'
                            }`}
                           >
                             {res}
                           </button>
                         ))}
                       </div>
                       <p className="text-[10px] text-[#86868B] mt-1">
                          2K/4K 分辨率会消耗更多时间，但细节更丰富。
                       </p>
                   </div>
                </div>

              </div>
            )}

            {/* Generate Button - Dynamic Color */}
            <div className="pt-2">
              <IOSButton 
                onClick={handleGenerate} 
                disabled={!images.original || !prompt || status.isLoading}
                isLoading={status.isLoading}
                className={engine === 'SEEDREAM' ? '!bg-orange-500 hover:!bg-orange-600' : ''}
              >
                <Wand2 className="w-5 h-5" />
                {status.isLoading ? '正在生成...' : (engine === 'SEEDREAM' ? '立即生成 (Seedream)' : 'Gemini 渲染')}
              </IOSButton>
            </div>

            {status.error && (
               <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 text-center flex flex-col items-center gap-1">
                 <AlertCircle className="w-5 h-5 mb-1" />
                 {status.error}
                 {engine === 'SEEDREAM' && status.error.includes("Endpoint") && (
                   <span className="text-xs text-red-400 mt-1">请点击右上角设置图标配置火山引擎 Key</span>
                 )}
               </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}