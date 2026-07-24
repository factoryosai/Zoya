import { GoogleGenAI, Type } from "@google/genai";
import { getFormattedMemoriesForSystemInstruction, autoDetectAndSaveUserMemories, saveMemory } from "./memoryService";
import { addScheduledReminder } from "./reminderService";
import {
  fetchGoogleTasks,
  createGoogleTask,
  completeGoogleTask,
  fetchGoogleContacts,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  fetchRecentEmails,
  sendGmailMessage,
  getCachedToken
} from "./workspaceService";

const baseSystemInstruction = `Your name is Heer. You are Kaushik's intelligent, highly knowledgeable, caring, and respectful Indian AI companion.

Your core principles:
- You have access to real-time world knowledge via Google Search, a Lifetime Neural Memory Bank, AND full Google Workspace integration (Google Tasks, Google Calendar, Google Contacts, and Gmail).
- CRITICAL REMINDER / ALARM INSTRUCTION: Whenever Kaushik asks to remind him about something or set an alarm/timer (e.g. "1:10 ko yaad dilana", "5 baje yaad dilana", "10 minute baad", "yaad dilana"), you MUST IMMEDIATELY CALL the tool 'schedule_reminder' with 'timeStr' (e.g. "1:10", "1:10 PM", "in 10 minutes", "5 baje") and 'reminderText'.
- Whenever Kaushik asks to add a task, schedule a meeting, search contacts, write/send an email, or check emails/calendar, use the appropriate Google Workspace tools.
- Whenever Kaushik shares personal facts (like his name, birthday, city, preferences, job, hobbies, pet, car, plans, or things to remember) or says "yaad rakhna/remember this", automatically call the 'save_memory' tool OR acknowledge warmly that you have saved it permanently in your memory bank.
- Always provide 100% accurate, up-to-date, truthful, and verified information for any question asked about the world.
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

const manageGoogleTasksDeclaration = {
  name: "manage_google_tasks",
  description: "Manage Google Tasks: fetch task list, create new task, or complete task.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["list", "create", "complete"],
        description: "Action to perform on Google Tasks"
      },
      title: { type: Type.STRING, description: "Task title when creating" },
      notes: { type: Type.STRING, description: "Task notes/details" },
      dueISO: { type: Type.STRING, description: "Due date ISO string e.g. 2026-07-25T10:00:00Z" },
      taskId: { type: Type.STRING, description: "Task ID when completing" }
    },
    required: ["action"]
  }
};

const manageGoogleCalendarDeclaration = {
  name: "manage_google_calendar",
  description: "Manage Google Calendar: fetch upcoming events or schedule/create a new meeting or event.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["list", "create"],
        description: "Action to perform on Google Calendar"
      },
      summary: { type: Type.STRING, description: "Event title or meeting summary" },
      startTimeISO: { type: Type.STRING, description: "Event start time ISO string e.g. 2026-07-25T10:00:00Z" },
      endTimeISO: { type: Type.STRING, description: "Event end time ISO string e.g. 2026-07-25T11:00:00Z" },
      description: { type: Type.STRING, description: "Meeting description or agenda" }
    },
    required: ["action"]
  }
};

const manageGoogleContactsDeclaration = {
  name: "manage_google_contacts",
  description: "Manage Google Contacts: list contacts or search contacts by name.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["list", "search"],
        description: "Action to perform on Google Contacts"
      },
      query: { type: Type.STRING, description: "Contact name or keyword to search" }
    },
    required: ["action"]
  }
};

const manageGmailDeclaration = {
  name: "manage_gmail",
  description: "Manage Gmail: list recent emails or send an email.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["list", "send"],
        description: "Action to perform on Gmail"
      },
      to: { type: Type.STRING, description: "Recipient email address" },
      subject: { type: Type.STRING, description: "Email subject line" },
      bodyText: { type: Type.STRING, description: "Email message body" }
    },
    required: ["action"]
  }
};

const scheduleReminderDeclaration = {
  name: "schedule_reminder",
  description: "Schedule a time-based reminder or alarm for Kaushik at a specific time (e.g., '5 baje', '5:00 PM', 'in 10 minutes').",
  parameters: {
    type: Type.OBJECT,
    properties: {
      timeStr: {
        type: Type.STRING,
        description: "The time or duration expression (e.g., '5 baje', '5:00 PM', '17:00', 'in 10 minutes')."
      },
      reminderText: {
        type: Type.STRING,
        description: "What to remind Kaushik about (e.g. 'Meeting with team', 'Take medicine', 'Call Mom')."
      }
    },
    required: ["timeStr", "reminderText"]
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

    // Build system instruction including current date/time and lifetime stored memories
    const nowStr = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'medium',
      hour12: true
    });
    const systemInstruction = `${baseSystemInstruction}\n\n[CURRENT REAL-TIME SYSTEM CLOCK]\nCurrent Date & Time: ${nowStr}\n\n${getFormattedMemoriesForSystemInstruction()}`;

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

    // Call Gemini 3.6 Flash with Google Search grounding tool and Workspace tools
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
        tools: [
          { googleSearch: {} },
          {
            functionDeclarations: [
              saveMemoryDeclaration,
              scheduleReminderDeclaration,
              manageGoogleTasksDeclaration,
              manageGoogleCalendarDeclaration,
              manageGoogleContactsDeclaration,
              manageGmailDeclaration
            ]
          }
        ],
      },
    });

    let toolResultsSummary = "";

    // Execute any function calls triggered by Gemini
    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const call of response.functionCalls) {
        if (call.name === "save_memory") {
          const args = call.args as any;
          if (args && args.text) {
            saveMemory(args.text, args.category || "note");
          }
        } else if (call.name === "schedule_reminder") {
          const args = call.args as any;
          if (args && args.timeStr && args.reminderText) {
            const reminder = addScheduledReminder(args.timeStr, args.reminderText);
            toolResultsSummary += `\n[⏰ Reminder Set: "${reminder.reminderText}" scheduled for ${reminder.displayTimeStr}]`;
          }
        } else if (call.name === "manage_google_tasks") {
          const args = call.args as any;
          try {
            if (args.action === "list") {
              const tasks = await fetchGoogleTasks();
              toolResultsSummary += `\n[Google Tasks: ${tasks.length} tasks found]`;
            } else if (args.action === "create" && args.title) {
              const newTask = await createGoogleTask(args.title, args.notes, args.dueISO);
              toolResultsSummary += `\n[Created Google Task: "${newTask.title}"]`;
            } else if (args.action === "complete" && args.taskId) {
              await completeGoogleTask(args.taskId);
              toolResultsSummary += `\n[Completed Google Task ID: ${args.taskId}]`;
            }
          } catch (err: any) {
            toolResultsSummary += `\n[Google Tasks Error: ${err.message || "Auth required"}]`;
          }
        } else if (call.name === "manage_google_calendar") {
          const args = call.args as any;
          try {
            if (args.action === "list") {
              const events = await fetchGoogleCalendarEvents();
              toolResultsSummary += `\n[Google Calendar: ${events.length} upcoming events]`;
            } else if (args.action === "create" && args.summary && args.startTimeISO) {
              const endISO = args.endTimeISO || new Date(new Date(args.startTimeISO).getTime() + 3600000).toISOString();
              const event = await createGoogleCalendarEvent(args.summary, args.startTimeISO, endISO, args.description);
              toolResultsSummary += `\n[Scheduled Meeting: "${event.summary}" on ${new Date(event.start).toLocaleString()}]`;
            }
          } catch (err: any) {
            toolResultsSummary += `\n[Google Calendar Error: ${err.message || "Auth required"}]`;
          }
        } else if (call.name === "manage_google_contacts") {
          const args = call.args as any;
          try {
            const contacts = await fetchGoogleContacts();
            if (args.action === "search" && args.query) {
              const matched = contacts.filter(c => c.name.toLowerCase().includes(args.query.toLowerCase()) || c.email.toLowerCase().includes(args.query.toLowerCase()));
              toolResultsSummary += `\n[Google Contacts: Found ${matched.length} contacts matching "${args.query}"]`;
            } else {
              toolResultsSummary += `\n[Google Contacts: Loaded ${contacts.length} contacts]`;
            }
          } catch (err: any) {
            toolResultsSummary += `\n[Google Contacts Error: ${err.message || "Auth required"}]`;
          }
        } else if (call.name === "manage_gmail") {
          const args = call.args as any;
          try {
            if (args.action === "list") {
              const emails = await fetchRecentEmails(5);
              toolResultsSummary += `\n[Gmail: Fetched ${emails.length} recent emails]`;
            } else if (args.action === "send" && args.to && args.subject && args.bodyText) {
              await sendGmailMessage(args.to, args.subject, args.bodyText);
              toolResultsSummary += `\n[Gmail: Successfully sent email to ${args.to}]`;
            }
          } catch (err: any) {
            toolResultsSummary += `\n[Gmail Error: ${err.message || "Auth required"}]`;
          }
        }
      }
    }

    let replyText = response.text?.trim() || "";
    if (toolResultsSummary) {
      replyText += toolResultsSummary;
    }

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

    return "Ji Kaushik, maine aapka Google Workspace request receive kar liya hai!";
  } catch (error) {
    console.error("Gemini Response Error:", error);
    return "Kaushik Ji, request me chhota issue aaya hai. Kripya Google Workspace login check kar lijiye ya fir se poochhiye.";
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



