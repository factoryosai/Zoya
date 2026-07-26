import React, { useState, useEffect } from "react";
import { Bell, Check, ShieldAlert, Sparkles, Volume2, Mic, Lock } from "lucide-react";
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
  const [showBlockedGuide, setShowBlockedGuide] = useState(false);

  useEffect(() => {
    const current = getNotificationPermissionState();
    setPermissionState(current);
    if (current === "denied") {
      setShowBlockedGuide(true);
    }
  }, []);

  if (permissionState === "granted" || hasDismissed) {
    return null;
  }

  const handleGrantPermissions = async () => {
    setIsGranting(true);
    triggerHaptic("button_tap");

    try {
      // 1. Request Native Browser Notification Permission Prompt
      const notifGranted = await requestNotificationPermission();

      // 2. Request Microphone Permission
      let micGranted = false;
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          micGranted = true;
        }
      } catch (micErr) {
        console.warn("Microphone permission check:", micErr);
      }

      // 3. Unlock Web Audio Context
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

      if (notifGranted || updatedState === "granted" || micGranted) {
        triggerHaptic("success");
        setHasDismissed(true);
        if (onPermissionsGranted) onPermissionsGranted();
      } else if (updatedState === "denied") {
        setShowBlockedGuide(true);
      }
    } catch (err) {
      console.error("Error asking for permissions:", err);
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-[#091328] border border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] text-white flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mb-4 text-cyan-300 shadow-lg">
            <Bell className="w-7 h-7 animate-pulse" />
          </div>

          <h3 className="text-xl font-serif font-bold text-white mb-2 flex items-center gap-2">
            <span>Allow Heer Permissions</span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </h3>

          <p className="text-xs text-white/70 mb-5 leading-relaxed">
            For Heer to speak reminders on time, alert you about background alarms, and hear your voice, please grant browser permissions.
          </p>

          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-5 space-y-2 text-left">
            <div className="flex items-center gap-2.5 text-xs text-cyan-200">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>Background Alarms & System Notifications</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-cyan-200">
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Microphone for Voice Commands</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-cyan-200">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Web Audio & High Quality Speech Output</span>
            </div>
          </div>

          {showBlockedGuide && (
            <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 mb-5 text-left text-xs text-amber-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-300">
                <Lock className="w-3.5 h-3.5" />
                <span>Browser Permission Blocked?</span>
              </p>
              <p className="text-[11px] text-amber-100/80">
                Click the lock icon (🔒) in your browser address bar → set Notifications & Microphone to <strong>Allow</strong> → then click Refresh.
              </p>
            </div>
          )}

          <div className="w-full space-y-2.5">
            <button
              onClick={handleGrantPermissions}
              disabled={isGranting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-black font-bold text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isGranting ? (
                <span>Granting Permissions...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Allow All Permissions</span>
                </>
              )}
            </button>

            <button
              onClick={() => setHasDismissed(true)}
              className="w-full py-2.5 text-xs text-white/50 hover:text-white/80 transition-colors"
            >
              Continue Without Permissions
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
