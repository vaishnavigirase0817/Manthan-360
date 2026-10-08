import React from "react";
import { X, MessageSquare, Clock, PlusCircle, Trash2, Globe } from "lucide-react";
import { ChatSession } from "../types";
import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";
import { getTranslation } from "../translations";

interface RecentChatsMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession?: (sessionId: string) => void;
}

export default function RecentChatsMobileDrawer({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: RecentChatsMobileDrawerProps) {
  const { selectedLanguage, setLanguage } = useLanguage();
  const t = getTranslation(selectedLanguage);

  if (!isOpen) return null;

  const formatSessionTitle = (session: ChatSession) => {
    if (session.title && session.title.trim().length > 0) {
      return session.title.slice(0, 36);
    }
    if (session.messages && session.messages.length > 1) {
      const firstUserMsg = session.messages.find((m) => m.role === "user");
      if (firstUserMsg && firstUserMsg.content) {
        return firstUserMsg.content.slice(0, 36);
      }
    }
    return t.studyChatbot;
  };

  return (
    <div
      id="recent-chats-mobile-drawer"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-80 bg-[#090d1f] border-l border-white/10 h-full p-4 flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            <span className="font-bold text-sm text-white">{t.recentChatsTitle}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Language Selector */}
        <div className="mb-3 p-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Globe className="w-4 h-4 text-violet-400 shrink-0" />
            <span>Language</span>
          </div>
          <select
            value={selectedLanguage}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-950 border border-white/10 text-xs font-medium text-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-950 text-slate-200">
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>

        {/* New Chat Action */}
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 p-3 mb-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-medium text-xs shadow-md shadow-violet-500/20 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.newChatBtn}</span>
        </button>

        {/* List of sessions */}
        <div className="flex-1 overflow-y-auto space-y-1.5 no-scrollbar">
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              No recent conversations yet.
            </p>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const title = formatSessionTitle(session);

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs transition-all border cursor-pointer ${
                    isActive
                      ? "bg-violet-600/20 text-white border-violet-500/40 font-semibold"
                      : "bg-slate-900/60 text-slate-300 border-white/5 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-violet-400" : "text-slate-400"
                      }`}
                    />
                    <span className="truncate flex-1">{title}</span>
                  </div>

                  {onDeleteSession && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
