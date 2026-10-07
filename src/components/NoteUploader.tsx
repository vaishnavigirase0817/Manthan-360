import { useState, useRef, DragEvent, ChangeEvent } from "react";
import Tesseract from "tesseract.js";
import { Upload, FileText, Image, PenTool, CheckCircle, RefreshCw, AlertCircle, Sparkles, BookOpen } from "lucide-react";
import { motion } from "motion/react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { FirebaseUser, Note } from "../types";
import { extractTextFromPdf, ExtractionProgress } from "../services/pdfExtractor";
import { analyzeContentSuitability } from "../services/contentAnalyzer";

interface NoteUploaderProps {
  user: FirebaseUser | null;
  onUploaded: (note: Note) => void;
}

export default function NoteUploader({ user, onUploaded }: NoteUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop events
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (selectedFile: File) => {
    setError("");
    setExtractedText("");
    setPageCount(null);
    const fileType = selectedFile.type;
    const isImage = fileType.startsWith("image/");
    const isPdf = fileType === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isImage && !isPdf) {
      setError("Please upload an image (PNG, JPG) or a PDF study document.");
      return;
    }

    setFile(selectedFile);
    // Auto fill title from filename
    const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));

    if (isPdf) {
      triggerPdfExtraction(selectedFile);
    } else {
      triggerImageOCR(selectedFile);
    }
  };

  const triggerPdfExtraction = async (pdfFile: File) => {
    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMessage(`Loading ${pdfFile.name}...`);
    setError("");

    try {
      const result = await extractTextFromPdf(pdfFile, (p: ExtractionProgress) => {
        setProgressMessage(p.message);
        if (p.stage === "extracting" && p.totalPages > 0) {
          setProgressPercent(Math.round(15 + (p.currentPage / p.totalPages) * 60));
        } else if (p.stage === "ocr") {
          const ocrRatio = (p.ocrProgress || 0) / 100;
          const pageRatio = (p.currentPage - 1 + ocrRatio) / (p.totalPages || 1);
          setProgressPercent(Math.round(20 + pageRatio * 75));
        } else if (p.stage === "completed") {
          setProgressPercent(100);
        }
      });

      setPageCount(result.pageCount);
      setExtractedText(result.text);
      setIsProcessing(false);
    } catch (err: any) {
      console.error("PDF Extraction failure:", err);
      setIsProcessing(false);
      setError(
        err.message ||
          "Unable to extract readable text from this PDF. Please upload a text-based PDF or a clearer scanned document."
      );
    }
  };

  const triggerImageOCR = (imageFile: File) => {
    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMessage("Starting optical character recognition on image...");
    setError("");

    Tesseract.recognize(imageFile, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          const prog = Math.round(m.progress * 100);
          setProgressPercent(prog);
          setProgressMessage(`Scanning handwritten text: ${prog}%`);
        }
      },
    })
      .then(({ data: { text } }) => {
        setIsProcessing(false);
        const clean = text.trim();
        if (clean.length < 15) {
          setError("No readable handwritten notes found. Please ensure the note image has high legibility.");
        } else {
          setExtractedText(clean);
        }
      })
      .catch((err) => {
        console.error("Tesseract error:", err);
        setIsProcessing(false);
        setError("OCR Engine failed to process image note. Please copy-paste your notes text manually below.");
      });
  };

  const handleManualPasteSubmit = () => {
    const clean = pasteText.trim();
    if (!clean || clean.length < 15) {
      setError("Please paste substantive revision notes (at least a few sentences)!");
      return;
    }
    setExtractedText(clean);
    if (!title) {
      setTitle("Study Material Note");
    }
  };

  const handleSaveAndGenerate = async () => {
    if (!user) {
      setError("Authentication required to save notes.");
      return;
    }
    if (!title.trim()) {
      setError("Please supply a study title or topic name.");
      return;
    }
    const quality = analyzeContentSuitability(extractedText);
    if (!quality.isValid) {
      setError(quality.statusMessage);
      return;
    }

    try {
      setError("");
      const noteId = "note_" + Date.now();

      const newNote: Note = {
        id: noteId,
        userId: user.uid,
        title: title.trim(),
        fileName: file ? file.name : "pasted_text.txt",
        extractedText: extractedText.trim(),
        status: "uploaded",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store basic note metadata in Firestore
      await setDoc(doc(db, "notes", noteId), {
        id: newNote.id,
        userId: newNote.userId,
        title: newNote.title,
        fileName: newNote.fileName || "Note",
        extractedText: newNote.extractedText,
        status: "uploaded",
        createdAt: newNote.createdAt,
        updatedAt: newNote.updatedAt,
      });

      onUploaded(newNote);
    } catch (e: any) {
      console.error("Firestore Note Save Error:", e);
      setError("Database sync failed. Check cloud parameters or connectivity.");
    }
  };

  const resetUploader = () => {
    setFile(null);
    setTitle("");
    setIsProcessing(false);
    setProgressPercent(0);
    setProgressMessage("");
    setPageCount(null);
    setExtractedText("");
    setPasteText("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-6" id="note-uploader-wrapper">
      {error && (
        <div id="uploader-error-banner" className="bg-red-950/40 border border-red-900/60 p-4 rounded-2xl flex items-center gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* State A: File is not selected and not processing */}
      {!extractedText && !isProcessing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="uploader-input-selector">
          {/* Box 1: File OCR Drag n Drop */}
          <div
            id="drag-drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed p-10 rounded-3xl flex flex-col items-center justify-center text-center transition-all min-h-[340px] bg-slate-900/10 backdrop-blur-md ${
              dragActive
                ? "border-cyan-400 bg-cyan-950/20 scale-98"
                : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/30"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf,image/*,.pdf"
              className="hidden"
              id="uploader-file-input"
            />
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/50 border border-cyan-800/60 flex items-center justify-center mb-6 text-cyan-400">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-sans font-semibold text-lg text-slate-100">Upload PDF or Handwritten Notes</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm">
              Upload textbook PDFs, syllabus slides, lecture handouts, or note photos (PDF, PNG, JPG) to extract full multi-page document text.
            </p>
            <span className="text-xs font-mono text-cyan-500 bg-cyan-950/30 border border-cyan-900/40 px-3 py-1.5 rounded-full mt-6 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Full Multi-Page Document Parser Active
            </span>
          </div>

          {/* Box 2: Manual Text Copy Paste */}
          <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur-md flex flex-col justify-between min-h-[340px]" id="manual-paste-zone">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-950/50 border border-indigo-900/40 flex items-center justify-center text-indigo-400">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-slate-100 text-base">Direct Revision Copy-Paste</h3>
                  <p className="text-xs text-slate-400">Paste textbooks chapter clippings or lecture notes directly</p>
                </div>
              </div>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your notes text, exam syllabus or slide paragraphs here..."
                className="w-full h-44 rounded-2xl bg-slate-950/90 border border-slate-800 p-4 text-sm text-slate-300 font-sans focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 resize-none"
                id="manual-paste-textarea"
              />
            </div>
            <button
              onClick={handleManualPasteSubmit}
              id="manual-submit-btn"
              className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-5 rounded-2xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              Analyze Pasted Text
            </button>
          </div>
        </div>
      )}

      {/* Extraction / OCR processing active */}
      {isProcessing && (
        <div className="border border-slate-800 p-12 rounded-3xl bg-slate-900/20 backdrop-blur-md text-center flex flex-col items-center justify-center" id="ocr-progress-card">
          <div className="relative w-20 h-20 mb-6" id="ocr-pulse">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-cyan-500/20 bg-cyan-500/5"
              animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-4 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin" />
          </div>
          <h3 className="text-xl font-sans font-semibold text-slate-100">Extracting Document Content</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-sm">
            {progressMessage || "Parsing document pages and extracting text layer..."}
          </p>
          <div className="w-full max-w-sm bg-slate-950 rounded-full h-3 border border-slate-800 mt-6 overflow-hidden" id="ocr-progress-track">
            <motion.div
              className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </div>
          <span className="text-xs font-mono text-cyan-400 mt-3">{progressPercent}% Complete</span>
        </div>
      )}

      {/* Extracted/Editable Notes view */}
      {extractedText && (
        <div className="border border-slate-800 rounded-3xl p-6 bg-slate-900/25 backdrop-blur-md space-y-6" id="notes-extracted-review">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5" id="review-header">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-900/45 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-slate-100 text-lg">
                  Extracted Document Text {pageCount ? `(${pageCount} Pages)` : ""}
                </h3>
                <p className="text-xs text-slate-400">
                  {extractedText.length.toLocaleString()} characters extracted. Review, refine or edit before generating AI study modules.
                </p>
              </div>
            </div>
            <button
              onClick={resetUploader}
              id="ocr-reupload-btn"
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-800 text-xs font-mono rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-upload File
            </button>
          </div>

          <div className="space-y-4" id="review-body">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Study Topic / Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Computer Networks - TCP/IP Protocol"
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-4 py-3 text-sm text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                id="review-title-input"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Extracted Document Content (Grounded Source for AI)
              </label>
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="w-full h-80 rounded-2xl bg-slate-950/80 border border-slate-800 p-5 text-sm text-slate-300 font-sans leading-relaxed focus:outline-none focus:border-cyan-500 resize-y font-mono"
                id="review-textarea"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end" id="review-actions">
            <button
              id="confirm-generate-modules-btn"
              onClick={handleSaveAndGenerate}
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:opacity-90 text-white font-semibold py-3.5 px-8 rounded-2xl transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
            >
              Analyze & Generate Study Modules
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
