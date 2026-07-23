import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, LayoutGrid, Calendar as CalendarIcon, Menu, FolderUp } from "lucide-react";
import { Toaster, toast } from "sonner";

import { Subject, Chapter, Topic, PlannedTopic, CalendarEvent, ViewMode, MergeSummary } from "../types";
import {
  getSubjects,
  saveSubjects,
  getChapters,
  getTopics,
  saveTopics,
  getPlannedTopics,
  savePlannedTopics,
  getCalendarEvents,
  saveCalendarEvents,
  seedInitialDataIfEmpty,
} from "../lib/storage";

import { Sidebar } from "./components/Sidebar";
import { TodayView } from "./components/TodayView";
import { SubjectsView } from "./components/SubjectsView";
import { StudyTrailView } from "./components/StudyTrailView";
import { WeeklyPlanView } from "./components/WeeklyPlanView";
import { CalendarView } from "./components/CalendarView";
import { FolderUploadModal } from "./components/FolderUploadModal";
import { SubjectColorPickerModal } from "./components/SubjectColorPickerModal";
import { FileViewerModal } from "./components/FileViewerModal";
import { InTabNotifications } from "./components/InTabNotifications";
import { CelebrationOverlay } from "./components/CelebrationOverlay";
import { PALETTE, NEU_SHADOW } from "../lib/constants";

// Global styles for custom scrollbars, animations, fonts
const GLOBAL_STYLES = `
  @keyframes pulse-ring {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.65; transform: scale(1.18); }
  }
  @keyframes shimmer-pass {
    from { transform: translateX(-180%) skewX(-12deg); }
    to   { transform: translateX(380%) skewX(-12deg); }
  }
  .pulse-glow { animation: pulse-ring 2.1s ease-in-out infinite; }
  .shimmer-bar { position: relative; overflow: hidden; }
  .shimmer-bar::after {
    content: '';
    position: absolute;
    inset: 0;
    width: 45%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
    animation: shimmer-pass 2.6s ease-in-out infinite;
    border-radius: inherit;
  }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(61,52,44,0.15); border-radius: 2px; }
  body { font-family: 'Inter', sans-serif; background-color: #FAF8F4; color: #3D342C; }
`;

