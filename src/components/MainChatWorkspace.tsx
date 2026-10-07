import React, { useState, useEffect, useRef } from "react";
import { FirebaseUser, Note, ChatMessage } from "../types";
import { getTutorCorrection } from "../services/api";
import { db } from "../services/firebase";
import { doc, getDocs, setDoc, query, collection, where } from "firebase/firestore";
import DocumentContextBar from "./DocumentContextBar";
import ChatComposer from "./ChatComposer";
import Loader from "./Loader";
import {
  Sparkles,
  User,
  Bot,
  FileText,
  Layers,
  Award,
  GitGraph,
  Share2,
  CalendarRange,
  Video,
  DownloadCloud,
  UploadCloud,
  ArrowRight,
  BookOpen,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface MainChatWorkspaceProps {
  user: FirebaseUser | null;
  focusedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onUpdateNote: (note: Note | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewSession?: () => void;
}

export default function MainChatWorkspace({
  user,
  focusedNote,
  onSelectNote,
  onUpdateNote,
  activeTab,
  setActiveTab,
  onNewSession,
}: MainChatWorkspaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const sessionId = focusedNote && user ? `chat_${focusedNote.id}_${user.uid}` : "";

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load chat session if note is selected
  useEffect(() => {
    if (!focusedNote || !user) {
      setMessages([]);
      return;
    }

    const loadSession = async () => {
      try {
        const q = query(
          collection(db, "chatSessions"),
          where("id", "==", sessionId)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const sessionData = snap.docs[0].data();
          if (sessionData.messages && sessionData.messages.length > 0) {
            setMessages(sessionData.messages);
            return;
          }
        }

        // Default initial greeting for new document
        const welcomeMsg: ChatMessage = {
          role: "assistant",
          content: `I've processed your study material "${focusedNote.title}". What would you like to do with it?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages([welcomeMsg]);
      } catch (err) {
        console.error("Firestore chat load failed:", err);
      }
    };

    loadSession();
  }, [focusedNote, user, sessionId]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setError("");
    setLastQuery(text.trim());

    // 1. Immediately render user's message optimistically
    const userMsg: ChatMessage = {
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    try {
      const extractedContent = focusedNote?.extractedText || focusedNote?.summary?.shortSummary || "";
      const aiResponseText = await getTutorCorrection(newHistory, extractedContent);

      const aiMsg: ChatMessage = {
        role: "assistant",
        content: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const finalHistory = [...newHistory, aiMsg];
      setMessages(finalHistory);

      // Save to Firestore if user and note are active
      if (user && focusedNote) {
        await setDoc(doc(db, "chatSessions", sessionId), {
          id: sessionId,
          userId: user.uid,
          noteId: focusedNote.id,
          messages: finalHistory,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.error("Manthan360 Chat Error:", err);
      setError("Manthan360 couldn't complete that request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetryLastQuery = () => {
    if (lastQuery) {
      handleSendMessage(lastQuery);
    }
  };

  const handleActionClick = (actionType: string) => {
    if (actionInProgress) return; // Prevent duplicate clicks
    setActionInProgress(actionType);

    if (actionType === "explain_simply") {
      handleSendMessage("Explain this study material simply with intuitive examples.");
    } else {
      setActiveTab(actionType);
    }

    setTimeout(() => {
      setActionInProgress(null);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative" id="main-chat-workspace">
      {/* Top Document Context Bar if note is focused */}
      {focusedNote && (
        <div className="sticky top-0 z-20 px-4 pt-2">
          <DocumentContextBar
            note={focusedNote}
            onClearContext={() => setActiveTab("dashboard")}
            onOpenDocument={() => setActiveTab("summary")}
          />
        </div>
      )}

      {/* Main Conversation Flow Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 max-w-4xl mx-auto w-full no-scrollbar">
        {/* Welcome State when no note or new chat session */}
        {!focusedNote && (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in" id="workspace-welcome-state">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-violet-500/25 mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Manthan360
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-md">
              Your AI-powered study companion that lives with you through your learning journey.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                type="button"
                id="welcome-upload-notes-btn"
                onClick={() => setActiveTab("upload")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-violet-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Notes
              </button>

              <button
                type="button"
                id="welcome-ask-manthan-btn"
                onClick={() => handleSendMessage("How can you help me study effectively?")}
                className="px-5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 hover:border-violet-500/30 font-medium text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-violet-400" />
                Ask Manthan360
              </button>
            </div>

            {/* Suggested Starter Actions */}
            <div className="mt-10 w-full max-w-lg text-left bg-slate-900/60 border border-white/10 rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Suggested Actions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: "Summarize a chapter", prompt: "Explain the best method to summarize dense textbook chapters." },
                  { label: "Create flashcards", prompt: "How should I structure flashcards for maximum active recall retention?" },
                  { label: "Generate practice quiz", prompt: "What question formats are most effective for self-testing?" },
                  { label: "Create a mind map", prompt: "How can visual mind maps help me connect complex engineering concepts?" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-violet-950/40 text-slate-300 hover:text-white border border-white/5 hover:border-violet-500/30 text-xs text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={idx}
              id={`chat-msg-${idx}`}
              className={`flex gap-3 animate-fade-in ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/10 rounded-br-sm"
                    : "bg-slate-900/90 text-slate-200 border border-white/10 shadow-md rounded-bl-sm"
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/5">
                    <span className="font-semibold text-xs text-violet-300">Manthan360</span>
                    {msg.timestamp && (
                      <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                {/* If it's an AI message responding to a note, provide quick action shortcuts */}
                {!isUser && focusedNote && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                    <button
                      type="button"
                      id={`msg-action-summary-${idx}`}
                      onClick={() => handleActionClick("summary")}
                      disabled={!!actionInProgress}
                      className="px-2.5 py-1 rounded-lg bg-violet-950/60 hover:bg-violet-900/80 text-violet-200 border border-violet-500/30 text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <FileText className="w-3 h-3" /> Summary
                    </button>
                    <button
                      type="button"
                      id={`msg-action-flashcards-${idx}`}
                      onClick={() => handleActionClick("flashcards")}
                      disabled={!!actionInProgress}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Layers className="w-3 h-3" /> Flashcards
                    </button>
                    <button
                      type="button"
                      id={`msg-action-quiz-${idx}`}
                      onClick={() => handleActionClick("quiz")}
                      disabled={!!actionInProgress}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Award className="w-3 h-3" /> Quiz
                    </button>
                    <button
                      type="button"
                      id={`msg-action-mindmap-${idx}`}
                      onClick={() => handleActionClick("mindmap")}
                      disabled={!!actionInProgress}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <GitGraph className="w-3 h-3" /> Mind Map
                    </button>
                    <button
                      type="button"
                      id={`msg-action-flowchart-${idx}`}
                      onClick={() => handleActionClick("flowchart")}
                      disabled={!!actionInProgress}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Share2 className="w-3 h-3" /> Flowchart
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-violet-500/30 flex items-center justify-center shadow-md shrink-0 mt-1">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          );
        })}

        {/* Instant Thinking Bubble */}
        {loading && (
          <div className="flex gap-3 animate-fade-in" id="chat-thinking-indicator">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0 mt-1">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl rounded-bl-sm p-4">
              <Loader message="Manthan360 is thinking and analyzing your study context..." step={2} />
            </div>
          </div>
        )}

        {/* Error Notification with Inline Retry */}
        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            {lastQuery && (
              <button
                type="button"
                id="chat-retry-btn"
                onClick={handleRetryLastQuery}
                disabled={loading}
                className="px-3 py-1 bg-rose-900/60 hover:bg-rose-900/90 border border-rose-700/50 rounded-lg text-rose-100 text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Retry
              </button>
            )}
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Bottom Fixed Composer */}
      <ChatComposer
        onSendMessage={handleSendMessage}
        onAttachClick={() => setActiveTab("upload")}
        onSuggestionClick={handleActionClick}
        isLoading={loading}
        hasDocument={!!focusedNote}
        placeholder={
          focusedNote
            ? `Ask Manthan360 about "${focusedNote.title}"...`
            : "Ask Manthan360 anything or upload notes..."
        }
      />
    </div>
  );
}
