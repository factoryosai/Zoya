import React, { useEffect } from "react";
import { Bell, Check, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ScheduledReminder } from "../services/reminderService";

interface AlarmReminderModalProps {
  activeAlarm: ScheduledReminder | null;
  onDismiss: () => void;
}

export function AlarmReminderModal({ activeAlarm, onDismiss }: AlarmReminderModalProps) {
  useEffect(() => {
    if (activeAlarm) {
      // Play alarm chime sound when reminder triggers
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
      } catch (e) {
        // AudioContext fallback
      }
    }
  }, [activeAlarm]);

  if (!activeAlarm) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="w-full max-w-sm bg-[#0c1630] border-2 border-cyan-400 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.4)] overflow-hidden text-white"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-xl animate-bounce">
                <Bell className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm tracking-wide">HEER AI REMINDER ALARM</h3>
                <div className="text-[10px] font-mono text-cyan-100 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {activeAlarm.displayTimeStr}
                </div>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 text-center space-y-4">
            <div className="text-xs text-cyan-300 font-mono uppercase tracking-wider">Kaushik Ji, aapka reminder time ho gaya hai!</div>
            
            <div className="p-4 rounded-xl bg-white/5 border border-cyan-500/30 text-sm font-medium text-amber-200 shadow-inner">
              "{activeAlarm.reminderText}"
            </div>

            <button
              onClick={onDismiss}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Dismiss Reminder
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
