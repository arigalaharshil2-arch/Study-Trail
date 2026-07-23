import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertCircle, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { Topic, Subject, PlannedTopic } from "../../types";
import { PALETTE, NEU_SHADOW } from "../../lib/constants";

type InTabNotificationsProps = {
  topics: Topic[];
  subjects: Subject[];
  plannedTopics: PlannedTopic[];
  onOpenTopic: (topic: Topic) => void;
};

export function InTabNotifications({ topics, subjects, plannedTopics, onOpenTopic }: InTabNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Topics scheduled for today that are incomplete
  const todayPlannedIds = new Set(plannedTopics.filter((p) => p.date === todayStr).map((p) => p.topicId));
  const dueTodayTopics = topics.filter((t) => todayPlannedIds.has(t.id) && !t.completed);

  // Overdue topics (scheduled before today and incomplete)
  const overduePlannedIds = new Set(plannedTopics.filter((p) => p.date < todayStr).map((p) => p.topicId));
  const overdueTopics = topics.filter((t) => overduePlannedIds.has(t.id) && !t.completed);

  const totalNotifs = dueTodayTopics.length + overdueTopics.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSubjectColor = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.color || PALETTE.gold;
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || "Subject";
  };

  return (
    <div className="relative inline-block" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl transition-all hover:bg-black/5 flex items-center justify-center"
        style={{ color: totalNotifs > 0 ? PALETTE.text : PALETTE.muted }}
        title="Notifications"
      >
        <Bell size={18} />
        {totalNotifs > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ background: overdueTopics.length > 0 ? PALETTE.destructive : PALETTE.gold }}
          >
            {totalNotifs}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 rounded-2xl p-4 z-50 overflow-hidden"
            style={{
              background: PALETTE.card,
              boxShadow: NEU_SHADOW,
              border: `1px solid ${PALETTE.border}`,
            }}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/5">
              <span className="text-xs font-semibold tracking-wider uppercase text-stone-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Study Reminders
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono font-medium">
                {totalNotifs} pending
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto flex flex-col gap-2.5 pr-1">
              {totalNotifs === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400 flex flex-col items-center gap-1.5">
                  <CheckCircle2 size={24} className="text-emerald-500/70" />
                  <span>All caught up! No pending items.</span>
                </div>
              ) : (
                <>
                  {overdueTopics.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-rose-600 uppercase font-mono">
                        <AlertCircle size={12} />
                        <span>Overdue ({overdueTopics.length})</span>
                      </div>
                      {overdueTopics.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            onOpenTopic(t);
                            setIsOpen(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl text-left cursor-pointer hover:bg-stone-50 transition-colors border border-rose-100 bg-rose-50/30"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-medium text-stone-800 truncate">{t.name}</div>
                            <div className="text-[10px] font-mono" style={{ color: getSubjectColor(t.subjectId) }}>
                              {getSubjectName(t.subjectId)}
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-stone-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  {dueTodayTopics.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-amber-700 uppercase font-mono">
                        <Clock size={12} />
                        <span>Due Today ({dueTodayTopics.length})</span>
                      </div>
                      {dueTodayTopics.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            onOpenTopic(t);
                            setIsOpen(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl text-left cursor-pointer hover:bg-stone-50 transition-colors border border-amber-100 bg-amber-50/20"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-medium text-stone-800 truncate">{t.name}</div>
                            <div className="text-[10px] font-mono" style={{ color: getSubjectColor(t.subjectId) }}>
                              {getSubjectName(t.subjectId)}
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-stone-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
