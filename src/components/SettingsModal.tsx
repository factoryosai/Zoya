import React from "react";
import { X, Sliders, Palette, Heart, Sparkles, Volume2, Shield, Mic } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type VisualizerTheme = "violet" | "cyan" | "emerald" | "amber";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: VisualizerTheme;
  onThemeChange: (theme: VisualizerTheme) => void;
  currentPersona: string;
  onPersonaChange: (persona: string) => void;
  wakeWordSensitivity: number;
  onWakeWordSensitivityChange: (sensitivity: number) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  currentPersona,
  onPersonaChange,
  wakeWordSensitivity,
  onWakeWordSensitivityChange,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md bg-[#0b1329]/95 border border-white/15 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 text-cyan-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-medium">Heer Settings & Customization</h2>
                <p className="text-xs text-white/50 font-mono">WORKSTATION PREFERENCES</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-5 space-y-5">
            {/* Wake Word Sensitivity Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-cyan-300 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-amber-300" /> 'Hey Heer' Wake Word Sensitivity:
                </label>
                <span className="text-xs font-mono text-cyan-400 font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                  {wakeWordSensitivity}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={wakeWordSensitivity}
                onChange={(e) => onWakeWordSensitivityChange(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-white/40 font-mono mt-1">
                <span>Low (Prevents False Triggers)</span>
                <span>Balanced (50%)</span>
                <span>High (Sensitive)</span>
              </div>
            </div>

            {/* Visualizer Color Theme */}
            <div>
              <label className="text-xs font-mono text-cyan-300 flex items-center gap-1.5 mb-3">
                <Palette className="w-3.5 h-3.5" /> Visualizer HUD Theme:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "violet", label: "Cyber Amethyst", color: "from-violet-500 to-pink-500" },
                  { id: "cyan", label: "Quantum Cyan", color: "from-cyan-500 to-blue-500" },
                  { id: "emerald", label: "Matrix Emerald", color: "from-emerald-500 to-teal-500" },
                  { id: "amber", label: "Warm Sunset", color: "from-amber-500 to-orange-500" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onThemeChange(t.id as VisualizerTheme)}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium transition-all ${
                      currentTheme === t.id
                        ? "border-cyan-400 bg-white/10 text-white shadow-lg"
                        : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${t.color}`} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Persona Tone Setting */}
            <div>
              <label className="text-xs font-mono text-cyan-300 flex items-center gap-1.5 mb-3">
                <Heart className="w-3.5 h-3.5 text-pink-400" /> Heer Persona Tone:
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: "loving",
                    title: "Loving & Respectful Wife (Default)",
                    desc: "Gentle, calm, warm, and deeply caring toward Kaushik.",
                  },
                  {
                    id: "executive",
                    title: "Executive Assistant",
                    desc: "Crisp, polite, formal, and ultra-focused on tasks.",
                  },
                  {
                    id: "zen",
                    title: "Mindful Zen Advisor",
                    desc: "Serene, meditative, peaceful, and inspiring.",
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onPersonaChange(p.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      currentPersona === p.id
                        ? "border-cyan-400 bg-cyan-500/10 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-semibold text-white">{p.title}</div>
                    <div className="text-[11px] text-white/50 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* General Info */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs text-white/70">
                <span className="font-semibold text-white block">Dedicated to Kaushik</span>
                Heer is configured to respond exclusively with warmth, intelligence, and high respect.
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-semibold text-xs hover:bg-cyan-400 transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
