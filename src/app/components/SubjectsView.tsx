import { motion } from "framer-motion";
import { BookOpen, Palette, ChevronRight, FolderUp, CheckCircle, Clock, Plus } from "lucide-react";
import { Subject, Chapter, Topic } from "../../types";
import { LiquidBar } from "./LiquidBar";
import { PALETTE, NEU_SHADOW } from "../../lib/constants";
import { calculateSubjectProgress } from "../../lib/analytics";

type SubjectsViewProps = {
  subjects: Subject[];
  chapters: Chapter[];
  topics: Topic[];
  onSelectSubject: (subjectId: string) => void;
  onOpenUpload: () => void;
  onOpenUploadTarget?: (subjectId?: string, chapterId?: string) => void;
  onOpenColorPicker: (subject: Subject) => void;
};

export function SubjectsView({
  subjects,
  chapters,
  topics,
  onSelectSubject,
  onOpenUpload,
  onOpenUploadTarget,
  onOpenColorPicker,
}: SubjectsViewProps) {
  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-amber-100/70 text-amber-800 flex items-center justify-center mb-4">
          <BookOpen size={32} />
        </div>
        <h2 className="text-2xl font-bold text-stone-800 mb-2" style={{ fontFamily: "Fraunces, serif" }}>
          Your study trail starts here.
        </h2>
        <p className="text-xs text-stone-500 mb-6 leading-relaxed">
          Upload your existing study-material folder structure or individual files to convert them into interactive roadmaps.
        </p>
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-sm"
        >
          <FolderUp size={16} />
          <span>Upload Study Materials</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-6 py-7 max-w-5xl mx-auto w-full gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-stone-200/80 pb-5">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-amber-800 uppercase">Academic Subjects</span>
          <h1 className="text-3xl font-bold text-stone-800 mt-0.5" style={{ fontFamily: "Fraunces, serif" }}>
            Curriculum Roadmaps
          </h1>
        </div>
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-sm"
        >
          <FolderUp size={14} /> Add Subject / Materials
        </button>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {subjects.map((s) => {
          const subjChapters = chapters.filter((c) => c.subjectId === s.id);
          const subjTopics = topics.filter((t) => t.subjectId === s.id);
          const doneCount = subjTopics.filter((t) => t.completed).length;
          const totalCount = subjTopics.length;
          const remainingCount = totalCount - doneCount;
          const progressRatio = calculateSubjectProgress(topics, s.id);

          return (
            <motion.div
              key={s.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.18 }}
              className="rounded-2xl p-6 flex flex-col justify-between gap-5 relative border cursor-pointer group"
              style={{
                background: PALETTE.card,
                boxShadow: NEU_SHADOW,
                borderColor: PALETTE.border,
              }}
              onClick={() => onSelectSubject(s.id)}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ background: s.colorDim, color: s.color }}
                  >
                    {s.name.substring(0, 4).toUpperCase()}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onOpenUploadTarget && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenUploadTarget(s.id);
                        }}
                        className="px-2 py-1 rounded-lg text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors flex items-center gap-1"
                        title="Upload chapter/topic to this subject"
                      >
                        <Plus size={12} /> Add Material
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenColorPicker(s);
                      }}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                      title="Change subject color"
                    >
                      <Palette size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-stone-800 leading-tight" style={{ fontFamily: "Fraunces, serif" }}>
                  {s.name}
                </h3>
              </div>

              {/* Progress Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-500 font-medium">Progress</span>
                  <span className="font-bold" style={{ color: s.color }}>
                    {Math.round(progressRatio * 100)}% ({doneCount}/{totalCount} topics)
                  </span>
                </div>
                <LiquidBar value={progressRatio} color={s.color} height={8} />
              </div>

              {/* Footer Metrics */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-200/60 text-xs font-mono text-stone-500">
                <div className="flex items-center gap-3">
                  <span>{subjChapters.length} chapters</span>
                  <span>•</span>
                  <span>{remainingCount} remaining</span>
                </div>

                <div className="flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform" style={{ color: s.color }}>
                  <span>Open Trail</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

