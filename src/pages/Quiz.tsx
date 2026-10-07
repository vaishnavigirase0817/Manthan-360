import { useEffect, useState } from "react";
import { Note, Quiz, FirebaseUser } from "../types";
import { generateNotesQuiz } from "../services/api";
import { db } from "../services/firebase";
import { doc, getDocs, setDoc, query, collection, where } from "firebase/firestore";
import { Award, AlertCircle, RefreshCw } from "lucide-react";
import QuizCard from "../components/QuizCard";
import Loader from "../components/Loader";

interface QuizProps {
  focusedNote: Note | null;
  user: FirebaseUser | null;
}

export default function QuizRoom({ focusedNote, user }: QuizProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  const findOrCreateQuiz = async () => {
    if (!focusedNote || !user) return;
    setLoading(true);
    setError("");
    const quizzesPath = "quizzes";
    try {
      // Look up if an exam quiz was already compiled for this note
      const q = query(
        collection(db, quizzesPath),
        where("noteId", "==", focusedNote.id)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        // Loaded existing quiz
        const quizDoc = snap.docs[0];
        setActiveQuiz(quizDoc.data() as Quiz);
      } else {
        // Generate new quiz through Express proxy APIs
        const questionsList = await generateNotesQuiz(focusedNote.extractedText);
        const generatedQuizId = "quiz_" + Date.now();

        const newQuiz: Quiz = {
          id: generatedQuizId,
          userId: user.uid,
          noteId: focusedNote.id,
          noteTitle: focusedNote.title,
          questions: questionsList,
          createdAt: new Date().toISOString(),
        };

        // Save new quiz to database
        await setDoc(doc(db, quizzesPath, generatedQuizId), {
          id: newQuiz.id,
          userId: newQuiz.userId,
          noteId: newQuiz.noteId,
          noteTitle: newQuiz.noteTitle,
          questions: newQuiz.questions,
          createdAt: newQuiz.createdAt,
        });

        setActiveQuiz(newQuiz);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "AI quiz generation failed. Check API keys or text contents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveQuiz(null);
    setError("");
    if (!focusedNote || !user) return;

    findOrCreateQuiz();
  }, [focusedNote?.id, user?.uid]);

  if (!focusedNote) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center" id="quiz-empty-locked">
        <Award className="w-12 h-12 text-slate-600 mb-4" />
        <h3 className="font-sans font-semibold text-slate-300">No Active Note Selected</h3>
        <p className="text-sm text-slate-500 max-w-xs mt-1">
          Please select a study material from the Dashboard to unlock its quiz room.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6" id="quiz-page-container">
      {/* Page Header */}
      <div className="flex items-center justify-between pointer-events-none" id="quiz-page-header">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              Comprehension testing
            </span>
          </div>
          <h2 className="text-2xl font-sans font-black text-white mt-1">Study Quiz Room</h2>
        </div>
      </div>

      {loading && <Loader message="Manthan360 is examining document logic to generate evaluation questions..." step={2} />}

      {error && (
        <div id="quiz-error-banner" className="bg-red-950/40 border border-red-900/60 p-4 rounded-2xl flex items-center justify-between gap-3 text-red-200 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={findOrCreateQuiz}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-xs rounded-xl text-red-100 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {!loading && activeQuiz && (
        <div id="active-quiz-view-wrapper">
          <QuizCard
            quizId={activeQuiz.id}
            questions={activeQuiz.questions}
            noteTitle={focusedNote.title}
            user={user}
          />
        </div>
      )}
    </div>
  );
}
