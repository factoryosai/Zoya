import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Brain, Bookmark, Clock, Heart, Sparkles, ShieldCheck, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getMemories, saveMemory, deleteMemory, MemoryItem } from "../services/memoryService";
import { syncAllData } from "../services/dataSyncService";

interface MemoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeakText?: (text: string) => void;
}

export default function MemoryDrawer({ isOpen, onClose, onSpeakText }: MemoryDrawerProps) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [newText, setNewText] = useState("");
  const [category, setCategory] = useState<MemoryItem["category"]>("note");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMemories = async () => {
    setIsRefreshing(true);
    try {
      await syncAllData();
      setMemories(getMemories());
    } catch (e) {
      setMemories(getMemories());
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const refresh = () => setMemories(getMemories());
    refresh();

    window.addEventListener("heer-memory-updated", refresh);
    return () => {
      window.removeEventListener("heer-memory-updated", refresh);
    };
  }, [isOpen]);

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const textToSave = newText.trim();
    const updated = saveMemory(textToSave, category);
    setMemories(updated);
    setNewText("");
    if (onSpeakText) {
      onSpeakText(`Ji Kaushik, main iss baat ko hamesha life long yaad rakhungi: "${textToSave}"`);
    }
  };

  const handleDelete = (id: string) => {
    const updated = deleteMemory(id);
    setMemories(updated);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-end p-0 md:p-4">
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-md h-full bg-[#0a0f1d]/95 border-l border-cyan-500/20 text-white p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none" />

          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-medium tracking-wide">Heer's Memory Bank</h2>
                  <p className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> LIFETIME PERSISTENT MEMORY
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={refreshMemories}
                  disabled={isRefreshing}
                  title="Update & Sync Memory Bank with Cloud Firestore"
                  className="p-2 rounded-full hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Add Memory Form */}
            <form onSubmit={handleAddMemory} className="mt-5 flex flex-col gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Tell Heer to remember something:
              </span>
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="e.g. Kaushik's favorite book is Interstellar..."
                className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  {(["note", "reminder", "preference", "date"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-2.5 py-1 rounded-md text-xs capitalize transition-all ${
                        category === cat
                          ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/40"
                          : "bg-white/5 text-white/50 border border-white/5 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-semibold hover:bg-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </form>

            {/* List of Memories */}
            <div className="mt-6 space-y-3 max-h-[50vh] overflow-y-auto pr-1 scrollbar-hide">
              {memories.length === 0 ? (
                <div className="text-center py-10 text-white/40 text-sm">
                  No memories saved yet. Ask Heer to remember key details for you!
                </div>
              ) : (
                memories.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all group flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-cyan-400">
                        {item.category === "preference" && <Heart className="w-4 h-4 text-pink-400" />}
                        {item.category === "reminder" && <Clock className="w-4 h-4 text-amber-400" />}
                        {item.category === "note" && <Bookmark className="w-4 h-4 text-cyan-400" />}
                        {item.category === "date" && <Brain className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div>
                        <p className="text-sm text-white/90 font-sans leading-relaxed">{item.text}</p>
                        <span className="text-[10px] text-white/40 font-mono mt-1 block">{item.createdAt}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-white/30 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-white/40 font-mono">
              "Heer will always hold Kaushik's notes with deep care and privacy."
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
