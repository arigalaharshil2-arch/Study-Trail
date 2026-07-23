import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check, Search, Calendar as CalendarIcon, Filter } from "lucide-react";
import { Subject, Chapter, Topic, PlannedTopic } from "../../types";
import { PALETTE, NEU_SHADOW } from "../../lib/constants";

type WeeklyPlanViewProps = {
  subjects: Subject[];
  chapters: Chapter[];
  topics: Topic[];
  plannedTopics: PlannedTopic[];
  onAddPlan: (topicId: string, date: string) => void;
  onRemovePlan: (planId: string) => void;
  onToggleTopic: (topicId: string) => void;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeeklyPlanView({
  subjects,
  chapters,
  topics,
  plannedTopics,
  onAddPlan,
  onRemovePlan,
  onToggleTopic,
}: WeeklyPlanViewProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  // Calculate dates for current week (Monday to Sunday)
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek);

  const weekDates = DAYS.map((dayLabel, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateStr = d.toISOString().split("T")[0];
    const isToday = dateStr === today.toISOString().split("T")[0];
    return { dayLabel, dateStr, isToday, dateNum: d.getDate() };
  });

  // Topics available to schedule (all incomplete or unscheduled topics)
  const scheduledTopicIds = new Set(plannedTopics.map((p) => p.topicId));
  const pendingTopics = topics.filter((t) => {
    if (t.completed) return false;
    if (subjectFilter !== "all" && t.subjectId !== subjectFilter) return false;
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleAssignToDate = (dateStr: string) => {
    if (!selectedTopicId) return;
    onAddPlan(selectedTopicId, dateStr);
    setSelectedTopicId(null);
  };

  const getSubject = (subjectId: string) => subjects.find((s) => s.id === subjectId);

  return (
    <div className="flex flex-col h-full overflow-hidden px-8 pt-7 pb-6 max-w-7xl mx-auto w-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-amber-800 uppercase">Weekly Schedule</span>
          <h1 className="text-3xl font-bold text-stone-800" style={{ fontFamily: "Fraunces, serif" }}>
            Weekly Planner
          </h1>
        </div>
      </div>

      {/* Available Topics Selector Bar */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-3 border shrink-0 bg-white"
        style={{ boxShadow: NEU_SHADOW, borderColor: PALETTE.border }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-mono font-bold text-stone-700 uppercase tracking-wider">
            {selectedTopicId ? "Assigning Selected Topic → Click any Day below" : "Select a topic to schedule into your week:"}
          </div>

          {/* Search & Subject Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1 rounded-xl text-xs font-mono border border-stone-200 bg-stone-50 focus:outline-hidden focus:border-amber-500 w-36"
              />
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="py-1 px-2.5 rounded-xl text-xs font-mono border border-stone-200 bg-stone-50 focus:outline-hidden text-stone-700"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pending Topics Pill List */}
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pt-1 pr-1">
          {pendingTopics.length === 0 ? (
            <span className="text-xs text-stone-400 font-mono py-1">No pending topics match filters.</span>
          ) : (
            pendingTopics.map((topic) => {
              const subject = getSubject(topic.subjectId);
              const color = subject?.color || PALETTE.gold;
              const isSelected = selectedTopicId === topic.id;

              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicId(isSelected ? null : topic.id)}
                  className="text-[11px] px-3 py-1 rounded-full font-mono transition-all border flex items-center gap-1.5"
                  style={{
                    background: isSelected ? color : PALETTE.card,
                    color: isSelected ? "#FFFFFF" : PALETTE.text,
                    borderColor: isSelected ? color : PALETTE.border,
                    boxShadow: isSelected ? "none" : NEU_SHADOW,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? "#FFF" : color }} />
                  <span className="font-medium">{subject?.name.substring(0, 4).toUpperCase()}:</span>
                  <span>{topic.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 7-Day Weekly Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
        <div className="grid grid-cols-7 gap-3 h-full min-w-[850px]">
          {weekDates.map(({ dayLabel, dateStr, isToday, dateNum }) => {
            const dayPlans = plannedTopics.filter((p) => p.date === dateStr);

            return (
              <div key={dateStr} className="flex flex-col gap-2 h-full">
                {/* Day Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs font-bold font-mono uppercase tracking-wider"
                      style={{ color: isToday ? PALETTE.gold : PALETTE.text }}
                    >
                      {dayLabel} {dateNum}
                    </span>
                  </div>
                  {isToday && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-600 text-white font-bold">
                      TODAY
                    </span>
                  )}
                </div>

                {/* Day Droppable Container */}
                <div
                  onClick={() => handleAssignToDate(dateStr)}
                  className="flex-1 rounded-2xl p-2.5 flex flex-col gap-2 transition-all overflow-y-auto border"
                  style={{
                    background: selectedTopicId ? "rgba(201,151,74,0.05)" : PALETTE.card,
                    borderColor: selectedTopicId ? "rgba(201,151,74,0.4)" : PALETTE.border,
                    boxShadow: selectedTopicId ? "none" : NEU_SHADOW,
                    cursor: selectedTopicId ? "pointer" : "default",
                  }}
                >
                  <AnimatePresence>
                    {dayPlans.map((plan) => {
                      const topic = topics.find((t) => t.id === plan.topicId);
                      if (!topic) return null;
                      const subject = getSubject(topic.subjectId);
                      const color = subject?.color || PALETTE.gold;

                      return (
                        <motion.div
                          key={plan.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="group relative rounded-xl p-2 flex flex-col gap-1 border transition-all"
                          style={{
                            background: `${color}12`,
                            borderColor: `${color}35`,
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemovePlan(plan.id);
                            }}
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-stone-700"
                            title="Remove from day"
                          >
                            <X size={12} />
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleTopic(topic.id);
                              }}
                              className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0"
                              style={{
                                borderColor: topic.completed ? color : "rgba(61,52,44,0.3)",
                                background: topic.completed ? color : "transparent",
                              }}
                            >
                              {topic.completed && <Check size={8} className="text-white" strokeWidth={3} />}
                            </button>

                            <span className="text-[10px] font-mono font-bold" style={{ color }}>
                              {subject?.name.substring(0, 4).toUpperCase()}
                            </span>
                          </div>

                          <div
                            className="text-xs font-medium text-stone-800 leading-tight truncate pr-3"
                            style={{ textDecoration: topic.completed ? "line-through" : "none" }}
                          >
                            {topic.name}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {dayPlans.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-300">
                      <Plus size={16} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
