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
 * Calculates exact target Date for expressions like "1:10", "1 bajke 10 minute", "5 baje", "in 10 minutes", "10 min baad"
 */
export function parseTimeToTargetDate(timeExpr: string): Date {
  const now = new Date();
  const lowerExpr = timeExpr.toLowerCase().trim();

  // Check if expression is explicit clock time (contains bajke, baj kar, baje, or colon/period formatted time)
  const isClockTimeExpression = /baj\s*k[ae]|baj\s*kar|baje|\d{1,2}[:.]\d{2}/i.test(lowerExpr);

  if (!isClockTimeExpression) {
    const relMinMatch = lowerExpr.match(/(\d+)\s*(?:min|minute|minutes)/i);
    if (relMinMatch) {
      const mins = parseInt(relMinMatch[1], 10);
      return new Date(now.getTime() + mins * 60 * 1000);
    }
  }

  let hour = 0;
  let minute = 0;
  let matched = false;

  const explicitAM = lowerExpr.includes("am") || lowerExpr.includes("subah") || lowerExpr.includes("morning");
  const explicitPM = lowerExpr.includes("pm") || lowerExpr.includes("shaam") || lowerExpr.includes("raat") || lowerExpr.includes("dopahar") || lowerExpr.includes("evening") || lowerExpr.includes("night");

  // Pattern A: "1 bajke 10 minute", "1 baj kar 10 min", "1 baje 10 min"
  const bajkeMatch = lowerExpr.match(/(\d{1,2})\s*(?:baj\s*k[ae]|baj\s*kar|baje)?\s*(\d{1,2})?/);

  // Pattern B: "1:10", "01:10", "1.10"
  const colonMatch = lowerExpr.match(/(\d{1,2})[:.](\d{2})/);

  if (colonMatch) {
    hour = parseInt(colonMatch[1], 10);
    minute = parseInt(colonMatch[2], 10);
    matched = true;
  } else if (bajkeMatch && (lowerExpr.includes("baj") || bajkeMatch[2])) {
    hour = parseInt(bajkeMatch[1], 10);
    minute = bajkeMatch[2] ? parseInt(bajkeMatch[2], 10) : 0;
    matched = true;
  } else if (bajkeMatch) {
    hour = parseInt(bajkeMatch[1], 10);
    minute = 0;
    matched = true;
  }

  if (!matched) {
    // Default fallback: 1 hour from now
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  // Handle explicit AM
  if (explicitAM) {
    if (hour === 12) hour = 0;
    const target = new Date(now);
    target.setHours(hour, minute, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }

  // Handle explicit PM
  if (explicitPM) {
    if (hour < 12) hour += 12;
    const target = new Date(now);
    target.setHours(hour, minute, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }

  // Unspecified AM/PM (e.g., "1:10", "1 bajke 10 min", "5 baje")
  // Evaluate future candidates for AM/PM today and tomorrow, picking the closest upcoming time
  const candidates: Date[] = [];
  const hAM = hour === 12 ? 0 : hour;
  const hPM = hour < 12 ? hour + 12 : hour;

  // Candidate 1: AM Today
  const candAMToday = new Date(now);
  candAMToday.setHours(hAM, minute, 0, 0);
  if (candAMToday.getTime() > now.getTime()) candidates.push(candAMToday);

  // Candidate 2: PM Today
  const candPMToday = new Date(now);
  candPMToday.setHours(hPM, minute, 0, 0);
  if (candPMToday.getTime() > now.getTime()) candidates.push(candPMToday);

  // Candidate 3: AM Tomorrow
  const candAMTomorrow = new Date(now);
  candAMTomorrow.setDate(candAMTomorrow.getDate() + 1);
  candAMTomorrow.setHours(hAM, minute, 0, 0);
  if (candAMTomorrow.getTime() > now.getTime()) candidates.push(candAMTomorrow);

  // Candidate 4: PM Tomorrow
  const candPMTomorrow = new Date(now);
  candPMTomorrow.setDate(candPMTomorrow.getDate() + 1);
  candPMTomorrow.setHours(hPM, minute, 0, 0);
  if (candPMTomorrow.getTime() > now.getTime()) candidates.push(candPMTomorrow);

  // Sort ascending by time difference from now
  candidates.sort((a, b) => a.getTime() - b.getTime());

  return candidates.length > 0 ? candidates[0] : new Date(now.getTime() + 60 * 60 * 1000);
}

/**
 * Adds a new scheduled reminder for Kaushik
 */
export function addScheduledReminder(timeExpr: string, reminderText: string): ScheduledReminder {
  const targetDate = parseTimeToTargetDate(timeExpr);
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
 * Checks for any reminders whose target time has arrived (down to millisecond precision) and marks them triggered.
 */
export function checkAndTriggerPendingReminders(nowTime: number = Date.now()): ScheduledReminder[] {
  const reminders = getScheduledReminders();
  const dueToTrigger: ScheduledReminder[] = [];

  const updated = reminders.map(r => {
    if (!r.triggered) {
      const targetTime = new Date(r.targetTimeISO).getTime();
      const diffMs = nowTime - targetTime;
      // Trigger if target time reached (diffMs >= 0) and passed within last 30 minutes
      if (diffMs >= 0 && diffMs <= 30 * 60 * 1000) {
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

/**
 * Returns exact millisecond difference for a reminder relative to specified system time
 */
export function getMillisecondRemaining(reminder: ScheduledReminder, nowTime: number = Date.now()): number {
  const targetTime = new Date(reminder.targetTimeISO).getTime();
  return targetTime - nowTime;
}

/**
 * Returns the next untriggered reminder and its exact millisecond offset
 */
export function getMostUrgentReminder(nowTime: number = Date.now()): { reminder: ScheduledReminder; msRemaining: number } | null {
  const reminders = getScheduledReminders().filter(r => !r.triggered);
  if (reminders.length === 0) return null;

  let best = reminders[0];
  let minDiff = getMillisecondRemaining(best, nowTime);

  for (let i = 1; i < reminders.length; i++) {
    const diff = getMillisecondRemaining(reminders[i], nowTime);
    if (diff < minDiff) {
      minDiff = diff;
      best = reminders[i];
    }
  }

  return { reminder: best, msRemaining: minDiff };
}

export function deleteReminder(id: string): void {
  const reminders = getScheduledReminders().filter(r => r.id !== id);
  saveScheduledReminders(reminders);
}

