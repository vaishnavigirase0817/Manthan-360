import { useEffect, useState } from "react";
import { Note } from "../types";
import { generateNotesSummary } from "../services/api";
import { db } from "../services/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { BrainCircuit, RefreshCw, AlertCircle } from "lucide-react";
import SummaryCard from "../components/SummaryCard";
import Loader from "../components/Loader";

interface SummaryProps {
  focusedNote: Note | null;
  onUpdateNote: (updatedNote: Note) => void;
}

export default function Summary({ focusedNote, onUpdateNote }: SummaryProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const triggerSummaryGeneration = async () => {
    if (!focusedNote) return;
    setLoading(true);
    setError("");
    const notesPath = "notes";
    try {
      // Trigger Express Gemini Summarization Proxy
      const summaryData = await generateNotesSummary(focusedNote.extractedText);

      // Update Firestore Note Document with summary data
      const noteRef = doc(db, notesPath, focusedNote.id);
      await updateDoc(noteRef, {
        summary: summaryData,
        status: "completed",
        updatedAt: new Date().toISOString(),
      });

      // Callback to parent React state
      onUpdateNote({
        ...focusedNote,
        summary: summaryData,
        status: "completed",
      });
    } catch (e: any) {
      console.error("Failed to generate summary:", e);
      setError(e.message || "AI summary generation failed. Please check API configuration or retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!focusedNote) return;
    setError("");

    // If summary already exists in this note, do not re-generate
    if (focusedNote.summary) return;

    triggerSummaryGeneration();
  }, [focusedNote?.id]);

  if (!focusedNote) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center" id="summary-empty-locked">
        <BrainCircuit className="w-12 h-12 text-slate-600 mb-4" />
        <h3 className="font-sans font-semibold text-slate-300">No Active Note Selected</h3>
        <p className="text-sm text-slate-500 max-w-xs mt-1">
          Please choose a study material from the Dashboard to unlock AI summaries.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6" id="summary-page">
      {/* Page Header */}
      <div className="flex items-center justify-between pointer-events-none" id="summary-page-header">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              AI Synthesis Module
            </span>
          </div>
          <h2 className="text-2xl font-sans font-black text-white mt-1">Study Summaries</h2>
        </div>
        {focusedNote.summary && (
          <button
            onClick={triggerSummaryGeneration}
            disabled={loading}
            className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 border border-slate-800 text-xs font-mono rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Regenerate
          </button>
        )}
      </div>

      {loading && <Loader message="Manthan360 is analyzing material context and creating structured summaries..." step={2} />}

      {error && (
        <div id="summary-error-banner" className="bg-red-950/40 border border-red-900/60 p-4 rounded-2xl flex items-center justify-between gap-3 text-red-200 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={triggerSummaryGeneration}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-xs rounded-xl text-red-100 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {!loading && focusedNote.summary && (
        <div id="summary-result-render">
          <SummaryCard summary={focusedNote.summary} noteTitle={focusedNote.title} />
        </div>
      )}
    </div>
  );
}
