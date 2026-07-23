import React from "react";
import { motion } from "framer-motion";
import { Calendar, LayoutGrid, BookOpen, Clock, FolderUp, Palette, ChevronRight } from "lucide-react";
import { Subject, Chapter, Topic, ViewMode } from "../../types";
import { LiquidBar } from "./LiquidBar";
import { PALETTE, NEU_SHADOW } from "../../lib/constants";
import { calculateSubjectProgress } from "../../lib/analytics";

type SidebarProps = {
  subjects: Subject[];
  chapters: Chapter[];
  topics: Topic[];
  activeView: ViewMode;
  activeSubjectId: string | null;
  onSelectView: (view: ViewMode) => void;
  onSelectSubject: (subjectId: string) => void;
  onOpenUpload: () => void;
  onOpenColorPicker?: (subject: Subject) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export function Sidebar({
  subjects,
  topics,
  activeView,
  activeSubjectId,
  onSelectView,
  onSelectSubject,
  onOpenUpload,
  onOpenColorPicker,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: "today", label: "Today", icon: <Clock size={16} /> },
    { id: "subjects", label: "Subjects", icon: <BookOpen size={16} /> },
    { id: "weekly", label: "Weekly Plan", icon: <LayoutGrid size={16} /> },
    { id: "calendar", label: "Calendar", icon: <Calendar size={16} /> },
  ];

  const content = (
    <div
      className="flex flex-col h-full overflow-hidden shrink-0 border-r border-stone-300/40"
      style={{ width: 240, background: PALETTE.sidebarBg }}
    >
      {/* App Branding */}
      <div className="px-5 pt-6 pb-4 shrink-0">
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: PALETTE.text, letterSpacing: "-0.01em" }}>
          Study Trail
        </div>
        <div
          className="text-[9.5px] mt-0.5 tracking-widest uppercase font-mono"
          style={{ color: PALETTE.muted }}
        >
          PERSONAL STUDY LOGBOOK
        </div>
      </div>

      <div className="w-full h-px shrink-0 bg-stone-300/40" />

      {/* Main Navigation */}
      <div className="px-3 pt-4 pb-2 flex flex-col gap-1 shrink-0">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectView(item.id);
                onCloseMobile?.();
              }}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left w-full"
              style={{
                background: isActive ? PALETTE.card : "transparent",
                color: isActive ? PALETTE.gold : PALETTE.text,
                boxShadow: isActive ? NEU_SHADOW : "none",
                border: isActive ? `1px solid rgba(201,151,74,0.3)` : "1px solid transparent",
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="px-3 py-2 shrink-0">
        <button
          onClick={() => {
            onOpenUpload();
            onCloseMobile?.();
          }}
          className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-sm hover:opacity-90 active:scale-95"
          style={{ background: PALETTE.gold }}
        >
          <FolderUp size={15} />
          <span>Upload Folder</span>
        </button>
      </div>

      <div className="w-full h-px shrink-0 bg-stone-300/40 my-2" />

      {/* Subjects List */}
      <div className="flex-1 overflow-y-auto px-3 py-1">
        <div className="text-[9.5px] font-mono px-2 mb-2 tracking-widest text-stone-500 uppercase">
          SUBJECT TRAILS ({subjects.length})
        </div>

        {subjects.map((s) => {
          const pct = calculateSubjectProgress(topics, s.id);
          const isSelected = activeView === "trail" && activeSubjectId === s.id;

          return (
            <div key={s.id} className="group relative mb-1.5">
              <button
                onClick={() => {
                  onSelectSubject(s.id);
                  onCloseMobile?.();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl flex flex-col gap-1.5 transition-all"
                style={{
                  background: isSelected ? PALETTE.card : "transparent",
                  border: isSelected ? `1px solid ${s.color}40` : "1px solid transparent",
                  boxShadow: isSelected ? NEU_SHADOW : "none",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-medium truncate pr-1"
                    style={{ color: isSelected ? PALETTE.text : PALETTE.muted }}
                  >
                    {s.name}
                  </span>
                  <span className="text-[10px] font-mono tabular-nums shrink-0" style={{ color: s.color }}>
                    {Math.round(pct * 100)}%
                  </span>
                </div>
                <LiquidBar value={pct} color={s.color} height={4} />
              </button>

              {onOpenColorPicker && (
                <button
                  onClick={() => onOpenColorPicker(s)}
                  title="Change subject color"
                  className="absolute right-2 top-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-stone-200/80 hover:bg-stone-300 text-stone-600"
                >
                  <Palette size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer metadata */}
      <div className="p-4 shrink-0 border-t border-stone-300/40 text-[10px] font-mono text-stone-500 flex flex-col gap-0.5">
        <div className="font-semibold text-stone-700">ACADEMIC YEAR 2026</div>
        <div>{topics.length} study topics indexed</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block h-full">{content}</aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
