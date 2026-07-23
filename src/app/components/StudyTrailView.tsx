import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, X, FileText, Clock, AlertCircle, Flame, Plus, FolderUp } from "lucide-react";
import { Subject, Chapter, Topic, TrailNode, PlannedTopic } from "../../types";
import { LiquidBar } from "./LiquidBar";
import { PALETTE, NEU_SHADOW, NEU_INSET } from "../../lib/constants";
import { calculateChapterProgress, calculateSubjectProgress } from "../../lib/analytics";

type StudyTrailViewProps = {
  subject: Subject;
  chapters: Chapter[];
  topics: Topic[];
  plannedTopics: PlannedTopic[];
  activeChapterId: string | null;
  onSelectChapter: (chapterId: string | null) => void;
  onToggleTopic: (topicId: string) => void;
  onOpenTopicFile: (topic: Topic) => void;
  onOpenUploadTarget?: (subjectId?: string, chapterId?: string) => void;
};

// SVG geometry calculation constants
const LX = 88, RX = 278, SY = 72, STP = 106, NR = 17;
const npos = (i: number) => ({ x: i % 2 === 0 ? LX : RX, y: SY + i * STP });

function buildPath(n: number): string {
  if (n < 2) return "";
  const pts = Array.from({ length: n }, (_, i) => npos(i));
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const mid = (a.y + b.y) / 2;
    d += ` C ${a.x},${mid} ${b.x},${mid} ${b.x},${b.y}`;
  }
  return d;
}

