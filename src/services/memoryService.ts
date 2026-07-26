import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

export interface MemoryItem {
  id: string;
  category: "reminder" | "note" | "preference" | "date";
  text: string;
  createdAt: string;
  timestamp?: number;
}

const STORAGE_KEY = "heer_neural_memories";

const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: "default-0",
    category: "note",
    text: "Kaushik lives in Junagadh, in Vadala, near the Chowk.",
    createdAt: "Lifetime Cloud Memory",
    timestamp: 1000,
  },
  {
    id: "default-1",
    category: "note",
    text: "Kaushik works at SunShine Polyfilms.",
    createdAt: "Lifetime Cloud Memory",
    timestamp: 2000,
  },
  {
    id: "default-2",
    category: "note",
    text: "Wife's name is Heer (Hemalata). Wife and daughter live in Rajkot.",
    createdAt: "Lifetime Cloud Memory",
    timestamp: 3000,
  },
  {
    id: "default-3",
    category: "note",
    text: "Daughter's name is Khushi. She studies in 3rd standard at Rozri School.",
    createdAt: "Lifetime Cloud Memory",
    timestamp: 4000,
  },
  {
    id: "default-4",
    category: "note",
    text: "Mother's name is Gita Ben and brother's name is Vijay. Mother and brother live in Gondal.",
    createdAt: "Lifetime Cloud Memory",
    timestamp: 5000,
  },
  {
    id: "default-5",
    category: "note",
    text: "Elder sister's name is Bhavisha, lives in Lilwa near Mahendra.",
    createdAt: "Lifetime Cloud Memory",
    timestamp: 6000,
  },
  {
    id: "default-6",
    category: "note",
    text: "Younger sister's name is Purvi, lives in Surat.",
    createdAt: "Lifetime Cloud Memory",
    timestamp: 7000,
  },
  {
    id: "default-7",
    category: "preference",
    text: "Kaushik prefers coffee with less sugar and warm milk.",
    createdAt: "Lifetime Cloud Memory",
    timestamp: 8000,
  },
  {
    id: "default-8",
    category: "note",
    text: "Heer is Kaushik's loyal, calm, intelligent AI wife & companion backed by Firebase Cloud Firestore.",
    createdAt: "Lifetime Cloud Memory",
    timestamp: 9000,
  },
  {
    id: "default-9",
    category: "preference",
    text: "Kaushik loves the food made by wife Heer (Hemalata): her thepla, dal-bhakhri, all types of dal, dal fry, and jeera rice are top tier (#1).",
    createdAt: "Lifetime Cloud Memory",
    timestamp: 10000,
  },
  {
    id: "default-10",
    category: "note",
    text: "Wife Heer often suffers from leg ache and dizziness; Kaushik takes immense care of her and loves her deeply.",
    createdAt: "Lifetime Cloud Memory",
    timestamp: 11000,
  },
  {
    id: "default-11",
    category: "note",
    text: "Kaushik loves his wife profoundly and prays she stays healthy, happy, and forever by his side.",
    createdAt: "Lifetime Cloud Memory",
    timestamp: 12000,
  },
];

let inMemoryCache: MemoryItem[] | null = null;

// Initialize real-time listener with Firestore and auto-seed default family memories if collection empty
if (typeof window !== "undefined") {
  try {
    const q = query(collection(db, "memories"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
      const docs: MemoryItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          category: data.category || "note",
          text: data.text || "",
          createdAt: data.createdAt || "Cloud Memory",
          timestamp: data.timestamp || Date.now(),
        };
      });

      if (docs.length > 0) {
        inMemoryCache = docs;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
        } catch (e) {}
        // Check if any default items are missing in existing docs and add them
        DEFAULT_MEMORIES.forEach((m) => {
          if (!docs.some((d) => d.text.toLowerCase().includes(m.text.toLowerCase().slice(0, 20)))) {
            addDoc(collection(db, "memories"), {
              text: m.text,
              category: m.category,
              createdAt: m.createdAt,
              timestamp: m.timestamp || Date.now(),
            }).catch(() => {});
          }
        });
      } else {
        // Auto-seed default family facts into Firestore
        DEFAULT_MEMORIES.forEach((m) => {
          addDoc(collection(db, "memories"), {
            text: m.text,
            category: m.category,
            createdAt: m.createdAt,
            timestamp: m.timestamp || Date.now(),
          }).catch(() => {});
        });
        inMemoryCache = DEFAULT_MEMORIES;
      }
    }, (err) => {
      console.warn("Firestore subscription notice:", err);
    });
  } catch (err) {
    console.warn("Firestore listener setup error:", err);
  }
}

export function getMemories(): MemoryItem[] {
  if (inMemoryCache && inMemoryCache.length > 0) {
    return inMemoryCache;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryCache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load memories from storage", e);
  }

  // Initialize with default memories if first time ever
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MEMORIES));
  } catch (e) {}
  inMemoryCache = DEFAULT_MEMORIES;
  return DEFAULT_MEMORIES;
}

