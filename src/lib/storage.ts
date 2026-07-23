import { get, set, del } from "idb-keyval";
import { Subject, Chapter, Topic, PlannedTopic, CalendarEvent } from "../types";
import { DEFAULT_SUBJECT_COLORS, getSubjectColorDim } from "./constants";

const STORAGE_KEYS = {
  SUBJECTS: "study_trail_subjects_v1",
  CHAPTERS: "study_trail_chapters_v1",
  TOPICS: "study_trail_topics_v1",
  PLANNED_TOPICS: "study_trail_planned_topics_v1",
  CALENDAR_EVENTS: "study_trail_calendar_events_v1",
};

// --- Subjects ---
export async function getSubjects(): Promise<Subject[]> {
  const data = await get<Subject[]>(STORAGE_KEYS.SUBJECTS);
  return data || [];
}

export async function saveSubjects(subjects: Subject[]): Promise<void> {
  await set(STORAGE_KEYS.SUBJECTS, subjects);
}

// --- Chapters ---
export async function getChapters(): Promise<Chapter[]> {
  const data = await get<Chapter[]>(STORAGE_KEYS.CHAPTERS);
  return data || [];
}

export async function saveChapters(chapters: Chapter[]): Promise<void> {
  await set(STORAGE_KEYS.CHAPTERS, chapters);
}

// --- Topics ---
export async function getTopics(): Promise<Topic[]> {
  const data = await get<Topic[]>(STORAGE_KEYS.TOPICS);
  return data || [];
}

export async function saveTopics(topics: Topic[]): Promise<void> {
  await set(STORAGE_KEYS.TOPICS, topics);
}

// --- Planned Topics ---
export async function getPlannedTopics(): Promise<PlannedTopic[]> {
  const data = await get<PlannedTopic[]>(STORAGE_KEYS.PLANNED_TOPICS);
  return data || [];
}

export async function savePlannedTopics(planned: PlannedTopic[]): Promise<void> {
  await set(STORAGE_KEYS.PLANNED_TOPICS, planned);
}

// --- Calendar Events ---
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const data = await get<CalendarEvent[]>(STORAGE_KEYS.CALENDAR_EVENTS);
  return data || [];
}

export async function saveCalendarEvents(events: CalendarEvent[]): Promise<void> {
  await set(STORAGE_KEYS.CALENDAR_EVENTS, events);
}

// --- File Blobs in IndexedDB ---
export async function saveFileBlob(fileId: string, blob: Blob): Promise<void> {
  await set(`file_blob_${fileId}`, blob);
}

export async function getFileBlob(fileId: string): Promise<Blob | null> {
  const blob = await get<Blob>(`file_blob_${fileId}`);
  return blob || null;
}

export async function deleteFileBlob(fileId: string): Promise<void> {
  await del(`file_blob_${fileId}`);
}

// --- Clear database ---
export async function clearDatabase(): Promise<void> {
  await set(STORAGE_KEYS.SUBJECTS, []);
  await set(STORAGE_KEYS.CHAPTERS, []);
  await set(STORAGE_KEYS.TOPICS, []);
  await set(STORAGE_KEYS.PLANNED_TOPICS, []);
  await set(STORAGE_KEYS.CALENDAR_EVENTS, []);
}

