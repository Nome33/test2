
import { GoogleGenAI } from "@google/genai";
import { EditMode, AiModel, VolcengineConfig, RenderConfig, ViewShiftMode } from "../types";

// Helper to calculate dimensions for Seedream/Volcengine
const getVolcengineDimensions = (aspectRatio: string, resolution: string): { width: number, height: number } => {
  let longSide = 1024;
  if (resolution === '2K') longSide = 2048; 
  if (resolution === '4K') longSide = 3840;

  let w = longSide;
  let h = longSide;

  switch (aspectRatio) {
    case '16:9': w = longSide; h = Math.round(longSide * 9 / 16); break;
    case '9:16': w = Math.round(longSide * 9 / 16); h = longSide; break;
    case '4:3': w = longSide; h = Math.round(longSide * 3 / 4); break;
    case '3:4': w = Math.round(longSide * 3 / 4); h = longSide; break;
    case '1:1': default: w = longSide; h = longSide; break;
  }

  w = Math.round(w / 8) * 8;
  h = Math.round(h / 8) * 8;

  return { width: w, height: h };
};

const generateVolcengineImage = async (
  prompt: string,
  base64Image: string,
  volcConfig: VolcengineConfig | undefined,
  renderConfig: RenderConfig
): Promise<string> => {
  if (!volcConfig?.apiKey || !volcConfig?.endpointId) {
    throw new Error("请在配置中心填写火山引擎 (Volcengine) 的 API Key 和 Endpoint ID");
  }

  const endpoint = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
  const { width, height } = getVolcengineDimensions(renderConfig.aspectRatio, renderConfig.resolution);
  const fullDataUri = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;
  
  // Volcengine often benefits from aspect ratio explicitly in prompt too
  const finalPrompt = `${prompt} --ar ${renderConfig.aspectRatio.replace(':','-')}`;

  const payload: any = {
    model: volcConfig.endpointId,
    prompt: finalPrompt,
    image: fullDataUri,
    width: width,
    height: height,
    strength: renderConfig.strength, 
    watermark: false,
    size: renderConfig.resolution.toLowerCase() 
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${volcConfig.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Volcengine API Error:', errorData);
      
      let errorMsg = `API Error (${response.status})`;
      if (errorData.error?.message) {
        errorMsg = errorData.error.message;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url || data.data?.[0]?.image_url || data.data?.[0]?.binary_data;

    if (!imageUrl) {
      throw new Error("火山引擎未返回有效的图片 URL。");
    }

    return imageUrl;
  } catch (error: any) {
    console.error("Volcengine Generation Failed:", error);
    throw error;
  }
};

export const generateEditedImage = async (
  base64Image: string,
  prompt: string,
  mode: EditMode,
  model: AiModel,
  volcConfig?: VolcengineConfig,
  renderConfig: RenderConfig = { 
    resolution: '1K', 
    aspectRatio: '1:1', 
    strength: 0.65,
    seed: -1,
    scale: 7.5 
  },
  viewShiftMode: ViewShiftMode = 'CAMERA'
): Promise<string> => {

  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  // --- Prompt Construction (Shared Logic) ---
  let augmentedPrompt = "";
  
  switch (mode) {
    case EditMode.GENERAL:
      augmentedPrompt = `Professional image editing. ${prompt}. Maintain the original subject's identity strictly. High fidelity, ${renderConfig.resolution}.`;
      break;
    case EditMode.BACKGROUND:
      augmentedPrompt = `Product photography background replacement. Place the product in: ${prompt}. CRITICAL: Do not alter the product's shape, logo, or color. Only change the background environment. Realistic lighting, ${renderConfig.resolution}.`;
      break;
    case EditMode.CREATIVE:
      augmentedPrompt = `Creative re-imagining. ${prompt}. Artistic style, masterpiece quality, ${renderConfig.resolution}.`;
      break;
    case EditMode.VIEW_SHIFT:
      // Separate logic for English (Gemini) vs Chinese (Seedream)
      if (model === 'external-seedream') {
         // Chinese Logic for Seedream - Simplified to respect the "将视角改为" prefix from App.tsx
         augmentedPrompt = `${prompt}。关键：要求画面透视合理，保持主体特征一致，背景光影融合自然。`;
      } else {
         // English Logic for Gemini
         augmentedPrompt = `${prompt}. Novel View Synthesis logic: ensure subject identity features are consistent and background perspective changes accordingly.`;
      }
      break;
    default:
      augmentedPrompt = `Edit this image: ${prompt}.`;
  }

  // --- Engine Routing ---

  // 1. Seedream / Volcengine Route
  if (model === 'external-seedream') {
    return generateVolcengineImage(augmentedPrompt, base64Image, volcConfig, renderConfig);
  }

  // 2. Gemini Route
  // Create a new instance right before use as per guidelines to ensure it uses the latest process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const geminiConfig: any = {};
  if (model === 'gemini-3-pro-image-preview') {
    geminiConfig.imageConfig = {
      imageSize: renderConfig.resolution,
      aspectRatio: renderConfig.aspectRatio
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: augmentedPrompt,
          },
        ],
      },
      config: geminiConfig
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("AI 生成失败，未返回图片数据。");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let msg = error.message;
    if (msg.includes('API key not valid') || msg.includes('Requested entity was not found')) {
      msg = 'Gemini API Key 无效或未找到。如果是 Gemini 3 模型，请确保您已在对话框中选择了有效的 API Key。';
    }
    throw new Error(msg);
  }
};