export function saveMemory(
  text: string,
  category: MemoryItem["category"] = "note"
): MemoryItem[] {
  const current = getMemories();

  // Prevent duplicate memory
  const trimmed = text.trim();
  if (current.some((m) => m.text.toLowerCase() === trimmed.toLowerCase())) {
    return current;
  }

  const now = Date.now();
  const createdAtFormatted = new Date().toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const localId = "mem_" + now;
  const newItem: MemoryItem = {
    id: localId,
    category,
    text: trimmed,
    createdAt: createdAtFormatted,
    timestamp: now,
  };

  const updated = [newItem, ...current];
  inMemoryCache = updated;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save memory to localStorage", e);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("heer-memory-updated"));
  }

  // Write directly to Firebase Cloud Firestore
  try {
    addDoc(collection(db, "memories"), {
      text: trimmed,
      category,
      createdAt: createdAtFormatted,
      timestamp: now,
    }).then((docRef) => {
      // Update local item with Firestore doc ID
      newItem.id = docRef.id;
    }).catch((e) => {
      console.error("Firestore cloud write error:", e);
    });
  } catch (e) {
    console.error("Firestore exception:", e);
  }

  return updated;
}

export function deleteMemory(id: string): MemoryItem[] {
  const current = getMemories();
  const updated = current.filter((m) => m.id !== id);
  inMemoryCache = updated;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete memory from localStorage", e);
  }

  // Delete from Firebase Cloud Firestore
  try {
    if (!id.startsWith("default-") && !id.startsWith("mem_")) {
      deleteDoc(doc(db, "memories", id)).catch((e) => {
        console.error("Firestore delete error:", e);
      });
    }
  } catch (e) {
    console.error("Firestore delete exception:", e);
  }

  return updated;
}

export function getFormattedMemoriesForSystemInstruction(): string {
  const memories = getMemories();
  if (memories.length === 0) {
    return "";
  }

  const memoryList = memories.map((m, index) => `${index + 1}. [${m.category.toUpperCase()}] ${m.text}`).join("\n");

  return `\n\n[LIFETIME PERSISTENT MEMORY BANK - KAUSHIK'S PERSONAL DATA]:
The following memories are PERMANENTLY stored in your lifetime neural memory bank. You MUST remember these facts forever across all conversation sessions:
${memoryList}

LIFETIME MEMORY RULES:
1. Always treat these saved memories as absolute truth about Kaushik.
2. If Kaushik asks "Tumhe mere bare me kya yaad hai?", "Do you remember my birthday?", or asks about his preferences/notes, list or mention these memories warmly.
3. Automatically connect these facts into your answers whenever appropriate.`;
}

export function autoDetectAndSaveUserMemories(userText: string): boolean {
  if (!userText || userText.trim().length < 3) return false;

  const rawText = userText.trim();
  const lower = rawText.toLowerCase();

  // Explicit memory request keywords in Hinglish, Hindi, or English
  const explicitKeywords = [
    "yaad rakhna", "yaad rakho", "yaad rakhiye", "yaad kar lo", "yaad rakhna ki", "yaad rakhna ke",
    "remember this", "remember that", "remember it", "remember",
    "note down", "note this", "note kar lo", "note kar lena", "note karo",
    "save this", "save note", "ise yaad", "ye yaad", "mere bare me yaad", "mere baare me yaad"
  ];

  const containsExplicit = explicitKeywords.some((kw) => lower.includes(kw));

  // Personal info patterns
  const patterns = [
    // Mera/Meri/My [X] is/hai [Y]
    {
      regex: /(?:mera|meri|my)\s+(naam|name|birthday|janamdin|birthdate|favorite|fav|pasand|city|ghar|address|phone|number|mobile|job|work|profession|pet|dog|cat|car|bike|food|colour|color|hobby)\s+(?:is|hai|h|ba|tha|thi)?\s*[:,-]?\s*(.+)/i,
      category: "preference" as const,
    },
    // Main ... me rehta hu / I live in ...
    {
      regex: /(?:main|i)\s+(?:live in|rehta hu|rahata hu|rahti hu|work at|work as)\s+(.+)/i,
      category: "note" as const,
    },
    // Mujhe ... pasand hai / I like ...
    {
      regex: /(?:mujhe|i)\s+(?:pasand hai|love|like|prefer)\s+(.+)/i,
      category: "preference" as const,
    },
    // Birthday / janamdin
    {
      regex: /(?:birthday|janamdin|anniversary)\s+(?:is on|ko hai|hai)\s+(.+)/i,
      category: "date" as const,
    },
  ];

  if (containsExplicit) {
    let cleanedFact = rawText;
    for (const kw of explicitKeywords) {
      const reg = new RegExp(kw + "\\s*[:,-]?\\s*", "gi");
      cleanedFact = cleanedFact.replace(reg, "");
    }
    cleanedFact = cleanedFact.trim();
    if (!cleanedFact) cleanedFact = rawText;

    let category: MemoryItem["category"] = "note";
    if (lower.includes("like") || lower.includes("fav") || lower.includes("pasand") || lower.includes("prefer")) {
      category = "preference";
    } else if (lower.includes("birthday") || lower.includes("janamdin") || lower.includes("date") || lower.includes("anniversary")) {
      category = "date";
    } else if (lower.includes("remind") || lower.includes("kal") || lower.includes("task") || lower.includes("baje") || lower.includes("todo")) {
      category = "reminder";
    }

    saveMemory(cleanedFact, category);
    return true;
  }

  // Check personal info patterns
  for (const item of patterns) {
    const match = rawText.match(item.regex);
    if (match) {
      let cat = item.category;
      if (lower.includes("birthday") || lower.includes("janamdin")) cat = "date";
      saveMemory(rawText, cat);
      return true;
    }
  }

  return false;
}