// --- Seed Initial Demo Data If Empty ---
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  const existing = await getSubjects();
  if (existing && existing.length > 0) return false;

  const now = new Date().toISOString();
  const todayStr = new Date().toISOString().split("T")[0];

  // Calculate dates relative to today
  const todayObj = new Date();
  const getOffsetDate = (offsetDays: number) => {
    const d = new Date(todayObj);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  };

  const mathColor = DEFAULT_SUBJECT_COLORS[0]; // Lavender #9580C8
  const physColor = DEFAULT_SUBJECT_COLORS[1]; // Blue #5A9EC4
  const litColor  = DEFAULT_SUBJECT_COLORS[2]; // Coral #D98A72
  const chemColor = DEFAULT_SUBJECT_COLORS[6]; // Emerald #5EAD8A

  const subjects: Subject[] = [
    {
      id: "subj-math",
      name: "Mathematics",
      normalizedName: "mathematics",
      color: mathColor.color,
      colorDim: mathColor.colorDim,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "subj-physics",
      name: "Physics",
      normalizedName: "physics",
      color: physColor.color,
      colorDim: physColor.colorDim,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "subj-literature",
      name: "Literature",
      normalizedName: "literature",
      color: litColor.color,
      colorDim: litColor.colorDim,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "subj-chemistry",
      name: "Chemistry",
      normalizedName: "chemistry",
      color: chemColor.color,
      colorDim: chemColor.colorDim,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const chapters: Chapter[] = [
    // Math Chapters
    { id: "ch-m1", subjectId: "subj-math", name: "Sets & Relations", normalizedName: "sets & relations", sortOrder: 1, createdAt: now, updatedAt: now },
    { id: "ch-m2", subjectId: "subj-math", name: "Limits & Continuity", normalizedName: "limits & continuity", sortOrder: 2, createdAt: now, updatedAt: now },
    { id: "ch-m3", subjectId: "subj-math", name: "Differentiation", normalizedName: "differentiation", sortOrder: 3, createdAt: now, updatedAt: now },
    { id: "ch-m4", subjectId: "subj-math", name: "Integration", normalizedName: "integration", sortOrder: 4, createdAt: now, updatedAt: now },

    // Physics Chapters
    { id: "ch-p1", subjectId: "subj-physics", name: "Mechanics", normalizedName: "mechanics", sortOrder: 1, createdAt: now, updatedAt: now },
    { id: "ch-p2", subjectId: "subj-physics", name: "Waves & Oscillations", normalizedName: "waves & oscillations", sortOrder: 2, createdAt: now, updatedAt: now },

    // Literature Chapters
    { id: "ch-l1", subjectId: "subj-literature", name: "Modernist Fiction", normalizedName: "modernist fiction", sortOrder: 1, createdAt: now, updatedAt: now },

    // Chemistry Chapters
    { id: "ch-c1", subjectId: "subj-chemistry", name: "Atomic Structure", normalizedName: "atomic structure", sortOrder: 1, createdAt: now, updatedAt: now },
    { id: "ch-c2", subjectId: "subj-chemistry", name: "Chemical Bonding", normalizedName: "chemical bonding", sortOrder: 2, createdAt: now, updatedAt: now },
  ];

  const yesterdayStr = getOffsetDate(-1);
  const dayBeforeYesterdayStr = getOffsetDate(-2);

  const topics: Topic[] = [
    // Math Topics
    { id: "top-m1", chapterId: "ch-m1", subjectId: "subj-math", name: "Set Notation & Operations", fileName: "SetNotation.pdf", relativePath: "mathematics/sets & relations/setnotation.pdf", mimeType: "application/pdf", completed: true, completedAt: dayBeforeYesterdayStr, sortOrder: 1, createdAt: now, updatedAt: now },
    { id: "top-m2", chapterId: "ch-m1", subjectId: "subj-math", name: "Equivalence Relations", fileName: "Equivalence.pdf", relativePath: "mathematics/sets & relations/equivalence.pdf", mimeType: "application/pdf", completed: true, completedAt: yesterdayStr, sortOrder: 2, createdAt: now, updatedAt: now },
    { id: "top-m3", chapterId: "ch-m2", subjectId: "subj-math", name: "ε-δ Limit Definition", fileName: "LimitDefinition.pdf", relativePath: "mathematics/limits & continuity/limitdefinition.pdf", mimeType: "application/pdf", completed: true, completedAt: yesterdayStr, sortOrder: 1, createdAt: now, updatedAt: now },
    { id: "top-m4", chapterId: "ch-m3", subjectId: "subj-math", name: "Parametric Differentiation", fileName: "ParametricDiff.pdf", relativePath: "mathematics/differentiation/parametricdiff.pdf", mimeType: "application/pdf", completed: false, completedAt: null, sortOrder: 1, createdAt: now, updatedAt: now },
    { id: "top-m5", chapterId: "ch-m3", subjectId: "subj-math", name: "Related Rates Problems", fileName: "RelatedRates.pdf", relativePath: "mathematics/differentiation/relatedrates.pdf", mimeType: "application/pdf", completed: false, completedAt: null, sortOrder: 2, createdAt: now, updatedAt: now },
    { id: "top-m6", chapterId: "ch-m4", subjectId: "subj-math", name: "Integration by Parts", fileName: "IntegrationByParts.pdf", relativePath: "mathematics/integration/integrationbyparts.pdf", mimeType: "application/pdf", completed: false, completedAt: null, sortOrder: 1, createdAt: now, updatedAt: now },

    // Physics Topics
    { id: "top-p1", chapterId: "ch-p1", subjectId: "subj-physics", name: "Newton's Laws of Motion", fileName: "NewtonsLaws.pdf", relativePath: "physics/mechanics/newtonslaws.pdf", mimeType: "application/pdf", completed: true, completedAt: dayBeforeYesterdayStr, sortOrder: 1, createdAt: now, updatedAt: now },
    { id: "top-p2", chapterId: "ch-p2", subjectId: "subj-physics", name: "Wave Speed in Media", fileName: "WaveSpeed.pdf", relativePath: "physics/waves & oscillations/wavespeed.pdf", mimeType: "application/pdf", completed: false, completedAt: null, sortOrder: 1, createdAt: now, updatedAt: now },

    // Literature Topics
    { id: "top-l1", chapterId: "ch-l1", subjectId: "subj-literature", name: "Stream of Consciousness", fileName: "StreamOfConsciousness.docx", relativePath: "literature/modernist fiction/streamofconsciousness.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", completed: true, completedAt: yesterdayStr, sortOrder: 1, createdAt: now, updatedAt: now },

    // Chemistry Topics
    { id: "top-c1", chapterId: "ch-c1", subjectId: "subj-chemistry", name: "Quantum Numbers & Electron Config", fileName: "QuantumNumbers.pdf", relativePath: "chemistry/atomic structure/quantumnumbers.pdf", mimeType: "application/pdf", completed: true, completedAt: todayStr, sortOrder: 1, createdAt: now, updatedAt: now },
    { id: "top-c2", chapterId: "ch-c2", subjectId: "subj-chemistry", name: "Hybridisation sp³d", fileName: "Hybridisation.pdf", relativePath: "chemistry/chemical bonding/hybridisation.pdf", mimeType: "application/pdf", completed: true, completedAt: todayStr, sortOrder: 1, createdAt: now, updatedAt: now },
  ];

  const planned: PlannedTopic[] = [
    { id: "plan-1", topicId: "top-m4", date: todayStr, createdAt: now },
    { id: "plan-2", topicId: "top-c2", date: todayStr, createdAt: now },
    { id: "plan-3", topicId: "top-p2", date: yesterdayStr, createdAt: now }, // Overdue!
    { id: "plan-4", topicId: "top-m5", date: getOffsetDate(2), createdAt: now },
  ];

  const calendarEvents: CalendarEvent[] = [
    { id: "evt-1", title: "Chemistry Mid-term Exam", date: getOffsetDate(5), type: "exam", subjectId: "subj-chemistry", color: DEFAULT_SUBJECT_COLORS[4].color, createdAt: now, updatedAt: now },
    { id: "evt-2", title: "Literature Essay Deadline", date: getOffsetDate(3), type: "deadline", subjectId: "subj-literature", color: litColor.color, createdAt: now, updatedAt: now },
  ];

  await saveSubjects(subjects);
  await saveChapters(chapters);
  await saveTopics(topics);
  await savePlannedTopics(planned);
  await saveCalendarEvents(calendarEvents);

  return true;
}
