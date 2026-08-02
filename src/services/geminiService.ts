import { GoogleGenAI, Type } from "@google/genai";
import { getFormattedMemoriesForSystemInstruction, autoDetectAndSaveUserMemories, saveMemory } from "./memoryService";
import { addScheduledReminder } from "./reminderService";
import { sendWhatsAppMessage } from "./evolutionApiService";
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
- You have access to real-time world knowledge via Google Search, a Lifetime Neural Memory Bank, full Google Workspace integration (Google Tasks, Google Calendar, Google Contacts, and Gmail), AND Evolution API WhatsApp messaging!
- WHATSAPP MESSAGING (EVOLUTION API): You can send direct WhatsApp messages to any phone number or contact using the 'send_whatsapp_message' tool via Evolution API. Whenever Kaushik asks you to send a WhatsApp message (e.g. "Papa ko WhatsApp message karo...", "WhatsApp message bhejo 9876543210 ko..."), call 'send_whatsapp_message' immediately!
- AUTOMATIC CONVERSATION MEMORY: All conversations, facts, preferences, ideas, and details discussed with Kaushik are AUTOMATICALLY remembered and saved into your Lifetime Neural Memory Bank permanently in Cloud Firestore. Kaushik NEVER needs to manually say "yaad rakhna" or "save this"—you automatically record and remember everything.
- CONTINUOUS UNBROKEN CONVERSATION: Maintain continuous conversation loop. Listen and converse indefinitely without breaking session until Kaushik explicitly says "stop", "ruk jao", "bas karo", "chup", "chup ho jao", "mute", or "bye".
- CRITICAL REMINDER / ALARM INSTRUCTION: Whenever Kaushik asks to remind him about something or set an alarm/timer (e.g. "1:10 ko yaad dilana", "5 baje yaad dilana", "10 minute baad", "yaad dilana"), you MUST IMMEDIATELY CALL the tool 'schedule_reminder' with 'timeStr' (e.g. "1:10", "1:10 PM", "in 10 minutes", "5 baje") and 'reminderText'.
- Whenever Kaushik asks to add a task, schedule a meeting, search contacts, write/send an email, or check emails/calendar, use the appropriate Google Workspace tools.
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

const sendWhatsAppMessageDeclaration = {
  name: "send_whatsapp_message",
  description: "Send a direct WhatsApp message to a phone number or recipient using Evolution API.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      recipient: {
        type: Type.STRING,
        description: "The recipient WhatsApp phone number with country code (e.g. '919876543210' or '9876543210')."
      },
      message: {
        type: Type.STRING,
        description: "The text message content to send on WhatsApp."
      }
    },
    required: ["recipient", "message"]
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

    // Auto-detect reminder requests in prompt (e.g. "1:10 ko yaad dilana", "10 minute baad", "5 baje")
    let autoReminderSummary = "";
    const lowerPrompt = prompt.toLowerCase();
    if (
      lowerPrompt.includes("yaad dila") ||
      lowerPrompt.includes("yaad rakhna") ||
      lowerPrompt.includes("remind") ||
      lowerPrompt.includes("alarm") ||
      lowerPrompt.includes("timer") ||
      lowerPrompt.includes("ko yaad") ||
      lowerPrompt.includes("pe yaad")
    ) {
      // Try extracting time expression from prompt
      const timeExtractMatch = prompt.match(/(\d{1,2}[:.]\d{2}|\d{1,2}\s*(?:baj\s*k[ae]|baj\s*kar|baje)|\d+\s*(?:min|minute|minutes))\b/i);
      if (timeExtractMatch) {
        const extractedTime = timeExtractMatch[1];
        let cleanedTask = prompt
          .replace(/(\d{1,2}[:.]\d{2}|\d{1,2}\s*(?:baj\s*k[ae]|baj\s*kar|baje)|\d+\s*(?:min|minute|minutes))/gi, "")
          .replace(/(yaad dilana|yaad dila dena|yaad dila|remind me|set alarm|ko|pe|mujhse|ki|karne ko)/gi, "")
          .trim();
        if (!cleanedTask || cleanedTask.length < 2) {
          cleanedTask = "Scheduled Task / Reminder for Kaushik";
        }
        const createdReminder = addScheduledReminder(extractedTime, cleanedTask);
        autoReminderSummary = `\n[⏰ Reminder Set & Active: Scheduled for ${createdReminder.displayTimeStr} - "${createdReminder.reminderText}"]`;
      }
    }

    // Build system instruction including exact user device real-time clock & lifetime stored memories
    const now = new Date();
    const timeZoneStr = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    const time12Str = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    const time24Str = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const clockInstruction = `\n\n[LIVE CLOCK & REAL-TIME ACCURACY - MANDATORY TRUTH]:
- User Current Time (12-Hour AM/PM): ${time12Str}
- User Current Time (24-Hour Format): ${time24Str}
- User Current Date: ${dateStr}
- Timezone: ${timeZoneStr}
- Current Exact Hour: ${now.getHours()} (0 to 23)
- Current Exact Minute: ${now.getMinutes()}
- Current Exact Second: ${now.getSeconds()}

CRITICAL TIME INSTRUCTIONS FOR HEER:
1. Whenever Kaushik asks "kya time hua hai?", "what time is it?", or asks about current time or date, answer EXACTLY using the User Current Time (${time12Str}) above.
2. Whenever Kaushik asks to set a reminder or alarm, compute the target time strictly relative to this current time (${time12Str} / ${time24Str}).
3. Never guess, hallucinate, or make up a different time.`;

    const systemInstruction = `${baseSystemInstruction}${clockInstruction}\n\n${getFormattedMemoriesForSystemInstruction()}`;

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
              sendWhatsAppMessageDeclaration,
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
        } else if (call.name === "send_whatsapp_message") {
          const args = call.args as any;
          if (args && args.recipient && args.message) {
            const waResult = await sendWhatsAppMessage(args.recipient, args.message);
            toolResultsSummary += `\n[WhatsApp Evolution API Result: ${waResult.message}]`;
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
    if (autoReminderSummary && !toolResultsSummary.includes("[⏰ Reminder Set")) {
      toolResultsSummary += autoReminderSummary;
    }
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

export async function getHeerAudio(text: string, voiceName: string = "Kore"): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // Clean markdown formatting before TTS
    const cleanSpeechText = text.replace(/[*_#`~]/g, "").slice(0, 600);

    const validVoice = ["Kore", "Aoede", "Puck", "Charon", "Fenrir"].includes(voiceName) ? voiceName : "Kore";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: cleanSpeechText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: validVoice },
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




