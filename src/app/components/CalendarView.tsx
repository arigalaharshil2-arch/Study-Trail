import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, FileText, AlertCircle, Bookmark } from "lucide-react";
import { Subject, Topic, PlannedTopic, CalendarEvent, CalendarEventType } from "../../types";
import { PALETTE, NEU_SHADOW } from "../../lib/constants";

type CalendarViewProps = {
  subjects: Subject[];
  topics: Topic[];
  plannedTopics: PlannedTopic[];
  calendarEvents: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => void;
  onDeleteEvent: (eventId: string) => void;
  onOpenTopicFile: (topic: Topic) => void;
};

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarView({
  subjects,
  topics,
  plannedTopics,
  calendarEvents,
  onAddEvent,
  onDeleteEvent,
  onOpenTopicFile,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split("T")[0]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<CalendarEventType>("exam");
  const [newSubjectId, setNewSubjectId] = useState<string>("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // Mon = 0

  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayStr = new Date().toISOString().split("T")[0];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDateStr(todayStr);
  };

  const getSubject = (subjectId?: string) => (subjectId ? subjects.find((s) => s.id === subjectId) : undefined);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const subj = getSubject(newSubjectId);
    let color = PALETTE.gold;
    if (newType === "deadline") color = PALETTE.destructive;
    else if (subj) color = subj.color;

    onAddEvent({
      title: newTitle.trim(),
      date: selectedDateStr,
      type: newType,
      subjectId: newSubjectId || undefined,
      color,
    });

    setNewTitle("");
    setIsAddEventOpen(false);
  };

  // Scheduled Topics for Selected Date
  const selectedDatePlanned = plannedTopics.filter((p) => p.date === selectedDateStr);
  const selectedDateEvents = calendarEvents.filter((e) => e.date === selectedDateStr);

  return (
    <div className="flex flex-col h-full overflow-hidden px-8 pt-7 pb-6 max-w-7xl mx-auto w-full gap-5">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 border-b border-stone-200/80 pb-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-amber-800 uppercase">Monthly Overview</span>
          <h1 className="text-3xl font-bold text-stone-800" style={{ fontFamily: "Fraunces, serif" }}>
            {monthName}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-stone-100 rounded-xl p-1">
            <button onClick={handlePrevMonth} className="p-1 rounded-lg hover:bg-white text-stone-600">
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleNextMonth} className="p-1 rounded-lg hover:bg-white text-stone-600">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
        {/* Calendar Grid (3 cols) */}
        <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
          {/* Day of Week Labels */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5 shrink-0">
            {DOW.map((d) => (
              <div key={d} className="text-center text-[10px] font-mono font-bold tracking-widest text-stone-400 py-1 uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* Month Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5 flex-1 overflow-y-auto" style={{ gridAutoRows: "1fr" }}>
            {cells.map((dayNum, idx) => {
              if (!dayNum) return <div key={`empty-${idx}`} className="bg-transparent" />;

              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDateStr;

              const dayPlans = plannedTopics.filter((p) => p.date === dateStr);
              const dayEvts = calendarEvents.filter((e) => e.date === dateStr);

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className="rounded-xl p-2 flex flex-col gap-1 cursor-pointer transition-all border overflow-hidden min-h-[75px]"
                  style={{
                    background: isSelected ? "rgba(201,151,74,0.08)" : PALETTE.card,
                    borderColor: isSelected ? PALETTE.gold : isToday ? "rgba(201,151,74,0.4)" : PALETTE.border,
                    boxShadow: isSelected ? `0 0 0 1px ${PALETTE.gold}` : NEU_SHADOW,
                  }}
                >
                  <span
                    className="text-xs font-bold font-mono"
                    style={{ color: isToday ? PALETTE.gold : PALETTE.text }}
                  >
                    {dayNum}
                  </span>

                  <div className="flex flex-col gap-1 overflow-hidden">
                    {/* Event badges */}
                    {dayEvts.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[9px] font-mono font-semibold truncate px-1 py-0.5 rounded text-white"
                        style={{ background: ev.color || PALETTE.gold }}
                      >
                        {ev.type.toUpperCase()}: {ev.title}
                      </div>
                    ))}

                    {/* Scheduled topic badges */}
                    {dayPlans.slice(0, 2 - dayEvts.length).map((plan) => {
                      const topic = topics.find((t) => t.id === plan.topicId);
                      const subj = topic ? getSubject(topic.subjectId) : undefined;
                      const color = subj?.color || PALETTE.gold;

                      return (
                        <div
                          key={plan.id}
                          className="text-[9px] font-mono truncate px-1 py-0.5 rounded"
                          style={{ background: `${color}20`, color: color }}
                        >
                          {topic?.name}
                        </div>
                      );
                    })}

                    {dayPlans.length + dayEvts.length > 2 && (
                      <span className="text-[8px] font-mono text-stone-400">
                        +{dayPlans.length + dayEvts.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Sidebar (1 col) */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4 border overflow-y-auto bg-white"
          style={{ boxShadow: NEU_SHADOW, borderColor: PALETTE.border }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-amber-800 uppercase">
                Date Details
              </span>
              <h3 className="font-bold text-stone-800 text-lg" style={{ fontFamily: "Fraunces, serif" }}>
                {selectedDateStr}
              </h3>
            </div>
            <button
              onClick={() => setIsAddEventOpen(!isAddEventOpen)}
              className="p-1.5 rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              title="Add Event"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Add Event Form */}
          <AnimatePresence>
            {isAddEventOpen && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateEvent}
                className="flex flex-col gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200"
              >
                <span className="text-xs font-bold text-stone-800">Add Calendar Event</span>
                <input
                  type="text"
                  placeholder="Event title (e.g. Mid-term Exam)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white border border-stone-200 focus:outline-hidden"
                  required
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as CalendarEventType)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white border border-stone-200 focus:outline-hidden"
                >
                  <option value="exam">Exam</option>
                  <option value="deadline">Deadline</option>
                  <option value="event">Event</option>
                </select>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white border border-stone-200 focus:outline-hidden"
                >
                  <option value="">No Associated Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
                >
                  Save Event
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Manual Events */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
              Manual Events ({selectedDateEvents.length})
            </span>
            {selectedDateEvents.length === 0 ? (
              <span className="text-xs text-stone-400 font-mono italic">No manual events on this date.</span>
            ) : (
              selectedDateEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono"
                  style={{ background: `${ev.color || PALETTE.gold}10`, borderColor: `${ev.color || PALETTE.gold}30` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ev.color || PALETTE.gold }} />
                    <span className="font-semibold text-stone-800 truncate">{ev.title}</span>
                  </div>
                  <button
                    onClick={() => onDeleteEvent(ev.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors shrink-0"
                    title="Delete event"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Scheduled Topics */}
          <div className="flex flex-col gap-2 pt-2 border-t border-stone-200">
            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
              Scheduled Topics ({selectedDatePlanned.length})
            </span>
            {selectedDatePlanned.length === 0 ? (
              <span className="text-xs text-stone-400 font-mono italic">No topics scheduled for this date.</span>
            ) : (
              selectedDatePlanned.map((plan) => {
                const topic = topics.find((t) => t.id === plan.topicId);
                if (!topic) return null;
                const subj = getSubject(topic.subjectId);

                return (
                  <div
                    key={plan.id}
                    className="p-2.5 rounded-xl border bg-stone-50 border-stone-200 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-1">
                      <span className="font-semibold text-stone-800 block truncate">{topic.name}</span>
                      <span className="text-[10px] font-mono" style={{ color: subj?.color }}>
                        {subj?.name}
                      </span>
                    </div>
                    <button
                      onClick={() => onOpenTopicFile(topic)}
                      className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200 shrink-0"
                    >
                      <FileText size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
