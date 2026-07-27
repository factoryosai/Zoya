// Utility for Free Web Speech API & Custom Voice Tuning

export interface FreeVoiceSettings {
  engine: "gemini" | "webspeech"; // "gemini" = Gemini AI Free Voice, "webspeech" = Free Browser Device Voice
  geminiVoice: "Kore" | "Puck" | "Charon" | "Fenrir" | "Aoede";
  webVoiceURI: string;
  pitch: number; // 0.5 to 1.5
  rate: number;  // 0.8 to 1.3
  customGreetingAudioUrl?: string; // Stored recorded voice clip
}

export function getStoredVoiceSettings(): FreeVoiceSettings {
  try {
    const saved = localStorage.getItem("heer_voice_settings");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}

  return {
    engine: "gemini",
    geminiVoice: "Kore",
    webVoiceURI: "",
    pitch: 1.1, // ligeramente higher pitch for warm female voice
    rate: 1.0,
  };
}

export function saveVoiceSettings(settings: FreeVoiceSettings): void {
  try {
    localStorage.setItem("heer_voice_settings", JSON.stringify(settings));
  } catch (e) {}
}

export function getAvailableBrowserVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Speaks text using the free built-in browser Web Speech API with custom pitch and speed.
 */
export function speakWithBrowserVoice(
  text: string,
  settings: FreeVoiceSettings,
  onEnd?: () => void
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  const synth = window.speechSynthesis;
  synth.cancel(); // Stop current speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = settings.pitch || 1.1;
  utterance.rate = settings.rate || 1.0;

  const voices = synth.getVoices();
  if (settings.webVoiceURI) {
    const matchedVoice = voices.find((v) => v.voiceURI === settings.webVoiceURI);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
  } else {
    // Default to Hindi or English Female voice if available
    const hindiVoice = voices.find(
      (v) => (v.lang.includes("hi") || v.lang.includes("IN")) && v.name.toLowerCase().includes("female")
    ) || voices.find((v) => v.lang.includes("hi") || v.lang.includes("IN"));

    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  synth.speak(utterance);
  return true;
}
