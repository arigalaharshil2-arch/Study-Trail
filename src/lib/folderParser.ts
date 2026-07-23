import { Subject, Chapter, Topic, MergeSummary } from "../types";
import { getSubjects, saveSubjects, getChapters, saveChapters, getTopics, saveTopics, saveFileBlob } from "./storage";
import { DEFAULT_SUBJECT_COLORS, getSubjectColorDim } from "./constants";

export type UploadedFileItem = {
  file: File;
  relativePath: string; // e.g., "Mathematics/Calculus/Limits.pdf" or "Physics/Mechanics/Kinematics.pdf"
};

export function normalizePath(path: string): string {
  return path
    .toLowerCase()
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .trim();
}

export type UploadOptions = {
  targetSubjectId?: string;
  targetChapterId?: string;
  targetChapterName?: string;
};

export function parsePathHierarchy(
  relativePath: string,
  options?: UploadOptions
): {
  subjectName: string;
  chapterName: string;
  topicName: string;
  fileName: string;
  normalizedPath: string;
} {
  const normPath = normalizePath(relativePath);
  const parts = normPath.split("/").filter(Boolean);

  let subjectName = "General Study";
  let chapterName = "General";
  let fileName = parts[parts.length - 1] || "Untitled";

  if (parts.length >= 3) {
    subjectName = rawPartToTitle(parts[0]);
    chapterName = rawPartToTitle(parts[1]);
  } else if (parts.length === 2) {
    // 2 parts e.g. "Chapter/Topic.pdf" or "Subject/Topic.pdf"
    subjectName = rawPartToTitle(parts[0]);
    chapterName = "General";
  } else if (parts.length === 1) {
    subjectName = "General Study";
    chapterName = "General";
  }

  // Overrides when 2 parts are uploaded under a target subject: part 0 becomes chapter name
  if (options?.targetSubjectId && parts.length === 2) {
    chapterName = rawPartToTitle(parts[0]);
  }

  // Topic name is derived from file name without extension
  const dotIdx = fileName.lastIndexOf(".");
  const nameWithoutExt = dotIdx > 0 ? fileName.substring(0, dotIdx) : fileName;
  const topicName = rawPartToTitle(nameWithoutExt);

  return {
    subjectName,
    chapterName,
    topicName,
    fileName,
    normalizedPath: normPath,
  };
}

