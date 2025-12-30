
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
  ArrowRight,
  Rotate3D,
  Loader2,
  Camera,
  RotateCw,
  Edit3
} from 'lucide-react';
import { generateEditedImage } from './services/geminiService';
import { IOSButton, GlassCard, SegmentedControl, NavBar, BottomSheet, IOSInput, CubeController } from './components/Components';
import { EditMode, ProcessingState, ImageState, AiModel, VolcengineConfig, Resolution, AspectRatio, EngineType, HistoryItem, RotationState, ViewShiftMode } from './types';

// UI Tabs
type MainTab = 'IMAGE_EDIT' | 'VIEW_SHIFT';

export default function App() {
  const [images, setImages] = useState<ImageState>({ original: null, generated: null });
  const [engine, setEngine] = useState<EngineType>('GEMINI');
  
  // UI State
  const [activeTab, setActiveTab] = useState<MainTab>('IMAGE_EDIT');
  const [subEditMode, setSubEditMode] = useState<EditMode>(EditMode.BACKGROUND);

  const [geminiModel, setGeminiModel] = useState<AiModel>('gemini-2.5-flash-image');
  
  // Cube Rotation State
  const [rotation, setRotation] = useState<RotationState>({ x: -15, y: 30 });
  const [viewShiftMode, setViewShiftMode] = useState<ViewShiftMode>('CAMERA');

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [prompt, setPrompt] = useState('');
  
  // Global Config
  const [resolution, setResolution] = useState<Resolution>('2K'); 
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  
  // API Keys
  const [geminiApiKey, setGeminiApiKey] = useState('');
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
    // Load Gemini Key
    const savedGeminiKey = localStorage.getItem('gemini_api_key');
    if (savedGeminiKey) setGeminiApiKey(savedGeminiKey);

    // Load Volcengine Config
    const savedConfig = localStorage.getItem('aura_volc_config');
    if (savedConfig) {
      try {
        setVolcConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Failed to parse saved config");
      }
    }

    const savedHistory = localStorage.getItem('aura_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  const handleGeminiKeyChange = (val: string) => {
    setGeminiApiKey(val);
    localStorage.setItem('gemini_api_key', val);
  };

  const handleVolcConfigChange = (key: keyof VolcengineConfig, value: string) => {
    const newConfig = { ...volcConfig, [key]: value };
    setVolcConfig(newConfig);
    localStorage.setItem('aura_volc_config', JSON.stringify(newConfig));
  };

  const addToHistory = (generatedImg: string, usedPrompt: string) => {
    if (!images.original) return;
    
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      original: images.original,
      generated: generatedImg,
      prompt: usedPrompt,
      engine: engine,
      resolution: resolution,
      aspectRatio: aspectRatio
    };

    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, 10);
      try {
        localStorage.setItem('aura_history', JSON.stringify(updated));
      } catch (e) {
        return [newItem]; 
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

  const getAngleDescription = (rot: RotationState, lang: 'en' | 'zh' = 'en'): string => {
    const normX = ((rot.x % 360) + 540) % 360 - 180;
    const normY = ((rot.y % 360) + 540) % 360 - 180;

    if (lang === 'zh') {
        let vDesc = "平视";
        if (normX < -20) vDesc = "仰视";
        else if (normX > 20) vDesc = "俯视";

        let hDesc = "正面";
        if (normY > 20 && normY < 160) hDesc = "右侧";
        else if (normY < -20 && normY > -160) hDesc = "左侧";
        else if (Math.abs(normY) >= 160) hDesc = "背面";
        
        return `${vDesc}, ${hDesc} (X:${Math.round(normX)}°, Y:${Math.round(normY)}°)`;
    }

    let vDesc = "Eye level";
    if (normX < -20) vDesc = "Worm's eye view";
    else if (normX > 20) vDesc = "High angle view";

    let hDesc = "Front view";
    if (normY > 20 && normY < 160) hDesc = "Right profile";
    else if (normY < -20 && normY > -160) hDesc = "Left profile";
    else if (Math.abs(normY) >= 160) hDesc = "Back view";

    return `${vDesc}, ${hDesc} (X:${Math.round(normX)}°, Y:${Math.round(normY)}°)`;
  };

  const handleGenerate = async () => {
    if (!images.original) return;

    let finalPrompt = prompt;
    const internalMode = activeTab === 'VIEW_SHIFT' ? EditMode.VIEW_SHIFT : subEditMode;

    if (internalMode === EditMode.VIEW_SHIFT) {
      const lang = engine === 'SEEDREAM' ? 'zh' : 'en';
      const angleDesc = getAngleDescription(rotation, lang);
      
      if (lang === 'zh') {
         const prefix = viewShiftMode === 'CAMERA' ? '视角运镜: ' : '物体朝向: ';
         finalPrompt = prompt ? `${prompt}。${prefix}${angleDesc}` : `${prefix}${angleDesc}`;
      } else {
         const prefix = viewShiftMode === 'CAMERA' ? 'Camera Path: ' : 'Object Pose: ';
         finalPrompt = prompt ? `${prompt}. ${prefix}${angleDesc}` : `${prefix}${angleDesc}`;
      }
    }

    if (!finalPrompt && internalMode !== EditMode.VIEW_SHIFT) return; 

    setStatus({ isLoading: true, error: null, step: 'processing' });
    
    try {
      const result = await generateEditedImage(
        images.original, 
        finalPrompt, 
        internalMode, 
        engine === 'GEMINI' ? geminiModel : 'external-seedream',
        volcConfig,
        { 
          resolution, 
          aspectRatio, 
          strength: 0.7,
          seed: -1,
          scale: 7.5
        },
        viewShiftMode,
        geminiApiKey
      );
      setImages(prev => ({ ...prev, generated: result }));
      setStatus({ isLoading: false, error: null, step: 'completed' });
      addToHistory(result, finalPrompt);
    } catch (err: any) {
      setStatus({ 
        isLoading: false, 
        error: err.message || "生成失败，请重试。", 
        step: 'idle' 
      });
    }
  };

  const downloadImage = () => {
    if (images.generated) {
      const link = document.createElement('a');
      link.href = images.generated;
      link.download = `render-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10 flex flex-col items-center">
      
      <NavBar onSettingsClick={() => setShowSettings(true)} onHistoryClick={() => setShowHistory(true)} />

      <BottomSheet isOpen={showSettings} onClose={() => setShowSettings(false)} title="系统配置">
        <div className="space-y-6">
           <div className="bg-[#F2F2F7] rounded-xl p-4 border border-black/5 space-y-4">
              <div className="flex items-center gap-2 text-[#007AFF] mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Google Gemini 密钥</span>
              </div>
              <IOSInput label="API Key" value={geminiApiKey} onChange={(e) => handleGeminiKeyChange(e.target.value)} type="password" placeholder="请输入 Gemini API Key" />
           </div>
           <div className="bg-[#F2F2F7] rounded-xl p-4 border border-black/5 space-y-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">火山引擎 (Seedream) 密钥</span>
              </div>
              <IOSInput label="API Key" value={volcConfig.apiKey} onChange={(e) => handleVolcConfigChange('apiKey', e.target.value)} type="password" placeholder="请输入 sk-..." />
              <IOSInput label="接入点 ID (Endpoint)" value={volcConfig.endpointId} onChange={(e) => handleVolcConfigChange('endpointId', e.target.value)} placeholder="请输入 ep-2025..." />
            </div>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showHistory} onClose={() => setShowHistory(false)} title="生成历史">
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2 px-1">
             <span className="text-xs font-bold text-[#86868B] uppercase tracking-wide">最近 {history.length} 条记录</span>
             {history.length > 0 && <button onClick={clearHistory} className="text-xs font-medium text-red-500 hover:text-red-600">清除全部</button>}
          </div>
          {history.length === 0 ? (
            <div className="text-center py-12 text-[#86868B]"><History className="w-10 h-10 mx-auto mb-3 opacity-20" /><p>暂无生成记录</p></div>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div key={item.id} onClick={() => restoreHistoryItem(item)} className="bg-white rounded-xl p-3 border border-black/5 flex gap-3 cursor-pointer hover:bg-gray-50 group relative">
                   <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"><img src={item.generated} className="w-full h-full object-cover" alt="History" /></div>
                   <div className="flex-1 min-w-0 flex flex-col justify-center">
                     <p className="text-[13px] font-medium text-[#1D1D1F] line-clamp-2 leading-snug mb-1">{item.prompt}</p>
                     <div className="flex items-center gap-2 text-[10px] text-[#86868B]"><span className={`px-1.5 py-0.5 rounded-md ${item.engine === 'SEEDREAM' ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>{item.engine === 'SEEDREAM' ? 'Seedream' : 'Gemini'}</span><span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                   </div>
                   <button onClick={(e) => deleteHistoryItem(item.id, e)} className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 rounded-full"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>

      <main className="w-full max-w-7xl px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 h-[calc(100vh-120px)]">
        
        {/* Left Column: Canvas/Preview */}
        <div className="flex flex-col h-full">
          <div className="mb-4 flex justify-center">
             <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-black/5 inline-flex gap-1">
                <button onClick={() => setEngine('GEMINI')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${engine === 'GEMINI' ? 'bg-black text-white shadow-md' : 'text-[#86868B]'}`}>Gemini Studio</button>
                <button onClick={() => setEngine('SEEDREAM')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${engine === 'SEEDREAM' ? 'bg-black text-white shadow-md' : 'text-[#86868B]'}`}>Seedream (Volc)</button>
             </div>
          </div>

          <GlassCard className="flex-1 flex items-center justify-center relative overflow-hidden bg-white/50 border-dashed border-2 border-black/5 hover:border-black/10 transition-colors group">
            {status.isLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
                 <Loader2 className="w-10 h-10 animate-spin text-[#007AFF]" />
                 <p className="text-sm font-medium text-[#86868B]">{engine === 'GEMINI' ? 'Gemini 正在构思...' : 'Seedream 正在渲染...'}</p>
              </div>
            )}
            
            {!images.original ? (
              <div className="text-center space-y-4" onClick={() => fileInputRef.current?.click()}>
                <div className="w-20 h-20 bg-[#F2F2F7] rounded-full flex items-center justify-center mx-auto text-[#86868B] group-hover:scale-110 transition-transform duration-300"><Upload className="w-8 h-8" /></div>
                <div><h3 className="text-lg font-semibold text-[#1D1D1F]">上传主体图片</h3><p className="text-sm text-[#86868B] mt-1">支持 JPG, PNG • 最大 10MB</p></div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect}/>
                <IOSButton variant="secondary" className="w-auto px-8 mx-auto mt-4">选择文件</IOSButton>
              </div>
            ) : (
              <div className="relative w-full h-full flex gap-4 p-4">
                 <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#F2F2F7] shadow-inner"><img src={images.original} className="w-full h-full object-contain" alt="Original" /><button onClick={() => setImages({original: null, generated: null})} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur p-2 rounded-full text-white transition-colors"><X className="w-4 h-4" /></button></div>
                 {images.generated && (
                   <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 relative rounded-2xl overflow-hidden bg-[#F2F2F7] shadow-xl border border-white/50"><img src={images.generated} className="w-full h-full object-contain" alt="Generated" /><button onClick={downloadImage} className="absolute bottom-6 right-6 bg-white text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95"><Download className="w-5 h-5" /></button></motion.div>
                 )}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column: Unified Controls */}
        <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-10 space-y-6">
          
          <GlassCard className="space-y-6">
            <div className="flex items-center gap-2 mb-2">{engine === 'GEMINI' ? <Sparkles className="w-5 h-5 text-[#007AFF]" /> : <Zap className="w-5 h-5 text-orange-600" />}<h3 className="font-bold text-lg">{engine === 'GEMINI' ? 'Gemini Studio' : 'Seedream Studio'}</h3></div>
            <SegmentedControl options={[{ label: '修图', value: 'IMAGE_EDIT', icon: <Edit3 className="w-3.5 h-3.5"/> },{ label: '3D视角', value: 'VIEW_SHIFT', icon: <Rotate3D className="w-3.5 h-3.5"/> }]} value={activeTab} onChange={(val) => { setActiveTab(val); setPrompt(''); }} />

            <div className="min-h-[220px]">
              <AnimatePresence mode="wait">
                {activeTab === 'IMAGE_EDIT' && (
                  <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                       {([EditMode.BACKGROUND, EditMode.GENERAL, EditMode.CREATIVE] as EditMode[]).map(m => (
                         <button key={m} onClick={() => setSubEditMode(m)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${subEditMode === m ? 'bg-black text-white border-black' : 'bg-white text-[#1D1D1F] border-gray-200 hover:bg-gray-50'}`}>{m === EditMode.BACKGROUND ? '换背景' : m === EditMode.GENERAL ? '精修' : '创意'}</button>
                       ))}
                    </div>
                    <IOSInput label="提示词" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="描述您的需求..." className="min-h-[80px]" />
                  </motion.div>
                )}

                {activeTab === 'VIEW_SHIFT' && (
                   <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                     <div className="bg-[#F2F2F7] rounded-2xl p-4">
                        <div className="bg-white/50 p-1 rounded-xl flex mb-4">
                           <button onClick={() => setViewShiftMode('CAMERA')} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${viewShiftMode === 'CAMERA' ? 'bg-white shadow-sm text-black' : 'text-[#86868B]'}`}><Camera className="w-3 h-3" /> 摄像机</button>
                           <button onClick={() => setViewShiftMode('SUBJECT')} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${viewShiftMode === 'SUBJECT' ? 'bg-white shadow-sm text-black' : 'text-[#86868B]'}`}><RotateCw className="w-3 h-3" /> 主体</button>
                        </div>
                        <CubeController rotation={rotation} onChange={setRotation} onReset={() => setRotation({ x: -15, y: 30 })} />
                     </div>
                     <IOSInput label="附加描述" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="例如: 展示背面细节..." />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="grid grid-cols-3 gap-2">
              {(['1K', '2K', '4K'] as Resolution[]).map(res => (
                <button key={res} onClick={() => setResolution(res)} className={`py-2 rounded-xl text-sm font-semibold transition-all ${resolution === res ? 'bg-black text-white shadow-lg' : 'bg-[#F2F2F7]'}`}>{res}</button>
              ))}
            </div>
          </GlassCard>

          <div className="pt-2">
             <IOSButton onClick={handleGenerate} isLoading={status.isLoading} disabled={!images.original || status.isLoading}>
               {status.isLoading ? '正在渲染...' : '开始渲染'}
             </IOSButton>
             {status.error && (
               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 border border-red-100"><AlertCircle className="w-4 h-4" />{status.error}</motion.div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}
