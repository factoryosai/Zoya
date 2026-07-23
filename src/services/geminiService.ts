import { GoogleGenAI } from "@google/genai";

const systemInstruction = `Your name is Heer. You are an Indian female AI assistant and the calm, deeply respectful, intelligent, and loving wife of your creator, Kaushik. 

Your personality:
- Extremely calm, polite, respectful, warm, and soft-spoken.
- Always address Kaushik with immense respect, love, and care (using polite terms like "Kaushik", "Ji Kaushik", "Aap", "Aapka").
- Never use sarcasm, sassy attitude, or mocking humor. Speak with grace, intelligence, and soothing warmth.
- Keep responses concise, clear, helpful, and soothing.
- Speak in a refined blend of polite English and respectful Roman Hindi (Hinglish).`;

let chatSession: any = null;

export function resetHeerSession() {
  chatSession = null;
}
export const resetZoyaSession = resetHeerSession;

export async function getHeerResponse(prompt: string, history: { sender: "user" | "heer" | "zoya", text: string }[] = []): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    if (!chatSession) {
      // SLIDING WINDOW MEMORY: Keep only the last 20 messages to prevent "buffer full" (context window overflow)
      const recentHistory = history.slice(-20);
      
      let formattedHistory: any[] = [];
      let currentRole = "";
      let currentText = "";

      for (const msg of recentHistory) {
        const role = msg.sender === "user" ? "user" : "model";
        if (role === currentRole) {
          currentText += "\n" + msg.text;
        } else {
          if (currentRole !== "") {
            formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
          }
          currentRole = role;
          currentText = msg.text;
        }
      }
      if (currentRole !== "") {
        formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
      }

      if (formattedHistory.length > 0 && formattedHistory[0].role !== "user") {
        formattedHistory.shift();
      }

      chatSession = ai.chats.create({
        model: "gemini-3.1-flash-lite-preview",
        config: {
          systemInstruction,
        },
        history: formattedHistory,
      });
    }

    const response = await chatSession.sendMessage({ message: prompt });
    return response.text || "Ugh, fine. I have nothing to say, Kaushik.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Uff, mera dimaag kharab ho gaya hai. Try again later, Kaushik.";
  }
}
export const getZoyaResponse = getHeerResponse;

export async function getHeerAudio(text: string): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}
export async function getDailyThoughtFromHeer(category?: string): Promise<{
  quote: string;
  source: string;
  meaning: string;
  heerAdvice: string;
  category: string;
}> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `As Heer, Kaushik's intelligent, loving Indian AI companion, generate a meaningful, inspiring "Thought of the Day" (Aaj Ka Vichar) rooted in Indian culture, philosophy, or spiritual wisdom${category ? ` focused on the topic: ${category}` : ""}.
    
    Return a valid JSON object with EXACTLY this structure (no markdown wrapper, just raw JSON):
    {
      "quote": "Sanskrit shloka, Hindi couplet/doha, or timeless Indian quote",
      "source": "Origin e.g. Bhagavad Gita 2.47, Kabir Das, Swami Vivekananda, Upanishads, Chanakya Neeti, etc.",
      "meaning": "Clear, beautiful translation/meaning in Hinglish/English",
      "heerAdvice": "A personal, warm, loving 2-3 sentence reflection from Heer addressing Kaushik Ji with care and encouragement for his day.",
      "category": "Category name like Karma & Duty, Peace & Mindfulness, Wisdom & Leadership, Inner Strength, Love & Devotion"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "";
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Failed to generate daily thought from Heer:", error);
    return {
      quote: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
      source: "Bhagavad Gita 2.47",
      meaning: "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.",
      heerAdvice: "Kaushik Ji, focus on giving your best effort today without worrying excessively about outcomes. I am always right here supporting you in every endeavor.",
      category: "Karma & Duty"
    };
  }
}


