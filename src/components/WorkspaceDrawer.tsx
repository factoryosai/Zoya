import React, { useState, useEffect } from "react";
import {
  X,
  CheckSquare,
  Calendar,
  Users,
  Mail,
  Plus,
  Check,
  Search,
  Send,
  RefreshCw,
  LogOut,
  Clock,
  Sparkles,
  PhoneCall
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  initWorkspaceAuth,
  signInWithWorkspaceGoogle,
  signOutWorkspaceGoogle,
  getCachedToken,
  getCurrentWorkspaceUser,
  fetchGoogleTasks,
  createGoogleTask,
  completeGoogleTask,
  GoogleTaskItem,
  fetchGoogleContacts,
  GoogleContactItem,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  GoogleCalendarEvent,
  fetchRecentEmails,
  sendGmailMessage,
  GmailMessageItem
} from "../services/workspaceService";

interface WorkspaceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkspaceDrawer({ isOpen, onClose }: WorkspaceDrawerProps) {
  const [user, setUser] = useState(getCurrentWorkspaceUser());
  const [token, setToken] = useState(getCachedToken());
  const [activeTab, setActiveTab] = useState<"tasks" | "calendar" | "contacts" | "gmail">("tasks");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Google Tasks State
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");

  // Calendar State
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [newEventSummary, setNewEventSummary] = useState("");
  const [newEventStart, setNewEventStart] = useState("");

  // Contacts State
  const [contacts, setContacts] = useState<GoogleContactItem[]>([]);
  const [contactSearch, setContactSearch] = useState("");

