
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generatePostMetadata = async (content: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this markdown blog post and provide a concise summary (max 150 chars) and 3-5 relevant tags.
    Content: ${content.substring(0, 3000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          tags: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          }
        },
        required: ["summary", "tags"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { summary: "New post shared.", tags: ["general"] };
  }
};
