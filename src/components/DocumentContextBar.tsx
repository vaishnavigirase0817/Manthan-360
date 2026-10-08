import React from "react";
import { Note } from "../types";
import { FileText, CheckCircle2, ChevronRight, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations";

interface DocumentContextBarProps {
  note: Note | null;
  onClearContext?: () => void;
  onOpenDocument?: () => void;
}

export default function DocumentContextBar({ note, onClearContext, onOpenDocument }: DocumentContextBarProps) {
  const { selectedLanguage } = useLanguage();
  const t = getTranslation(selectedLanguage);

  if (!note) return null;

  const charCount = note.extractedText?.length || 0;
  const wordCount = note.extractedText ? note.extractedText.trim().split(/\s+/).length : 0;

  return (
    <div
      id="document-context-bar"
      className="w-full bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 sm:p-3 px-3 sm:px-4 flex flex-wrap items-center justify-between gap-2.5 shadow-lg shadow-black/20 animate-fade-in"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-bold text-slate-100 truncate max-w-[160px] sm:max-w-sm md:max-w-md">
              {note.title}
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
              <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {t.activeContextLabel}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5 font-sans">
            {note.fileName || "Uploaded Material"} • ~{wordCount.toLocaleString()} words ({charCount.toLocaleString()} chars)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
        {onOpenDocument && (
          <button
            type="button"
            id="context-bar-view-notes-btn"
            onClick={onOpenDocument}
            className="flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-medium transition-all cursor-pointer"
            title="View Raw Document Text"
          >
            <span>{t.viewNotesBtn}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
        {onClearContext && (
          <button
            type="button"
            id="context-bar-clear-btn"
            onClick={onClearContext}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-all cursor-pointer"
            title="Deselect Note Context"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
