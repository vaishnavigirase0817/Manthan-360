import { useEffect, useState, lazy, Suspense } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./services/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { FirebaseUser, Note, ChatSession } from "./types";
import Navbar from "./components/Navbar";
import TopFeatureBar from "./components/TopFeatureBar";
import RecentChatsSidebar from "./components/RecentChatsSidebar";
import RecentChatsMobileDrawer from "./components/RecentChatsMobileDrawer";
import MobileLearningMenu from "./components/MobileLearningMenu";
import MainChatWorkspace from "./components/MainChatWorkspace";
import Loader from "./components/Loader";
import { checkAndTickStreak } from "./services/gamification";
import { ThemeProvider } from "./context/ThemeContext";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { MessageSquare, Sparkles } from "lucide-react";
import { analyzeContentSuitability } from "./services/contentAnalyzer";

// Code splitting / Route-based lazy loading for heavy workspace pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const UploadNotes = lazy(() => import("./pages/UploadNotes"));
const Summary = lazy(() => import("./pages/Summary"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const QuizRoom = lazy(() => import("./pages/Quiz"));
const MindMap = lazy(() => import("./pages/MindMap"));
const Flowchart = lazy(() => import("./pages/Flowchart"));
const StudyPlanner = lazy(() => import("./pages/StudyPlanner"));
const ProgressAnalytics = lazy(() => import("./pages/ProgressAnalytics"));
const LearningVideos = lazy(() => import("./pages/LearningVideos"));
const ExportHub = lazy(() => import("./pages/ExportHub"));

import { useLanguage } from "./context/LanguageContext";
import { getTranslation } from "./translations";

function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [focusedNote, setFocusedNote] = useState<Note | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileLearningOpen, setMobileLearningOpen] = useState(false);
  const [mobileRecentChatsOpen, setMobileRecentChatsOpen] = useState(false);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  
  const navigate = useNavigate();
  const { selectedLanguage } = useLanguage();
  const t = getTranslation(selectedLanguage);

  // Content suitability for top feature bar status
  const suitability = focusedNote ? analyzeContentSuitability(focusedNote.extractedText) : null;

  // Load chat sessions from Firestore
  const fetchChatSessions = async () => {
    if (!user) {
      setChatSessions([]);
      return;
    }
    try {
      const q = query(
        collection(db, "chatSessions"),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const loaded: ChatSession[] = [];
      snap.forEach((d) => {
        const data = d.data();
        loaded.push({
          id: data.id || d.id,
          noteId: data.noteId || "general",
          title: data.title || "Study Conversation",
          messages: data.messages || [],
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });
      loaded.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      setChatSessions(loaded);
    } catch (e) {
      console.error("Failed to load chat sessions:", e);
    }
  };

  // Load recent notes whenever user is active
  const fetchRecentNotes = async () => {
    if (!user) {
      setRecentNotes([]);
      return;
    }
    try {
      const q = query(
        collection(db, "notes"),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const loaded: Note[] = [];
      snap.forEach((d) => loaded.push(d.data() as Note));
      loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentNotes(loaded);
    } catch (e) {
      console.error("Failed to load recent notes:", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentNotes();
      fetchChatSessions();
    }
  }, [user]);

  // Monitor Auth Session
  useEffect(() => {
    const storedDemo = localStorage.getItem("manthan360_demo_user");
    if (storedDemo) {
      try {
        const parsedDemo = JSON.parse(storedDemo);
        if (parsedDemo && parsedDemo.uid) {
          setUser(parsedDemo);
          setAuthChecking(false);
          if (window.location.pathname === "/") {
            navigate("/dashboard", { replace: true });
          }
        }
      } catch (err) {
        localStorage.removeItem("manthan360_demo_user");
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const formattedUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        };
        setUser(formattedUser);
        localStorage.removeItem("manthan360_demo_user");
        
        checkAndTickStreak(currentUser.uid).catch((err) => console.error("Streak sync failure:", err));
        navigate("/dashboard", { replace: true });
      } else {
        if (!localStorage.getItem("manthan360_demo_user")) {
          setUser(null);
          setFocusedNote(null);
          setActiveTab("chat");
          navigate("/", { replace: true });
        }
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSelectNote = (note: Note) => {
    setFocusedNote(note);
    if (user) {
      setCurrentSessionId(`chat_${note.id}_${user.uid}`);
    }
    setActiveTab("chat");
  };

  const handleStartNewSession = () => {
    setFocusedNote(null);
    if (user) {
      setCurrentSessionId(`chat_session_${Date.now()}_${user.uid}`);
    } else {
      setCurrentSessionId(`guest_${Date.now()}`);
    }
    setActiveTab("chat");
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session && session.noteId && session.noteId !== "general") {
      const matchedNote = recentNotes.find((n) => n.id === session.noteId);
      if (matchedNote) {
        setFocusedNote(matchedNote);
      }
    } else {
      setFocusedNote(null);
    }
    setActiveTab("chat");
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteDoc(doc(db, "chatSessions", sessionId));
      setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        handleStartNewSession();
      }
    } catch (e) {
      console.error("Failed to delete chat session:", e);
    }
  };

  const handleLoginSuccess = (u: any) => {
    if (u.uid === "demo_student_manthan360") {
      try {
        localStorage.setItem("manthan360_demo_user", JSON.stringify(u));
      } catch (err) {
        console.error("Local storage sync error:", err);
      }
    }
    setUser(u);
    navigate("/dashboard", { replace: true });
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#020617] light:bg-[#fdf5f6] flex items-center justify-center relative overflow-hidden" id="auth-loading-gate">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 light:bg-rose-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-600/10 light:bg-rose-800/10 rounded-full blur-[100px]" />
        <Loader message="Verifying secure Manthan360 session..." step={1} />
      </div>
    );
  }

  const isConversationalView = activeTab === "chat";

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020617] light:bg-[#fdf5f6] flex items-center justify-center">
          <Loader message="Loading Manthan360 Workspace..." step={2} />
        </div>
      }
    >
      <Routes>
        {/* Public Landing Page Route */}
        <Route 
          path="/" 
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />

        {/* Protected Dashboard / AI Workspace Route */}
        <Route 
          path="/dashboard" 
          element={
            !user ? (
              <Navigate to="/" replace />
            ) : (
              <div className="h-screen max-h-screen bg-[#020617] light:bg-[#f8fafc] flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200 relative text-slate-100 light:text-slate-900 overflow-hidden" id="manthan-360-app">
                {/* Background Decorative Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 light:bg-violet-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-600/20 light:bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

                {/* Modern Fixed Top Navbar */}
                <Navbar
                  user={user}
                  onOpenLearningTools={() => setMobileLearningOpen(true)}
                  onOpenRecentChats={() => setMobileRecentChatsOpen(true)}
                />

                {/* Top Learning Features Bar */}
                <TopFeatureBar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  focusedNote={focusedNote}
                  suitability={suitability}
                />

                {/* Mobile Slide-over Drawer 1: Learning Tools [ ⋮ ] */}
                <MobileLearningMenu
                  isOpen={mobileLearningOpen}
                  onClose={() => setMobileLearningOpen(false)}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  noteSelected={!!focusedNote}
                  focusedNote={focusedNote}
                  suitability={suitability}
                />

                {/* Mobile Slide-over Drawer 2: Recent Chats [ ⋮ ] */}
                <RecentChatsMobileDrawer
                  isOpen={mobileRecentChatsOpen}
                  onClose={() => setMobileRecentChatsOpen(false)}
                  sessions={chatSessions}
                  activeSessionId={currentSessionId}
                  onSelectSession={handleSelectSession}
                  onNewChat={handleStartNewSession}
                  onDeleteSession={handleDeleteSession}
                />

                {/* Main Unified Workspace Layout */}
                <div className="flex-1 flex relative z-10 overflow-hidden" id="applet-core-shell">
                  {/* Desktop Left: Recent Chats Sidebar */}
                  <RecentChatsSidebar
                    sessions={chatSessions}
                    activeSessionId={currentSessionId}
                    onSelectSession={handleSelectSession}
                    onNewChat={handleStartNewSession}
                    onDeleteSession={handleDeleteSession}
                    isCollapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    recentNotes={recentNotes}
                    onSelectNote={handleSelectNote}
                  />

                  {/* Primary Center Viewport */}
                  <main
                    className={`flex-1 flex flex-col h-full relative bg-[#020617] light:bg-[#f8fafc] ${
                      isConversationalView ? "overflow-hidden" : "overflow-y-auto"
                    }`}
                    id="applet-viewport"
                  >
                    {/* Top Switcher Bar when inside a dedicated tool */}
                    {!isConversationalView && (
                      <div className="px-4 sm:px-6 py-2.5 bg-[#020617] light:bg-white border-b border-slate-800/80 light:border-slate-200 flex items-center justify-between text-xs sticky top-0 z-20 backdrop-blur-md shadow-sm">
                        <button
                          type="button"
                          id="return-to-chat-btn"
                          onClick={() => setActiveTab("chat")}
                          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 light:text-violet-700 border border-violet-500/30 transition-all font-medium cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-violet-400 light:text-violet-600" />
                          <span>{t.returnToChat}</span>
                        </button>

                        {focusedNote && (
                          <span className="text-slate-400 light:text-slate-600 truncate max-w-xs hidden sm:inline">
                            Document: <strong className="text-slate-200 light:text-slate-900">{focusedNote.title}</strong>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex-1 flex flex-col min-h-0" id="applet-viewport-inner">
                      {/* Primary Document-Grounded Chatbot Workspace */}
                      {isConversationalView && (
                        <MainChatWorkspace
                          user={user}
                          focusedNote={focusedNote}
                          onSelectNote={handleSelectNote}
                          onUpdateNote={setFocusedNote}
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          onNewSession={handleStartNewSession}
                          currentSessionId={currentSessionId}
                          onSessionUpdated={fetchChatSessions}
                        />
                      )}
                      
                      {activeTab === "upload" && (
                        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
                          <UploadNotes
                            user={user}
                            onUploaded={(n) => {
                              handleSelectNote(n);
                              fetchRecentNotes();
                            }}
                            setActiveTab={setActiveTab}
                          />
                        </div>
                      )}

                      {activeTab === "summary" && (
                        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
                          <Summary
                            focusedNote={focusedNote}
                            onUpdateNote={setFocusedNote}
                          />
                        </div>
                      )}

                      {activeTab === "flashcards" && (
                        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
                          <Flashcards
                            focusedNote={focusedNote}
                            onUpdateNote={setFocusedNote}
                          />
                        </div>
                      )}

                      {activeTab === "quiz" && (
                        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
                          <QuizRoom
                            focusedNote={focusedNote}
                            user={user}
                          />
                        </div>
                      )}

                      {activeTab === "mindmap" && (
                        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
                          <MindMap
                            focusedNote={focusedNote}
                            onUpdateNote={setFocusedNote}
                          />
                        </div>
                      )}

                      {activeTab === "flowchart" && (
                        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
                          <Flowchart
                            focusedNote={focusedNote}
                            onUpdateNote={setFocusedNote}
                          />
                        </div>
                      )}

                      {activeTab === "planner" && (
                        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
                          <StudyPlanner
                            focusedNote={focusedNote}
                            onUpdateNote={setFocusedNote}
                          />
                        </div>
                      )}

                      {activeTab === "analytics" && (
                        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
                          <ProgressAnalytics
                            user={user}
                            focusedNote={focusedNote}
                            onUpdateNote={setFocusedNote}
                          />
                        </div>
                      )}

                      {activeTab === "videos" && (
                        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
                          <LearningVideos
                            focusedNote={focusedNote}
                            onUpdateNote={setFocusedNote}
                            user={user}
                          />
                        </div>
                      )}

                      {activeTab === "export" && (
                        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
                          <ExportHub
                            focusedNote={focusedNote}
                            onUpdateNote={setFocusedNote}
                          />
                        </div>
                      )}
                    </div>
                  </main>
                </div>
              </div>
            )
          } 
        />

        {/* Fallback Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}
