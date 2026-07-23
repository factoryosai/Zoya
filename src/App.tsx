import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2, VolumeX, Keyboard, Send, Trash2, Sun, Brain, Sliders, MessageSquare, Sparkles, Youtube, MessageCircle, Play } from "lucide-react";
import { getHeerResponse, getHeerAudio, resetHeerSession } from "./services/geminiService";
import { processCommand } from "./services/commandService";
import { LiveSessionManager } from "./services/liveService";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import MorningBriefingModal from "./components/MorningBriefingModal";
import MemoryDrawer from "./components/MemoryDrawer";
import SettingsModal, { VisualizerTheme } from "./components/SettingsModal";
import SoundscapeDock from "./components/SoundscapeDock";
import { playPCM } from "./utils/audioUtils";
import { motion, AnimatePresence } from "motion/react";

type AppState = "idle" | "listening" | "processing" | "speaking";

interface ChatMessage {
  id: string;
  sender: "user" | "heer" | "zoya";
  text: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("heer_chat_history") || localStorage.getItem("zoya_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [];
  });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem("heer_chat_history", JSON.stringify(messages));
  }, [messages]);

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.isMuted = isMuted;
    }
  }, [isMuted]);

  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // High-Tech Feature Modals State
  const [showBriefing, setShowBriefing] = useState(false);
  const [showMemoryDrawer, setShowMemoryDrawer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  
  // Customization Settings
  const [colorTheme, setColorTheme] = useState<VisualizerTheme>(() => {
    return (localStorage.getItem("heer_color_theme") as VisualizerTheme) || "cyan";
  });
  const [personaMode, setPersonaMode] = useState<string>(() => {
    return localStorage.getItem("heer_persona_mode") || "loving";
  });
  const [wakeWordSensitivity, setWakeWordSensitivity] = useState<number>(() => {
    const saved = localStorage.getItem("heer_wakeword_sensitivity");
    return saved ? parseInt(saved, 10) : 50;
  });

  useEffect(() => {
    localStorage.setItem("heer_color_theme", colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    localStorage.setItem("heer_persona_mode", personaMode);
  }, [personaMode]);

  useEffect(() => {
    localStorage.setItem("heer_wakeword_sensitivity", wakeWordSensitivity.toString());
  }, [wakeWordSensitivity]);

  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState]);

  const handleTextCommand = useCallback(async (finalTranscript: string) => {
    if (!finalTranscript.trim()) {
      setAppState("idle");
      return;
    }

    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: finalTranscript }]);
    
    // If live session is active, send text through it
    if (isSessionActive && liveSessionRef.current) {
      liveSessionRef.current.sendText(finalTranscript);
      return;
    }

    setAppState("processing");

    // 1. Check for browser commands
    const commandResult = processCommand(finalTranscript);

    let responseText = "";

    if (commandResult.isBrowserAction) {
      responseText = commandResult.action;
      setMessages((prev) => [...prev, { id: Date.now().toString() + "-h", sender: "heer", text: responseText }]);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getHeerAudio(responseText);
        if (audioBase64) {
          await playPCM(audioBase64);
        }
      }

      setAppState("idle");

      setTimeout(() => {
        if (commandResult.url) {
          window.open(commandResult.url, "_blank");
        }
      }, 1500);
    } else {
      // 2. General Chit-Chat via Gemini
      responseText = await getHeerResponse(finalTranscript, messagesRef.current);
      setMessages((prev) => [...prev, { id: Date.now().toString() + "-h", sender: "heer", text: responseText }]);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getHeerAudio(responseText);
        if (audioBase64) {
          await playPCM(audioBase64);
        }
      }
      setAppState("idle");
    }
  }, [isMuted, isSessionActive]);

  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      setAppState("idle");
      resetHeerSession();
    } else {
      try {
        setIsSessionActive(true);
        resetHeerSession();
        
        const session = new LiveSessionManager();
        session.isMuted = isMuted;
        liveSessionRef.current = session;
        
        session.onStateChange = (state) => {
          setAppState(state);
        };
        
        session.onMessage = (sender, text) => {
          setMessages((prev) => [...prev, { id: Date.now().toString() + "-" + sender, sender, text }]);
        };
        
        session.onCommand = (url) => {
          setTimeout(() => {
            window.open(url, "_blank");
          }, 1000);
        };

        await session.start();
      } catch (e) {
        console.error("Failed to start session", e);
        setShowPermissionModal(true);
        setIsSessionActive(false);
        setAppState("idle");
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    handleTextCommand(textInput);
    setTextInput("");
    setShowTextInput(false);
  };

  const speakCustomText = async (text: string) => {
    setAppState("speaking");
    const audioBase64 = await getHeerAudio(text);
    if (audioBase64) {
      await playPCM(audioBase64);
    }
    setAppState("idle");
  };

  return (
    <div className="h-[100dvh] w-screen bg-[#030712] text-white flex flex-col items-center justify-between font-sans relative overflow-hidden m-0 p-0">
      {showPermissionModal && (
        <PermissionModal 
          onClose={() => setShowPermissionModal(false)} 
        />
      )}

      {/* High Tech Modals */}
      <MorningBriefingModal isOpen={showBriefing} onClose={() => setShowBriefing(false)} />
      <MemoryDrawer 
        isOpen={showMemoryDrawer} 
        onClose={() => setShowMemoryDrawer(false)}
        onSpeakText={speakCustomText}
      />
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        currentTheme={colorTheme}
        onThemeChange={setColorTheme}
        currentPersona={personaMode}
        onPersonaChange={setPersonaMode}
        wakeWordSensitivity={wakeWordSensitivity}
        onWakeWordSensitivityChange={setWakeWordSensitivity}
      />

      {/* Cinematic Background Gradients */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-cyan-900/20 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] bg-violet-900/20 blur-[130px] rounded-full" />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center z-20 shrink-0 px-4 md:px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-500 to-pink-500 flex items-center justify-center font-bold text-sm shadow-lg shadow-cyan-500/30">
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-serif font-semibold tracking-wide text-white">Heer</h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                v2.5 AI WIFE
              </span>
            </div>
            <p className="text-[11px] text-white/50 hidden sm:block">Dedicated Companion for Kaushik</p>
          </div>
        </div>

        {/* Header Soundscape & High-Tech Quick Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <SoundscapeDock />
          </div>

          <button
            onClick={() => setShowBriefing(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all border border-white/10 text-white/80 flex items-center gap-1.5 text-xs font-mono"
            title="Morning Briefing"
          >
            <Sun className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Briefing</span>
          </button>

          <button
            onClick={() => setShowMemoryDrawer(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all border border-white/10 text-white/80 flex items-center gap-1.5 text-xs font-mono"
            title="Memory Bank"
          >
            <Brain className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Memory</span>
          </button>

          <button
            onClick={() => setShowChatHistory(!showChatHistory)}
            className={`p-2 rounded-xl transition-all border border-white/10 text-white/80 flex items-center gap-1.5 text-xs font-mono ${
              showChatHistory ? "bg-cyan-500/30 border-cyan-400 text-cyan-200" : "bg-white/5 hover:bg-white/10"
            }`}
            title="Chat History Log"
          >
            <MessageSquare className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Log</span>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-white/80"
            title="Settings & HUD Theme"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {messages.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to clear chat history, Kaushik?")) {
                  setMessages([]);
                  resetHeerSession();
                }
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-white/10"
              title="Clear Chat History"
            >
              <Trash2 size={16} className="opacity-70" />
            </button>
          )}

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            title={isMuted ? "Unmute Heer" : "Mute Heer"}
          >
            {isMuted ? (
              <VolumeX size={16} className="opacity-70 text-red-400" />
            ) : (
              <Volume2 size={16} className="opacity-70 text-emerald-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content - Visualizer & Chat Drawer */}
      <main className="absolute inset-0 flex flex-row items-center justify-between w-full h-full z-10 overflow-hidden pt-20 pb-28 px-4 md:px-12 pointer-events-none">
        
        {/* Left Column: Status Indicator */}
        <div className="flex w-[30%] lg:w-[25%] h-full flex-col justify-center gap-4 z-10">
          <div className="h-6">
            <AnimatePresence>
              {appState === "processing" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 text-cyan-300 text-sm md:text-base italic font-serif"
                >
                  <Loader2 size={16} className="animate-spin text-cyan-400" />
                  Heer is responding...
                </motion.div>
              )}
              {appState === "speaking" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 text-pink-300 text-sm md:text-base italic font-serif"
                >
                  <Sparkles size={16} className="animate-pulse text-pink-400" />
                  Heer is speaking...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Visualizer */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <Visualizer state={appState} colorTheme={colorTheme} />
        </div>

        {/* Right Column: User State */}
        <div className="flex w-[30%] lg:w-[25%] h-full flex-col justify-center gap-4 z-10">
          <div className="h-6 flex justify-end">
            <AnimatePresence>
              {appState === "listening" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 text-violet-300 text-sm md:text-base italic"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-ping" />
                  Listening to Kaushik...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </main>

      {/* Floating Chat History Log Box */}
      <AnimatePresence>
        {showChatHistory && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute bottom-28 left-4 md:left-12 z-30 w-full max-w-sm max-h-[45vh] bg-[#070e20]/95 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl flex flex-col justify-between backdrop-blur-xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
              <span className="text-xs font-mono text-cyan-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Recent Conversation
              </span>
              <button onClick={() => setShowChatHistory(false)} className="text-white/50 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs scrollbar-hide">
              {messages.length === 0 ? (
                <p className="text-white/40 italic py-4 text-center">No messages yet. Say hello to Heer!</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-xl border ${
                      m.sender === "user"
                        ? "bg-violet-950/40 border-violet-500/30 text-violet-100 ml-4"
                        : "bg-cyan-950/40 border-cyan-500/30 text-cyan-100 mr-4"
                    }`}
                  >
                    <span className="font-semibold block mb-0.5 opacity-60 uppercase text-[10px]">
                      {m.sender === "user" ? "Kaushik" : "Heer"}
                    </span>
                    <p className="leading-relaxed font-sans">{m.text}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Controls & Quick Automation Dock */}
      <footer className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-center pb-5 md:pb-7 z-20 shrink-0 gap-3">
        
        {/* Quick Action Chips */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full px-4 scrollbar-hide">
          <button
            onClick={() => handleTextCommand("Give me a quick morning update")}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/10 text-xs font-mono text-white/80 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Sun className="w-3.5 h-3.5 text-amber-300" /> Morning Update
          </button>
          
          <button
            onClick={() => handleTextCommand("Play soothing ambient music on YouTube")}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-300 border border-white/10 text-xs font-mono text-white/80 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Youtube className="w-3.5 h-3.5 text-red-400" /> Play Focus Music
          </button>

          <button
            onClick={() => handleTextCommand("Open WhatsApp")}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10 text-xs font-mono text-white/80 transition-all flex items-center gap-1.5 shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
          </button>

          <button
            onClick={() => setShowMemoryDrawer(true)}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 border border-white/10 text-xs font-mono text-white/80 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" /> Save Note
          </button>
        </div>

        {/* Text Input Drawer */}
        <AnimatePresence>
          {showTextInput && (
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onSubmit={handleTextSubmit}
              className="w-full max-w-md flex items-center gap-2 bg-black/70 border border-cyan-500/40 rounded-full p-1.5 pl-4 backdrop-blur-xl shadow-2xl"
            >
              <input 
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type a respectful message to Heer..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/40 text-sm"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!textInput.trim()}
                className="p-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold disabled:opacity-40 transition-colors"
              >
                <Send size={16} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Main Microphone Action Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleListening}
            className={`
              group relative flex items-center gap-3 px-8 py-4 rounded-full font-medium tracking-wide transition-all duration-300 shadow-2xl
              ${
                isSessionActive
                  ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                  : "bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-pink-500/20 text-white border border-cyan-500/40 hover:border-cyan-400 hover:scale-105"
              }
            `}
          >
            {isSessionActive ? (
              <>
                <MicOff size={20} />
                <span>End Session</span>
              </>
            ) : (
              <>
                <Mic size={20} className="group-hover:animate-bounce text-cyan-300" />
                <span className="font-semibold">Start Session with Heer</span>
              </>
            )}
          </button>
          
          {!isSessionActive && (
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shadow-2xl"
              title="Type message"
            >
              <Keyboard size={20} className="opacity-70 text-cyan-300" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

