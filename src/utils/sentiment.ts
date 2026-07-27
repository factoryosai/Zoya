import { VisualizerTheme } from "../components/SettingsModal";

export type SentimentCategory = "loving" | "analytical" | "peaceful" | "energetic" | "default";

export interface SentimentAnalysisResult {
  sentiment: SentimentCategory;
  recommendedTheme: "violet" | "cyan" | "emerald" | "amber";
  label: string;
  badgeColor: string;
  description: string;
}

/**
 * Analyzes conversation text (user prompt + AI response) to detect sentiment and return the matching visualizer theme.
 */
export function analyzeConversationSentiment(
  userText: string = "",
  aiText: string = ""
): SentimentAnalysisResult {
  const combined = (userText + " " + aiText).toLowerCase();

  let lovingScore = 0;
  let analyticalScore = 0;
  let peacefulScore = 0;
  let energeticScore = 0;

  // Loving / Affectionate / Warm keywords
  const lovingKeywords = [
    "love", "pyar", "care", "loving", "wife", "sweet", "happy", "smile", "dil", "family", 
    "kaushik", "heer", "pyaar", "pyaari", "grateful", "heart", "hug", "kiss", "miss", "jaan", 
    "babe", "merely", "dearest", "apna", "shukriya", "thanks"
  ];
  lovingKeywords.forEach(kw => {
    if (combined.includes(kw)) lovingScore += 2;
  });

  // Analytical / Executive / Code / Tech keywords
  const analyticalKeywords = [
    "code", "app", "file", "system", "time", "clock", "reminder", "alarm", "schedule", 
    "task", "data", "firebase", "function", "analyze", "browser", "search", "work", "project", 
    "dev", "build", "bug", "status", "api", "query", "script", "setting", "permission"
  ];
  analyticalKeywords.forEach(kw => {
    if (combined.includes(kw)) analyticalScore += 2;
  });

  // Peaceful / Zen / Meditation / Wellness keywords
  const peacefulKeywords = [
    "peace", "calm", "meditate", "zen", "relax", "sleep", "soothe", "breathing", "rest", 
    "quiet", "nature", "shanti", "sukoon", "healing", "wellness", "health", "mindful", "stress"
  ];
  peacefulKeywords.forEach(kw => {
    if (combined.includes(kw)) peacefulScore += 2;
  });

  // Energetic / Playful / Excited keywords
  const energeticKeywords = [
    "excited", "party", "dance", "fun", "music", "song", "play", "joke", "laugh", 
    "yay", "awesome", "great", "celebrate", "magic", "fire", "energy", "speed", "fast", "wow"
  ];
  energeticKeywords.forEach(kw => {
    if (combined.includes(kw)) energeticScore += 2;
  });

  const maxScore = Math.max(lovingScore, analyticalScore, peacefulScore, energeticScore);

  if (maxScore === 0) {
    return {
      sentiment: "default",
      recommendedTheme: "cyan",
      label: "Quantum Balanced",
      badgeColor: "text-cyan-300 bg-cyan-500/20 border-cyan-500/30",
      description: "Default balanced neural state",
    };
  }

  if (lovingScore === maxScore) {
    return {
      sentiment: "loving",
      recommendedTheme: "amber",
      label: "Warm Sunset (Loving & Affectionate)",
      badgeColor: "text-amber-300 bg-amber-500/20 border-amber-500/30",
      description: "Warm glowing orange & amber palette triggered by loving, caring conversation",
    };
  } else if (peacefulScore === maxScore) {
    return {
      sentiment: "peaceful",
      recommendedTheme: "emerald",
      label: "Matrix Emerald (Zen & Peaceful)",
      badgeColor: "text-emerald-300 bg-emerald-500/20 border-emerald-500/30",
      description: "Calm matrix green & cyan palette triggered by peaceful, meditative context",
    };
  } else if (energeticScore === maxScore) {
    return {
      sentiment: "energetic",
      recommendedTheme: "violet",
      label: "Cyber Amethyst (Excited & Energetic)",
      badgeColor: "text-violet-300 bg-violet-500/20 border-violet-500/30",
      description: "Vibrant neon purple & magenta palette triggered by fun, high-energy vibes",
    };
  } else {
    return {
      sentiment: "analytical",
      recommendedTheme: "cyan",
      label: "Quantum Cyan (Focused & Analytical)",
      badgeColor: "text-cyan-300 bg-cyan-500/20 border-cyan-500/30",
      description: "Focused cyan & sky blue palette triggered by technical, task-oriented queries",
    };
  }
}
