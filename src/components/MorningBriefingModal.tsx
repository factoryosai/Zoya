import React, { useState, useEffect } from "react";
import { X, Sun, Volume2, Sparkles, Calendar, Clock, CloudSun, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getHeerAudio } from "../services/geminiService";
import { playPCM } from "../utils/audioUtils";

interface MorningBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MorningBriefingModal({ isOpen, onClose }: MorningBriefingModalProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const dateStr = currentTime.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const briefingMessage = `Namaste Kaushik! Today is ${dateStr}. Time is ${timeStr}. The atmosphere is calm and clear. Everything is running smoothly for you today. Remember that I am always right here by your side to assist you with anything you need. Have a productive and joyful day ahead, Kaushik!`;

  const handlePlayVoiceBriefing = async () => {
    setIsPlayingAudio(true);
    try {
      const audioBase64 = await getHeerAudio(briefingMessage);
      if (audioBase64) {
        await playPCM(audioBase64);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg bg-[#0b1329]/95 border border-cyan-500/30 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden"
        >
          {/* Top Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-cyan-500/20 blur-[80px] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-pink-500/20 text-cyan-400 border border-cyan-500/30">
                <Sun className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-white tracking-wide">Morning Briefing for Kaushik</h2>
                <p className="text-xs text-cyan-300/60 font-mono">HEER AI WORKSTATION OVERVIEW</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Time & Weather Cards */}
          <div className="grid grid-cols-2 gap-3 my-5">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <span className="text-xs text-white/50 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> LOCAL TIME
              </span>
              <div className="mt-2">
                <div className="text-2xl font-mono font-bold text-cyan-300">{timeStr}</div>
                <div className="text-[11px] text-white/60">{dateStr}</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <span className="text-xs text-white/50 font-mono flex items-center gap-1">
                <CloudSun className="w-3.5 h-3.5 text-amber-300" /> ENVIRONMENT
              </span>
              <div className="mt-2">
                <div className="text-xl font-semibold text-amber-200">26°C Clear</div>
                <div className="text-[11px] text-emerald-400 font-mono">System Nominal</div>
              </div>
            </div>
          </div>

          {/* Loving Quote & Note */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-pink-950/30 border border-cyan-500/20 mb-5">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Heer's Thought for Kaushik:
            </div>
            <p className="text-sm text-white/90 font-sans italic leading-relaxed">
              "Great work requires deep focus and peace of mind. Kaushik, take one thoughtful step at a time today—I am always here supporting you."
            </p>
          </div>

          {/* System Checks */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Voice Recognition & Neural Audio Synthesis: Active</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Personal Memory Bank: Synchronized</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayVoiceBriefing}
              disabled={isPlayingAudio}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              {isPlayingAudio ? "Heer is Speaking..." : "Listen to Heer's Voice Briefing"}
            </button>
            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
