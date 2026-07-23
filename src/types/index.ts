export type Subject = {
  id: string;
  name: string;
  normalizedName: string;
  color: string;
  colorDim: string;
  createdAt: string;
  updatedAt: string;
};

export type Chapter = {
  id: string;
  subjectId: string;
  name: string;
  normalizedName: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Topic = {
  id: string;
  chapterId: string;
  subjectId: string;
  name: string;
  fileName: string;
  relativePath: string; // normalized key: e.g. "mathematics/calculus/limits.pdf"
  mimeType: string;
  fileId?: string; // key in IndexedDB blob store
  localPath?: string; // absolute local path when running in desktop mode
  fileMissing?: boolean; // flagged if file cannot be retrieved or located
  completed: boolean;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PlannedTopic = {
  id: string;
  topicId: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
};

export type CalendarEventType = "topic" | "exam" | "deadline" | "event";

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  type: CalendarEventType;
  subjectId?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
};

export type ViewMode = "today" | "subjects" | "trail" | "weekly" | "calendar";

export type NodeStatus = "completed" | "current" | "upcoming";

export type TrailNode = {
  id: string;
  title: string;
  total: number;
  done: number;
  status: NodeStatus;
  chapterId?: string;
};

export type MergeSummary = {
  subjectsAdded: number;
  chaptersAdded: number;
  topicsAdded: number;
  topicsUpdated: number;
  totalProcessed: number;
};
