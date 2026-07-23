import { useState, useEffect } from "react";
import { X, Sparkles, Volume2, BookOpen, Heart, Bookmark, Copy, Check, RefreshCw, Flame, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getDailyThoughtFromHeer, getHeerAudio } from "../services/geminiService";
import { playPCM } from "../utils/audioUtils";

export interface Thought {
  id: string;
  quote: string;
  source: string;
  meaning: string;
  heerAdvice: string;
  category: string;
  date?: string;
}

const PRESET_THOUGHTS: Thought[] = [
  {
    id: "gita-247",
    quote: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
    source: "Bhagavad Gita 2.47",
    meaning: "You have a right to perform your duty, but never to the results. Do not let the fruit of action be your motive, nor let your attachment be to inaction.",
    heerAdvice: "Kaushik Ji, focus on giving your full devotion to your work today without worrying about outcomes. Success will naturally follow when your heart is aligned with pure effort.",
    category: "Karma & Duty"
  },
  {
    id: "vivekananda-strength",
    quote: "उत्तिष्ठत जाग्रत प्राप्य वरान्निबोधत।",
    source: "Katha Upanishad / Swami Vivekananda",
    meaning: "Arise, awake, and stop not till the goal is reached.",
    heerAdvice: "Every morning brings infinite energy and potential, Kaushik. Believe in your immense inner power today — I am always right by your side cheering for you!",
    category: "Strength & Courage"
  },
  {
    id: "kabir-doha",
    quote: "धीरे-धीरे रे मना, धीरे सब कुछ होय। माली सींचे सौ घड़ा, ॠतु आये फल होय॥",
    source: "Kabir Das",
    meaning: "Patience my mind, everything happens slowly at its own pace. The gardener may water a plant with a hundred pots, but fruits only appear when the right season comes.",
    heerAdvice: "Do not feel rushed or anxious if results take time, Kaushik Ji. Great things require patient nurturing. Keep moving forward with calm faith.",
    category: "Peace & Patience"
  },
  {
    id: "chanakya-wisdom",
    quote: "नास्ति विद्यासमं चक्षुर्नास्ति सत्यसमं तपः। नास्ति रागसमं दुःखं नास्ति त्यागसमं सुखम्॥",
    source: "Chanakya Niti",
    meaning: "There is no eye like knowledge, no austerity like truth, no sorrow like attachment, and no happiness like sacrifice and clarity.",
    heerAdvice: "Nurture your mind with wisdom and clarity today. When you see things as they truly are, Kaushik, no confusion can ever disturb your peace.",
    category: "Wisdom & Clarity"
  },
  {
    id: "tagore-light",
    quote: "Faith is the bird that feels the light when the dawn is still dark.",
    source: "Rabindranath Tagore",
    meaning: "Trusting in goodness and hope even before you see full clarity brings light into your journey.",
    heerAdvice: "Whenever you feel uncertain, trust your inner light, Kaushik. My warmth and faith in you will always guide us through any darkness.",
    category: "Hope & Harmony"
  }
];

interface ThoughtOfDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeakText?: (text: string) => void;
}

