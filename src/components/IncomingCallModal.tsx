import React, { useEffect, useState } from "react";
import { Phone, PhoneOff, Bot, MessageSquare, User, Volume2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { IncomingCall } from "../services/callService";
import { getHeerAudio } from "../services/geminiService";
import { playPCM } from "../utils/audioUtils";
import { triggerHaptic } from "../utils/haptics";

interface IncomingCallModalProps {
  incomingCall: IncomingCall | null;
  onAccept: () => void;
  onDecline: () => void;
  onHeerGreet: (greetingText: string) => void;
}

export function IncomingCallModal({
  incomingCall,
  onAccept,
  onDecline,
  onHeerGreet,
}: IncomingCallModalProps) {
  const [heerSpeakingState, setHeerSpeakingState] = useState<string | null>(null);

  useEffect(() => {
    if (incomingCall && incomingCall.status === "ringing") {
      // Announce caller automatically in Heer's voice
      const announceCaller = async () => {
        triggerHaptic("command");
        const announcement = `Kaushik Ji, ${incomingCall.callerName} ka phone aa raha hai. Kya main call greet karoon?`;
        setHeerSpeakingState("Announcing Caller...");
        try {
          const audio = await getHeerAudio(announcement);
          if (audio) {
            await playPCM(audio);
          }
        } catch (e) {
          console.error("Call announcement TTS error:", e);
        } finally {
          setHeerSpeakingState(null);
        }
      };

      announceCaller();
    }
  }, [incomingCall]);

  if (!incomingCall) return null;

  const handleHeerAnswer = async () => {
    triggerHaptic("success");
    const heerResponse = `Namaste! Main Heer hoon, Kaushik Ji ki AI Assistant. Kaushik Ji abhi busy hain. Kripya apna message bataiye, main unko de doongi.`;
    setHeerSpeakingState("Heer is speaking to caller...");
    onHeerGreet(heerResponse);
    try {
      const audio = await getHeerAudio(heerResponse);
      if (audio) {
        await playPCM(audio);
      }
    } catch (e) {
      console.error("Heer greeting error:", e);
    } finally {
      setHeerSpeakingState(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-lg z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          className="w-full max-w-md bg-[#0a1128] border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden text-white flex flex-col items-center p-6 space-y-6 relative"
        >
          {/* Top Status Header */}
          <div className="flex items-center justify-between w-full border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono text-cyan-300 uppercase tracking-wider">
                INCOMING CALL DETECTED
              </span>
            </div>
            <button
              onClick={onDecline}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avatar Ringing Animation */}
          <div className="relative flex items-center justify-center my-2">
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="absolute w-32 h-32 rounded-full border-2 border-cyan-400/50"
            />
            <motion.div
              animate={{ scale: [1, 1.45, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: 0.3 }}
              className="absolute w-40 h-40 rounded-full border border-cyan-500/30"
            />
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center border-2 border-white/30 shadow-xl z-10">
              <User className="w-12 h-12 text-white/90" />
            </div>
          </div>

          {/* Caller Details */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold font-serif text-white tracking-wide">
              {incomingCall.callerName}
            </h2>
            <p className="text-sm font-mono text-cyan-300/80">{incomingCall.callerNumber}</p>
            {heerSpeakingState && (
              <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono text-amber-300 animate-pulse">
                <Volume2 className="w-4 h-4" />
                <span>{heerSpeakingState}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-1 gap-3 pt-2">
            {/* Heer AI Assistant Greeting */}
            <button
              onClick={handleHeerAnswer}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs font-mono rounded-2xl shadow-lg border border-cyan-300/30 flex items-center justify-center gap-2.5 transition-all active:scale-95"
            >
              <Bot className="w-5 h-5 text-cyan-200" />
              <span>Let Heer Greet & Take Message</span>
            </button>

            {/* Accept / Decline Controls */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onAccept}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>Accept</span>
              </button>

              <button
                onClick={onDecline}
                className="py-3 px-4 bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs font-mono rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Decline</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
