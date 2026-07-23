import { useState } from "react";
import { motion } from "motion/react";
import { Maximize2, Minimize2, Volume2, Sparkles, Mic } from "lucide-react";
import { VisualizerTheme } from "./SettingsModal";
import heerAvatar from "../assets/images/heer_avatar_1784816886423.jpg";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

interface VisualizerProps {
  state: VisualizerState;
  colorTheme?: VisualizerTheme;
}

export default function Visualizer({ state, colorTheme = "violet" }: VisualizerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRingAnimation = (index: number, reverse: boolean = false) => {
    const baseSpeed = state === "listening" ? 3 : state === "processing" ? 1.5 : state === "speaking" ? 2 : 15;
    return {
      rotate: reverse ? [-360, 0] : [0, 360],
      transition: { duration: baseSpeed + index * 2, repeat: Infinity, ease: "linear" }
    };
  };

  const getAvatarPulse = () => {
    if (state === "speaking") {
      return {
        scale: [1, 1.04, 0.99, 1.03, 1],
        y: [0, -2, 1, -1, 0],
        transition: { duration: 0.45, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "listening") {
      return {
        scale: [1, 1.02, 1],
        y: [0, -1, 0],
        transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "processing") {
      return {
        scale: [0.99, 1.01, 0.99],
        transition: { duration: 0.8, repeat: Infinity, ease: "linear" }
      };
    }
    return {
      scale: [1, 1.015, 1],
      y: [0, -1.5, 0],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    };
  };

  const getTheme = () => {
    if (colorTheme === "cyan") {
      switch (state) {
        case "listening": return { color: "rgba(6, 182, 212, 1)", glow: "shadow-cyan-500/80", border: "border-cyan-400", hex: "#06b6d4" };
        case "processing": return { color: "rgba(59, 130, 246, 1)", glow: "shadow-blue-500/80", border: "border-blue-400", hex: "#3b82f6" };
        case "speaking": return { color: "rgba(14, 165, 233, 1)", glow: "shadow-sky-400/80", border: "border-sky-300", hex: "#0ea5e9" };
        default: return { color: "rgba(6, 182, 212, 0.8)", glow: "shadow-cyan-500/40", border: "border-cyan-500/50", hex: "#06b6d4" };
      }
    } else if (colorTheme === "emerald") {
      switch (state) {
        case "listening": return { color: "rgba(16, 185, 129, 1)", glow: "shadow-emerald-500/80", border: "border-emerald-400", hex: "#10b981" };
        case "processing": return { color: "rgba(20, 184, 166, 1)", glow: "shadow-teal-500/80", border: "border-teal-400", hex: "#14b8a6" };
        case "speaking": return { color: "rgba(52, 211, 153, 1)", glow: "shadow-emerald-400/80", border: "border-emerald-300", hex: "#34d399" };
        default: return { color: "rgba(16, 185, 129, 0.8)", glow: "shadow-emerald-500/40", border: "border-emerald-500/50", hex: "#10b981" };
      }
    } else if (colorTheme === "amber") {
      switch (state) {
        case "listening": return { color: "rgba(245, 158, 11, 1)", glow: "shadow-amber-500/80", border: "border-amber-400", hex: "#f59e0b" };
        case "processing": return { color: "rgba(249, 115, 22, 1)", glow: "shadow-orange-500/80", border: "border-orange-400", hex: "#f97316" };
        case "speaking": return { color: "rgba(251, 191, 36, 1)", glow: "shadow-amber-300/80", border: "border-amber-300", hex: "#fbbf24" };
        default: return { color: "rgba(245, 158, 11, 0.8)", glow: "shadow-amber-500/40", border: "border-amber-500/50", hex: "#f59e0b" };
      }
    } else {
      // Default: Violet / Pink
      switch (state) {
        case "listening": return { color: "rgba(139, 92, 246, 1)", glow: "shadow-violet-500/60", border: "border-violet-400", hex: "#8b5cf6" };
        case "processing": return { color: "rgba(56, 189, 248, 1)", glow: "shadow-sky-400/80", border: "border-sky-400", hex: "#38bdf8" };
        case "speaking": return { color: "rgba(236, 72, 153, 1)", glow: "shadow-pink-500/80", border: "border-pink-400", hex: "#ec4899" };
        default: return { color: "rgba(168, 85, 247, 0.8)", glow: "shadow-purple-500/40", border: "border-purple-500/50", hex: "#a855f7" };
      }
    }
  };

  const theme = getTheme();

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Ambient Outer Aura Glow */}
      <motion.div
        animate={getAvatarPulse()}
        className={`absolute rounded-full blur-[90px] transition-all duration-500 ${
          isExpanded ? "w-[480px] h-[480px] md:w-[600px] md:h-[600px]" : "w-[280px] h-[280px] md:w-[380px] md:h-[380px]"
        } ${theme.glow}`}
        style={{ backgroundColor: theme.color, opacity: state === "speaking" ? 0.4 : 0.2 }}
      />

      {/* Ring 1: Outer Dashed HUD */}
      <motion.div
        animate={getRingAnimation(4, false)}
        className={`absolute rounded-full border-[1px] border-dashed transition-all duration-500 ${theme.border} opacity-20 ${
          isExpanded ? "w-[500px] h-[500px] md:w-[680px] md:h-[680px]" : "w-[360px] h-[360px] md:w-[500px] md:h-[500px]"
        }`}
      />

      {/* Ring 2: Segmented Dotted Ring */}
      <motion.div
        animate={getRingAnimation(3, true)}
        className={`absolute rounded-full border-[2px] border-dotted transition-all duration-500 ${theme.border} opacity-30 ${
          isExpanded ? "w-[440px] h-[440px] md:w-[600px] md:h-[600px]" : "w-[310px] h-[310px] md:w-[440px] md:h-[440px]"
        }`}
      />

      {/* Ring 3: Scanner Ring */}
      <motion.div
        animate={getRingAnimation(2, false)}
        className={`absolute rounded-full border-[1px] transition-all duration-500 ${theme.border} border-t-transparent border-b-transparent opacity-40 ${
          isExpanded ? "w-[380px] h-[380px] md:w-[520px] md:h-[520px]" : "w-[270px] h-[270px] md:w-[380px] md:h-[380px]"
        }`}
      />

      {/* Ring 4: 360 Audio Wave Emitters when Speaking */}
      {state === "speaking" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3].map((pulseIndex) => (
            <motion.div
              key={pulseIndex}
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: [0.9, 1.4 + pulseIndex * 0.2], opacity: [0.6, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: pulseIndex * 0.4,
                ease: "easeOut"
              }}
              className={`absolute rounded-full border border-pink-400/50 ${
                isExpanded ? "w-[340px] h-[340px] md:w-[460px] md:h-[460px]" : "w-[220px] h-[220px] md:w-[300px] md:h-[300px]"
              }`}
            />
          ))}
        </div>
      )}

      {/* Central Heer Live Talking Avatar Frame */}
      <motion.div
        animate={getAvatarPulse()}
        className={`relative z-10 rounded-full p-1 bg-gradient-to-tr from-cyan-500 via-violet-500 to-pink-500 shadow-2xl flex items-center justify-center pointer-events-auto transition-all duration-500 ${
          isExpanded ? "w-[300px] h-[300px] md:w-[420px] md:h-[420px]" : "w-[200px] h-[200px] md:w-[280px] md:h-[280px]"
        }`}
        style={{
          boxShadow: `0 0 50px ${theme.color}, inset 0 0 20px ${theme.color}`
        }}
      >
        <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-950 border-2 border-white/20 group">
          {/* Avatar Image with Lip-Sync Movement */}
          <motion.img
            src={heerAvatar}
            alt="Heer AI Avatar"
            animate={
              state === "speaking"
                ? {
                    scale: [1, 1.03, 1.01, 1.04, 1],
                    y: [0, -2, 1, -1, 0],
                    filter: [
                      "brightness(1) contrast(1.05)",
                      "brightness(1.08) contrast(1.08)",
                      "brightness(1) contrast(1.05)"
                    ]
                  }
                : { scale: 1, y: 0 }
            }
            transition={
              state === "speaking"
                ? { duration: 0.35, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.5 }
            }
            className="w-full h-full object-cover object-top filter contrast-[1.05] brightness-[1.02]"
          />

          {/* Lip-Sync Talking Wave Overlay at mouth position */}
          {state === "speaking" && (
            <motion.div
              animate={{
                scaleY: [0.6, 1.3, 0.8, 1.4, 0.7],
                opacity: [0.3, 0.7, 0.4, 0.8, 0.3]
              }}
              transition={{ duration: 0.25, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-3 rounded-full bg-pink-400/30 blur-sm pointer-events-none"
            />
          )}

          {/* Eye Blink Simulation Overlay */}
          <motion.div
            animate={{ opacity: [0, 0, 0.85, 0, 0] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.94, 0.96, 0.98, 1] }}
            className="absolute top-[34%] left-1/2 -translate-x-1/2 w-[65%] h-3 bg-[#1e2338]/90 blur-[1px] pointer-events-none"
          />

          {/* Hologram Scanning Beam when Thinking */}
          {state === "processing" && (
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/35 to-transparent pointer-events-none"
            />
          )}

          {/* Bottom Live Audio Waveform when Speaking */}
          {state === "speaking" && (
            <div className="absolute bottom-0 left-0 w-full h-14 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end justify-center gap-1.5 pb-2 px-6">
              {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.85, 0.3, 0.75, 0.55].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: ["8px", `${Math.random() * 32 + 10}px`, "8px"]
                  }}
                  transition={{
                    duration: 0.22 + (i % 4) * 0.04,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="w-1.5 rounded-full shadow-lg shadow-pink-500/50"
                  style={{ backgroundColor: theme.hex }}
                />
              ))}
            </div>
          )}

          {/* Full-Screen Avatar Expand/Contract Hover Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/20"
            title={isExpanded ? "Collapse View" : "Expand Live Avatar View"}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>

        {/* Live Speaking / Listening Status Indicator Chip */}
        <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-slate-900/95 border border-cyan-500/40 text-[10px] font-mono tracking-wider text-cyan-300 flex items-center gap-1.5 shadow-2xl backdrop-blur-md whitespace-nowrap z-20">
          <span className={`w-2 h-2 rounded-full ${
            state === "speaking" ? "bg-pink-400 animate-ping" : state === "listening" ? "bg-cyan-400 animate-pulse" : "bg-emerald-400"
          }`} />
          {state === "speaking" ? (
            <span className="flex items-center gap-1 font-semibold text-pink-300">
              <Volume2 className="w-3 h-3 text-pink-400 animate-bounce" /> HEER TALKING...
            </span>
          ) : state === "listening" ? (
            <span className="flex items-center gap-1 font-semibold text-cyan-300">
              <Mic className="w-3 h-3 text-cyan-400 animate-pulse" /> LISTENING...
            </span>
          ) : state === "processing" ? (
            <span className="flex items-center gap-1 font-semibold text-blue-300">
              <Sparkles className="w-3 h-3 text-blue-400 animate-spin" /> SYNTHESIZING...
            </span>
          ) : (
            <span>HEER LIVE AVATAR</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}


