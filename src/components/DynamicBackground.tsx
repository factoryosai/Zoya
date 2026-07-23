import { useState, useEffect } from "react";
import { motion } from "motion/react";

export type TimeOfDay = "auto" | "morning" | "afternoon" | "evening" | "night";

interface DynamicBackgroundProps {
  timeOfDayMode?: TimeOfDay;
}

export function getTimeOfDayLabel(mode: TimeOfDay): { label: string; icon: string; colors: string[] } {
  let effective = mode;
  if (mode === "auto") {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) effective = "morning";
    else if (hour >= 12 && hour < 17) effective = "afternoon";
    else if (hour >= 17 && hour < 21) effective = "evening";
    else effective = "night";
  }

  switch (effective) {
    case "morning":
      return {
        label: "Sunrise Golden Hour",
        icon: "🌅",
        colors: ["from-amber-500/25 via-rose-500/20 to-orange-600/15", "from-yellow-600/20 to-pink-600/20"]
      };
    case "afternoon":
      return {
        label: "Midday Solar Cyan",
        icon: "☀️",
        colors: ["from-cyan-500/25 via-sky-500/20 to-blue-600/15", "from-teal-500/20 to-indigo-600/20"]
      };
    case "evening":
      return {
        label: "Twilight Magenta Dusk",
        icon: "🌆",
        colors: ["from-violet-600/25 via-pink-600/20 to-purple-800/15", "from-fuchsia-600/20 to-indigo-700/20"]
      };
    case "night":
    default:
      return {
        label: "Deep Space Midnight",
        icon: "🌙",
        colors: ["from-cyan-900/25 via-indigo-900/20 to-purple-950/20", "from-blue-900/20 to-slate-900/30"]
      };
  }
}

export default function DynamicBackground({ timeOfDayMode = "auto" }: DynamicBackgroundProps) {
  const [currentPeriod, setCurrentPeriod] = useState<string>("night");

  useEffect(() => {
    const updatePeriod = () => {
      let mode = timeOfDayMode;
      if (mode === "auto") {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) mode = "morning";
        else if (hour >= 12 && hour < 17) mode = "afternoon";
        else if (hour >= 17 && hour < 21) mode = "evening";
        else mode = "night";
      }
      setCurrentPeriod(mode);
    };

    updatePeriod();
    const interval = setInterval(updatePeriod, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [timeOfDayMode]);

  const config = getTimeOfDayLabel(currentPeriod as TimeOfDay);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* Top Left Floating Ambient Orb */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -25, 20, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] bg-gradient-to-br ${config.colors[0]} transition-all duration-1000`}
      />

      {/* Bottom Right Floating Ambient Orb */}
      <motion.div
        animate={{
          x: [0, -40, 25, 0],
          y: [0, 30, -25, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] bg-gradient-to-tl ${config.colors[1]} transition-all duration-1000`}
      />

      {/* Center Subtle Aurora Pulse */}
      <motion.div
        animate={{
          opacity: [0.15, 0.3, 0.15],
          scale: [0.95, 1.05, 0.95]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vh] rounded-full blur-[160px] bg-cyan-500/10 pointer-events-none"
      />
    </div>
  );
}
