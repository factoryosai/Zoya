import React, { useState, useEffect } from "react";
import { Bell, Check, ShieldAlert, Sparkles, Volume2, Mic } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { requestNotificationPermission, getNotificationPermissionState } from "../services/notificationService";
import { triggerHaptic } from "../utils/haptics";

interface PermissionPromptModalProps {
  onPermissionsGranted?: () => void;
}

export function PermissionPromptModal({ onPermissionsGranted }: PermissionPromptModalProps) {
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [hasDismissed, setHasDismissed] = useState(false);
  const [isGranting, setIsGranting] = useState(false);

  useEffect(() => {
    setPermissionState(getNotificationPermissionState());
  }, []);

  if (permissionState === "granted" || hasDismissed) {
    return null;
  }

  const handleGrantPermissions = async () => {
    setIsGranting(true);
    triggerHaptic("button_tap");

    try {
      // 1. Request Native Browser Notification Permission Prompt
      const granted = await requestNotificationPermission();
      
      // 2. Request Microphone Permission if needed
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop stream immediately after permission granted
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (micErr) {
        console.warn("Microphone permission check:", micErr);
      }

      // 3. Unlock Web Audio Context via user gesture
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          if (ctx.state === "suspended") {
            await ctx.resume();
          }
        }
      } catch (audioErr) {
        console.warn("Audio Context unlock:", audioErr);
      }

      const updatedState = getNotificationPermissionState();
      setPermissionState(updatedState);

      if (granted || updatedState === "granted") {
        triggerHaptic("success");
        if (onPermissionsGranted) onPermissionsGranted();
      }
    } catch (err) {
      console.error("Error asking for permissions:", err);
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-[#0d1836]/90 backdrop-blur-xl border border-cyan-400/50 rounded-2xl shadow-[0_10px_35px_rgba(6,182,212,0.3)] p-4 text-white flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 animate-pulse">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-serif font-bold text-cyan-100 flex items-center gap-1.5">
              <span>Allow Heer Permissions</span>
              <Sparkles className="w-3 h-3 text-amber-300" />
            </h4>
            <p className="text-[11px] text-white/70">
              Enable background reminders, alarms & voice audio alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGrantPermissions}
            disabled={isGranting}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
          >
            {isGranting ? (
              <span>Allowing...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Allow Now</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => setHasDismissed(true)}
            className="text-[10px] text-white/40 hover:text-white/70 px-1"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
