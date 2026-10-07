import { motion } from "motion/react";
import { CheckCircle2, CircleDashed } from "lucide-react";

interface LoaderProps {
  message?: string;
  step?: number; // Optional 1, 2, or 3 for stage progression
}

export default function Loader({ 
  message = "Processing with Manthan360...", 
  step = 2 
}: LoaderProps) {
  const stages = [
    "Reading document",
    "Understanding content",
    "Preparing learning resources"
  ];

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4" id="loader-wrapper">
      <div className="relative w-16 h-16 mb-4" id="loader-spinner-container">
        {/* Futuristic outer pulse */}
        <motion.div
          id="loader-pulse"
          className="absolute inset-0 rounded-full bg-violet-500/20 border border-violet-400"
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.15, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Fast inner spinner */}
        <motion.div
          id="loader-spinner"
          className="absolute inset-2 rounded-full border-t-2 border-r-2 border-violet-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.p
        id="loader-message"
        className="text-sm font-medium text-slate-200 tracking-wide text-center max-w-sm mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {message}
      </motion.p>

      {/* Stage indicators */}
      <div className="flex flex-col gap-2 w-full max-w-xs bg-slate-900/60 border border-white/10 rounded-xl p-3 shadow-inner">
        {stages.map((stageName, idx) => {
          const stageNum = idx + 1;
          const isDone = stageNum < step;
          const isCurrent = stageNum === step;

          return (
            <div key={stageName} className="flex items-center gap-2.5 text-xs">
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <CircleDashed className="w-3.5 h-3.5 text-violet-400 animate-spin shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
              )}
              <span
                className={
                  isDone
                    ? "text-slate-300 font-medium line-through opacity-70"
                    : isCurrent
                    ? "text-violet-300 font-semibold"
                    : "text-slate-500"
                }
              >
                {stageName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
