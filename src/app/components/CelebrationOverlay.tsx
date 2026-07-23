import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { Subject, Chapter } from "../../types";
import { PALETTE, NEU_SHADOW } from "../../lib/constants";

type CelebrationOverlayProps = {
  type: "chapter" | "subject" | null;
  subject: Subject | null;
  chapter: Chapter | null;
  onDismiss: () => void;
};

export function CelebrationOverlay({ type, subject, chapter, onDismiss }: CelebrationOverlayProps) {
  useEffect(() => {
    if (type) {
      // Trigger confetti burst
      const isSubject = type === "subject";
      confetti({
        particleCount: isSubject ? 120 : 60,
        spread: isSubject ? 100 : 70,
        origin: { y: 0.6 },
        colors: ["#C9974A", "#8DD4B8", "#9580C8", "#5A9EC4", "#D98A72"],
      });
    }
  }, [type]);

  if (!type || !subject) return null;

  const isSubject = type === "subject";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-md rounded-3xl p-8 flex flex-col items-center text-center gap-6 overflow-hidden"
          style={{ background: PALETTE.card, boxShadow: NEU_SHADOW, border: `1px solid ${PALETTE.border}` }}
        >
          {/* Ambient Glow */}
          <div
            className="absolute rounded-full pointer-events-none -top-20"
            style={{
              width: 300,
              height: 300,
              background: `radial-gradient(circle, ${subject.color}25 0%, transparent 70%)`,
              filter: "blur(30px)",
            }}
          />

          {/* Icon Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${PALETTE.goldLt}, ${PALETTE.goldDk})`,
            }}
          >
            {isSubject ? <Trophy size={40} className="text-white" /> : <Sparkles size={38} className="text-white" />}
          </motion.div>

          {/* Heading */}
          <div>
            <div
              className="text-xs font-mono font-bold tracking-widest uppercase mb-2"
              style={{ color: isSubject ? PALETTE.gold : subject.color }}
            >
              {isSubject ? "Subject Completed 🎉" : "Chapter Completed ✨"}
            </div>
            <h2
              className="text-3xl font-bold text-stone-800 leading-tight"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              {isSubject ? subject.name : chapter?.name || "Chapter"}
            </h2>
            <p className="text-sm text-stone-500 mt-2">
              {isSubject ? (
                <>You have mastered all topics across <strong>{subject.name}</strong>!</>
              ) : (
                <>All topics finished in <strong>{chapter?.name}</strong>.</>
              )}
            </p>
          </div>

          {/* Progress Card */}
          <div className="w-full bg-stone-50 p-4 rounded-2xl border border-stone-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle size={20} className="text-emerald-600" />
              <div className="text-left">
                <span className="text-xs font-semibold text-stone-800 block">Milestone Reached</span>
                <span className="text-[10px] font-mono text-stone-500">Recorded in study logbook</span>
              </div>
            </div>
            <span
              className="text-xs font-mono font-bold px-2.5 py-1 rounded-full text-white"
              style={{ background: subject.color }}
            >
              100%
            </span>
          </div>

          {/* Continue Button */}
          <button
            onClick={onDismiss}
            className="w-full py-3.5 rounded-2xl font-medium text-white flex items-center justify-center gap-2 text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${PALETTE.goldLt}, ${PALETTE.goldDk})`,
            }}
          >
            <span>Continue Trail</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
