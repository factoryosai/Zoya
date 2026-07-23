import React, { useState } from "react";
import { CloudRain, Radio, Waves, Volume2, VolumeX, Sparkles } from "lucide-react";
import { playSoundscape, stopSoundscape, SoundscapeType } from "../utils/soundscapeUtils";

export default function SoundscapeDock() {
  const [activeSound, setActiveSound] = useState<SoundscapeType>("none");
  const [volume, setVolume] = useState(0.25);

  const handleToggle = (type: SoundscapeType) => {
    if (activeSound === type) {
      stopSoundscape();
      setActiveSound("none");
    } else {
      playSoundscape(type, volume);
      setActiveSound(type);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (activeSound !== "none") {
      playSoundscape(activeSound, newVol);
    }
  };

  return (
    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-lg border border-white/10 rounded-full px-3 py-1.5 shadow-xl">
      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1 mr-1">
        <Sparkles className="w-3 h-3 text-amber-300" /> Focus Ambient:
      </span>

      <button
        onClick={() => handleToggle("rain")}
        title="Gentle Falling Rain"
        className={`p-1.5 rounded-full transition-all text-xs flex items-center gap-1 ${
          activeSound === "rain"
            ? "bg-cyan-500/30 text-cyan-300 border border-cyan-400/50"
            : "hover:bg-white/10 text-white/60 hover:text-white"
        }`}
      >
        <CloudRain className="w-3.5 h-3.5" />
        <span className="hidden md:inline text-[11px]">Rain</span>
      </button>

      <button
        onClick={() => handleToggle("space")}
        title="Cosmic Space Drone"
        className={`p-1.5 rounded-full transition-all text-xs flex items-center gap-1 ${
          activeSound === "space"
            ? "bg-purple-500/30 text-purple-300 border border-purple-400/50"
            : "hover:bg-white/10 text-white/60 hover:text-white"
        }`}
      >
        <Radio className="w-3.5 h-3.5" />
        <span className="hidden md:inline text-[11px]">Space</span>
      </button>

      <button
        onClick={() => handleToggle("waves")}
        title="Cyber Ocean Waves"
        className={`p-1.5 rounded-full transition-all text-xs flex items-center gap-1 ${
          activeSound === "waves"
            ? "bg-teal-500/30 text-teal-300 border border-teal-400/50"
            : "hover:bg-white/10 text-white/60 hover:text-white"
        }`}
      >
        <Waves className="w-3.5 h-3.5" />
        <span className="hidden md:inline text-[11px]">Waves</span>
      </button>

      {activeSound !== "none" && (
        <div className="flex items-center gap-1 ml-2 border-l border-white/10 pl-2">
          <button
            onClick={() => handleToggle("none")}
            className="text-red-400 hover:text-red-300 p-1"
            title="Stop Soundscape"
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min="0.05"
            max="0.8"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-12 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      )}
    </div>
  );
}
