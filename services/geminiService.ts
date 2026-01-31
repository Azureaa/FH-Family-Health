
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function analyzeMedicalImages(base64Images: string[]): Promise<AIAnalysisResult> {
  const model = 'gemini-3-flash-preview';
  
  const imageParts = base64Images.map(img => {
    // Strip data prefix if present
    const data = img.split(',')[1] || img;
    return {
      inlineData: {
        data: data,
        mimeType: 'image/jpeg'
      }
    };
  });

  const prompt = `You are a professional medical assistant. Analyze the uploaded medical reports.
  1. Identify if these are multiple independent reports or pages of one.
  2. Extract structured data from each report.
  3. Respond only in the specified JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: prompt },
          ...imageParts
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reports: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category_name: { type: Type.STRING, description: 'Formal name of the medical report' },
                  target_organ: { 
                    type: Type.STRING, 
                    description: 'One of: brain, lungs, heart, liver, digestive, limbs, general' 
                  },
                  report_date: { type: Type.STRING, description: 'Date of report in YYYY-MM-DD' },
                  findings: { type: Type.STRING, description: 'Clinical findings' },
                  diagnosis: { type: Type.STRING, description: 'Diagnostic conclusion' },
                  doctor_summary: { type: Type.STRING, description: 'Key summary for user' },
                  health_score: { type: Type.NUMBER, description: 'Estimated health score from 0-100' },
                  abnormal_items: { type: Type.ARRAY, items: { type: Type.STRING } },
                  image_indices: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: 'Indices of the provided images belonging to this report' }
                },
                required: ['category_name', 'target_organ', 'report_date']
              }
            }
          }
        }
      }
    });

    const jsonStr = response.text || '{}';
    return JSON.parse(jsonStr) as AIAnalysisResult;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw error;
  }
}
