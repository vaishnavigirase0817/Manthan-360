import React, { useState, useRef, useEffect } from "react";
import { Send, Plus, Sparkles, Paperclip, Loader2, ArrowUp, CornerDownLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations";

interface ChatComposerProps {
  onSendMessage: (message: string) => void;
  onAttachClick?: () => void;
  onSuggestionClick?: (actionType: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  hasDocument?: boolean;
}

export default function ChatComposer({
  onSendMessage,
  onAttachClick,
  onSuggestionClick,
  isLoading = false,
  disabled = false,
  placeholder,
  hasDocument = false,
}: ChatComposerProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedLanguage } = useLanguage();
  const t = getTranslation(selectedLanguage);

  const activePlaceholder = placeholder || t.askAnythingPlaceholder;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickPrompts = hasDocument
    ? [
        { label: t.summary, action: "summary" },
        { label: t.makeFlashcards, action: "flashcards" },
        { label: t.testMe, action: "quiz" },
        { label: t.explainSimpler, action: "explain_simply" },
        { label: t.mindMap, action: "mindmap" },
        { label: t.showFlowchart, action: "flowchart" },
        { label: t.roadmap, action: "planner" },
      ]
    : [
        { label: "Active Recall", prompt: "Explain the science of active recall and spaced repetition for exam prep." },
        { label: "Explain Recursion", prompt: "Explain recursion simply with an intuitive beginner example." },
        { label: "Study Plan", prompt: "Help me create an effective 5-day study plan for my upcoming exam." },
      ];

  return (
    <div
      id="chat-composer-container"
      className="sticky bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent light:from-[#f8fafc] light:via-[#f8fafc]/95 pt-2 pb-3.5 sm:pb-4 px-2.5 sm:px-6"
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Quick Suggestion Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 shrink-0 flex items-center gap-1 mr-0.5">
            <Sparkles className="w-3 h-3 text-violet-400" /> {t.suggestedActionsLabel}:
          </span>
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              type="button"
              id={`quick-suggestion-chip-${idx}`}
              onClick={() => {
                if (item.action && onSuggestionClick) {
                  onSuggestionClick(item.action);
                } else if (item.prompt) {
                  onSendMessage(item.prompt);
                }
              }}
              disabled={isLoading || disabled}
              className="shrink-0 px-2.5 sm:px-3 py-1 rounded-full bg-slate-900/90 hover:bg-violet-950/40 text-slate-300 hover:text-violet-200 border border-white/10 hover:border-violet-500/40 transition-all cursor-pointer shadow-sm text-[11px] sm:text-xs"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="relative flex items-end gap-2 bg-slate-900/90 backdrop-blur-xl border border-white/15 focus-within:border-violet-500/60 rounded-2xl p-2 shadow-2xl transition-all">
          {/* Attach Button */}
          {onAttachClick && (
            <button
              type="button"
              id="composer-attach-button"
              onClick={onAttachClick}
              title="Upload Notes / Study Material"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            id="composer-text-input"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={activePlaceholder}
            className="flex-1 max-h-32 min-h-[40px] bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none py-2 px-1 font-sans"
          />

          {/* Send Action */}
          <button
            type="button"
            id="composer-send-button"
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isLoading || disabled}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              input.trim() && !isLoading && !disabled
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25 cursor-pointer scale-100"
                : "bg-slate-800/80 text-slate-500 cursor-not-allowed"
            }`}
            title="Send to Manthan360"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-2">
          <span>Manthan360 AI Study Companion</span>
          <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
