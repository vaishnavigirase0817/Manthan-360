import React, { useState, useEffect, useRef, useMemo } from "react";
import { FirebaseUser, Note, ChatMessage, ChatSession } from "../types";
import { getTutorCorrection } from "../services/api";
import { db } from "../services/firebase";
import { doc, getDocs, setDoc, query, collection, where } from "firebase/firestore";
import DocumentContextBar from "./DocumentContextBar";
import ChatComposer from "./ChatComposer";
import Loader from "./Loader";
import ManthanLogo from "./ManthanLogo";
import { analyzeContentSuitability, ContentSuitability } from "../services/contentAnalyzer";
import { chunkDocument, retrieveRelevantChunks, DocumentChunk } from "../services/documentChunker";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations";
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
  DownloadCloud,
  UploadCloud,
  ArrowRight,
  BookOpen,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HelpCircle as QuestionIcon,
  Zap,
  Bookmark,
  Search,
} from "lucide-react";

interface MainChatWorkspaceProps {
  user: FirebaseUser | null;
  focusedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onUpdateNote: (note: Note | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewSession?: () => void;
  currentSessionId?: string;
  onSessionUpdated?: () => void;
}

export default function MainChatWorkspace({
  user,
  focusedNote,
  onSelectNote,
  onUpdateNote,
  activeTab,
  setActiveTab,
  onNewSession,
  currentSessionId,
  onSessionUpdated,
}: MainChatWorkspaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [lastCitations, setLastCitations] = useState<string[]>([]);
  const [chatMode, setChatMode] = useState<"simple" | "study">(focusedNote ? "study" : "simple");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const { selectedLanguage } = useLanguage();
  const t = getTranslation(selectedLanguage);

  // Automatically switch to Study Mode when a document is active
  useEffect(() => {
    if (focusedNote) {
      setChatMode("study");
    }
  }, [focusedNote?.id]);

  // Document suitability intelligence
  const suitability: ContentSuitability | null = useMemo(() => {
    if (!focusedNote) return null;
    return analyzeContentSuitability(focusedNote.extractedText, focusedNote.fileName);
  }, [focusedNote?.id, focusedNote?.extractedText, focusedNote?.fileName]);

  // Scalable Document Chunks (RAG-lite) cached by note ID
  const documentChunks: DocumentChunk[] = useMemo(() => {
    if (!focusedNote || !focusedNote.extractedText) return [];
    return chunkDocument(focusedNote.extractedText, focusedNote.id, {
      fileName: focusedNote.fileName,
    });
  }, [focusedNote?.id, focusedNote?.extractedText]);

  const activeSessionKey = currentSessionId || (focusedNote && user ? `chat_${focusedNote.id}_${user.uid}` : (user ? `chat_general_${user.uid}` : "guest_session"));

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load chat session from Firestore
  useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }

    const loadSession = async () => {
      try {
        const q = query(
          collection(db, "chatSessions"),
          where("id", "==", activeSessionKey)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const sessionData = snap.docs[0].data();
          if (sessionData.messages && sessionData.messages.length > 0) {
            setMessages(sessionData.messages);
            return;
          }
        }

        // Welcome Greeting localized
        let welcomeText = t.welcomeHeadline;
        if (chatMode === "study" && focusedNote && suitability) {
          if (!suitability.isValid) {
            welcomeText = `I processed "${focusedNote.title}", but couldn't find enough readable content.`;
          } else {
            welcomeText = `I've analyzed and indexed "${focusedNote.title}" (~${documentChunks.length} sections). Ask me any specific topic, question, or analysis on this document!`;
          }
        } else if (chatMode === "simple") {
          welcomeText = "Hello! I am Manthan360. Ask me any general question, math formula, code problem, or concept, and I'll explain it instantly.";
        }

        const welcomeMsg: ChatMessage = {
          role: "assistant",
          content: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages([welcomeMsg]);
      } catch (err) {
        console.error("Firestore chat load failed:", err);
      }
    };

    loadSession();
  }, [activeSessionKey, focusedNote?.id, user?.uid, selectedLanguage, chatMode]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setError("");
    const userQueryText = text.trim();
    setLastQuery(userQueryText);

