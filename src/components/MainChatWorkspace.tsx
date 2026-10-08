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
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Document suitability intelligence
  const suitability: ContentSuitability | null = useMemo(() => {
    if (!focusedNote) return null;
    return analyzeContentSuitability(focusedNote.extractedText);
  }, [focusedNote?.id, focusedNote?.extractedText]);

  // Scalable Document Chunks (RAG-lite)
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

        // Welcome Greeting
        let welcomeText = "Hi! Upload your study notes, PDF, PPT or ask me anything you want to learn.";
        if (focusedNote && suitability) {
          if (!suitability.isValid) {
            welcomeText = `I processed "${focusedNote.title}", but couldn't find enough readable study content. The file might be blank or too low-resolution for text extraction.`;
          } else {
            welcomeText = `I've analyzed and indexed "${focusedNote.title}" (~${documentChunks.length} sections). Ask me any specific topic, chapter, or question about this material!`;
          }
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
  }, [activeSessionKey, focusedNote?.id, user?.uid]);

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

      // 2. Intelligent Relevant Chunk Retrieval
      if (focusedNote && suitability?.isValid && documentChunks.length > 0) {
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

      // 3. Call AI endpoint with ONLY relevant context
      const aiResponseText = await getTutorCorrection(newHistory, contextPayload);

      // Append Citation Tags if response was grounded from specific pages
      let finalAiResponse = aiResponseText;
      if (retrievedCitations.length > 0 && !finalAiResponse.includes("Source:")) {
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
          noteId: focusedNote ? focusedNote.id : "general",
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
      if (focusedNote && suitability?.isValid) {
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
      {/* Top Document Context Bar if note is focused */}
      {focusedNote && (
        <div className="sticky top-0 z-20 px-4 pt-2">
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
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 max-w-4xl mx-auto w-full no-scrollbar">
        {/* Welcome State when no messages or new session */}
        {messages.length <= 1 && !focusedNote && (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in" id="workspace-welcome-state">
            <div className="mb-4">
              <ManthanLogo size="lg" />
            </div>

            <p className="text-sm sm:text-base text-slate-300 light:text-rose-900 mt-2 max-w-md font-sans">
              Your AI-powered study companion. Upload 10–300+ page notes, PPTs, or ask anything you want to learn.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                type="button"
                id="welcome-upload-notes-btn"
                onClick={() => setActiveTab("upload")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 light:from-rose-800 light:to-rose-950 hover:from-violet-500 hover:to-indigo-500 light:hover:from-rose-700 text-white font-medium text-sm shadow-lg shadow-violet-500/20 light:shadow-rose-900/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Notes / Book PDF
              </button>

              <button
                type="button"
                id="welcome-ask-manthan-btn"
                onClick={() => handleSendMessage("How can you help me study effectively?")}
                className="px-5 py-2.5 rounded-xl bg-slate-900/90 light:bg-white hover:bg-slate-800 light:hover:bg-rose-50 text-slate-200 light:text-rose-950 border border-white/10 light:border-rose-900/20 font-medium text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-violet-400 light:text-rose-700" />
                Ask Manthan360
              </button>
            </div>

            {/* Suggested Starter Actions */}
            <div className="mt-10 w-full max-w-lg text-left bg-slate-900/60 light:bg-white border border-white/10 light:border-rose-900/15 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 light:text-rose-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-violet-400 light:text-rose-700" /> Suggested Actions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: "Explain active recall", prompt: "What is active recall and how does it improve retention?" },
                  { label: "Explain recursion simply", prompt: "Explain recursion simply with an intuitive example." },
                  { label: "TCP vs UDP differences", prompt: "What is the key difference between TCP and UDP protocols?" },
                  { label: "7-day exam prep strategy", prompt: "How do I prepare effectively for an exam in 7 days?" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-2.5 rounded-xl bg-slate-800/60 light:bg-rose-50/70 hover:bg-violet-950/40 light:hover:bg-rose-100 text-slate-300 light:text-rose-950 hover:text-white border border-white/5 light:border-rose-900/10 text-xs text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500 light:text-rose-600" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Blank / Invalid Document Warning Banner */}
        {focusedNote && suitability && !suitability.isValid && (
          <div className="p-4 rounded-2xl bg-amber-950/30 light:bg-amber-50 border border-amber-500/30 light:border-amber-300 text-amber-200 light:text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in" id="invalid-doc-banner">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 light:text-amber-700 shrink-0" />
              <div>
                <p className="text-xs font-semibold">{suitability.statusMessage}</p>
                <p className="text-[11px] text-amber-300/80 light:text-amber-800 mt-0.5">
                  No learning resources were manufactured to preserve accurate grounding.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 light:bg-amber-600 light:hover:bg-amber-700 light:text-white text-amber-100 border border-amber-500/40 text-xs font-medium transition-all cursor-pointer shrink-0"
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
              className={`flex gap-3 animate-fade-in ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 light:from-rose-800 light:to-rose-950 flex items-center justify-center shadow-md shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 light:from-rose-800 light:to-rose-950 text-white shadow-lg shadow-violet-500/10 light:shadow-rose-900/10 rounded-br-sm"
                    : "bg-slate-900/90 light:bg-white text-slate-200 light:text-slate-900 border border-white/10 light:border-rose-900/15 shadow-md rounded-bl-sm"
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/5 light:border-rose-900/10">
                    <span className="font-semibold text-xs text-violet-300 light:text-rose-900">Manthan360</span>
                    {msg.timestamp && (
                      <span className="text-[10px] text-slate-400 light:text-slate-700 font-mono">{msg.timestamp}</span>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                {/* Follow-up & Dynamic Learning Action Buttons */}
                {!isUser && (
                  <div className="mt-3 pt-3 border-t border-white/10 light:border-rose-900/10 flex flex-wrap gap-2">
                    {focusedNote && suitability?.isValid ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleActionClick("explain_simply")}
                          disabled={!!actionInProgress}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 light:bg-rose-50 hover:bg-slate-700 light:hover:bg-rose-100 text-slate-200 light:text-rose-950 border border-white/10 light:border-rose-900/20 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <QuestionIcon className="w-3 h-3" /> Explain Simpler
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActionClick("give_example")}
                          disabled={!!actionInProgress}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 light:bg-rose-50 hover:bg-slate-700 light:hover:bg-rose-100 text-slate-200 light:text-rose-950 border border-white/10 light:border-rose-900/20 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" /> Give Example
                        </button>
                        {suitability.recommendedFeatures.includes("flashcards") && (
                          <button
                            type="button"
                            onClick={() => handleActionClick("flashcards")}
                            disabled={!!actionInProgress}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 light:bg-rose-50 hover:bg-slate-700 light:hover:bg-rose-100 text-slate-200 light:text-rose-950 border border-white/10 light:border-rose-900/20 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Layers className="w-3 h-3" /> Make Flashcards
                          </button>
                        )}
                        {suitability.recommendedFeatures.includes("quiz") && (
                          <button
                            type="button"
                            onClick={() => handleActionClick("quiz")}
                            disabled={!!actionInProgress}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 light:bg-rose-50 hover:bg-slate-700 light:hover:bg-rose-100 text-slate-200 light:text-rose-950 border border-white/10 light:border-rose-900/20 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Award className="w-3 h-3" /> Test Me
                          </button>
                        )}
                        {suitability.recommendedFeatures.includes("flowchart") && (
                          <button
                            type="button"
                            onClick={() => handleActionClick("flowchart")}
                            disabled={!!actionInProgress}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 light:bg-rose-50 hover:bg-slate-700 light:hover:bg-rose-100 text-slate-200 light:text-rose-950 border border-white/10 light:border-rose-900/20 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Share2 className="w-3 h-3" /> Show Flowchart
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleActionClick("give_example")}
                          disabled={!!actionInProgress}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 light:bg-rose-50 hover:bg-slate-700 light:hover:bg-rose-100 text-slate-200 light:text-rose-950 border border-white/10 light:border-rose-900/20 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" /> Give Example
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActionClick("explain_simply")}
                          disabled={!!actionInProgress}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 light:bg-rose-50 hover:bg-slate-700 light:hover:bg-rose-100 text-slate-200 light:text-rose-950 border border-white/10 light:border-rose-900/20 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <QuestionIcon className="w-3 h-3" /> Explain Simpler
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActionClick("test_me")}
                          disabled={!!actionInProgress}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 light:bg-rose-50 hover:bg-slate-700 light:hover:bg-rose-100 text-slate-200 light:text-rose-950 border border-white/10 light:border-rose-900/20 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Award className="w-3 h-3" /> Test Me
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 light:bg-rose-900 border border-violet-500/30 light:border-rose-700 flex items-center justify-center shadow-md shrink-0 mt-1">
                  <User className="w-4 h-4 text-slate-300 light:text-white" />
                </div>
              )}
            </div>
          );
        })}

        {/* Lightweight Instant Thinking Indicator */}
        {loading && (
          <div className="flex gap-3 animate-fade-in" id="chat-thinking-indicator">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 light:from-rose-800 light:to-rose-950 flex items-center justify-center shadow-md shrink-0 mt-1">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-900/90 light:bg-white border border-white/10 light:border-rose-900/15 rounded-2xl rounded-bl-sm p-4">
              <Loader
                message={
                  focusedNote && suitability?.isValid
                    ? "Manthan360 is retrieving relevant sections from your notes..."
                    : "Manthan360 is thinking…"
                }
                step={focusedNote ? 2 : 1}
              />
            </div>
          </div>
        )}

        {/* Error Notification with Inline Retry */}
        {error && (
          <div className="p-3 bg-rose-950/40 light:bg-rose-100 border border-rose-500/30 light:border-rose-300 rounded-xl text-rose-300 light:text-rose-900 text-xs flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 light:text-rose-700" />
              <span>{error}</span>
            </div>
            {lastQuery && (
              <button
                type="button"
                id="chat-retry-btn"
                onClick={handleRetryLastQuery}
                disabled={loading}
                className="px-3 py-1 bg-rose-900/60 light:bg-rose-800 hover:bg-rose-900 light:hover:bg-rose-900 border border-rose-700/50 rounded-lg text-rose-100 text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
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
        hasDocument={!!focusedNote && (suitability?.isValid ?? false)}
        placeholder={
          focusedNote && suitability?.isValid
            ? `Ask anything about "${focusedNote.title}" or type a topic...`
            : "Ask anything about your notes or type a topic..."
        }
      />
    </div>
  );
}
