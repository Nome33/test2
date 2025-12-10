
export enum EditMode {
  BACKGROUND = 'BACKGROUND',
  GENERAL = 'GENERAL', // General enhancement/modification
  CREATIVE = 'CREATIVE', // Heavy style transfer
  VIEW_SHIFT = 'VIEW_SHIFT' // New: Perspective/Rotation change
}

export type ViewShiftMode = 'CAMERA' | 'SUBJECT';

export type EngineType = 'GEMINI' | 'SEEDREAM';

export type AiModel = 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview' | 'external-seedream';

export type Resolution = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface RenderConfig {
  resolution: Resolution;
  aspectRatio: AspectRatio;
  strength: number; // 0.0 - 1.0, internal usage
  // Advanced Volcengine Params
  seed: number;
  scale: number;
  negativePrompt?: string;
}

export interface VolcengineConfig {
  apiKey: string;
  endpointId: string;
}

export interface ProcessingState {
  isLoading: boolean;
  error: string | null;
  step: 'idle' | 'uploading' | 'processing' | 'completed';
}

export interface ImageState {
  original: string | null;
  generated: string | null;
}

export interface StylePreset {
  id: string;
  name: string;
  promptModifier: string;
  icon: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  original: string;
  generated: string;
  prompt: string;
  engine: EngineType;
  resolution: Resolution;
  aspectRatio: AspectRatio;
}

export interface RotationState {
  x: number;
  y: number;
}
