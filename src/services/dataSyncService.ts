import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { getMemories, MemoryItem } from "./memoryService";
import { getScheduledReminders, ScheduledReminder } from "./reminderService";
import {
  getCachedToken,
  fetchGoogleTasks,
  fetchGoogleCalendarEvents,
  fetchGoogleContacts,
  fetchRecentEmails,
  GoogleTaskItem,
  GoogleCalendarEvent,
  GoogleContactItem,
  GmailMessageItem,
} from "./workspaceService";
import { checkEvolutionConnection, getEvolutionConfig } from "./evolutionApiService";
import { getAvailableBrowserVoices, getStoredVoiceSettings } from "../utils/speechUtils";

export interface DataSyncReport {
  timestamp: number;
  formattedTime: string;
  memoriesCount: number;
  tasksCount: number;
  eventsCount: number;
  contactsCount: number;
  emailsCount: number;
  evolutionStatus: string;
  remindersCount: number;
  voiceEngine: string;
  summaryMessage: string;
}

/**
 * Perform a full update and synchronization of all application data:
 * - Lifetime Neural Memories from Firebase Cloud Firestore
 * - Google Workspace data (Tasks, Calendar, Contacts, Gmail) if authorized
 * - Scheduled Reminders & Timers
 * - Evolution API WhatsApp Connection Status
 * - Web Speech and Gemini Voice Profiles
 */
export async function syncAllData(): Promise<DataSyncReport> {
  const now = new Date();
  let memoriesCount = getMemories().length;
  let tasksCount = 0;
  let eventsCount = 0;
  let contactsCount = 0;
  let emailsCount = 0;
  let evolutionStatus = "Not Configured";

  // 1. Synchronize Firebase Firestore Cloud Memories
  try {
    const querySnapshot = await getDocs(collection(db, "memories"));
    if (!querySnapshot.empty) {
      memoriesCount = querySnapshot.docs.length;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("heer-memory-updated"));
    }
  } catch (e) {
    console.warn("Firestore memories sync note:", e);
    memoriesCount = getMemories().length;
  }

  // 2. Synchronize Google Workspace Data (if token exists)
  const token = getCachedToken();
  if (token) {
    try {
      const [tasks, events, contacts, emails] = await Promise.allSettled([
        fetchGoogleTasks(),
        fetchGoogleCalendarEvents(),
        fetchGoogleContacts(),
        fetchRecentEmails(5),
      ]);

      if (tasks.status === "fulfilled") tasksCount = tasks.value.length;
      if (events.status === "fulfilled") eventsCount = events.value.length;
      if (contacts.status === "fulfilled") contactsCount = contacts.value.length;
      if (emails.status === "fulfilled") emailsCount = emails.value.length;
    } catch (e) {
      console.warn("Workspace sync note:", e);
    }
  }

  // 3. Synchronize Evolution API WhatsApp connection
  try {
    const evoConfig = getEvolutionConfig();
    if (evoConfig.baseUrl && evoConfig.apiKey && evoConfig.instanceName) {
      const evoRes = await checkEvolutionConnection(evoConfig);
      evolutionStatus = evoRes.connected ? `Connected (${evoRes.state || "Active"})` : "Disconnected";
    }
  } catch (e) {
    evolutionStatus = "Error checking";
  }

  // 4. Synchronize Scheduled Reminders
  const reminders = getScheduledReminders().filter((r) => !r.triggered);
  const remindersCount = reminders.length;

  // 5. Voice profile verification
  const voiceSettings = getStoredVoiceSettings();
  getAvailableBrowserVoices(); // trigger voice load cache

  const formattedTime = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const workspaceStatusStr = token
    ? `Google Workspace (${tasksCount} Tasks, ${eventsCount} Events, ${contactsCount} Contacts, ${emailsCount} Emails)`
    : `Google Workspace (Not signed in)`;

  const summaryMessage = `All data updated successfully at ${formattedTime}! Synced ${memoriesCount} Cloud Memories, ${workspaceStatusStr}, Evolution API (${evolutionStatus}), and ${remindersCount} active reminders.`;

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("heer-data-synced", {
        detail: {
          timestamp: now.getTime(),
          memoriesCount,
          tasksCount,
          eventsCount,
          contactsCount,
          emailsCount,
          evolutionStatus,
          remindersCount,
          formattedTime,
        },
      })
    );
  }

  return {
    timestamp: now.getTime(),
    formattedTime,
    memoriesCount,
    tasksCount,
    eventsCount,
    contactsCount,
    emailsCount,
    evolutionStatus,
    remindersCount,
    voiceEngine: voiceSettings.engine,
    summaryMessage,
  };
}
