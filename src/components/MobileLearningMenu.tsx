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

import { ContentSuitability } from "../services/contentAnalyzer";
import { Note } from "../types";

interface MobileLearningMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  noteSelected: boolean;
  focusedNote?: Note | null;
  suitability?: ContentSuitability | null;
}

export default function MobileLearningMenu({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  noteSelected,
  focusedNote,
  suitability,
}: MobileLearningMenuProps) {
  const { selectedLanguage } = useLanguage();
  const t = getTranslation(selectedLanguage);

  if (!isOpen) return null;

  const tools = [
    { id: "chat", label: t.studyChatbot, desc: "Fast AI chat & study companion", icon: MessageSquare },
    { id: "summary", label: t.summary, desc: "Key points & detailed breakdown", icon: FileText },
    { id: "flashcards", label: t.flashcards, desc: "Spaced repetition active practice", icon: Layers },
    { id: "quiz", label: t.quiz, desc: "Self-assessment & score tracking", icon: Award },
    { id: "mindmap", label: t.mindMap, desc: "Visual concept node graph", icon: GitGraph },
    { id: "flowchart", label: t.flowchart, desc: "Step-by-step logic flowchart", icon: Share2 },
    { id: "planner", label: t.roadmap, desc: "Curated learning journey & timeline", icon: CalendarRange },
    { id: "export", label: t.presentation, desc: "Slide decks & study exports", icon: DownloadCloud },
    { id: "videos", label: "AI Animated Teacher", desc: "Multi-slide structured lectures", icon: Video },
    { id: "analytics", label: "Analytics", desc: "Streak, goals & progress", icon: Settings },
    { id: "upload", label: t.uploadButton, desc: "Add PDF, docs, or text notes", icon: UploadCloud },
  ];

  const handleSelect = (toolId: string) => {
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
        className="w-full max-h-[85vh] bg-slate-950 light:bg-white border-t border-white/15 light:border-black/10 rounded-t-3xl flex flex-col p-5 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 light:border-black/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white light:text-slate-900">Manthan360 Learning Tools</h3>
              <p className="text-xs text-slate-400 light:text-slate-500">Select a study mode</p>
            </div>
          </div>
          <button
            type="button"
            id="mobile-menu-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tools List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 no-scrollbar" id="mobile-learning-tools-list">
          {tools.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`mobile-tool-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
                  isActive
                    ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/20"
                    : "bg-slate-900/80 light:bg-slate-50 hover:bg-slate-800/90 light:hover:bg-slate-100 border-white/10 light:border-slate-200 text-slate-200 light:text-slate-800"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-white/20 text-white shadow-inner"
                        : "bg-slate-800 light:bg-white text-violet-400 light:text-violet-600 border border-white/5 light:border-slate-200"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? "text-white" : "text-slate-100 light:text-slate-900"}`}>
                      {item.label}
                    </p>
                    <p className={`text-xs truncate ${isActive ? "text-violet-100" : "text-slate-400 light:text-slate-500"}`}>{item.desc}</p>
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
