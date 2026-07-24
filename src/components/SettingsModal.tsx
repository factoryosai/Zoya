import React, { useState, useEffect } from "react";
import { X, Sliders, Palette, Heart, Shield, Mic, Sun, Moon, CloudSun, Sunset, Smartphone, Camera, Bluetooth, Wifi, Radio, Contact, PhoneCall, Key, CheckCircle2, Bell, Folder } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TimeOfDay } from "./DynamicBackground";

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
  timeOfDayMode: TimeOfDay;
  onTimeOfDayModeChange: (mode: TimeOfDay) => void;
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
  timeOfDayMode,
  onTimeOfDayModeChange,
}: SettingsModalProps) {
  const [mobilePermissions, setMobilePermissions] = useState({
    camera: true,
    bluetooth: true,
    wifi: true,
    hotspot: true,
    contacts: true,
    callDialer: true,
    accessibility: true,
    notifications: true,
    fileManager: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("heer_mobile_permissions");
    if (saved) {
      try {
        setMobilePermissions(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const togglePermission = (key: keyof typeof mobilePermissions) => {
    const updated = { ...mobilePermissions, [key]: !mobilePermissions[key] };
    setMobilePermissions(updated);
    localStorage.setItem("heer_mobile_permissions", JSON.stringify(updated));
  };

  const allowAllPermissions = () => {
    const allAllowed = {
      camera: true,
      bluetooth: true,
      wifi: true,
      hotspot: true,
      contacts: true,
      callDialer: true,
      accessibility: true,
      notifications: true,
      fileManager: true,
    };
    setMobilePermissions(allAllowed);
    localStorage.setItem("heer_mobile_permissions", JSON.stringify(allAllowed));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0b1329]/95 border border-white/15 rounded-2xl p-6 text-white shadow-2xl relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 sticky top-0 bg-[#0b1329]/95 z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-medium">Heer Settings & Controls</h2>
                <p className="text-xs text-white/50 font-mono">MOBILE PERMISSIONS & PREFERENCES</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-5 space-y-6">
            {/* Mobile Control & Permissions Section */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-cyan-950/40 to-slate-900/60 border border-cyan-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    MOBILE AUTOMATION PERMISSIONS
                  </span>
                </div>
                <button
                  onClick={allowAllPermissions}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-semibold flex items-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> ALLOW ALL
                </button>
              </div>

              <p className="text-[11px] text-white/60 mb-4 leading-relaxed">
                Enable these permissions so Heer can execute mobile automation, initiate calls, take photos, toggle hardware connectivity, and interact hands-free.
              </p>

              <div className="space-y-2">
                {[
                  { key: "notifications", label: "System Notifications", desc: "Push alerts & notification listener access", icon: Bell },
                  { key: "fileManager", label: "File Manager Storage", desc: "Full read/write storage access & file management", icon: Folder },
                  { key: "camera", label: "Camera Access", desc: "Live photo capture & vision analysis", icon: Camera },
                  { key: "bluetooth", label: "Bluetooth Control", desc: "Connect audio headsets & smart devices", icon: Bluetooth },
                  { key: "wifi", label: "Wi-Fi Management", desc: "Network diagnostics & auto-connect", icon: Wifi },
                  { key: "hotspot", label: "Mobile Hotspot", desc: "Tethering & portable AP control", icon: Radio },
                  { key: "contacts", label: "Contacts Sync", desc: "Name lookup for hands-free voice calls", icon: Contact },
                  { key: "callDialer", label: "Phone Call Dialer", desc: "Direct voice call execution via tel:", icon: PhoneCall },
                  { key: "accessibility", label: "Accessibility Service", desc: "Full-screen gesture & mobile control", icon: Key },
                ].map((perm) => {
                  const Icon = perm.icon;
                  const isAllowed = mobilePermissions[perm.key as keyof typeof mobilePermissions];
                  return (
                    <div
                      key={perm.key}
                      onClick={() => togglePermission(perm.key as keyof typeof mobilePermissions)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isAllowed
                          ? "bg-cyan-500/10 border-cyan-500/40 text-white"
                          : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isAllowed ? "bg-cyan-400/20 text-cyan-300" : "bg-white/10 text-white/40"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{perm.label}</div>
                          <div className="text-[10px] text-white/50">{perm.desc}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                        isAllowed ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/10 text-white/40"
                      }`}>
                        {isAllowed ? "ALLOWED" : "OFF"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

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
                <span>Low</span>
                <span>Balanced (50%)</span>
                <span>High</span>
              </div>
            </div>

            {/* Dynamic Time-of-Day Atmosphere */}
            <div>
              <label className="text-xs font-mono text-cyan-300 flex items-center gap-1.5 mb-3">
                <Sun className="w-3.5 h-3.5 text-amber-300" /> Time of Day Atmosphere Glow:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "auto", label: "Auto Clock Synced", icon: CloudSun },
                  { id: "morning", label: "Sunrise Golden", icon: Sun },
                  { id: "afternoon", label: "Midday Sky", icon: CloudSun },
                  { id: "evening", label: "Twilight Dusk", icon: Sunset },
                  { id: "night", label: "Deep Space Night", icon: Moon },
                ].map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => onTimeOfDayModeChange(mode.id as TimeOfDay)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium transition-all ${
                        timeOfDayMode === mode.id
                          ? "border-cyan-400 bg-white/10 text-white shadow-lg"
                          : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                      <span className="truncate">{mode.label}</span>
                    </button>
                  );
                })}
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
                Heer is configured with full mobile permissions and system automation capabilities.
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-semibold text-xs hover:bg-cyan-400 transition-colors"
            >
              Save & Apply
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

