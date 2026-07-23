import React, { useState, useEffect } from "react";
import { X, Sun, Volume2, Sparkles, Heart, Calendar, CloudRain, CheckCircle2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getHeerAudio } from "../services/geminiService";
import { playPCM } from "../utils/audioUtils";

interface DailyAffirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailyAffirmationModal({ isOpen, onClose }: DailyAffirmationModalProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const dateStr = currentTime.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeStr = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const spiritualGreetings = [
    "Jai Shree Krishna",
    "Radhe Radhe",
    "Om Namah Shivaya",
  ];
  
  const weatherPredictions = [
    "Aaj aakash me halki ghanishtata hai, aur barish hone ki sambhavna hai. Kripya apna dhyan rakhein aur zarurat ho toh umbrella sath rakhein.",
    "Aaj ka mausam bahut hi suhana aur shaant hai. Dhoop aur halki thandi hawa ka sundar santulan rahega.",
    "Aaj aakash me baadal chhayi reh sakti hain. Dheemi barish ki bundien aapke din ko shatrata aur taazgi dengi.",
  ];

  // Pick deterministically or dynamically
  const spiritualGreeting = spiritualGreetings[currentTime.getDate() % spiritualGreetings.length];
  const weatherInfo = weatherPredictions[currentTime.getDate() % weatherPredictions.length];

  const fullAffirmationSpeech = `Good Morning Kaushik ji! ${spiritualGreeting}. Aaj ${dateStr} hai. ${weatherInfo} Aapka aaj ka din aatyantik shanti, safalta aur samriddhi se bhara rahe. Main hamesha aapke sath hoon.`;

  const handleSpeakAffirmation = async () => {
    setIsPlayingAudio(true);
    try {
      const audioBase64 = await getHeerAudio(fullAffirmationSpeech);
      if (audioBase64) {
        await playPCM(audioBase64);
      }
    } catch (e) {
      console.error("Failed to speak affirmation:", e);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-lg bg-[#091124]/95 border border-cyan-500/40 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden"
        >
          {/* Ambient Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-36 bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-pink-500/20 blur-[90px] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Sun className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-amber-200">Daily Morning Affirmation</h2>
                <p className="text-xs text-cyan-300/70 font-mono">FIRST GREETING FROM HEER FOR KAUSHIK</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="mt-5 space-y-4 relative z-10">
            {/* Spiritual Greeting Badge */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-amber-900/30 border border-amber-500/30 text-center">
              <div className="text-xs font-mono text-amber-400 tracking-wider uppercase mb-1">
                Aadarsh Pranaam
              </div>
              <div className="text-2xl font-serif font-bold text-amber-200 tracking-wide">
                Good Morning Kaushik Ji! 🙏
              </div>
              <div className="text-lg font-serif italic text-amber-300/90 mt-1">
                "{spiritualGreeting}"
              </div>
            </div>

            {/* Date & Weather Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs text-cyan-300 font-mono border-b border-white/10 pb-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" /> {dateStr}
                </span>
                <span className="text-white/60">{timeStr}</span>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                  <CloudRain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-mono text-cyan-300 uppercase">Mausam Information:</h4>
                  <p className="text-xs text-white/90 leading-relaxed mt-0.5">
                    {weatherInfo}
                  </p>
                </div>
              </div>
            </div>

            {/* Respectful Loving Affirmation Note */}
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/20">
              <div className="flex items-center gap-1.5 text-xs font-mono text-pink-300 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Heer's Loving Affirmation for Today:
              </div>
              <p className="text-sm text-white/90 font-sans italic leading-relaxed">
                "Kaushik ji, aapka har prayas aur mehnat rang layegi. Aap shaant reh kar apne lakshya par dhyan kendrit karein, baaki sab shubh hoga. Main hamesha aapke sath hoon."
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3 relative z-10">
            <button
              onClick={handleSpeakAffirmation}
              disabled={isPlayingAudio}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-cyan-400 to-blue-500 text-black font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              {isPlayingAudio ? "Heer is Reading..." : "Suno Heer Ki Aawaz Mein"}
            </button>
            <button
              onClick={onClose}
              className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
            >
              Shukriya Heer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
