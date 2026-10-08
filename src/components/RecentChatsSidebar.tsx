import React, { useState } from "react";
import { PlusCircle, MessageSquare, Clock, Trash2, BookOpen, PanelLeftClose, PanelLeft } from "lucide-react";
import { ChatSession, Note } from "../types";
import ManthanLogo from "./ManthanLogo";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations";

interface RecentChatsSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession?: (sessionId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  recentNotes?: Note[];
  onSelectNote?: (note: Note) => void;
}

export default function RecentChatsSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isCollapsed = false,
  onToggleCollapse,
  recentNotes = [],
  onSelectNote,
}: RecentChatsSidebarProps) {
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const { selectedLanguage } = useLanguage();
  const t = getTranslation(selectedLanguage);

  const formatSessionTitle = (session: ChatSession) => {
    if (session.title && session.title.trim().length > 0) {
      return session.title.slice(0, 30);
    }
    if (session.messages && session.messages.length > 1) {
      const firstUserMsg = session.messages.find((m) => m.role === "user");
      if (firstUserMsg && firstUserMsg.content) {
        return firstUserMsg.content.slice(0, 30);
      }
    }
    return t.studyChatbot;
  };

  return (
    <aside
      id="recent-chats-sidebar"
      className={`hidden md:flex flex-col bg-slate-950/90 backdrop-blur-xl border-r border-white/10 font-sans transition-all duration-300 z-20 select-none ${
        isCollapsed ? "w-18 p-3 items-center" : "w-64 p-4"
      }`}
    >
      {/* Top Brand & Collapse Toggle */}
      <div
        className={`flex items-center mb-4 py-1.5 ${
          isCollapsed ? "justify-center w-full" : "justify-between"
        }`}
        id="sidebar-brand-header"
      >
        <ManthanLogo iconOnly={isCollapsed} size={isCollapsed ? "sm" : "md"} />

        {onToggleCollapse && !isCollapsed && (
          <button
            type="button"
            id="sidebar-toggle-btn"
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Primary Action: + New Chat */}
      <div className="mb-4 w-full" id="new-chat-button-container">
        <button
          type="button"
          id="new-chat-btn"
          onClick={onNewChat}
          title="Start a New Study Session"
          className={`w-full flex items-center justify-center gap-2 rounded-xl font-medium text-xs transition-all shadow-md cursor-pointer ${
            isCollapsed
              ? "p-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
              : "px-3.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/20"
          }`}
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{t.newChatBtn}</span>}
        </button>
      </div>

      {/* Recent Conversations List */}
      <div className="flex-1 overflow-y-auto no-scrollbar w-full space-y-1" id="recent-chats-list">
        {!isCollapsed && (
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" /> {t.recentChatsTitle}
          </p>
        )}

        {sessions.length === 0 ? (
          !isCollapsed && (
            <div className="p-3 text-center text-xs text-slate-500">
              No recent chats. Start by typing a question or uploading notes.
            </div>
          )
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const title = formatSessionTitle(session);

            return (
              <div
                key={session.id}
                onMouseEnter={() => setHoveredSessionId(session.id)}
                onMouseLeave={() => setHoveredSessionId(null)}
                className={`w-full flex items-center justify-between rounded-xl text-xs font-medium transition-all group relative cursor-pointer ${
                  isCollapsed ? "p-3 justify-center" : "px-3 py-2"
                } ${
                  isActive
                    ? "bg-violet-600/20 text-white border border-violet-500/40 shadow-sm font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
                onClick={() => onSelectSession(session.id)}
                title={title}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? "text-violet-400" : "text-slate-400"
                    }`}
                  />
                  {!isCollapsed && <span className="truncate flex-1">{title}</span>}
                </div>

                {!isCollapsed && onDeleteSession && hoveredSessionId === session.id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    title="Delete Chat"
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })
        )}

        {/* Uploaded Materials / Recent Notes Section */}
        {!isCollapsed && recentNotes.length > 0 && (
          <div className="pt-4 space-y-1 border-t border-white/5 mt-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-slate-400" /> {t.studyNotes}
            </p>
            {recentNotes.slice(0, 4).map((note) => (
              <button
                key={note.id}
                onClick={() => onSelectNote && onSelectNote(note)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 truncate transition-colors flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{note.title || "Untitled Note"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {isCollapsed && onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Expand Sidebar"
          className="p-2 text-slate-400 light:text-rose-800 hover:text-white rounded-lg hover:bg-white/10 light:hover:bg-rose-100 mt-auto cursor-pointer"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}
    </aside>
  );
}
