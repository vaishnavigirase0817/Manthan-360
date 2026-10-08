import {
  FileText,
  MessageSquare,
  CalendarRange,
  Layers,
  Award,
  GitGraph,
  Share2,
  DownloadCloud,
  Video,
  UploadCloud,
  Settings,
  X,
  Sparkles,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations";

interface MobileLearningMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  noteSelected: boolean;
}

export default function MobileLearningMenu({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  noteSelected,
}: MobileLearningMenuProps) {
  const { selectedLanguage } = useLanguage();
  const t = getTranslation(selectedLanguage);

  if (!isOpen) return null;

  const tools = [
    { id: "summary", label: "AI Summary", desc: "Key points & detailed breakdown", icon: FileText, requiresNote: true },
    { id: "tutor", label: "Study Buddy", desc: "Interactive conversational AI tutor", icon: MessageSquare, requiresNote: true },
    { id: "planner", label: "Study Roadmap", desc: "Curated learning journey & timeline", icon: CalendarRange, requiresNote: true },
    { id: "flashcards", label: "Flashcards", desc: "Spaced repetition active practice", icon: Layers, requiresNote: true },
    { id: "quiz", label: "Active Recall Quiz", desc: "Self-assessment & score tracking", icon: Award, requiresNote: true },
    { id: "mindmap", label: "Brainstorm Mind Map", desc: "Visual concept node graph", icon: GitGraph, requiresNote: true },
    { id: "flowchart", label: "Interactive Concept Flow", desc: "Step-by-step logic flowchart", icon: Share2, requiresNote: true },
    { id: "export", label: "AI Presentation", desc: "Slide decks & study exports", icon: DownloadCloud, requiresNote: true },
    { id: "videos", label: "AI Animated Teacher", desc: "Multi-slide structured lectures", icon: Video, requiresNote: true },
    { id: "upload", label: "Upload Notes", desc: "Add PDF, docs, or text notes", icon: UploadCloud, requiresNote: false },
    { id: "analytics", label: "Settings & Analytics", desc: "Streak, goals & preferences", icon: Settings, requiresNote: false },
  ];

  const handleSelect = (toolId: string, locked: boolean) => {
    if (locked) return;
    setActiveTab(toolId);
    onClose();
  };

  return (
    <div
      id="mobile-learning-menu-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col justify-end md:hidden animate-fade-in"
      onClick={onClose}
    >
      <div
        id="mobile-learning-menu-panel"
        className="w-full max-h-[85vh] bg-[#090d1f] border-t border-white/15 rounded-t-3xl flex flex-col p-5 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manthan360 Learning Tools</h3>
              <p className="text-xs text-slate-400">Select a study mode</p>
            </div>
          </div>
          <button
            type="button"
            id="mobile-menu-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tools List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 no-scrollbar" id="mobile-learning-tools-list">
          {tools.map((item) => {
            const Icon = item.icon;
            const locked = item.requiresNote && !noteSelected;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`mobile-tool-${item.id}`}
                onClick={() => handleSelect(item.id, locked)}
                disabled={locked}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all border ${
                  isActive
                    ? "bg-violet-600/20 border-violet-500/40 text-white shadow-md"
                    : locked
                    ? "bg-slate-900/40 border-white/5 text-slate-600 cursor-not-allowed opacity-50"
                    : "bg-slate-900/80 hover:bg-slate-800/90 border-white/10 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                        : locked
                        ? "bg-slate-800 text-slate-600"
                        : "bg-slate-800 text-violet-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? "text-white" : locked ? "text-slate-500" : "text-slate-100"}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{item.desc}</p>
                  </div>
                </div>

                {locked ? (
                  <span className="text-[10px] bg-slate-800 px-2 py-1 rounded-md text-slate-400 font-mono">
                    Needs Note
                  </span>
                ) : (
                  <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? "text-violet-400" : "text-slate-500"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
