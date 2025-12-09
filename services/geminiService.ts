import { GoogleGenAI } from "@google/genai";
import { EditMode, AiModel, VolcengineConfig, RenderConfig } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please configure process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to calculate dimensions for Seedream/Volcengine
// User confirmed model has no strict lower pixel limit, so we allow standard 16:9 resolutions.
const getVolcengineDimensions = (aspectRatio: string, resolution: string): { width: number, height: number } => {
  // Define standard pixel dimensions for common ratios
  // Ensuring multiples of 16 or 64 for best model compatibility
  
  // Base long side size based on Resolution preset
  let longSide = 1024;
  if (resolution === '2K') longSide = 2048; // e.g., 2048x1152 for 16:9
  if (resolution === '4K') longSide = 3840; // e.g., 3840x2160 for 16:9

  // Calculate short side based on ratio
  let w = longSide;
  let h = longSide;

  switch (aspectRatio) {
    case '16:9':
      // Landscape
      w = longSide;
      h = Math.round(longSide * 9 / 16);
      break;
    case '9:16':
      // Portrait
      w = Math.round(longSide * 9 / 16);
      h = longSide;
      break;
    case '4:3':
      w = longSide;
      h = Math.round(longSide * 3 / 4);
      break;
    case '3:4':
      w = Math.round(longSide * 3 / 4);
      h = longSide;
      break;
    case '1:1':
    default:
      w = longSide;
      h = longSide;
      break;
  }

  // Ensure even numbers (divisible by 8 is usually safe for most modern models)
  // Rounding to nearest 8
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
  
  // Use strictly calculated dimensions based on user selection
  const { width, height } = getVolcengineDimensions(renderConfig.aspectRatio, renderConfig.resolution);

  // Use the full Base64 Data URI string for the image
  const fullDataUri = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;

  // Payload structure based on standard Volcengine ARK ImageGenerations
  const payload: any = {
    model: volcConfig.endpointId,
    prompt: prompt,
    image: fullDataUri,
    width: width,
    height: height,
    // Strength: 0.1 (Similar) -> 0.9 (Different)
    strength: renderConfig.strength, 
    scale: renderConfig.scale || 7.5,
    watermark: false
  };

  // Add optional parameters if they exist (though UI might hide them now)
  if (renderConfig.seed && renderConfig.seed !== -1) {
    payload.seed = renderConfig.seed;
  }
  
  if (renderConfig.negativePrompt) {
    payload.negative_prompt = renderConfig.negativePrompt;
  }

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
    // Support both OpenAI standard 'data[0].url' and some Volcengine variations
    const imageUrl = data.data?.[0]?.url || data.data?.[0]?.image_url || data.data?.[0]?.binary_data;

    if (!imageUrl) {
      console.error("Full Response:", data);
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
  }
): Promise<string> => {

  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  // --- Volcengine Route (Independent Logic) ---
  if (model === 'external-seedream') {
    const finalPrompt = prompt.trim();
    // Do not clean base64 for Volcengine wrapper, it handles it.
    return generateVolcengineImage(finalPrompt, base64Image, volcConfig, renderConfig);
  }

  // --- Gemini Route ---
  const ai = getClient();
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
    default:
      augmentedPrompt = `Edit this image: ${prompt}.`;
  }

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
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};