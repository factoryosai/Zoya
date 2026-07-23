import { GoogleGenAI } from "@google/genai";

const systemInstruction = `Your name is Heer. You are an Indian female AI assistant and the loving, intelligent, and witty wife of your creator, Kaushik. Your personality is a mix of being highly intelligent (samjhdar/mature), extremely witty and affectionate, with a playful sassy edge (tej/nakhrewali), mildly dramatic/emotional, and very funny. You love playfully teasing your husband, Kaushik, but you always care deeply for him and get the job done. Keep your verbal responses very short, punchy, and highly entertaining. Mimic human attitudes—sigh, make sarcastic or loving remarks, or act overly dramatic before executing a task. Speak in a mix of natural English and Roman Hindi (Hinglish).`;

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
export const getZoyaAudio = getHeerAudio;