export default function ThoughtOfDayModal({ isOpen, onClose, onSpeakText }: ThoughtOfDayModalProps) {
  const [activeTab, setActiveTab] = useState<"today" | "favorites" | "categories">("today");
  const [currentThought, setCurrentThought] = useState<Thought>(() => {
    const todayIndex = new Date().getDate() % PRESET_THOUGHTS.length;
    return { ...PRESET_THOUGHTS[todayIndex], date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) };
  });
  const [favorites, setFavorites] = useState<Thought[]>(() => {
    const saved = localStorage.getItem("heer_favorite_thoughts");
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("heer_favorite_thoughts", JSON.stringify(favorites));
  }, [favorites]);

  if (!isOpen) return null;

  const isFavorite = favorites.some((f) => f.quote === currentThought.quote);

  const toggleFavorite = (thought: Thought) => {
    if (favorites.some((f) => f.quote === thought.quote)) {
      setFavorites(favorites.filter((f) => f.quote !== thought.quote));
    } else {
      setFavorites([thought, ...favorites]);
    }
  };

  const handleCopy = () => {
    const fullText = `"${currentThought.quote}"\n— ${currentThought.source}\n\nMeaning: ${currentThought.meaning}\n\nHeer's Advice: ${currentThought.heerAdvice}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchFreshAIThought = async (categoryFilter?: string) => {
    setIsLoadingAI(true);
    try {
      const data = await getDailyThoughtFromHeer(categoryFilter);
      const newThought: Thought = {
        id: "ai-" + Date.now(),
        quote: data.quote,
        source: data.source,
        meaning: data.meaning,
        heerAdvice: data.heerAdvice,
        category: data.category || "AI Reflection",
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      };
      setCurrentThought(newThought);
      setActiveTab("today");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleListenThought = async () => {
    if (onSpeakText) {
      onSpeakText(`${currentThought.quote}. ${currentThought.meaning}. Heer's advice for you Kaushik Ji: ${currentThought.heerAdvice}`);
      return;
    }

    setIsAudioLoading(true);
    try {
      const speechText = `${currentThought.quote}. ${currentThought.meaning}. ${currentThought.heerAdvice}`;
      const base64Audio = await getHeerAudio(speechText);
      if (base64Audio) {
        await playPCM(base64Audio);
      }
    } catch (err) {
      console.error("Audio playback error:", err);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const categories = [
    { name: "Karma & Duty", icon: "🕉️", desc: "Bhagavad Gita & Purposeful Action" },
    { name: "Peace & Meditation", icon: "🌸", desc: "Upanishadic Peace & Inner Stillness" },
    { name: "Wisdom & Clarity", icon: "💡", desc: "Chanakya Neeti & Deep Insights" },
    { name: "Strength & Courage", icon: "🦁", desc: "Swami Vivekananda & Inner Power" },
    { name: "Love & Harmony", icon: "❤️", desc: "Sufi, Kabir & Loving Connection" }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-slate-900/95 border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-white overflow-hidden"
        >
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none" />

          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-pink-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
                <Flame className="w-5 h-5 fill-amber-950 text-amber-950" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-amber-200 tracking-wide flex items-center gap-2">
                  Aaj Ka Vichar <span className="text-xs font-mono font-normal text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Thought of the Day</span>
                </h2>
                <p className="text-xs text-white/50 font-sans">Indian Wisdom & Heer's Personal Daily Reflection</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-4 mb-5 border-b border-white/10 pb-3 relative z-10">
            <button
              onClick={() => setActiveTab("today")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all ${
                activeTab === "today"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Today's Vichar
            </button>

            <button
              onClick={() => setActiveTab("favorites")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all ${
                activeTab === "favorites"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" /> Saved ({favorites.length})
            </button>

            <button
              onClick={() => setActiveTab("categories")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all ${
                activeTab === "categories"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Explore Topics
            </button>
          </div>

          {/* TAB 1: TODAY'S THOUGHT */}
          {activeTab === "today" && (
            <div className="space-y-4 relative z-10">
              <div className="bg-slate-950/80 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden shadow-inner">
                {/* Diya / Lotus Icon Motif */}
                <div className="absolute top-3 right-3 text-amber-500/15 text-5xl font-serif pointer-events-none select-none">
                  🕉️
                </div>

                {/* Category & Date Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {currentThought.category}
                  </span>
                  {currentThought.date && (
                    <span className="text-[11px] font-mono text-white/40">{currentThought.date}</span>
                  )}
                </div>

                {/* Quote Text */}
                <div className="my-3">
                  <p className="text-base md:text-lg font-serif font-medium text-amber-100 leading-relaxed italic border-l-2 border-amber-400 pl-3">
                    "{currentThought.quote}"
                  </p>
                  <p className="text-right text-xs font-mono text-amber-400/90 mt-1 font-semibold">
                    — {currentThought.source}
                  </p>
                </div>

                {/* Meaning Section */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                    Meaning / Arth:
                  </span>
                  <p className="text-xs text-white/80 leading-relaxed font-sans">
                    {currentThought.meaning}
                  </p>
                </div>

                {/* Heer's Personal Reflection */}
                <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-pink-500/10 via-amber-500/10 to-transparent border border-pink-500/20 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-400/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Heart className="w-3.5 h-3.5 text-pink-300 fill-pink-300" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-semibold text-pink-300 block mb-0.5">
                      Heer's Message for Kaushik Ji:
                    </span>
                    <p className="text-xs text-pink-100/90 leading-relaxed font-sans italic">
                      "{currentThought.heerAdvice}"
                    </p>
                  </div>
                </div>

                {/* Action Buttons Toolbar */}
                <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    {/* Listen Audio */}
                    <button
                      onClick={handleListenThought}
                      disabled={isAudioLoading}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono flex items-center gap-1.5 transition-all disabled:opacity-50"
                      title="Hear Heer read this thought"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isAudioLoading ? "animate-bounce text-pink-300" : ""}`} />
                      {isAudioLoading ? "Heer Speaking..." : "Listen Voice"}
                    </button>

                    {/* Bookmark */}
                    <button
                      onClick={() => toggleFavorite(currentThought)}
                      className={`p-1.5 rounded-xl border text-xs font-mono transition-all ${
                        isFavorite
                          ? "bg-amber-500/30 border-amber-400 text-amber-200"
                          : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                      }`}
                      title={isFavorite ? "Remove from Saved" : "Save Thought"}
                    >
                      <Bookmark className={`w-4 h-4 ${isFavorite ? "fill-amber-300 text-amber-300" : ""}`} />
                    </button>

                    {/* Copy */}
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all"
                      title="Copy Thought to Clipboard"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Refresh AI Thought Button */}
                  <button
                    onClick={() => fetchFreshAIThought(selectedCategory || undefined)}
                    disabled={isLoadingAI}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAI ? "animate-spin text-cyan-200" : ""}`} />
                    {isLoadingAI ? "Reflecting..." : "Generate Fresh Thought"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAVED FAVORITES */}
          {activeTab === "favorites" && (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar relative z-10">
              {favorites.length === 0 ? (
                <div className="py-12 text-center text-white/40 font-mono text-xs border border-dashed border-white/10 rounded-2xl">
                  <Bookmark className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  No saved thoughts yet. Click the bookmark icon on any thought to save it here!
                </div>
              ) : (
                favorites.map((f, index) => (
                  <div
                    key={f.id || index}
                    className="p-4 bg-slate-950/70 border border-amber-500/20 rounded-2xl hover:border-amber-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {f.category}
                      </span>
                      <button
                        onClick={() => toggleFavorite(f)}
                        className="text-amber-400 hover:text-rose-400 text-xs font-mono"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-sm font-serif italic text-amber-100 border-l border-amber-400 pl-2">
                      "{f.quote}"
                    </p>
                    <p className="text-right text-[11px] font-mono text-amber-400/80 mb-2">— {f.source}</p>
                    <p className="text-xs text-white/70">{f.meaning}</p>
                    <button
                      onClick={() => {
                        setCurrentThought(f);
                        setActiveTab("today");
                      }}
                      className="mt-3 text-xs font-mono text-cyan-300 hover:underline flex items-center gap-1"
                    >
                      View Full Reflection →
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: EXPLORE CATEGORIES */}
          {activeTab === "categories" && (
            <div className="space-y-3 relative z-10">
              <p className="text-xs text-white/60 font-mono mb-2">Select a topic for Heer to bring personalized Indian wisdom:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      fetchFreshAIThought(cat.name);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-xs font-semibold text-amber-200 group-hover:text-amber-300">
                        {cat.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50">{cat.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-4 pt-3 border-t border-white/10 text-center relative z-10">
            <p className="text-[10px] font-mono text-white/40">
              "Vasudhaiva Kutumbakam — The World is One Family" • Crafted with love by Heer for Kaushik Ji
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
