import { Topic } from "../types";
import { getFileBlob, saveFileBlob, getTopics, saveTopics } from "./storage";

export function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

/**
 * Attempts to open a topic file using the OS default application (PowerPoint, Word, PDF Reader, Image viewer, etc.).
 */
export async function openTopicNative(
  topic: Topic
): Promise<{ success: boolean; error?: string; tempPath?: string }> {
  if (!isTauri()) {
    return { success: false, error: "WEB_MODE" };
  }

  try {
    const { open } = await import("@tauri-apps/plugin-shell");

    // 1. If absolute localPath is recorded, try launching it directly
    if (topic.localPath) {
      try {
        await open(topic.localPath);
        return { success: true };
      } catch (err) {
        console.warn("Direct localPath open failed, falling back to blob export:", err);
      }
    }

    // 2. If topic has stored file blob in IndexedDB/storage, write to app temp directory & launch
    if (topic.fileId) {
      const blob = await getFileBlob(topic.fileId);
      if (blob) {
        const { appDataDir, join } = await import("@tauri-apps/api/path");
        const { writeFile, mkdir, exists } = await import("@tauri-apps/plugin-fs");

        const baseDir = await appDataDir();
        const tempFolder = await join(baseDir, "temp_files");

        const dirExists = await exists(tempFolder);
        if (!dirExists) {
          await mkdir(tempFolder, { recursive: true });
        }

        const safeFileName = topic.fileName.replace(/[/\\?%*:|"<>]/g, "_");
        const filePath = await join(tempFolder, safeFileName);

        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        await writeFile(filePath, uint8Array);

        // Open exported file via OS default handler
        await open(filePath);
        return { success: true, tempPath: filePath };
      }
    }

    return { success: false, error: "FILE_NOT_FOUND" };
  } catch (err) {
    console.error("Failed to open topic natively:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Reveal file or containing folder in Windows Explorer / Finder.
 */
export async function revealInFolderNative(topic: Topic): Promise<boolean> {
  if (!isTauri()) return false;

  try {
    const { open } = await import("@tauri-apps/plugin-shell");
    if (topic.localPath) {
      // Extract directory path
      const lastSlash = Math.max(topic.localPath.lastIndexOf("/"), topic.localPath.lastIndexOf("\\"));
      if (lastSlash > 0) {
        const dirPath = topic.localPath.substring(0, lastSlash);
        await open(dirPath);
        return true;
      }
    }
  } catch (e) {
    console.error("Failed to reveal folder:", e);
  }
  return false;
}

/**
 * Open native desktop folder picker dialog.
 */
export async function pickFolderNative(): Promise<string | null> {
  if (!isTauri()) return null;

  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select Study Directory",
    });

    if (typeof selected === "string") {
      return selected;
    }
  } catch (err) {
    console.error("Failed to open native folder picker:", err);
  }
  return null;
}

/**
 * Re-attaches a missing file blob to an existing topic without resetting progress,
 * completion state, scheduling, or topic ID!
 */
export async function reattachTopicFile(
  topicId: string,
  file: File
): Promise<Topic | null> {
  const topics = await getTopics();
  const index = topics.findIndex((t) => t.id === topicId);
  if (index === -1) return null;

  const topic = topics[index];
  const fileId = topic.fileId || `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Save new file blob to storage
  await saveFileBlob(fileId, file);

  const localPath = (file as File & { path?: string }).path || topic.localPath;

  const updatedTopic: Topic = {
    ...topic,
    fileId,
    fileName: file.name,
    mimeType: file.type || topic.mimeType,
    localPath,
    fileMissing: false,
    updatedAt: new Date().toISOString(),
  };

  topics[index] = updatedTopic;
  await saveTopics(topics);

  return updatedTopic;
}
