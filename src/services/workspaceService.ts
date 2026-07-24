import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(firebaseApp);

// Configure Google Auth Provider with all requested Google Workspace scopes
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/tasks");
provider.addScope("https://www.googleapis.com/auth/contacts");
provider.addScope("https://www.googleapis.com/auth/calendar");
provider.addScope("https://mail.google.com/");
provider.addScope("https://www.googleapis.com/auth/userinfo.email");
provider.addScope("https://www.googleapis.com/auth/userinfo.profile");

// In-memory token storage (Do not persist token in localStorage)
let cachedAccessToken: string | null = null;
let currentUser: User | null = null;

export function getCachedToken(): string | null {
  return cachedAccessToken;
}

export function getCurrentWorkspaceUser(): User | null {
  return currentUser || auth.currentUser;
}

/**
 * Initialize Firebase Auth listener.
 */
export function initWorkspaceAuth(
  onSuccess?: (user: User, token: string) => void,
  onFailure?: () => void
) {
  return onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user && cachedAccessToken) {
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else {
      if (!user) {
        cachedAccessToken = null;
      }
      if (onFailure) onFailure();
    }
  });
}

/**
 * Sign in with Google with Workspace scopes
 */
export async function signInWithWorkspaceGoogle(): Promise<{ user: User; accessToken: string }> {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google Workspace access token.");
    }
    cachedAccessToken = credential.accessToken;
    currentUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Workspace Google Sign-In error:", error);
    throw error;
  }
}

/**
 * Sign out from Google Workspace session
 */
export async function signOutWorkspaceGoogle() {
  await signOut(auth);
  cachedAccessToken = null;
  currentUser = null;
}

/* ========================================================================
   GOOGLE TASKS API
   ======================================================================== */

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: "needsAction" | "completed";
}

export async function fetchGoogleTasks(): Promise<GoogleTaskItem[]> {
  const token = getCachedToken();
  if (!token) throw new Error("Google Workspace authentication required.");

  const response = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists/@default/tasks", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to fetch Google Tasks");
  }

  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    notes: item.notes || "",
    due: item.due || "",
    status: item.status || "needsAction"
  }));
}

export async function createGoogleTask(title: string, notes?: string, dueISO?: string): Promise<GoogleTaskItem> {
  const token = getCachedToken();
  if (!token) throw new Error("Google Workspace authentication required.");

  const body: any = { title, notes: notes || "" };
  if (dueISO) {
    body.due = dueISO;
  }

  const response = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists/@default/tasks", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to create Google Task");
  }

  const item = await response.json();
  return {
    id: item.id,
    title: item.title,
    notes: item.notes || "",
    due: item.due || "",
    status: item.status || "needsAction"
  };
}

export async function completeGoogleTask(taskId: string): Promise<boolean> {
  const token = getCachedToken();
  if (!token) throw new Error("Google Workspace authentication required.");

  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/users/@me/lists/@default/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status: "completed" })
  });

  return response.ok;
}

/* ========================================================================
   GOOGLE CONTACTS (PEOPLE API)
   ======================================================================== */

export interface GoogleContactItem {
  resourceName: string;
  name: string;
  email?: string;
  phone?: string;
}

export async function fetchGoogleContacts(): Promise<GoogleContactItem[]> {
  const token = getCachedToken();
  if (!token) throw new Error("Google Workspace authentication required.");

  const response = await fetch(
    "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers",
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to fetch Google Contacts");
  }

  const data = await response.json();
  return (data.connections || []).map((person: any) => ({
    resourceName: person.resourceName,
    name: person.names?.[0]?.displayName || "Unnamed Contact",
    email: person.emailAddresses?.[0]?.value || "",
    phone: person.phoneNumbers?.[0]?.value || ""
  }));
}

/* ========================================================================
   GOOGLE CALENDAR API
   ======================================================================== */

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  htmlLink?: string;
}

export async function fetchGoogleCalendarEvents(): Promise<GoogleCalendarEvent[]> {
  const token = getCachedToken();
  if (!token) throw new Error("Google Workspace authentication required.");

  const now = new Date().toISOString();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      now
    )}&orderBy=startTime&singleEvents=true&maxResults=20`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to fetch Google Calendar events");
  }

  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary || "(No Title)",
    description: item.description || "",
    start: item.start?.dateTime || item.start?.date || "",
    end: item.end?.dateTime || item.end?.date || "",
    htmlLink: item.htmlLink || ""
  }));
}

export async function createGoogleCalendarEvent(
  summary: string,
  startTimeISO: string,
  endTimeISO: string,
  description?: string
): Promise<GoogleCalendarEvent> {
  const token = getCachedToken();
  if (!token) throw new Error("Google Workspace authentication required.");

  const body = {
    summary,
    description: description || "",
    start: { dateTime: startTimeISO },
    end: { dateTime: endTimeISO }
  };

  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to create Calendar event");
  }

  const item = await response.json();
  return {
    id: item.id,
    summary: item.summary,
    description: item.description || "",
    start: item.start?.dateTime || item.start?.date || "",
    end: item.end?.dateTime || item.end?.date || "",
    htmlLink: item.htmlLink || ""
  };
}

/* ========================================================================
   GMAIL API
   ======================================================================== */

export interface GmailMessageItem {
  id: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
}

export async function fetchRecentEmails(maxResults = 10): Promise<GmailMessageItem[]> {
  const token = getCachedToken();
  if (!token) throw new Error("Google Workspace authentication required.");

  const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!listRes.ok) {
    const err = await listRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to fetch Gmail message list");
  }

  const listData = await listRes.json();
  const messages: GmailMessageItem[] = [];

  for (const msg of listData.messages || []) {
    const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (detailRes.ok) {
      const detail = await detailRes.json();
      const headers = detail.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

      messages.push({
        id: detail.id,
        snippet: detail.snippet || "",
        subject: getHeader("Subject") || "(No Subject)",
        from: getHeader("From") || "",
        date: getHeader("Date") || ""
      });
    }
  }

  return messages;
}

export async function sendGmailMessage(to: string, subject: string, bodyText: string): Promise<boolean> {
  const token = getCachedToken();
  if (!token) throw new Error("Google Workspace authentication required.");

  // Construct raw RFC 2822 email string and base64url encode it
  const rawEmail = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    bodyText
  ].join('\r\n');

  const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw: encodedEmail })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to send email");
  }

  return true;
}