  // Gmail State
  const [emails, setEmails] = useState<GmailMessageItem[]>([]);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  useEffect(() => {
    initWorkspaceAuth(
      (u, t) => {
        setUser(u);
        setToken(t);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
  }, []);

  useEffect(() => {
    if (isOpen && token) {
      loadTabData(activeTab);
    }
  }, [isOpen, token, activeTab]);

  const loadTabData = async (tab: typeof activeTab) => {
    if (!token) return;
    setIsLoading(true);
    setStatusMessage("");
    try {
      if (tab === "tasks") {
        const data = await fetchGoogleTasks();
        setTasks(data);
      } else if (tab === "calendar") {
        const data = await fetchGoogleCalendarEvents();
        setEvents(data);
      } else if (tab === "contacts") {
        const data = await fetchGoogleContacts();
        setContacts(data);
      } else if (tab === "gmail") {
        const data = await fetchRecentEmails(8);
        setEmails(data);
      }
    } catch (err: any) {
      console.error(`Error loading ${tab}:`, err);
      setStatusMessage(err?.message || `Failed to sync ${tab}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setStatusMessage("");
    try {
      const res = await signInWithWorkspaceGoogle();
      setUser(res.user);
      setToken(res.accessToken);
      setStatusMessage("Google Workspace connected successfully!");
    } catch (err: any) {
      setStatusMessage("Sign-In failed: " + (err.message || "Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutWorkspaceGoogle();
    setUser(null);
    setToken(null);
    setTasks([]);
    setEvents([]);
    setContacts([]);
    setEmails([]);
  };

  // Task Actions
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsLoading(true);
    try {
      const dueISO = newTaskDue ? new Date(newTaskDue).toISOString() : undefined;
      const created = await createGoogleTask(newTaskTitle.trim(), undefined, dueISO);
      setTasks([created, ...tasks]);
      setNewTaskTitle("");
      setNewTaskDue("");
      setStatusMessage("Task created in Google Tasks!");
    } catch (err: any) {
      setStatusMessage(err?.message || "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      await completeGoogleTask(id);
      setTasks(tasks.map(t => t.id === id ? { ...t, status: "completed" } : t));
    } catch (err: any) {
      setStatusMessage("Failed to mark task completed");
    }
  };

  // Calendar Actions
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventSummary.trim() || !newEventStart) return;
    setIsLoading(true);
    try {
      const startISO = new Date(newEventStart).toISOString();
      const endISO = new Date(new Date(newEventStart).getTime() + 3600000).toISOString(); // 1 hour duration
      const created = await createGoogleCalendarEvent(newEventSummary.trim(), startISO, endISO);
      setEvents([created, ...events]);
      setNewEventSummary("");
      setNewEventStart("");
      setStatusMessage("Meeting scheduled in Google Calendar!");
    } catch (err: any) {
      setStatusMessage(err?.message || "Failed to schedule event");
    } finally {
      setIsLoading(false);
    }
  };

  // Gmail Actions
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) return;
    setIsLoading(true);
    try {
      await sendGmailMessage(composeTo.trim(), composeSubject.trim(), composeBody.trim());
      setStatusMessage(`Email sent to ${composeTo}!`);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      loadTabData("gmail");
    } catch (err: any) {
      setStatusMessage(err?.message || "Failed to send email");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(
    c =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-md h-full bg-[#0b1329] text-white border-l border-white/10 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0f1938]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-serif font-medium">Google Workspace Hub</h2>
                <p className="text-[11px] text-white/50 font-mono">TASKS, CALENDAR, CONTACTS & GMAIL</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Sign-In Banner */}
          <div className="p-4 border-b border-white/10 bg-slate-900/40">
            {user && token ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-cyan-400/50" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-cyan-500/30 text-cyan-300 font-bold flex items-center justify-center text-xs">
                      {user.displayName?.[0] || "U"}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold">{user.displayName || "Google User"}</div>
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Connected
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadTabData(activeTab)}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs flex items-center gap-1"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs flex items-center gap-1 border border-rose-500/20"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-2">
                <p className="text-xs text-white/70 mb-3">
                  Connect Google Workspace to let Heer manage your Tasks, Calendar, Contacts, and Gmail seamlessly.
                </p>
                <button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="gsi-material-button px-4 py-2 bg-white text-gray-800 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg hover:bg-gray-100 transition-all border border-gray-300"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}

            {statusMessage && (
              <div className="mt-2 text-[11px] text-cyan-300 font-mono bg-cyan-950/40 p-2 rounded-lg border border-cyan-500/30">
                {statusMessage}
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 border-b border-white/10 bg-[#0c1630]">
            {[
              { id: "tasks", label: "Tasks", icon: CheckSquare },
              { id: "calendar", label: "Calendar", icon: Calendar },
              { id: "contacts", label: "Contacts", icon: Users },
              { id: "gmail", label: "Gmail", icon: Mail },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 flex flex-col items-center gap-1 transition-all border-b-2 text-[11px] font-medium ${
                    isActive
                      ? "border-cyan-400 text-cyan-300 bg-cyan-500/10 font-bold"
                      : "border-transparent text-white/50 hover:text-white/80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!token ? (
              <div className="text-center py-12 text-white/50 text-xs">
                <Sparkles className="w-8 h-8 text-cyan-400/50 mx-auto mb-2" />
                Please Sign in with Google above to access your {activeTab}.
              </div>
            ) : (
              <>
                {/* 1. TASKS TAB */}
                {activeTab === "tasks" && (
                  <div className="space-y-4">
                    {/* Add Task Form */}
                    <form onSubmit={handleAddTask} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                      <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> CREATE GOOGLE TASK
                      </div>
                      <input
                        type="text"
                        placeholder="Task title (e.g. Call client at 3 PM)..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                      <div className="flex gap-2">
                        <input
                          type="datetime-local"
                          value={newTaskDue}
                          onChange={(e) => setNewTaskDue(e.target.value)}
                          className="flex-1 bg-slate-900 border border-white/15 rounded-lg p-1.5 text-xs text-white/80"
                        />
                        <button
                          type="submit"
                          disabled={isLoading || !newTaskTitle.trim()}
                          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-xs transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </form>

                    {/* Task List */}
                    <div className="space-y-2">
                      {tasks.length === 0 ? (
                        <p className="text-center text-xs text-white/40 py-6">No tasks found in Google Tasks.</p>
                      ) : (
                        tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`p-3 rounded-xl border flex items-start justify-between gap-2 transition-all ${
                              task.status === "completed"
                                ? "bg-emerald-950/20 border-emerald-500/30 text-white/50 line-through"
                                : "bg-white/5 border-white/10 text-white"
                            }`}
                          >
                            <div className="flex-1">
                              <div className="text-xs font-medium">{task.title}</div>
                              {task.due && (
                                <div className="text-[10px] text-cyan-400/80 font-mono mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {new Date(task.due).toLocaleString()}
                                </div>
                              )}
                            </div>
                            {task.status !== "completed" && (
                              <button
                                onClick={() => handleCompleteTask(task.id)}
                                className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px]"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 2. CALENDAR TAB */}
                {activeTab === "calendar" && (
                  <div className="space-y-4">
                    {/* Add Event Form */}
                    <form onSubmit={handleAddEvent} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                      <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> SCHEDULE MEETING / EVENT
                      </div>
                      <input
                        type="text"
                        placeholder="Event title (e.g. Project Review Meeting)..."
                        value={newEventSummary}
                        onChange={(e) => setNewEventSummary(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                      <div className="flex gap-2">
                        <input
                          type="datetime-local"
                          value={newEventStart}
                          onChange={(e) => setNewEventStart(e.target.value)}
                          className="flex-1 bg-slate-900 border border-white/15 rounded-lg p-1.5 text-xs text-white/80"
                        />
                        <button
                          type="submit"
                          disabled={isLoading || !newEventSummary.trim() || !newEventStart}
                          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-xs transition-colors"
                        >
                          Schedule
                        </button>
                      </div>
                    </form>

                    {/* Events List */}
                    <div className="space-y-2">
                      {events.length === 0 ? (
                        <p className="text-center text-xs text-white/40 py-6">No upcoming events found.</p>
                      ) : (
                        events.map((evt) => (
                          <div key={evt.id} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                            <div className="text-xs font-semibold text-cyan-200">{evt.summary}</div>
                            <div className="text-[10px] text-white/60 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" />{" "}
                              {new Date(evt.start).toLocaleString()}
                            </div>
                            {evt.description && <div className="text-[11px] text-white/70 italic">{evt.description}</div>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 3. CONTACTS TAB */}
                {activeTab === "contacts" && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search contacts..."
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-2">
                      {filteredContacts.length === 0 ? (
                        <p className="text-center text-xs text-white/40 py-6">No Google Contacts found.</p>
                      ) : (
                        filteredContacts.map((contact, idx) => (
                          <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                            <div>
                              <div className="text-xs font-semibold">{contact.name}</div>
                              {contact.email && <div className="text-[10px] text-white/60">{contact.email}</div>}
                              {contact.phone && <div className="text-[10px] text-cyan-300 font-mono">{contact.phone}</div>}
                            </div>
                            {contact.phone && (
                              <a
                                href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                                className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs flex items-center gap-1"
                              >
                                <PhoneCall className="w-3.5 h-3.5" /> Call
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 4. GMAIL TAB */}
                {activeTab === "gmail" && (
                  <div className="space-y-4">
                    {/* Compose Email */}
                    <form onSubmit={handleSendEmail} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                      <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" /> COMPOSE EMAIL
                      </div>
                      <input
                        type="email"
                        placeholder="Recipient Email..."
                        value={composeTo}
                        onChange={(e) => setComposeTo(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                      <input
                        type="text"
                        placeholder="Subject..."
                        value={composeSubject}
                        onChange={(e) => setComposeSubject(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                      <textarea
                        rows={3}
                        placeholder="Email Body..."
                        value={composeBody}
                        onChange={(e) => setComposeBody(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !composeTo.trim() || !composeSubject.trim() || !composeBody.trim()}
                        className="w-full py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> Send Email via Gmail
                      </button>
                    </form>

                    {/* Email Messages */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono text-white/50 font-bold uppercase">Recent Gmail Messages</div>
                      {emails.length === 0 ? (
                        <p className="text-center text-xs text-white/40 py-6">No recent emails found.</p>
                      ) : (
                        emails.map((msg) => (
                          <div key={msg.id} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                            <div className="flex justify-between items-start">
                              <div className="text-xs font-semibold text-cyan-200 line-clamp-1">{msg.subject}</div>
                              <div className="text-[9px] text-white/40 font-mono shrink-0">{msg.date ? new Date(msg.date).toLocaleDateString() : ""}</div>
                            </div>
                            <div className="text-[10px] text-white/60 line-clamp-1">From: {msg.from}</div>
                            <div className="text-[11px] text-white/80 line-clamp-2 italic bg-slate-900/50 p-1.5 rounded-lg">{msg.snippet}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
