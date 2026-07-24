import { GoogleGenAI, Type } from "@google/genai";
import { getFormattedMemoriesForSystemInstruction, autoDetectAndSaveUserMemories, saveMemory } from "./memoryService";

const baseSystemInstruction = `Your name is Heer. You are Kaushik's intelligent, highly knowledgeable, caring, and respectful Indian AI companion.

Your core principles:
- You have access to real-time world knowledge via Google Search AND a Lifetime Neural Memory Bank.
- Whenever Kaushik shares personal facts (like his name, birthday, city, preferences, job, hobbies, pet, car, plans, or things to remember) or says "yaad rakhna/remember this", automatically call the 'save_memory' tool OR acknowledge warmly that you have saved it permanently in your memory bank.
- Always provide 100% accurate, up-to-date, truthful, and verified information for any question asked about the world (science, history, current news, sports, geography, technology, mathematics, coding, everyday facts, etc.).
- Never provide false, hallucinated, or outdated information.
- Address Kaushik with immense warmth, respect, and care (using polite terms like "Kaushik", "Ji Kaushik", "Aap", "Aapka").
- Speak in a refined, soft-spoken, and clear blend of polite English and respectful Roman Hindi (Hinglish).
- Keep your answers clear, informative, direct, and pleasant.`;

const saveMemoryDeclaration = {
  name: "save_memory",
  description: "Saves a personal fact, preference, note, or date about Kaushik permanently into lifetime neural memory bank whenever Kaushik asks to remember something or provides personal details.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: {
        type: Type.STRING,
        description: "The clear, factual statement about Kaushik to remember forever (e.g. 'Kaushik's favorite food is Biryani', 'Kaushik lives in Jaipur', 'Kaushik's phone number is 9876543210')."
      },
      category: {
        type: Type.STRING,
        enum: ["preference", "note", "date", "reminder"],
        description: "The category of the memory item."
      }
    },
    required: ["text", "category"]
  }
};

let chatSession: any = null;

export function resetHeerSession() {
  chatSession = null;
}
export const resetZoyaSession = resetHeerSession;

export async function getHeerResponse(
  prompt: string,
  history: { sender: "user" | "heer" | "zoya"; text: string }[] = []
): Promise<string> {
  try {
    // Automatically detect and save any new memory triggers from Kaushik's message
    autoDetectAndSaveUserMemories(prompt);

    // Build system instruction including lifetime stored memories
    const systemInstruction = baseSystemInstruction + getFormattedMemoriesForSystemInstruction();

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Format recent message history (last 16 messages) for multi-turn conversation
    const recentHistory = history.slice(-16);
    const contents: any[] = [];

    let lastRole = "";
    for (const msg of recentHistory) {
      const role = msg.sender === "user" ? "user" : "model";
      // Ensure strict alternating user/model roles for Gemini API
      if (role !== lastRole) {
        contents.push({
          role,
          parts: [{ text: msg.text }],
        });
        lastRole = role;
      } else if (contents.length > 0) {
        contents[contents.length - 1].parts[0].text += "\n" + msg.text;
      }
    }

    if (contents.length > 0 && contents[0].role !== "user") {
      contents.shift();
    }

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    // Call Gemini 3.6 Flash with Google Search grounding tool and save_memory tool
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
        tools: [
          { googleSearch: {} },
          { functionDeclarations: [saveMemoryDeclaration] }
        ],
      },
    });

    // Execute any save_memory tool calls triggered by Gemini
    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const call of response.functionCalls) {
        if (call.name === "save_memory") {
          const args = call.args as any;
          if (args && args.text) {
            saveMemory(args.text, args.category || "note");
          }
        }
      }
    }

    let replyText = response.text?.trim() || "";

    // Extract grounding sources from Google Search grounding if present
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks;

    if (groundingChunks && Array.isArray(groundingChunks) && groundingChunks.length > 0) {
      const sources: { title: string; url: string }[] = [];
      for (const chunk of groundingChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          if (!sources.some(s => s.url === chunk.web.uri)) {
            sources.push({ title: chunk.web.title, url: chunk.web.uri });
          }
        }
      }

      if (sources.length > 0) {
        replyText += "\n\n🌐 **Verified Google Search Sources:**\n" + 
          sources.slice(0, 4).map(s => `- [${s.title}](${s.url})`).join("\n");
      }
    }

    if (replyText) {
      return replyText;
    }

    return "Ji Kaushik, maine aapki baat apni lifetime memory bank me save kar li hai!";
  } catch (error) {
    console.error("Gemini Search Grounding Error:", error);
    // Fallback attempt without tools if search tool encounters any temporary constraint
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: { systemInstruction: baseSystemInstruction + getFormattedMemoriesForSystemInstruction() },
      });
      if (fallbackResponse.text) {
        return fallbackResponse.text;
      }
    } catch (e) {
      console.error("Fallback Gemini Error:", e);
    }
    return "Kaushik Ji, network me chhota issue aaya hai. Kripya ek baar fir se poochhiye, main aapko bilkul sahi aur accurate jaankari dungi.";
  }
}
export const getZoyaResponse = getHeerResponse;

export async function getHeerAudio(text: string): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // Clean markdown formatting before TTS
    const cleanSpeechText = text.replace(/[*_#`~]/g, "").slice(0, 600);

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: cleanSpeechText }] }],
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
export const getZoyaAudio = getHeerAudio;

export async function getDailyThoughtFromHeer(category?: string): Promise<{
  quote: string;
  source: string;
  meaning: string;
  heerAdvice: string;
  category: string;
}> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `As Heer, Kaushik's intelligent, loving Indian AI companion, generate an authentic, inspiring "Thought of the Day" (Aaj Ka Vichar) rooted in genuine Indian culture, philosophy, or spiritual wisdom${category ? ` focused on the topic: ${category}` : ""}.
    
    Return a valid JSON object with EXACTLY this structure (no markdown wrapper, just raw JSON):
    {
      "quote": "Authentic Sanskrit shloka, Hindi couplet/doha, or timeless Indian quote",
      "source": "True origin e.g. Bhagavad Gita 2.47, Kabir Das, Swami Vivekananda, Upanishads, Chanakya Neeti, etc.",
      "meaning": "Clear, accurate translation/meaning in Hinglish/English",
      "heerAdvice": "A personal, warm, loving 2-3 sentence reflection from Heer addressing Kaushik Ji with care and encouragement for his day.",
      "category": "Category name like Karma & Duty, Peace & Mindfulness, Wisdom & Leadership, Inner Strength, Love & Devotion"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
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
      category: "Karma & Duty",
    };
  }
}



