import { motion } from "framer-motion";
import { Check, Flame, Clock, AlertCircle, Calendar, BookOpen, ArrowRight, FileText, CheckCircle2 } from "lucide-react";
import { Subject, Chapter, Topic, PlannedTopic } from "../../types";
import { LiquidBar } from "./LiquidBar";
import { PALETTE, NEU_SHADOW } from "../../lib/constants";
import { calculateStreak, calculatePace } from "../../lib/analytics";

type TodayViewProps = {
  subjects: Subject[];
  chapters: Chapter[];
  topics: Topic[];
  plannedTopics: PlannedTopic[];
  onToggleTopic: (topicId: string) => void;
  onOpenTopicFile: (topic: Topic) => void;
  onNavigateToWeekly: () => void;
  onNavigateToSubjects: () => void;
};

export function TodayView({
  subjects,
  chapters,
  topics,
  plannedTopics,
  onToggleTopic,
  onOpenTopicFile,
  onNavigateToWeekly,
  onNavigateToSubjects,
}: TodayViewProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  // Today's scheduled topics
  const todayPlanned = plannedTopics.filter((p) => p.date === todayStr);
  const todayPlannedIds = new Set(todayPlanned.map((p) => p.topicId));
  const todayTopics = topics.filter((t) => todayPlannedIds.has(t.id));

  // Overdue topics (scheduled before today and incomplete)
  const overduePlanned = plannedTopics.filter((p) => p.date < todayStr);
  const overduePlannedIds = new Set(overduePlanned.map((p) => p.topicId));
  const overdueTopics = topics.filter((t) => overduePlannedIds.has(t.id) && !t.completed);

  // Daily statistics
  const doneTodayCount = todayTopics.filter((t) => t.completed).length;
  const totalTodayCount = todayTopics.length;
  const todayProgressRatio = totalTodayCount > 0 ? doneTodayCount / totalTodayCount : 0;

  // Streak & Pace calculations
  const streakInfo = calculateStreak(topics, todayStr);
  const paceInfo = calculatePace(topics);

  const getSubject = (subjectId: string) => subjects.find((s) => s.id === subjectId);
  const getChapter = (chapterId: string) => chapters.find((c) => c.id === chapterId);

  // Format today's date
  const dateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto px-6 py-7 max-w-5xl mx-auto w-full gap-7">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="text-xs font-mono font-bold tracking-widest text-amber-800 uppercase mb-1 flex items-center gap-2">
            <Clock size={14} /> {dateFormatted}
          </div>
          <h1 className="text-3xl font-bold text-stone-800" style={{ fontFamily: "Fraunces, serif" }}>
            Daily Study Dashboard
          </h1>
          <p className="text-xs font-mono text-stone-500 mt-1">
            {paceInfo.message}
          </p>
        </div>

        {/* Streak & Stat Pill */}
        <div className="flex items-center gap-3">
          <div
            className="rounded-2xl px-4 py-2.5 flex items-center gap-3 border"
            style={{ background: PALETTE.card, boxShadow: NEU_SHADOW, borderColor: "rgba(201,151,74,0.3)" }}
          >
            <Flame size={22} className="text-amber-500 animate-bounce" />
            <div className="flex flex-col">
              <span className="text-lg font-bold font-mono text-amber-800 leading-none">
                {streakInfo.currentStreak} {streakInfo.currentStreak === 1 ? "DAY" : "DAYS"}
              </span>
              <span className="text-[9px] font-mono tracking-wider text-stone-400 uppercase">CURRENT STREAK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Today's Schedule & Overdue */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Daily Progress Card */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: PALETTE.card, boxShadow: NEU_SHADOW, border: `1px solid ${PALETTE.border}` }}
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-stone-700 uppercase tracking-wider">Today's Target</span>
              <span className="text-amber-800 font-bold">
                {doneTodayCount} of {totalTodayCount} completed
              </span>
            </div>
            <LiquidBar value={todayProgressRatio} color={PALETTE.gold} height={8} />
          </div>

          {/* Overdue Items (if any) */}
          {overdueTopics.length > 0 && (
            <div
              className="rounded-2xl p-5 flex flex-col gap-3 border border-rose-200"
              style={{ background: "#FFFBFB", boxShadow: NEU_SHADOW }}
            >
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle size={16} />
                <span className="text-xs font-mono font-bold tracking-wider uppercase">
                  Overdue Topics ({overdueTopics.length})
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {overdueTopics.map((topic) => {
                  const subject = getSubject(topic.subjectId);
                  const chapter = getChapter(topic.chapterId);
                  return (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-rose-100 hover:border-rose-200 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <button
                          onClick={() => onToggleTopic(topic.id)}
                          className="w-5 h-5 rounded-md border border-rose-300 shrink-0 flex items-center justify-center hover:bg-rose-50"
                        >
                          {topic.completed && <Check size={12} className="text-rose-600" strokeWidth={3} />}
                        </button>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-stone-800 truncate block">{topic.name}</span>
                          <span className="text-[10px] font-mono text-stone-400">
                            {subject?.name} • {chapter?.name}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenTopicFile(topic)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
                        title="Open file"
                      >
                        <FileText size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Today's Planned Topics List */}
          <div
            className="rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: PALETTE.card, boxShadow: NEU_SHADOW, border: `1px solid ${PALETTE.border}` }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-amber-800" />
                <h3 className="font-bold text-stone-800 text-base" style={{ fontFamily: "Fraunces, serif" }}>
                  Scheduled Today
                </h3>
              </div>
              <button
                onClick={onNavigateToWeekly}
                className="text-xs font-mono font-medium text-amber-800 hover:underline flex items-center gap-1"
              >
                Weekly Planner <ArrowRight size={12} />
              </button>
            </div>

            {todayTopics.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center gap-3">
                <CheckCircle2 size={36} className="text-emerald-500/80" />
                <div>
                  <h4 className="text-sm font-semibold text-stone-800">No topics scheduled for today</h4>
                  <p className="text-xs text-stone-500 mt-1">Plan your upcoming week or browse topics directly by subject.</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={onNavigateToWeekly}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-all"
                  >
                    Plan This Week
                  </button>
                  <button
                    onClick={onNavigateToSubjects}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-all"
                  >
                    Browse Subjects
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {todayTopics.map((topic) => {
                  const subject = getSubject(topic.subjectId);
                  const chapter = getChapter(topic.chapterId);
                  const color = subject?.color || PALETTE.gold;

                  return (
                    <motion.div
                      key={topic.id}
                      whileHover={{ x: 2 }}
                      className="flex items-center justify-between p-3.5 rounded-xl border transition-all"
                      style={{
                        background: topic.completed ? `${color}10` : PALETTE.card,
                        borderColor: topic.completed ? `${color}30` : PALETTE.border,
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <button
                          onClick={() => onToggleTopic(topic.id)}
                          className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all"
                          style={{
                            borderColor: topic.completed ? color : "rgba(61,52,44,0.25)",
                            background: topic.completed ? color : "transparent",
                          }}
                        >
                          {topic.completed && <Check size={11} className="text-white" strokeWidth={3} />}
                        </button>
                        <div className="min-w-0">
                          <span
                            className="text-xs font-semibold block truncate"
                            style={{
                              color: topic.completed ? PALETTE.muted : PALETTE.text,
                              textDecoration: topic.completed ? "line-through" : "none",
                            }}
                          >
                            {topic.name}
                          </span>
                          <span className="text-[10px] font-mono flex items-center gap-2 mt-0.5" style={{ color }}>
                            <span>{subject?.name}</span>
                            <span className="text-stone-300">•</span>
                            <span className="text-stone-500">{chapter?.name}</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onOpenTopicFile(topic)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
                        title="Open file"
                      >
                        <FileText size={16} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Quick Subject Progress & Pace Breakdown */}
        <div className="flex flex-col gap-6">
          {/* Quick Subject Progress Overview */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: PALETTE.card, boxShadow: NEU_SHADOW, border: `1px solid ${PALETTE.border}` }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
              <span className="text-xs font-mono font-bold uppercase text-stone-700">Subject Overview</span>
              <button
                onClick={onNavigateToSubjects}
                className="text-[10px] font-mono text-amber-800 hover:underline"
              >
                View all
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {subjects.slice(0, 5).map((subject) => {
                const subjTopics = topics.filter((t) => t.subjectId === subject.id);
                const doneCount = subjTopics.filter((t) => t.completed).length;
                const totalCount = subjTopics.length;
                const ratio = totalCount > 0 ? doneCount / totalCount : 0;

                return (
                  <div key={subject.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-medium text-stone-800 truncate">{subject.name}</span>
                      <span className="text-[10px]" style={{ color: subject.color }}>
                        {doneCount}/{totalCount}
                      </span>
                    </div>
                    <LiquidBar value={ratio} color={subject.color} height={5} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Study Pace Card */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-3 bg-stone-50 border border-stone-200/80"
            style={{ boxShadow: NEU_SHADOW }}
          >
            <div className="flex items-center gap-2 text-amber-800 font-mono text-xs font-bold uppercase">
              <BookOpen size={16} /> Pace Analytics
            </div>
            <div className="text-2xl font-bold font-mono text-stone-800">
              {paceInfo.remainingTopics} <span className="text-xs text-stone-500 font-sans font-normal">topics remaining</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">{paceInfo.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
