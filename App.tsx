
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Sparkles, 
  Box, 
  Image as ImageIcon, 
  Download, 
  X,
  Zap,
  AlertCircle,
  Maximize2,
  History,
  Trash2,
  Rotate3D,
  Loader2,
  Camera,
  RotateCw,
  Edit3,
  MonitorCheck,
  User,
  Check,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Info
} from 'lucide-react';
import { generateEditedImage } from './services/geminiService';
import { IOSButton, GlassCard, SegmentedControl, NavBar, BottomSheet, IOSInput, CubeViewer } from './components/Components';
import { EditMode, ProcessingState, ImageState, AiModel, VolcengineConfig, Resolution, AspectRatio, EngineType, HistoryItem, RotationState, ViewShiftMode } from './types';

// UI Tabs
type MainTab = 'IMAGE_EDIT' | 'VIEW_SHIFT';

interface ViewpointPreset {
  label: string;
  x: number;
  y: number;
}

const VIEWPOINTS: ViewpointPreset[] = [
  { label: '正面平视', x: 0, y: 0 },
  { label: '右侧面视角', x: 0, y: -90 },
  { label: '左侧面视角', x: 0, y: 90 },
  { label: '背面视角', x: 0, y: 180 },
  { label: '右四分之三侧面', x: 0, y: -45 },
  { label: '左四分之三侧面', x: 0, y: 45 },
  { label: '俯视', x: -90, y: 0 },
  { label: '仰视', x: 90, y: 0 },
  { label: '右上侧面', x: -35, y: -45 },
  { label: '左上侧面', x: -35, y: 45 },
  { label: '右下侧面', x: 35, y: -45 },
  { label: '左下侧面', x: 35, y: 45 },
  { label: '正上侧面', x: -35, y: 0 },
  { label: '正下侧面', x: 35, y: 0 },
];

const PRESET_NAV_MAP: Record<string, Record<string, string>> = {
  "正面平视": { UP: "正上侧面", DOWN: "正下侧面", LEFT: "左四分之三侧面", RIGHT: "右四分之三侧面" },
  "右四分之三侧面": { UP: "右上侧面", DOWN: "右下侧面", LEFT: "正面平视", RIGHT: "右侧面视角" },
  "右侧面视角": { UP: "右上侧面", DOWN: "右下侧面", LEFT: "右四分之三侧面", RIGHT: "背面视角" },
  "背面视角": { UP: "俯视", DOWN: "仰视", LEFT: "右侧面视角", RIGHT: "左侧面视角" },
  "左侧面视角": { UP: "左上侧面", DOWN: "左下侧面", LEFT: "背面视角", RIGHT: "左四分之三侧面" },
  "左四分之三侧面": { UP: "左上侧面", DOWN: "左下侧面", LEFT: "左侧面视角", RIGHT: "正面平视" },
  "俯视": { UP: "背面视角", DOWN: "正上侧面", LEFT: "左上侧面", RIGHT: "右上侧面" },
  "仰视": { UP: "正下侧面", DOWN: "背面视角", LEFT: "左下侧面", RIGHT: "右下侧面" },
  "正上侧面": { UP: "俯视", DOWN: "正面平视", LEFT: "左上侧面", RIGHT: "右上侧面" },
  "正下侧面": { UP: "正面平视", DOWN: "仰视", LEFT: "左下侧面", RIGHT: "右下侧面" },
  "右上侧面": { UP: "俯视", DOWN: "右下侧面", LEFT: "正上侧面", RIGHT: "右侧面视角" },
  "左上侧面": { UP: "俯视", DOWN: "左下侧面", LEFT: "左侧面视角", RIGHT: "正上侧面" },
  "右下侧面": { UP: "右上侧面", DOWN: "仰视", LEFT: "正下侧面", RIGHT: "右侧面视角" },
  "左下侧面": { UP: "左上侧面", DOWN: "仰视", LEFT: "左侧面视角", RIGHT: "正下侧面" },
};

