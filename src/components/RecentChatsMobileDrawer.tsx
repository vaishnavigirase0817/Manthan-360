import React from "react";
import { X, MessageSquare, Clock, PlusCircle, Trash2 } from "lucide-react";
import { ChatSession } from "../types";

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
  if (!isOpen) return null;

  const formatSessionTitle = (session: ChatSession) => {
    if (session.messages && session.messages.length > 1) {
      const firstUserMsg = session.messages.find((m) => m.role === "user");
      if (firstUserMsg && firstUserMsg.content) {
        return firstUserMsg.content.slice(0, 36);
      }
    }
    return "Study Conversation";
  };

  return (
    <div
      id="recent-chats-mobile-drawer"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm md:hidden flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-80 bg-[#090d1f] light:bg-[#fdf5f6] border-l border-white/10 light:border-rose-900/15 h-full p-4 flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 light:border-rose-900/10 mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400 light:text-rose-700" />
            <span className="font-bold text-sm text-white light:text-rose-950">Recent Chats</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 light:text-rose-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Action */}
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 p-3 mb-3 bg-gradient-to-r from-violet-600 to-indigo-600 light:from-rose-800 light:to-rose-950 text-white rounded-xl font-medium text-xs shadow-md cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        {/* List of sessions */}
        <div className="flex-1 overflow-y-auto space-y-1.5 no-scrollbar">
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-500 light:text-rose-800 text-center py-6">
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
                      ? "bg-violet-600/20 light:bg-rose-100 text-white light:text-rose-950 border-violet-500/40 light:border-rose-900/30 font-semibold"
                      : "bg-slate-900/60 light:bg-white text-slate-300 light:text-rose-900 border-white/5 light:border-rose-900/10 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-violet-400 light:text-rose-700" : "text-slate-400 light:text-rose-700"
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
