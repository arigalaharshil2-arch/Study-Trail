import { describe, it, expect } from "vitest";
import { calculateStreak, calculatePace, calculateSubjectProgress, calculateChapterProgress } from "../analytics";
import { Topic } from "../../types";

describe("Analytics Module Tests", () => {
  const mockNow = "2026-07-23T10:00:00.000Z";

  it("calculates subject and chapter progress correctly", () => {
    const topics: Topic[] = [
      { id: "1", chapterId: "c1", subjectId: "s1", name: "T1", fileName: "f1.pdf", relativePath: "s1/c1/f1.pdf", mimeType: "pdf", completed: true, completedAt: mockNow, sortOrder: 1, createdAt: mockNow, updatedAt: mockNow },
      { id: "2", chapterId: "c1", subjectId: "s1", name: "T2", fileName: "f2.pdf", relativePath: "s1/c1/f2.pdf", mimeType: "pdf", completed: true, completedAt: mockNow, sortOrder: 2, createdAt: mockNow, updatedAt: mockNow },
      { id: "3", chapterId: "c1", subjectId: "s1", name: "T3", fileName: "f3.pdf", relativePath: "s1/c1/f3.pdf", mimeType: "pdf", completed: false, completedAt: null, sortOrder: 3, createdAt: mockNow, updatedAt: mockNow },
      { id: "4", chapterId: "c2", subjectId: "s1", name: "T4", fileName: "f4.pdf", relativePath: "s1/c2/f4.pdf", mimeType: "pdf", completed: false, completedAt: null, sortOrder: 1, createdAt: mockNow, updatedAt: mockNow },
    ];

    expect(calculateSubjectProgress(topics, "s1")).toBe(0.5); // 2 out of 4 done
    expect(calculateChapterProgress(topics, "c1")).toBe(2 / 3); // 2 out of 3 done
    expect(calculateChapterProgress(topics, "c2")).toBe(0); // 0 out of 1 done
  });

  it("calculates streaks correctly when completed today and consecutive days", () => {
    const topics: Topic[] = [
      { id: "1", chapterId: "c1", subjectId: "s1", name: "T1", fileName: "f1.pdf", relativePath: "a", mimeType: "pdf", completed: true, completedAt: "2026-07-23T10:00:00Z", sortOrder: 1, createdAt: mockNow, updatedAt: mockNow },
      { id: "2", chapterId: "c1", subjectId: "s1", name: "T2", fileName: "f2.pdf", relativePath: "b", mimeType: "pdf", completed: true, completedAt: "2026-07-22T10:00:00Z", sortOrder: 2, createdAt: mockNow, updatedAt: mockNow },
      { id: "3", chapterId: "c1", subjectId: "s1", name: "T3", fileName: "f3.pdf", relativePath: "c", mimeType: "pdf", completed: true, completedAt: "2026-07-21T10:00:00Z", sortOrder: 3, createdAt: mockNow, updatedAt: mockNow },
    ];

    const streak = calculateStreak(topics, "2026-07-23");
    expect(streak.currentStreak).toBe(3);
    expect(streak.completedToday).toBe(true);
  });

  it("calculates streaks correctly when completed yesterday but not today yet", () => {
    const topics: Topic[] = [
      { id: "1", chapterId: "c1", subjectId: "s1", name: "T1", fileName: "f1.pdf", relativePath: "a", mimeType: "pdf", completed: true, completedAt: "2026-07-22T10:00:00Z", sortOrder: 1, createdAt: mockNow, updatedAt: mockNow },
      { id: "2", chapterId: "c1", subjectId: "s1", name: "T2", fileName: "f2.pdf", relativePath: "b", mimeType: "pdf", completed: true, completedAt: "2026-07-21T10:00:00Z", sortOrder: 2, createdAt: mockNow, updatedAt: mockNow },
    ];

    const streak = calculateStreak(topics, "2026-07-23");
    expect(streak.currentStreak).toBe(2); // Still active from yesterday
    expect(streak.completedToday).toBe(false);
  });

  it("calculates pace estimation correctly", () => {
    const topics: Topic[] = [
      { id: "1", chapterId: "c1", subjectId: "s1", name: "T1", fileName: "f1.pdf", relativePath: "a", mimeType: "pdf", completed: true, completedAt: "2026-07-23T10:00:00Z", sortOrder: 1, createdAt: mockNow, updatedAt: mockNow },
      { id: "2", chapterId: "c1", subjectId: "s1", name: "T2", fileName: "f2.pdf", relativePath: "b", mimeType: "pdf", completed: false, completedAt: null, sortOrder: 2, createdAt: mockNow, updatedAt: mockNow },
      { id: "3", chapterId: "c1", subjectId: "s1", name: "T3", fileName: "f3.pdf", relativePath: "c", mimeType: "pdf", completed: false, completedAt: null, sortOrder: 3, createdAt: mockNow, updatedAt: mockNow },
    ];

    const pace = calculatePace(topics);
    expect(pace.remainingTopics).toBe(2);
    expect(pace.completedTopics).toBe(1);
    expect(pace.message).toContain("2 topics left");
  });
});
