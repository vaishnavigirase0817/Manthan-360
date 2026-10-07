import React, { useState } from "react";
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Layers,
  Award,
  MessageSquare,
  GitGraph,
  Share2,
  CalendarRange,
  Video,
  DownloadCloud,
  Settings,
  PlusCircle,
  PanelLeftClose,
  PanelLeft,
  BookOpen,
  Sparkles,
  HelpCircle,
  Clock,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { TRANSLATIONS } from "../translations";
import { Note } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  noteSelected: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNewSession?: () => void;
  recentNotes?: Note[];
  onSelectRecentNote?: (note: Note) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  noteSelected,
  isCollapsed = false,
  onToggleCollapse,
  onNewSession,
  recentNotes = [],
  onSelectRecentNote,
}: SidebarProps) {
  const { selectedLanguage } = useLanguage();
  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.English;

  const learningTools = [
    { id: "dashboard", label: "Overview & Library", icon: LayoutDashboard, requiresNote: false, tooltip: "Overview & Library" },
    { id: "upload", label: "Upload Notes", icon: UploadCloud, requiresNote: false, tooltip: "Upload PDFs & Study Material" },
    { id: "summary", label: "AI Summary", icon: FileText, requiresNote: true, tooltip: "AI Summary" },
    { id: "tutor", label: "Study Buddy", icon: MessageSquare, requiresNote: true, tooltip: "Conversational Study Buddy" },
    { id: "planner", label: "Study Roadmap", icon: CalendarRange, requiresNote: true, tooltip: "Study Roadmap & Plan" },
    { id: "flashcards", label: "Flashcards", icon: Layers, requiresNote: true, tooltip: "Flashcards & Spaced Repetition" },
    { id: "quiz", label: "Active Recall Quiz", icon: Award, requiresNote: true, tooltip: "Active Recall Quiz" },
    { id: "mindmap", label: "Brainstorm Mind Map", icon: GitGraph, requiresNote: true, tooltip: "Mind Map Graph" },
    { id: "flowchart", label: "Concept Flowchart", icon: Share2, requiresNote: true, tooltip: "Interactive Flowchart" },
    { id: "export", label: "AI Presentation", icon: DownloadCloud, requiresNote: true, tooltip: "AI Slide Presentation" },
    { id: "videos", label: "AI Animated Teacher", icon: Video, requiresNote: true, tooltip: "AI Animated Lecture" },
  ];

  const bottomItems = [
    { id: "analytics", label: "Settings & Analytics", icon: Settings, requiresNote: false, tooltip: "Progress & Settings" },
  ];

  return (
    <aside
      id="side-bar"
      className={`hidden md:flex flex-col bg-slate-950/80 backdrop-blur-xl border-r border-white/10 font-sans text-slate-100 transition-all duration-300 z-20 select-none ${
        isCollapsed ? "w-20 p-3 items-center" : "w-64 p-4"
      }`}
    >
      {/* Brand Header & Toggle */}
      <div
        className={`flex items-center mb-4 py-1.5 ${
          isCollapsed ? "justify-center w-full" : "justify-between"
        }`}
        id="sidebar-logo-container"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 block truncate">
                Manthan360
              </span>
              <span className="text-[10px] text-violet-400/90 font-mono tracking-wider block">
                AI Companion
              </span>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            id="sidebar-collapse-toggle"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Primary Action: + New Study Session */}
      <div className="mb-4 w-full" id="sidebar-primary-action">
        <button
          type="button"
          id="sidebar-new-session-btn"
          onClick={() => {
            if (onNewSession) {
              onNewSession();
            } else {
              setActiveTab("dashboard");
            }
          }}
          title="Start a New Study Session"
          className={`w-full flex items-center justify-center gap-2.5 rounded-xl font-medium text-xs transition-all shadow-md cursor-pointer ${
            isCollapsed
              ? "p-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white"
              : "px-3.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/20"
          }`}
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>New Study Session</span>}
        </button>
      </div>

      {/* Learning Tools Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar w-full space-y-1" id="sidebar-nav">
        {!isCollapsed && (
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1">
            Learning Tools
          </p>
        )}

        {learningTools.map((item) => {
          const Icon = item.icon;
          const locked = item.requiresNote && !noteSelected;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`sidebar-item-${item.id}`}
              onClick={() => {
                if (!locked) {
                  setActiveTab(item.id);
                }
              }}
              disabled={locked}
              title={item.tooltip}
              className={`w-full flex items-center gap-3 rounded-xl text-xs font-medium transition-all text-left relative cursor-pointer ${
                isCollapsed ? "p-3 justify-center" : "px-3 py-2.5"
              } ${
                isActive
                  ? "bg-violet-600/20 text-white border border-violet-500/40 shadow-sm font-semibold"
                  : locked
                  ? "opacity-35 cursor-not-allowed text-slate-600 hover:bg-transparent"
                  : "hover:bg-white/5 text-slate-300 hover:text-white border border-transparent"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-violet-400" : locked ? "text-slate-600" : "text-slate-400"
                }`}
              />
              {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!isCollapsed && locked && (
                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                  Note Req.
                </span>
              )}
              {isActive && (
                <div
                  className={`w-1.5 h-1.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400 ${
                    isCollapsed ? "absolute top-2 right-2" : "shrink-0"
                  }`}
                />
              )}
            </button>
          );
        })}

        {/* Recent Sessions list (if available and not collapsed) */}
        {!isCollapsed && recentNotes.length > 0 && (
          <div className="pt-4 space-y-1 border-t border-white/5 mt-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-400" /> Recent Notes
            </p>
            {recentNotes.slice(0, 4).map((note) => (
              <button
                key={note.id}
                id={`sidebar-recent-note-${note.id}`}
                onClick={() => onSelectRecentNote && onSelectRecentNote(note)}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 truncate transition-colors flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{note.title || "Untitled Note"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lower Section */}
      <div className="w-full pt-3 border-t border-white/10 space-y-1 mt-auto" id="sidebar-bottom-section">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              title={item.tooltip}
              className={`w-full flex items-center gap-3 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                isCollapsed ? "p-3 justify-center" : "px-3 py-2.5"
              } ${
                isActive
                  ? "bg-white/10 text-white border border-white/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0 text-slate-400" />
              {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