    // 1. Immediately render user's message optimistically
    const userMsg: ChatMessage = {
      role: "user",
      content: userQueryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    try {
      let contextPayload = "";
      let retrievedCitations: string[] = [];

      // 2. ONLY in Study Mode: Intelligent Relevant Chunk Retrieval
      if (chatMode === "study" && focusedNote && suitability?.isValid && documentChunks.length > 0) {
        const retrieval = retrieveRelevantChunks(documentChunks, userQueryText, 4);
        retrievedCitations = retrieval.sources;

        if (retrieval.relevantChunks.length > 0) {
          contextPayload = retrieval.relevantChunks
            .map((c) => `[Source: Page ${c.pageNumber || 1}]\n${c.text}`)
            .join("\n\n---\n\n");
        } else {
          contextPayload = focusedNote.extractedText.slice(0, 4000);
        }
      }

      setLastCitations(retrievedCitations);

      // 3. Call AI endpoint with ONLY relevant context (or blank context for fast simple chat)
      const aiResponseText = await getTutorCorrection(newHistory, contextPayload);

      // Append Citation Tags if response was grounded from specific pages
      let finalAiResponse = aiResponseText;
      if (chatMode === "study" && retrievedCitations.length > 0 && !finalAiResponse.includes("Source:")) {
        finalAiResponse += `\n\n📌 *Referenced from:* ${retrievedCitations.join(", ")}`;
      }

      const aiMsg: ChatMessage = {
        role: "assistant",
        content: finalAiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const finalHistory = [...newHistory, aiMsg];
      setMessages(finalHistory);

      // 4. Save to Firestore
      if (user) {
        await setDoc(doc(db, "chatSessions", activeSessionKey), {
          id: activeSessionKey,
          userId: user.uid,
          noteId: (chatMode === "study" && focusedNote) ? focusedNote.id : "general",
          title: userQueryText.slice(0, 36),
          messages: finalHistory,
          updatedAt: new Date().toISOString(),
        });
        if (onSessionUpdated) onSessionUpdated();
      }
    } catch (err: any) {
      console.error("Manthan360 Chat Error:", err);
      setError("Manthan360 couldn't complete that response. Please try again.");
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
    if (actionInProgress) return;
    setActionInProgress(actionType);

    if (actionType === "explain_simply") {
      handleSendMessage("Explain this topic simply with intuitive beginner examples.");
    } else if (actionType === "give_example") {
      handleSendMessage("Give me a practical real-world example of this concept.");
    } else if (actionType === "test_me") {
      if (chatMode === "study" && focusedNote && suitability?.isValid) {
        setActiveTab("quiz");
      } else {
        handleSendMessage("Test me with 3 practice exam questions on this topic.");
      }
    } else {
      setActiveTab(actionType);
    }

    setTimeout(() => {
      setActionInProgress(null);
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative" id="main-chat-workspace">
      {/* Top Mode Switcher Bar */}
      <div
        id="chat-mode-switcher-bar"
        className="sticky top-0 z-30 px-3 sm:px-6 py-2 bg-slate-950/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 shadow-inner">
          <button
            type="button"
            id="mode-switch-simple-btn"
            onClick={() => setChatMode("simple")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              chatMode === "simple"
                ? "bg-violet-600 text-white font-semibold shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t.simpleChat}</span>
            {chatMode === "simple" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />}
          </button>

          <button
            type="button"
            id="mode-switch-study-btn"
            onClick={() => setChatMode("study")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              chatMode === "study"
                ? "bg-violet-600 text-white font-semibold shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t.studyMode}</span>
            {chatMode === "study" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />}
          </button>
        </div>

        {chatMode === "study" && focusedNote && suitability?.isValid ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
            <span className="px-2 py-0.5 rounded-md bg-violet-950/80 text-violet-300 border border-violet-800/40 text-[10px] font-semibold">
              {suitability.categoryLabel}
            </span>
            <span className="truncate max-w-[140px] sm:max-w-[220px] text-slate-300 font-medium hidden xs:inline">
              {focusedNote.title}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
            {chatMode === "simple" ? "⚡ Fast AI Mode" : "📚 Document Mode"}
          </span>
        )}
      </div>

      {/* Top Document Context Bar if in study mode with focused note */}
      {chatMode === "study" && focusedNote && (
        <div className="px-4 pt-2">
          <DocumentContextBar
            note={focusedNote}
            onClearContext={() => {
              if (onNewSession) onNewSession();
            }}
            onOpenDocument={() => setActiveTab("summary")}
          />
        </div>
      )}

      {/* Main Conversation Flow Area */}
      <div className="flex-1 overflow-y-auto px-3 py-6 sm:px-6 md:px-8 space-y-6 max-w-4xl mx-auto w-full no-scrollbar">
        {/* Welcome State when no messages or new session */}
        {messages.length <= 1 && !focusedNote && (
          <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center animate-fade-in" id="workspace-welcome-state">
            <div className="mb-4">
              <ManthanLogo size="lg" />
            </div>

            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-md font-sans">
              {t.welcomeHeadline}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                type="button"
                id="welcome-upload-notes-btn"
                onClick={() => setActiveTab("upload")}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-violet-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{t.uploadNotesCta}</span>
              </button>

              <button
                type="button"
                id="welcome-ask-manthan-btn"
                onClick={() => handleSendMessage(selectedLanguage === "Hindi" ? "आप मुझे प्रभावी ढंग से अध्ययन करने में कैसे मदद कर सकते हैं?" : selectedLanguage === "Marathi" ? "तुम्ही मला प्रभावीपणे अभ्यास करण्यास कशी मदत करू शकता?" : "How can you help me study effectively?")}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 font-medium text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>{t.askManthanCta}</span>
              </button>
            </div>

            {/* Suggested Starter Actions */}
            <div className="mt-8 sm:mt-10 w-full max-w-lg text-left bg-slate-900/70 border border-white/10 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-violet-400" /> {t.suggestedActionsLabel}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: "Active Recall", prompt: "Explain how active recall improves memory retention and exam scores." },
                  { label: "Explain Recursion", prompt: "Explain recursion simply with an intuitive beginner example." },
                  { label: "TCP vs UDP", prompt: "What is the key difference between TCP and UDP protocols?" },
                  { label: "7-Day Exam Prep", prompt: "Help me structure an effective 7-day study plan before my exam." },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-violet-950/40 text-slate-300 hover:text-white border border-white/5 text-xs text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Blank / Invalid Document Warning Banner */}
        {focusedNote && suitability && !suitability.isValid && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in" id="invalid-doc-banner">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold">{suitability.statusMessage}</p>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  No learning resources were manufactured to preserve accurate grounding.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-100 border border-amber-500/40 text-xs font-medium transition-all cursor-pointer shrink-0"
            >
              Upload Another File
            </button>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={idx}
              id={`chat-msg-${idx}`}
              className={`flex gap-2.5 sm:gap-3 animate-fade-in ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
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

                <div className="whitespace-pre-wrap font-sans break-words">{msg.content}</div>

                {/* Follow-up & Dynamic Learning Action Buttons */}
                {!isUser && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-1.5 sm:gap-2">
                    {chatMode === "study" && focusedNote && suitability?.isValid ? (
                      <>
                        {suitability.customActionPills && suitability.customActionPills.length > 0 ? (
                          suitability.customActionPills.map((pill) => (
                            <button
                              key={pill.id}
                              type="button"
                              onClick={() => handleSendMessage(pill.prompt)}
                              disabled={!!actionInProgress || loading}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            >
                              <Sparkles className="w-3 h-3 text-violet-400" /> {pill.label}
                            </button>
                          ))
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleActionClick("explain_simply")}
                              disabled={!!actionInProgress || loading}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <QuestionIcon className="w-3 h-3" /> {t.explainSimpler}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleActionClick("give_example")}
                              disabled={!!actionInProgress || loading}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" /> {t.giveExample}
                            </button>
                          </>
                        )}
                        {suitability.recommendedFeatures.includes("flashcards") && (
                          <button
                            type="button"
                            onClick={() => handleActionClick("flashcards")}
                            disabled={!!actionInProgress || loading}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Layers className="w-3 h-3" /> {t.makeFlashcards}
                          </button>
                        )}
                        {suitability.recommendedFeatures.includes("quiz") && (
                          <button
                            type="button"
                            onClick={() => handleActionClick("quiz")}
                            disabled={!!actionInProgress || loading}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Award className="w-3 h-3" /> {t.testMe}
                          </button>
                        )}
                        {suitability.recommendedFeatures.includes("flowchart") && (
                          <button
                            type="button"
                            onClick={() => handleActionClick("flowchart")}
                            disabled={!!actionInProgress || loading}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Share2 className="w-3 h-3" /> {t.showFlowchart}
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleActionClick("explain_simply")}
                          disabled={!!actionInProgress || loading}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <QuestionIcon className="w-3 h-3" /> {t.explainSimpler}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActionClick("give_example")}
                          disabled={!!actionInProgress || loading}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" /> {t.giveExample}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActionClick("test_me")}
                          disabled={!!actionInProgress || loading}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Award className="w-3 h-3" /> {t.testMe}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 border border-violet-500/30 flex items-center justify-center shadow-md shrink-0 mt-1">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          );
        })}

        {/* Lightweight Instant Thinking Indicator */}
        {loading && (
          <div className="flex gap-2.5 sm:gap-3 animate-fade-in" id="chat-thinking-indicator">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0 mt-1">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl rounded-bl-sm p-4">
              <Loader
                message={
                  chatMode === "study" && focusedNote && suitability?.isValid
                    ? t.retrievingSectionsMessage
                    : t.thinkingMessage
                }
                step={chatMode === "study" && focusedNote ? 2 : 1}
              />
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
                className="px-3 py-1 bg-rose-900/60 hover:bg-rose-900 border border-rose-700/50 rounded-lg text-rose-100 text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
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
        hasDocument={chatMode === "study" && !!focusedNote && (suitability?.isValid ?? false)}
        placeholder={
          chatMode === "simple"
            ? t.askAnythingSimplePlaceholder
            : focusedNote && suitability?.isValid
            ? `Ask anything about "${focusedNote.title}"...`
            : t.studyModePlaceholder
        }
      />
    </div>
  );
}
