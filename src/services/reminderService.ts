export interface ScheduledReminder {
  id: string;
  reminderText: string;
  targetTimeISO: string; // ISO String when it should trigger
  displayTimeStr: string; // e.g. "5:00 PM"
  triggered: boolean;
  createdAt: string;
}

const STORAGE_KEY = "heer_scheduled_reminders";

export function getScheduledReminders(): ScheduledReminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveScheduledReminders(reminders: ScheduledReminder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch (e) {
    console.error("Failed to save reminders:", e);
  }
}

/**
 * Parses time expressions like "5 baje", "5:00 PM", "17:00", "in 10 minutes"
 */
export function addScheduledReminder(timeExpr: string, reminderText: string): ScheduledReminder {
  const now = new Date();
  let targetDate = new Date();

  const lowerExpr = timeExpr.toLowerCase().trim();

  // Relative minutes match: "in 10 minutes", "10 min"
  const relMinMatch = lowerExpr.match(/(?:in\s+)?(\d+)\s*(?:min|minute|minutes)/);
  if (relMinMatch) {
    const mins = parseInt(relMinMatch[1], 10);
    targetDate = new Date(now.getTime() + mins * 60 * 1000);
  } else {
    // Hour parse match: e.g. "5 baje", "5:00 pm", "17:00", "5"
    let hour = 0;
    let minute = 0;
    let isPM = lowerExpr.includes("pm") || lowerExpr.includes("shaam") || lowerExpr.includes("raat");

    const timeMatch = lowerExpr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje)?/);
    if (timeMatch) {
      hour = parseInt(timeMatch[1], 10);
      minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      
      // If "5 baje" in evening or explicitly 1 to 11 without AM/PM, default 5 baje -> 17:00 if current time < 17:00 or if evening implied
      if (!lowerExpr.includes("am") && !lowerExpr.includes("pm")) {
        if (hour < 12 && (now.getHours() >= 12 || hour <= 8)) {
          // If e.g. user says 5 baje, and it's daytime, assume 5 PM (17:00)
          if (hour <= 11) isPM = true;
        }
      }

      if (isPM && hour < 12) hour += 12;
      if (lowerExpr.includes("am") && hour === 12) hour = 0;

      targetDate.setHours(hour, minute, 0, 0);

      // If target time is earlier today than current time, schedule for tomorrow
      if (targetDate.getTime() <= now.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    } else {
      // Default to 1 hour from now if unparseable
      targetDate = new Date(now.getTime() + 60 * 60 * 1000);
    }
  }

  const displayTimeStr = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const reminder: ScheduledReminder = {
    id: Date.now().toString(),
    reminderText,
    targetTimeISO: targetDate.toISOString(),
    displayTimeStr,
    triggered: false,
    createdAt: new Date().toISOString()
  };

  const current = getScheduledReminders();
  current.push(reminder);
  saveScheduledReminders(current);

  return reminder;
}

/**
 * Checks for any reminders whose target time has arrived and marks them triggered.
 */
export function checkAndTriggerPendingReminders(): ScheduledReminder[] {
  const reminders = getScheduledReminders();
  const nowTime = new Date().getTime();
  const dueToTrigger: ScheduledReminder[] = [];

  const updated = reminders.map(r => {
    if (!r.triggered) {
      const targetTime = new Date(r.targetTimeISO).getTime();
      // If time has arrived or passed within 15 minutes
      if (nowTime >= targetTime && (nowTime - targetTime) <= 15 * 60 * 1000) {
        r.triggered = true;
        dueToTrigger.push(r);
      }
    }
    return r;
  });

  if (dueToTrigger.length > 0) {
    saveScheduledReminders(updated);
  }

  return dueToTrigger;
}

export function deleteReminder(id: string): void {
  const reminders = getScheduledReminders().filter(r => r.id !== id);
  saveScheduledReminders(reminders);
}