export default function App() {
  const [images, setImages] = useState<ImageState>({ original: null, generated: null });
  const [engine, setEngine] = useState<EngineType>('GEMINI');
  
  // UI State
  const [activeTab, setActiveTab] = useState<MainTab>('IMAGE_EDIT');
  const [subEditMode, setSubEditMode] = useState<EditMode>(EditMode.BACKGROUND);
  const [selectedViewpoint, setSelectedViewpoint] = useState<string>(VIEWPOINTS[0].label);
  const [preservePose, setPreservePose] = useState(false);

  const [geminiModel, setGeminiModel] = useState<AiModel>('gemini-2.5-flash-image');
  
  // Cube Rotation State
  const [rotation, setRotation] = useState<RotationState>({ x: 0, y: 0 });
  const [viewShiftMode, setViewShiftMode] = useState<ViewShiftMode>('CAMERA');

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [prompt, setPrompt] = useState('');
  
  // Global Config
  const [resolution, setResolution] = useState<Resolution>('2K'); 
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  
  // API Keys
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

  const handleVolcConfigChange = (key: keyof VolcengineConfig, value: string) => {
    const newConfig = { ...volcConfig, [key]: value };
    setVolcConfig(newConfig);
    localStorage.setItem('aura_volc_config', JSON.stringify(newConfig));
  };

  const handleViewpointSelect = (vp: ViewpointPreset) => {
    setSelectedViewpoint(vp.label);
    setRotation({ x: vp.x, y: vp.y });
  };

  const handleArrowNav = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    const nextLabel = PRESET_NAV_MAP[selectedViewpoint]?.[dir] || selectedViewpoint;
    const vp = VIEWPOINTS.find(v => v.label === nextLabel);
    if (vp) {
      handleViewpointSelect(vp);
    }
  };

  const resetRotation = () => {
    handleViewpointSelect(VIEWPOINTS[0]);
  };

  const getActiveFaces = (label: string): string[] => {
    switch (label) {
      case '正面平视': return ['front'];
      case '右侧面视角': return ['right'];
      case '左侧面视角': return ['left'];
      case '背面视角': return ['back'];
      case '右四分之三侧面': return ['front', 'right'];
      case '左四分之三侧面': return ['front', 'left'];
      case '俯视': return ['top'];
      case '仰视': return ['bottom'];
      case '右上侧面': return ['top', 'right'];
      case '左上侧面': return ['top', 'left'];
      case '右下侧面': return ['bottom', 'right'];
      case '左下侧面': return ['bottom', 'left'];
      case '正上侧面': return ['top', 'front'];
      case '正下侧面': return ['bottom', 'front'];
      default: return ['front'];
    }
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

  const clearImages = () => {
    setImages({ original: null, generated: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!images.original) return;

    let currentModel: AiModel = engine === 'GEMINI' ? geminiModel : 'external-seedream';
    if (engine === 'GEMINI' && (resolution === '2K' || resolution === '4K')) {
      currentModel = 'gemini-3-pro-image-preview';
    }

    if (currentModel === 'gemini-3-pro-image-preview') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    let finalPrompt = prompt;
    const internalMode = activeTab === 'VIEW_SHIFT' ? EditMode.VIEW_SHIFT : subEditMode;

    if (internalMode === EditMode.VIEW_SHIFT) {
      const poseInstr = preservePose ? "。人物动作姿势完全不变" : "";
      const viewText = selectedViewpoint;

      if (engine === 'SEEDREAM') {
         finalPrompt = `将视角改为${viewText}${poseInstr}。${prompt ? `${prompt}。` : ""}关键：画面的透视关系需精确匹配视角需求，背景与主体光影融合，保持主体一致。`;
      } else {
         const engPose = preservePose ? ". Keep the character's pose and action exactly the same" : "";
         finalPrompt = `Change the view to ${viewText}${engPose}. ${prompt ? `${prompt}. ` : ""}Professional novel view synthesis, maintaining subject identity and realistic lighting.`;
      }
    } else {
      if (preservePose) {
        finalPrompt = `${prompt}。保持人物原有动作姿势完全不变。`;
      }
    }

    if (!finalPrompt && internalMode !== EditMode.VIEW_SHIFT) return; 

    setStatus({ isLoading: true, error: null, step: 'processing' });
    
    try {
      const result = await generateEditedImage(
        images.original, 
        finalPrompt, 
        internalMode, 
        currentModel,
        volcConfig,
        { 
          resolution, 
          aspectRatio, 
          strength: 0.7,
          seed: -1,
          scale: 7.5
        },
        viewShiftMode
      );
      setImages(prev => ({ ...prev, generated: result }));
      setStatus({ isLoading: false, error: null, step: 'completed' });
      addToHistory(result, finalPrompt);
    } catch (err: any) {
      const errorStr = JSON.stringify(err);
      if (errorStr.includes('PERMISSION_DENIED') || errorStr.includes('403') || errorStr.includes('permission')) {
        setStatus({ 
          isLoading: false, 
          error: "Gemini 3 Pro 需要绑定了付费项目的 API Key 才能访问。请点击下方按钮重新选择项目。", 
          step: 'idle' 
        });
        await (window as any).aistudio.openSelectKey();
      } else {
        setStatus({ 
          isLoading: false, 
          error: err.message || "生成失败，请联系管理员或稍后重试。", 
          step: 'idle' 
        });
      }
    }
  };

  const downloadImage = () => {
    if (images.generated) {
      const link = document.createElement('a');
      link.href = images.generated;
      link.download = `bluelemon-render-${Date.now()}.png`;
      link.click();
    }
  };

  const isGemini3 = engine === 'GEMINI' && (resolution === '2K' || resolution === '4K');

  return (
    <div className="min-h-screen pt-20 pb-10 flex flex-col items-center">
      
      <NavBar onSettingsClick={() => setShowSettings(true)} onHistoryClick={() => setShowHistory(true)} />

      <BottomSheet isOpen={showSettings} onClose={() => setShowSettings(false)} title="系统配置">
        <div className="space-y-6">
           <div className="bg-[#F2F2F7] rounded-xl p-6 border border-black/5 space-y-4">
              <div className="flex items-center gap-2 text-[#007AFF] mb-1">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-tight">Google Gemini 配置</span>
              </div>
              <p className="text-xs text-[#86868B] leading-relaxed">
                使用 Gemini 3 Pro 模型进行高质量（2K/4K）渲染时，您需要选择一个绑定的付费项目 API 密钥。
              </p>
              <div className="flex flex-col gap-3">
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[13px] text-[#007AFF] font-bold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  查看 API 结算文档
                </a>
                <IOSButton 
                  variant="secondary" 
                  className="py-3 text-sm"
                  onClick={async () => {
                    await (window as any).aistudio.openSelectKey();
                  }}
                >
                  配置/更新 Gemini API 密钥
                </IOSButton>
              </div>
           </div>
           
           <div className="bg-[#F2F2F7] rounded-xl p-6 border border-black/5 space-y-4">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-tight">火山引擎 (Seedream) 密钥</span>
              </div>
              <IOSInput label="API Key" value={volcConfig.apiKey} onChange={(e) => handleVolcConfigChange('apiKey', (e.target as any).value)} type="password" placeholder="请输入 sk-..." />
              <IOSInput label="接入点 ID (Endpoint)" value={volcConfig.endpointId} onChange={(e) => handleVolcConfigChange('endpointId', (e.target as any).value)} placeholder="请输入 ep-2025..." />
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

      <main className="w-full max-w-7xl px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 h-[calc(100vh-120px)] overflow-hidden">
        
        {/* Left Column: Preview */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="mb-4 flex justify-center">
             <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-black/5 inline-flex gap-1">
                <button onClick={() => setEngine('GEMINI')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${engine === 'GEMINI' ? 'bg-black text-white shadow-md' : 'text-[#86868B]'}`}>Gemini Studio</button>
                <button onClick={() => setEngine('SEEDREAM')} className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${engine === 'SEEDREAM' ? 'bg-black text-white shadow-md' : 'text-[#86868B]'}`}>Seedream Studio</button>
             </div>
          </div>

          <GlassCard className="flex-1 flex items-center justify-center relative overflow-hidden bg-white/50 border-dashed border-2 border-black/5 hover:border-black/10 transition-colors group">
            {status.isLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
                 <Loader2 className="w-10 h-10 animate-spin text-[#007AFF]" />
                 <p className="text-sm font-medium text-[#86868B]">{engine === 'GEMINI' ? 'Gemini 正在构思...' : 'Seedream 正在渲染...'}</p>
                 {isGemini3 && <p className="text-[10px] text-blue-500 px-10 text-center">Gemini 3 Pro 高质量渲染中，请确保已选择有效项目 API Key</p>}
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
                 {/* Original Image Container */}
                 <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#F2F2F7] shadow-inner flex items-center justify-center">
                   <img src={images.original} className="w-full h-full object-contain" alt="Original" />
                   {/* Remove Button for Original - High Visibility */}
                   <button 
                     onClick={clearImages} 
                     className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md p-2 rounded-full text-white transition-all shadow-lg z-30"
                     title="删除图片"
                   >
                     <X className="w-5 h-5" />
                   </button>
                 </div>

                 {/* Generated Image Container */}
                 {images.generated && (
                   <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 relative rounded-2xl overflow-hidden bg-[#F2F2F7] shadow-xl border border-white/50 flex items-center justify-center">
                     <img src={images.generated} className="w-full h-full object-contain" alt="Generated" />
                     {/* Remove Button for Generated */}
                     <button 
                       onClick={() => setImages(prev => ({ ...prev, generated: null }))}
                       className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md p-2 rounded-full text-white transition-all shadow-lg z-30"
                       title="清除生成结果"
                     >
                       <X className="w-5 h-5" />
                     </button>
                     {/* Download Button */}
                     <button onClick={downloadImage} className="absolute bottom-6 right-6 bg-white text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95">
                       <Download className="w-5 h-5" />
                     </button>
                   </motion.div>
                 )}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column: Controls */}
        <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-10 space-y-6 pr-2">
          
          <GlassCard className="space-y-6">
            <div className="flex items-center gap-2 mb-2">{engine === 'GEMINI' ? <Sparkles className="w-5 h-5 text-[#007AFF]" /> : <Zap className="w-5 h-5 text-orange-600" />}<h3 className="font-bold text-lg">{engine === 'GEMINI' ? 'Gemini 智能渲染' : 'Seedream 专业渲染'}</h3></div>
            <SegmentedControl options={[{ label: '画质精修', value: 'IMAGE_EDIT', icon: <Edit3 className="w-3.5 h-3.5 mr-2"/> },{ label: '视角生成', value: 'VIEW_SHIFT', icon: <Rotate3D className="w-3.5 h-3.5 mr-2"/> }]} value={activeTab} onChange={(val) => { setActiveTab(val); setPrompt(''); }} />

            <div className="min-h-[220px]">
              <AnimatePresence mode="wait">
                {activeTab === 'IMAGE_EDIT' && (
                  <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                       {([EditMode.BACKGROUND, EditMode.GENERAL, EditMode.CREATIVE] as EditMode[]).map(m => (
                         <button key={m} onClick={() => setSubEditMode(m)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${subEditMode === m ? 'bg-black text-white border-black shadow-sm' : 'bg-white text-[#1D1D1F] border-gray-200 hover:bg-gray-50'}`}>{m === EditMode.BACKGROUND ? '换背景' : m === EditMode.GENERAL ? '精修' : '创意'}</button>
                       ))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">修改指令</label>
                        <button 
                          onClick={() => setPreservePose(!preservePose)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${preservePose ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-sm' : 'bg-white/50 text-[#86868B] border-black/5 hover:bg-white'}`}
                        >
                          <User className="w-3 h-3" />
                          人物动作不变
                          {preservePose && <Check className="w-2.5 h-2.5 ml-0.5" />}
                        </button>
                      </div>
                      <IOSInput value={prompt} onChange={(e) => setPrompt((e.target as any).value)} placeholder="描述您想对图片做出的修改..." className="min-h-[80px]" />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'VIEW_SHIFT' && (
                   <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                     <div className="relative">
                        <CubeViewer rotation={rotation} activeFaces={getActiveFaces(selectedViewpoint)} />
                        
                        {/* Navigation Controls Overlay - Strictly Preset-based Navigation */}
                        <div className="absolute bottom-4 right-4 flex flex-col items-center gap-1.5">
                           <div className="bg-white/5 backdrop-blur-xl rounded-[1.5rem] p-2 border border-white/10 shadow-2xl flex flex-col items-center gap-1">
                              <button 
                                onClick={() => handleArrowNav('UP')}
                                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/30 text-white transition-all active:scale-90"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleArrowNav('LEFT')}
                                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/30 text-white transition-all active:scale-90"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={resetRotation}
                                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/30 text-white transition-all active:scale-90"
                                >
                                  <RefreshCcw className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleArrowNav('RIGHT')}
                                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/30 text-white transition-all active:scale-90"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                onClick={() => handleArrowNav('DOWN')}
                                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/30 text-white transition-all active:scale-90"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     </div>
                     
                     <div className="space-y-3">
                        <label className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider px-1">快速选择视角</label>
                        <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto scrollbar-hide pr-1">
                           {VIEWPOINTS.map((vp) => (
                             <button
                               key={vp.label}
                               onClick={() => handleViewpointSelect(vp)}
                               className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                                 selectedViewpoint === vp.label 
                                   ? 'bg-black text-white border-black shadow-md' 
                                   : 'bg-white/60 text-[#1D1D1F] border-black/5 hover:bg-white hover:border-black/10'
                               }`}
                             >
                               {vp.label}
                             </button>
                           ))}
                        </div>
                     </div>

                     <div className="p-3 bg-white/40 border border-white/50 rounded-xl text-[13px] text-[#1D1D1F] font-semibold leading-relaxed shadow-sm mt-2 flex items-center justify-between">
                        <div>
                          <span className="text-gray-400 font-medium">目标视角：</span>
                          {selectedViewpoint}
                        </div>
                     </div>

                     <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[12px] font-bold text-[#86868B] uppercase tracking-wider">附加渲染描述</label>
                          <button 
                            onClick={() => setPreservePose(!preservePose)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${preservePose ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-sm' : 'bg-white/50 text-[#86868B] border-black/5 hover:bg-white'}`}
                          >
                            <User className="w-3 h-3" />
                            人物动作不变
                            {preservePose && <Check className="w-2.5 h-2.5 ml-0.5" />}
                          </button>
                        </div>
                        <IOSInput value={prompt} onChange={(e) => setPrompt((e.target as any).value)} placeholder="例如: 柔和侧光, 极简白背景..." />
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Maximize2 className="w-4 h-4 text-[#86868B]" />
                <span className="text-xs font-bold text-[#86868B] uppercase tracking-wider">输出画幅</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {(['1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatio[]).map(ratio => (
                  <button 
                    key={ratio} 
                    onClick={() => setAspectRatio(ratio)} 
                    className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${aspectRatio === ratio ? 'bg-black text-white border-black shadow-md' : 'bg-[#F2F2F7] text-[#86868B] border-transparent hover:bg-white/50 hover:border-black/5'}`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-black/5">
              <div className="flex items-center gap-2 mb-1">
                <MonitorCheck className="w-4 h-4 text-[#86868B]" />
                <span className="text-xs font-bold text-[#86868B] uppercase tracking-wider">渲染分辨率</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['1K', '2K', '4K'] as Resolution[]).map(res => (
                  <button key={res} onClick={() => setResolution(res)} className={`py-2 rounded-xl text-sm font-semibold transition-all border ${resolution === res ? 'bg-black text-white border-black shadow-lg' : 'bg-[#F2F2F7] text-[#86868B] border-transparent hover:bg-white/50 hover:border-black/5'}`}>{res}</button>
                ))}
              </div>
              {isGemini3 && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                   <Info className="w-3.5 h-3.5 text-blue-500" />
                   <p className="text-[10px] text-blue-600">2K/4K 渲染需要切换到付费项目 API Key</p>
                </div>
              )}
            </div>
          </GlassCard>

          <div className="pt-2">
             <IOSButton onClick={handleGenerate} isLoading={status.isLoading} disabled={!images.original || status.isLoading}>
               {status.isLoading ? '正在处理中...' : '开始渲染'}
             </IOSButton>
             {status.error && (
               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 border border-red-100 shadow-sm"><AlertCircle className="w-4 h-4" />{status.error}</motion.div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}
