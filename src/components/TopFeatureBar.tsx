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
  Lock,
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
    { id: "chat", label: t.studyChatbot, icon: MessageSquare, requiresNote: false },
    { id: "summary", label: t.summary, icon: FileText, requiresNote: true },
    { id: "flashcards", label: t.flashcards, icon: Layers, requiresNote: true },
    { id: "quiz", label: t.quiz, icon: Award, requiresNote: true },
    { id: "mindmap", label: t.mindMap, icon: GitGraph, requiresNote: true },
    { id: "flowchart", label: t.flowchart, icon: Share2, requiresNote: true },
    { id: "planner", label: t.roadmap, icon: CalendarRange, requiresNote: true },
    { id: "export", label: t.presentation, icon: DownloadCloud, requiresNote: true },
    { id: "upload", label: t.uploadButton, icon: UploadCloud, requiresNote: false },
  ];

  return (
    <div
      id="top-feature-bar"
      className="w-full bg-slate-950/70 light:bg-white/90 backdrop-blur-md border-b border-white/10 light:border-rose-900/10 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar select-none z-30"
    >
      <div className="flex items-center gap-1.5 min-w-max">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isNoteRequired = tool.requiresNote;
          const isLocked = isNoteRequired && (!focusedNote || !suitability?.isValid);
          const isActive = activeTab === tool.id;

          return (
            <button
              key={tool.id}
              id={`top-tool-btn-${tool.id}`}
              onClick={() => {
                if (!isLocked) {
                  setActiveTab(tool.id);
                }
              }}
              disabled={isLocked}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-violet-600/25 light:bg-rose-100 text-white light:text-rose-950 border border-violet-500/40 light:border-rose-900/30 font-semibold shadow-sm"
                  : isLocked
                  ? "opacity-35 text-slate-500 light:text-slate-400 cursor-not-allowed bg-transparent"
                  : "text-slate-300 light:text-rose-900 hover:text-white light:hover:text-rose-950 hover:bg-white/5 light:hover:bg-rose-50 border border-transparent"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive
                    ? "text-violet-400 light:text-rose-800"
                    : isLocked
                    ? "text-slate-600 light:text-slate-400"
                    : "text-slate-400 light:text-rose-700"
                }`}
              />
              <span>{tool.label}</span>
              {isLocked && <Lock className="w-2.5 h-2.5 opacity-60" />}
            </button>
          );
        })}
      </div>

      {focusedNote && suitability?.isValid && (
        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-white/10 light:border-rose-900/10 text-[11px] text-slate-400 light:text-rose-900 truncate shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 light:text-rose-700 shrink-0" />
          <span className="truncate max-w-[200px]">
            Context: <strong className="text-slate-200 light:text-rose-950">{focusedNote.title}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