export function StudyTrailView({
  subject,
  chapters,
  topics,
  plannedTopics,
  activeChapterId,
  onSelectChapter,
  onToggleTopic,
  onOpenTopicFile,
  onOpenUploadTarget,
}: StudyTrailViewProps) {
  const activeChapter = activeChapterId ? chapters.find((c) => c.id === activeChapterId) : null;

  // Compute Trail Nodes for Chapters
  const subjChapters = chapters.filter((c) => c.subjectId === subject.id);
  let foundCurrent = false;

  const trailNodes: TrailNode[] = subjChapters.map((ch) => {
    const chTopics = topics.filter((t) => t.chapterId === ch.id);
    const total = chTopics.length;
    const done = chTopics.filter((t) => t.completed).length;

    let status: TrailNode["status"] = "upcoming";
    if (total > 0 && done >= total) {
      status = "completed";
    } else if (!foundCurrent) {
      foundCurrent = true;
      status = "current";
    }

    return {
      id: ch.id,
      chapterId: ch.id,
      title: ch.name,
      total,
      done,
      status,
    };
  });

  const pathRef = useRef<SVGPathElement>(null);
  const [pathLen, setPathLen] = useState(0);
  const overallRatio = calculateSubjectProgress(topics, subject.id);

  useEffect(() => {
    if (pathRef.current) {
      setPathLen(pathRef.current.getTotalLength());
    }
  }, [trailNodes.length]);

  const svgH = SY + (Math.max(1, trailNodes.length) - 1) * STP + SY;
  const pathD = buildPath(trailNodes.length);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Trail Area */}
      <div className="flex-1 overflow-y-auto px-8 pt-7 pb-8">
        {/* Breadcrumb / Subject Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {activeChapter && (
              <button
                onClick={() => onSelectChapter(null)}
                className="flex items-center gap-1 text-xs font-mono text-stone-500 hover:text-stone-800 transition-colors mr-2"
              >
                <ChevronLeft size={14} /> Back to Chapters
              </button>
            )}

            <div className="flex items-baseline gap-2">
              <button
                onClick={() => onSelectChapter(null)}
                className={activeChapter ? "hover:opacity-80 transition-opacity" : ""}
              >
                <span
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontSize: activeChapter ? 18 : 26,
                    fontWeight: 600,
                    color: activeChapter ? PALETTE.muted : PALETTE.text,
                    lineHeight: 1,
                  }}
                >
                  {subject.name}
                </span>
              </button>

              {activeChapter && (
                <>
                  <ChevronRight size={13} className="text-stone-400" />
                  <span style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 600, color: PALETTE.text }}>
                    {activeChapter.name}
                  </span>
                </>
              )}

              <span
                className="text-[10px] px-2 py-0.5 rounded tracking-widest uppercase ml-1 font-mono"
                style={{ background: subject.colorDim, color: subject.color }}
              >
                {subject.name.substring(0, 4).toUpperCase()}
              </span>
            </div>
          </div>

          {onOpenUploadTarget && (
            <button
              onClick={() => onOpenUploadTarget(subject.id, activeChapterId || undefined)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200/80 transition-all"
            >
              <Plus size={14} className="text-amber-700" />
              <span>{activeChapter ? "Add Topic to Chapter" : "Add Chapter / Material"}</span>
            </button>
          )}
        </div>

        {/* Overall Progress Indicator */}
        <div
          className="flex items-center gap-4 mb-6 p-4 rounded-2xl max-w-md border"
          style={{ background: PALETTE.card, boxShadow: NEU_SHADOW, borderColor: PALETTE.border }}
        >
          <div className="flex-1">
            <LiquidBar value={overallRatio} color={subject.color} height={8} />
          </div>
          <span className="text-xs font-mono font-bold shrink-0" style={{ color: subject.color }}>
            {Math.round(overallRatio * 100)}% complete
          </span>
        </div>

        {/* SVG Path Trail */}
        <div style={{ maxWidth: 370 }}>
          <svg width="100%" viewBox={`0 0 370 ${svgH}`} style={{ display: "block" }}>
            <defs>
              <linearGradient id={`gold-grad-${subject.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={PALETTE.goldLt} />
                <stop offset="100%" stopColor={PALETTE.goldDk} />
              </linearGradient>
              <filter id="node-shadow">
                <feDropShadow dx="1" dy="2" stdDeviation="3" floodColor="rgba(61,52,44,0.15)" />
              </filter>
            </defs>

            {/* Base dim path */}
            <path d={pathD} stroke="rgba(61,52,44,0.1)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path ref={pathRef} d={pathD} stroke="none" fill="none" />

            {/* Completed animated path fill */}
            {pathLen > 0 && (
              <motion.path
                d={pathD}
                stroke={`url(#gold-grad-${subject.id})`}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDashoffset: pathLen }}
                animate={{ strokeDashoffset: pathLen * (1 - overallRatio) }}
                style={{ strokeDasharray: pathLen }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            )}

            {/* Render Nodes */}
            {trailNodes.map((nd, i) => {
              const pos = npos(i);
              const isLeft = i % 2 === 0;
              const lx = isLeft ? pos.x + NR + 14 : pos.x - NR - 14;
              const anchor = isLeft ? "start" : "end";
              const pct = nd.total > 0 ? nd.done / nd.total : 0;
              const ringC = 2 * Math.PI * (NR - 5);
              const isSelected = activeChapterId === nd.chapterId;

              return (
                <g key={nd.id} style={{ cursor: "pointer" }} onClick={() => onSelectChapter(nd.chapterId || null)}>
                  <circle cx={pos.x} cy={pos.y} r={NR + 12} fill="transparent" />

                  {/* Pulsing ring for active chapter */}
                  {nd.status === "current" && (
                    <>
                      <circle cx={pos.x} cy={pos.y} r={NR + 13} fill={subject.color} fillOpacity="0.1" className="pulse-glow" />
                      <circle cx={pos.x} cy={pos.y} r={NR + 6} fill="none" stroke={subject.color} strokeWidth="1" strokeOpacity="0.4" />
                    </>
                  )}

                  {/* Circle Fill */}
                  {nd.status === "completed" && (
                    <circle cx={pos.x} cy={pos.y} r={NR} fill={`url(#gold-grad-${subject.id})`} filter="url(#node-shadow)" />
                  )}
                  {nd.status === "current" && (
                    <circle cx={pos.x} cy={pos.y} r={NR} fill={PALETTE.card} stroke={subject.color} strokeWidth="2.5" filter="url(#node-shadow)" />
                  )}
                  {nd.status === "upcoming" && (
                    <circle cx={pos.x} cy={pos.y} r={NR} fill={PALETTE.surface} stroke="rgba(61,52,44,0.15)" strokeWidth="1.5" />
                  )}

                  {/* Progress Gauge on Circle */}
                  {nd.status === "current" && nd.total > 0 && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={NR - 5}
                      fill="none"
                      stroke={subject.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={`${ringC * pct} ${ringC}`}
                      strokeDashoffset={ringC * 0.25}
                    />
                  )}

                  {/* Node Label Text */}
                  {nd.status === "completed" && (
                    <text x={pos.x} y={pos.y + 4.5} textAnchor="middle" fontSize="13" fill="#FFFFFF" fontWeight="700">✓</text>
                  )}
                  {nd.status === "current" && (
                    <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="8.5" fill={subject.color} fontFamily="'JetBrains Mono', monospace">
                      {nd.done}/{nd.total}
                    </text>
                  )}
                  {nd.status === "upcoming" && (
                    <text x={pos.x} y={pos.y + 4.5} textAnchor="middle" fontSize="10.5" fill="rgba(61,52,44,0.35)" fontFamily="'JetBrains Mono', monospace">
                      {String(i + 1).padStart(2, "0")}
                    </text>
                  )}

                  <text
                    x={lx}
                    y={pos.y - 6}
                    textAnchor={anchor}
                    fontSize="12"
                    fill={nd.status === "upcoming" ? "rgba(61,52,44,0.4)" : PALETTE.text}
                    fontFamily="'Inter', sans-serif"
                    fontWeight={isSelected || nd.status === "current" ? "600" : "400"}
                  >
                    {nd.title.length > 24 ? nd.title.slice(0, 22) + "…" : nd.title}
                  </text>
                  <text
                    x={lx}
                    y={pos.y + 9}
                    textAnchor={anchor}
                    fontSize="9.5"
                    fontFamily="'JetBrains Mono', monospace"
                    fill={nd.status === "current" ? subject.color : "rgba(61,52,44,0.4)"}
                  >
                    {nd.done}/{nd.total} topics done
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Slide-out Topics Side Panel when a Chapter is selected */}
      <AnimatePresence>
        {activeChapter && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-80 flex flex-col h-full border-l border-stone-200/80 bg-stone-50/80 shrink-0 z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-stone-200/80 bg-white flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: subject.color }}>
                    Chapter Topics
                  </span>
                  <h3 className="text-lg font-bold text-stone-800 leading-tight mt-0.5" style={{ fontFamily: "Fraunces, serif" }}>
                    {activeChapter.name}
                  </h3>
                </div>
                <button
                  onClick={() => onSelectChapter(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <div className="flex-1">
                  <LiquidBar value={calculateChapterProgress(topics, activeChapter.id)} color={subject.color} height={6} />
                </div>
                <span className="text-[10px] text-stone-500">
                  {topics.filter((t) => t.chapterId === activeChapter.id && t.completed).length}/
                  {topics.filter((t) => t.chapterId === activeChapter.id).length}
                </span>
              </div>

              {onOpenUploadTarget && (
                <button
                  onClick={() => onOpenUploadTarget(subject.id, activeChapter.id)}
                  className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus size={14} /> Add Topic to this Chapter
                </button>
              )}
            </div>

            {/* Topics List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {topics
                .filter((t) => t.chapterId === activeChapter.id)
                .map((topic) => (
                  <div
                    key={topic.id}
                    className="p-3 rounded-xl border flex items-center justify-between transition-all bg-white hover:border-stone-300"
                    style={{
                      borderColor: topic.completed ? `${subject.color}40` : PALETTE.border,
                      background: topic.completed ? `${subject.color}08` : "#FFFFFF",
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <button
                        onClick={() => onToggleTopic(topic.id)}
                        className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all"
                        style={{
                          borderColor: topic.completed ? subject.color : "rgba(61,52,44,0.3)",
                          background: topic.completed ? subject.color : "transparent",
                        }}
                      >
                        {topic.completed && <Check size={10} className="text-white" strokeWidth={3} />}
                      </button>
                      <span
                        className="text-xs font-medium text-stone-800 truncate"
                        style={{
                          textDecoration: topic.completed ? "line-through" : "none",
                          color: topic.completed ? PALETTE.muted : PALETTE.text,
                        }}
                      >
                        {topic.name}
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenTopicFile(topic)}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 shrink-0"
                      title="Open study file"
                    >
                      <FileText size={15} />
                    </button>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

