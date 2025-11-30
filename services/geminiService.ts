import { GoogleGenAI } from "@google/genai";

// Ensure the API Key is read from process.env as required by guidelines
const apiKey = process.env.API_KEY || ''; 

export interface AIConfig {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemInstruction?: string;
  responseMimeType?: string;
}

// We can accept an override key from the UI if the environment one is missing
export const generateText = async (prompt: string, overrideKey?: string, config?: AIConfig): Promise<string> => {
  const effectiveKey = overrideKey || apiKey;
  
  if (!effectiveKey) {
    throw new Error("API Key is missing. Please provide it in Settings or Environment.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: effectiveKey });
    
    // Default values
    const modelName = config?.model || 'gemini-2.5-flash';
    const maxTokens = config?.maxTokens || 4096;
    const temperature = config?.temperature ?? 0.7;

    const requestConfig: any = {
      maxOutputTokens: maxTokens,
      temperature: temperature,
    };

    if (config?.systemInstruction) {
      requestConfig.systemInstruction = config.systemInstruction;
    }

    if (config?.responseMimeType) {
        requestConfig.responseMimeType = config.responseMimeType;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: requestConfig
    });
    
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};