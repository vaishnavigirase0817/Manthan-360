import { useEffect, useState, lazy, Suspense } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FirebaseUser, Note } from "./types";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MobileLearningMenu from "./components/MobileLearningMenu";
import MainChatWorkspace from "./components/MainChatWorkspace";
import Loader from "./components/Loader";
import { checkAndTickStreak } from "./services/gamification";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { MessageSquare, X, Sparkles } from "lucide-react";

// Code splitting / Route-based lazy loading for heavy workspace pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UploadNotes = lazy(() => import("./pages/UploadNotes"));
const Summary = lazy(() => import("./pages/Summary"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const QuizRoom = lazy(() => import("./pages/Quiz"));
const Tutor = lazy(() => import("./pages/Tutor"));
const MindMap = lazy(() => import("./pages/MindMap"));
const Flowchart = lazy(() => import("./pages/Flowchart"));
const StudyPlanner = lazy(() => import("./pages/StudyPlanner"));
const ProgressAnalytics = lazy(() => import("./pages/ProgressAnalytics"));
const LearningVideos = lazy(() => import("./pages/LearningVideos"));
const ExportHub = lazy(() => import("./pages/ExportHub"));

function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [focusedNote, setFocusedNote] = useState<Note | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  
  const navigate = useNavigate();

  // Load recent notes whenever user is active
  useEffect(() => {
    if (!user) {
      setRecentNotes([]);
      return;
    }

    const fetchRecentNotes = async () => {
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
        console.error("Failed to load recent notes for sidebar:", e);
      }
    };

    fetchRecentNotes();
  }, [user, focusedNote]);

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
          setActiveTab("dashboard");
          navigate("/", { replace: true });
        }
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSelectNote = (note: Note) => {
    setFocusedNote(note);
    setActiveTab("chat");
  };

  const handleStartNewSession = () => {
    setFocusedNote(null);
    setActiveTab("chat");
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
      <div className="min-h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden" id="auth-loading-gate">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-600/10 rounded-full blur-[100px]" />
        <Loader message="Verifying secure student authorization session..." step={1} />
      </div>
    );
  }

  const isConversationalView = activeTab === "chat" || activeTab === "tutor";

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
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

        {/* Protected Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={
            !user ? (
              <Navigate to="/" replace />
            ) : (
              <div className="min-h-screen bg-[#020617] flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200 relative text-slate-100 overflow-x-hidden" id="manthan-360-app">
                {/* Background Decorative Elements */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none z-0" />

                {/* Modern Fixed Navbar */}
                <Navbar
                  user={user}
                  onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                  onOpenMobileTools={() => setMobileToolsOpen(true)}
                />

                {/* Mobile Drawer (When hamburger clicked on small screens) */}
                {mobileSidebarOpen && (
                  <div
                    className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm md:hidden flex animate-fade-in"
                    onClick={() => setMobileSidebarOpen(false)}
                  >
                    <div
                      className="w-72 bg-slate-950 border-r border-white/10 h-full p-4 flex flex-col shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-bold text-white">Manthan360</span>
                        </div>
                        <button
                          onClick={() => setMobileSidebarOpen(false)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <Sidebar
                        activeTab={activeTab}
                        setActiveTab={(tab) => {
                          setActiveTab(tab);
                          setMobileSidebarOpen(false);
                        }}
                        noteSelected={!!focusedNote}
                        onNewSession={() => {
                          handleStartNewSession();
                          setMobileSidebarOpen(false);
                        }}
                        recentNotes={recentNotes}
                        onSelectRecentNote={(n) => {
                          handleSelectNote(n);
                          setMobileSidebarOpen(false);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Mobile 3-Dot Learning Tools Menu */}
                <MobileLearningMenu
                  isOpen={mobileToolsOpen}
                  onClose={() => setMobileToolsOpen(false)}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  noteSelected={!!focusedNote}
                />

                {/* Main Workspace Layout */}
                <div className="flex-1 flex relative z-10 overflow-hidden" id="applet-core-shell">
                  {/* Desktop Collapsible Navigation Sidebar */}
                  <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    noteSelected={!!focusedNote}
                    isCollapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    onNewSession={handleStartNewSession}
                    recentNotes={recentNotes}
                    onSelectRecentNote={handleSelectNote}
                  />

                  {/* Primary View Workspace */}
                  <main className="flex-1 flex flex-col overflow-y-auto relative" id="applet-viewport">
                    {/* Top Switcher Bar when inside a dedicated tool */}
                    {!isConversationalView && activeTab !== "dashboard" && (
                      <div className="px-6 py-2.5 bg-slate-900/40 border-b border-white/5 flex items-center justify-between text-xs sticky top-0 z-20 backdrop-blur-md">
                        <button
                          type="button"
                          id="return-to-chat-btn"
                          onClick={() => setActiveTab("chat")}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 transition-all font-medium cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Conversational Study Companion</span>
                        </button>

                        {focusedNote && (
                          <span className="text-slate-400 truncate max-w-xs hidden sm:inline">
                            Active: <strong className="text-slate-200">{focusedNote.title}</strong>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex-1 flex flex-col" id="applet-viewport-inner">
                      {/* Conversational AI Workspace */}
                      {isConversationalView && (
                        <MainChatWorkspace
                          user={user}
                          focusedNote={focusedNote}
                          onSelectNote={handleSelectNote}
                          onUpdateNote={setFocusedNote}
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          onNewSession={handleStartNewSession}
                        />
                      )}

                      {activeTab === "dashboard" && (
                        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
                          <Dashboard
                            user={user}
                            onSelectNote={handleSelectNote}
                            focusedNote={focusedNote}
                            onUpdateNote={setFocusedNote}
                            setActiveTab={setActiveTab}
                          />
                        </div>
                      )}
                      
                      {activeTab === "upload" && (
                        <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
                          <UploadNotes
                            user={user}
                            onUploaded={handleSelectNote}
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
    <Router>
      <AppContent />
    </Router>
  );
}
