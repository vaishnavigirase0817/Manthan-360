import React from "react";
import { Note } from "../types";
import { FileText, CheckCircle2, ChevronRight, X, Sparkles, RefreshCw } from "lucide-react";

interface DocumentContextBarProps {
  note: Note | null;
  onClearContext?: () => void;
  onOpenDocument?: () => void;
}

export default function DocumentContextBar({ note, onClearContext, onOpenDocument }: DocumentContextBarProps) {
  if (!note) return null;

  const charCount = note.extractedText?.length || 0;
  const wordCount = note.extractedText ? note.extractedText.trim().split(/\s+/).length : 0;

  return (
    <div
      id="document-context-bar"
      className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-3 px-4 flex items-center justify-between gap-3 shadow-lg shadow-black/20 animate-fade-in"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-100 truncate max-w-[200px] sm:max-w-sm md:max-w-md">
              {note.title}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Active Context
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5 font-sans">
            {note.fileName || "Uploaded Material"} • ~{wordCount.toLocaleString()} words ({charCount.toLocaleString()} chars) • Processed by Manthan360
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onOpenDocument && (
          <button
            onClick={onOpenDocument}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-xs font-medium transition-all cursor-pointer"
            title="View Raw Document Text"
          >
            <span>View Notes</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>
        )}
        {onClearContext && (
          <button
            onClick={onClearContext}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer"
            title="Deselect Note Context"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
