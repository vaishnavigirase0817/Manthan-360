import React from "react";
import {
  FileText,
  Layers,
  Award,
  GitGraph,
  Share2,
  CalendarRange,
  DownloadCloud,
  UploadCloud,
  MessageSquare,
  Sparkles,
  Video,
  BarChart3,
} from "lucide-react";
import { Note } from "../types";
import { ContentSuitability } from "../services/contentAnalyzer";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations";

interface TopFeatureBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  focusedNote: Note | null;
  suitability: ContentSuitability | null;
}

export default function TopFeatureBar({
  activeTab,
  setActiveTab,
  focusedNote,
  suitability,
}: TopFeatureBarProps) {
  const { selectedLanguage } = useLanguage();
  const t = getTranslation(selectedLanguage);

  const tools = [
    { id: "chat", label: t.studyChatbot, icon: MessageSquare },
    { id: "summary", label: t.summary, icon: FileText },
    { id: "flashcards", label: t.flashcards, icon: Layers },
    { id: "quiz", label: t.quiz, icon: Award },
    { id: "mindmap", label: t.mindMap, icon: GitGraph },
    { id: "flowchart", label: t.flowchart, icon: Share2 },
    { id: "planner", label: t.roadmap, icon: CalendarRange },
    { id: "export", label: t.presentation, icon: DownloadCloud },
    { id: "videos", label: "AI Teacher", icon: Video },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "upload", label: t.uploadButton, icon: UploadCloud },
  ];

  return (
    <div
      id="top-feature-bar"
      className="w-full bg-slate-950/80 light:bg-white/95 backdrop-blur-md border-b border-white/10 light:border-black/5 px-3 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar select-none z-30 shrink-0"
    >
      <div className="flex items-center gap-1.5 min-w-max">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTab === tool.id;

          return (
            <button
              key={tool.id}
              id={`top-tool-btn-${tool.id}`}
              onClick={() => setActiveTab(tool.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-violet-600 text-white font-semibold shadow-md shadow-violet-600/25 border border-violet-500"
                  : "text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-950 hover:bg-white/10 light:hover:bg-slate-100 border border-transparent"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive
                    ? "text-white"
                    : "text-violet-400 light:text-violet-600"
                }`}
              />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {focusedNote && (
        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-white/10 light:border-black/10 text-[11px] text-slate-400 light:text-slate-600 truncate shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 light:text-violet-600 shrink-0" />
          <span className="truncate max-w-[200px]">
            {suitability?.categoryLabel || "Active"}: <strong className="text-slate-200 light:text-slate-900">{focusedNote.title}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