function rawPartToTitle(str: string): string {
  if (!str) return "Untitled";
  // Replace underscores and hyphens with spaces and capitalize words
  return str
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function processFolderUpload(
  files: UploadedFileItem[],
  options?: UploadOptions
): Promise<MergeSummary> {
  const existingSubjects = await getSubjects();
  const existingChapters = await getChapters();
  const existingTopics   = await getTopics();

  const now = new Date().toISOString();

  let subjectsAdded = 0;
  let chaptersAdded = 0;
  let topicsAdded = 0;
  let topicsUpdated = 0;

  const subjectsMap = new Map<string, Subject>();
  existingSubjects.forEach((s) => subjectsMap.set(s.normalizedName, s));

  const chaptersMap = new Map<string, Chapter>();
  existingChapters.forEach((c) => {
    const key = `${c.subjectId}::${c.normalizedName}`;
    chaptersMap.set(key, c);
  });

  const topicsMap = new Map<string, Topic>();
  existingTopics.forEach((t) => topicsMap.set(t.relativePath, t));

  // Used palette index counter for new subjects
  let colorIdx = existingSubjects.length % DEFAULT_SUBJECT_COLORS.length;

  // Pre-resolve target subject if options.targetSubjectId is given
  let targetSubject: Subject | undefined = undefined;
  if (options?.targetSubjectId) {
    targetSubject = existingSubjects.find((s) => s.id === options.targetSubjectId);
  }

  // Pre-resolve target chapter if options.targetChapterId is given
  let targetChapter: Chapter | undefined = undefined;
  if (options?.targetChapterId) {
    targetChapter = existingChapters.find((c) => c.id === options.targetChapterId);
  }

  for (const item of files) {
    if (!item.relativePath || item.file.name.startsWith(".")) continue; // skip hidden files

    const parsed = parsePathHierarchy(item.relativePath, options);
    let { subjectName, chapterName, topicName, fileName, normalizedPath } = parsed;

    // 1. Resolve Subject
    let subject: Subject;
    if (targetSubject) {
      subject = targetSubject;
    } else {
      const normSubjName = subjectName.toLowerCase().trim();
      let foundSubj = subjectsMap.get(normSubjName);
      if (!foundSubj) {
        const palette = DEFAULT_SUBJECT_COLORS[colorIdx % DEFAULT_SUBJECT_COLORS.length];
        colorIdx++;
        foundSubj = {
          id: `subj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: subjectName,
          normalizedName: normSubjName,
          color: palette.color,
          colorDim: palette.colorDim,
          createdAt: now,
          updatedAt: now,
        };
        subjectsMap.set(normSubjName, foundSubj);
        subjectsAdded++;
      }
      subject = foundSubj;
    }

    // 2. Resolve Chapter
    let chapter: Chapter;
    if (targetChapter) {
      chapter = targetChapter;
    } else if (options?.targetChapterName && options.targetChapterName.trim()) {
      const customChapName = options.targetChapterName.trim();
      const normCustomChap = customChapName.toLowerCase();
      const chapKey = `${subject.id}::${normCustomChap}`;
      let foundChap = chaptersMap.get(chapKey);
      if (!foundChap) {
        const subjectChapters = Array.from(chaptersMap.values()).filter((c) => c.subjectId === subject.id);
        foundChap = {
          id: `chap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          subjectId: subject.id,
          name: customChapName,
          normalizedName: normCustomChap,
          sortOrder: subjectChapters.length + 1,
          createdAt: now,
          updatedAt: now,
        };
        chaptersMap.set(chapKey, foundChap);
        chaptersAdded++;
      }
      chapter = foundChap;
    } else {
      const normChapName = chapterName.toLowerCase().trim();
      const chapKey = `${subject.id}::${normChapName}`;
      let foundChap = chaptersMap.get(chapKey);
      if (!foundChap) {
        const subjectChapters = Array.from(chaptersMap.values()).filter((c) => c.subjectId === subject.id);
        foundChap = {
          id: `chap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          subjectId: subject.id,
          name: chapterName,
          normalizedName: normChapName,
          sortOrder: subjectChapters.length + 1,
          createdAt: now,
          updatedAt: now,
        };
        chaptersMap.set(chapKey, foundChap);
        chaptersAdded++;
      }
      chapter = foundChap;
    }

    // Unify relative path key if targeting a specific subject/chapter
    const topicRelPath = targetSubject || targetChapter
      ? `${subject.name}/${chapter.name}/${fileName}`.toLowerCase()
      : normalizedPath;

    // 3. Resolve Topic
    let topic = topicsMap.get(topicRelPath);
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Save actual file blob to IndexedDB
    try {
      await saveFileBlob(fileId, item.file);
    } catch (e) {
      console.warn("Could not save file blob into IndexedDB:", e);
    }

    if (topic) {
      // DETERMINISTIC MERGING: Preserve completion state, completedAt, id, and schedule
      topic = {
        ...topic,
        name: topicName,
        fileName: fileName,
        mimeType: item.file.type || getMimeTypeFromExt(fileName),
        fileId: fileId,
        updatedAt: now,
      };
      topicsMap.set(topicRelPath, topic);
      topicsUpdated++;
    } else {
      const chapTopics = Array.from(topicsMap.values()).filter((t) => t.chapterId === chapter.id);
      topic = {
        id: `top-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        chapterId: chapter.id,
        subjectId: subject.id,
        name: topicName,
        fileName: fileName,
        relativePath: topicRelPath,
        mimeType: item.file.type || getMimeTypeFromExt(fileName),
        fileId: fileId,
        completed: false,
        completedAt: null,
        sortOrder: chapTopics.length + 1,
        createdAt: now,
        updatedAt: now,
      };
      topicsMap.set(topicRelPath, topic);
      topicsAdded++;
    }
  }

  // Save back to persistent store
  const updatedSubjects = Array.from(subjectsMap.values());
  const updatedChapters = Array.from(chaptersMap.values());
  const updatedTopics   = Array.from(topicsMap.values());

  await saveSubjects(updatedSubjects);
  await saveChapters(updatedChapters);
  await saveTopics(updatedTopics);

  return {
    subjectsAdded,
    chaptersAdded,
    topicsAdded,
    topicsUpdated,
    totalProcessed: files.length,
  };
}

function getMimeTypeFromExt(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf": return "application/pdf";
    case "doc": return "application/msword";
    case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "ppt": return "application/vnd.ms-powerpoint";
    case "pptx": return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "txt": return "text/plain";
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    default: return "application/octet-stream";
  }
}