export default function App() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [plannedTopics, setPlannedTopics] = useState<PlannedTopic[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const [activeView, setActiveView] = useState<ViewMode>("today");
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  // Modals & Overlays state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTargetContext, setUploadTargetContext] = useState<{
    subjectId?: string;
    chapterId?: string;
  } | null>(null);

  const [colorPickerSubject, setColorPickerSubject] = useState<Subject | null>(null);
  const [selectedViewerTopic, setSelectedViewerTopic] = useState<Topic | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleOpenUploadTarget = (subjectId?: string, chapterId?: string) => {
    setUploadTargetContext({ subjectId, chapterId });
    setIsUploadOpen(true);
  };

  // Celebration state
  const [celebState, setCelebState] = useState<{
    type: "chapter" | "subject" | null;
    subject: Subject | null;
    chapter: Chapter | null;
  }>({ type: null, subject: null, chapter: null });

  // Load persistent DB data
  const loadData = useCallback(async () => {
    await seedInitialDataIfEmpty();
    const subjs = await getSubjects();
    const chaps = await getChapters();
    const tops = await getTopics();
    const plans = await getPlannedTopics();
    const evts = await getCalendarEvents();

    setSubjects(subjs);
    setChapters(chaps);
    setTopics(tops);
    setPlannedTopics(plans);
    setCalendarEvents(evts);

    if (subjs.length > 0 && !activeSubjectId) {
      setActiveSubjectId(subjs[0].id);
    }
  }, [activeSubjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Topic Completion Handler
  const handleToggleTopic = useCallback(
    async (topicId: string) => {
      const topicToToggle = topics.find((t) => t.id === topicId);
      if (!topicToToggle) return;

      const newCompleted = !topicToToggle.completed;
      const nowStr = new Date().toISOString();

      const updatedTopics = topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              completed: newCompleted,
              completedAt: newCompleted ? nowStr : null,
              updatedAt: nowStr,
            }
          : t
      );

      setTopics(updatedTopics);
      await saveTopics(updatedTopics);

      toast.success(newCompleted ? `Marked "${topicToToggle.name}" as completed!` : `Unmarked "${topicToToggle.name}"`);

      if (newCompleted) {
        // Check for Chapter & Subject completion celebrations
        const chap = chapters.find((c) => c.id === topicToToggle.chapterId);
        const subj = subjects.find((s) => s.id === topicToToggle.subjectId);

        if (chap && subj) {
          const chapTopics = updatedTopics.filter((t) => t.chapterId === chap.id);
          const isChapDone = chapTopics.length > 0 && chapTopics.every((t) => t.completed);

          const subjTopics = updatedTopics.filter((t) => t.subjectId === subj.id);
          const isSubjDone = subjTopics.length > 0 && subjTopics.every((t) => t.completed);

          if (isSubjDone) {
            setTimeout(() => setCelebState({ type: "subject", subject: subj, chapter: chap }), 300);
          } else if (isChapDone) {
            setTimeout(() => setCelebState({ type: "chapter", subject: subj, chapter: chap }), 300);
          }
        }
      }
    },
    [topics, chapters, subjects]
  );

  // Subject Selection Handler
  const handleSelectSubject = (subjectId: string) => {
    setActiveSubjectId(subjectId);
    setActiveChapterId(null);
    setActiveView("trail");
  };

  // Subject Color Update Handler
  const handleSaveSubjectColor = async (subjectId: string, color: string, colorDim: string) => {
    const updatedSubjs = subjects.map((s) => (s.id === subjectId ? { ...s, color, colorDim } : s));
    setSubjects(updatedSubjs);
    await saveSubjects(updatedSubjs);
    toast.success("Subject color updated!");
  };

  // Weekly Plan Schedule Handlers
  const handleAddPlan = async (topicId: string, date: string) => {
    const newPlan: PlannedTopic = {
      id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      topicId,
      date,
      createdAt: new Date().toISOString(),
    };
    const updatedPlans = [...plannedTopics, newPlan];
    setPlannedTopics(updatedPlans);
    await savePlannedTopics(updatedPlans);
    toast.success("Topic scheduled into weekly plan!");
  };

  const handleRemovePlan = async (planId: string) => {
    const updatedPlans = plannedTopics.filter((p) => p.id !== planId);
    setPlannedTopics(updatedPlans);
    await savePlannedTopics(updatedPlans);
    toast.success("Removed from weekly plan.");
  };

  // Calendar Manual Event Handlers
  const handleAddCalendarEvent = async (eventData: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newEvt: CalendarEvent = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    const updatedEvts = [...calendarEvents, newEvt];
    setCalendarEvents(updatedEvts);
    await saveCalendarEvents(updatedEvts);
    toast.success("Calendar event created!");
  };

  const handleDeleteCalendarEvent = async (eventId: string) => {
    const updatedEvts = calendarEvents.filter((e) => e.id !== eventId);
    setCalendarEvents(updatedEvts);
    await saveCalendarEvents(updatedEvts);
    toast.success("Calendar event deleted.");
  };

  // Upload Complete Handler
  const handleUploadSuccess = (summary: MergeSummary) => {
    loadData();
  };

  const handleTopicUpdated = (updatedTopic: Topic) => {
    setTopics((prev) => prev.map((t) => (t.id === updatedTopic.id ? updatedTopic : t)));
    setSelectedViewerTopic(updatedTopic);
  };

  const activeSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <Toaster position="bottom-right" richColors />

      <div className="flex h-screen overflow-hidden bg-[#FAF8F4]">
        {/* Sidebar Component */}
        <Sidebar
          subjects={subjects}
          chapters={chapters}
          topics={topics}
          activeView={activeView}
          activeSubjectId={activeSubjectId}
          onSelectView={setActiveView}
          onSelectSubject={handleSelectSubject}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenColorPicker={setColorPickerSubject}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Workspace */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top Navbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-[#FAF8F4] shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-200/60 transition-colors"
              >
                <Menu size={20} />
              </button>

              <div className="hidden sm:flex items-center gap-1.5">
                {[
                  { id: "today", label: "Today", icon: <Clock size={14} /> },
                  { id: "subjects", label: "Subjects", icon: <BookOpen size={14} /> },
                  { id: "weekly", label: "Weekly Plan", icon: <LayoutGrid size={14} /> },
                  { id: "calendar", label: "Calendar", icon: <CalendarIcon size={14} /> },
                ].map((item) => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id as ViewMode)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: isActive ? PALETTE.card : "transparent",
                        color: isActive ? PALETTE.gold : PALETTE.muted,
                        border: isActive ? `1px solid rgba(201,151,74,0.3)` : "1px solid transparent",
                        boxShadow: isActive ? NEU_SHADOW : "none",
                      }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <InTabNotifications
                topics={topics}
                subjects={subjects}
                plannedTopics={plannedTopics}
                onOpenTopic={(t) => setSelectedViewerTopic(t)}
              />

              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all shadow-sm hover:opacity-90"
                style={{ background: PALETTE.gold }}
              >
                <FolderUp size={14} />
                <span className="hidden sm:inline">Upload Folder</span>
              </button>
            </div>
          </div>

          {/* Active View Container */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeView}-${activeSubjectId}-${activeChapterId}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="h-full"
              >
                {activeView === "today" && (
                  <TodayView
                    subjects={subjects}
                    chapters={chapters}
                    topics={topics}
                    plannedTopics={plannedTopics}
                    onToggleTopic={handleToggleTopic}
                    onOpenTopicFile={setSelectedViewerTopic}
                    onNavigateToWeekly={() => setActiveView("weekly")}
                    onNavigateToSubjects={() => setActiveView("subjects")}
                  />
                )}

                {activeView === "subjects" && (
                  <SubjectsView
                    subjects={subjects}
                    chapters={chapters}
                    topics={topics}
                    onSelectSubject={handleSelectSubject}
                    onOpenUpload={() => handleOpenUploadTarget()}
                    onOpenUploadTarget={handleOpenUploadTarget}
                    onOpenColorPicker={setColorPickerSubject}
                  />
                )}

                {activeView === "trail" && activeSubject && (
                  <StudyTrailView
                    subject={activeSubject}
                    chapters={chapters}
                    topics={topics}
                    plannedTopics={plannedTopics}
                    activeChapterId={activeChapterId}
                    onSelectChapter={setActiveChapterId}
                    onToggleTopic={handleToggleTopic}
                    onOpenTopicFile={setSelectedViewerTopic}
                    onOpenUploadTarget={handleOpenUploadTarget}
                  />
                )}

                {activeView === "weekly" && (
                  <WeeklyPlanView
                    subjects={subjects}
                    chapters={chapters}
                    topics={topics}
                    plannedTopics={plannedTopics}
                    onAddPlan={handleAddPlan}
                    onRemovePlan={handleRemovePlan}
                    onToggleTopic={handleToggleTopic}
                  />
                )}

                {activeView === "calendar" && (
                  <CalendarView
                    subjects={subjects}
                    topics={topics}
                    plannedTopics={plannedTopics}
                    calendarEvents={calendarEvents}
                    onAddEvent={handleAddCalendarEvent}
                    onDeleteEvent={handleDeleteCalendarEvent}
                    onOpenTopicFile={setSelectedViewerTopic}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Folder Upload Modal */}
      <FolderUploadModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setUploadTargetContext(null);
        }}
        onUploadSuccess={handleUploadSuccess}
        initialSubjectId={uploadTargetContext?.subjectId}
        initialChapterId={uploadTargetContext?.chapterId}
      />

      {/* Subject Color Picker Modal */}
      <SubjectColorPickerModal
        subject={colorPickerSubject}
        onClose={() => setColorPickerSubject(null)}
        onSaveColor={handleSaveSubjectColor}
      />

      {/* File Preview & Download Modal */}
      <FileViewerModal
        topic={selectedViewerTopic}
        onClose={() => setSelectedViewerTopic(null)}
        onTopicUpdated={handleTopicUpdated}
      />

      {/* Chapter / Subject Completion Celebration Overlay */}
      <CelebrationOverlay
        type={celebState.type}
        subject={celebState.subject}
        chapter={celebState.chapter}
        onDismiss={() => setCelebState({ type: null, subject: null, chapter: null })}
      />
    </>
  );
}
