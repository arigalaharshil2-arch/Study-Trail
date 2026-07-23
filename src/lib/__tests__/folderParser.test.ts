import { describe, it, expect } from "vitest";
import { parsePathHierarchy, normalizePath } from "../folderParser";

describe("Folder Parser Tests", () => {
  it("normalizes file paths cleanly", () => {
    expect(normalizePath("Mathematics\\Calculus\\Limits.pdf")).toBe("mathematics/calculus/limits.pdf");
    expect(normalizePath("Physics//Mechanics///Kinematics.pdf ")).toBe("physics/mechanics/kinematics.pdf");
  });

  it("parses 3-level folder hierarchy correctly", () => {
    const res = parsePathHierarchy("Mathematics/Calculus/Limits.pdf");
    expect(res.subjectName).toBe("Mathematics");
    expect(res.chapterName).toBe("Calculus");
    expect(res.topicName).toBe("Limits");
    expect(res.fileName).toBe("limits.pdf");
  });

  it("parses 2-level folder hierarchy correctly", () => {
    const res = parsePathHierarchy("Literature/Syllabus.docx");
    expect(res.subjectName).toBe("Literature");
    expect(res.chapterName).toBe("General");
    expect(res.topicName).toBe("Syllabus");
  });

  it("handles target subject overrides with 2-level path", () => {
    const res = parsePathHierarchy("Calculus/Limits.pdf", { targetSubjectId: "subj-math" });
    expect(res.chapterName).toBe("Calculus");
    expect(res.topicName).toBe("Limits");
  });

  it("handles filenames with multiple dots or underscores", () => {
    const res = parsePathHierarchy("Computer_Science/Data_Structures/Binary_Search_Trees_v1.2.pdf");
    expect(res.subjectName).toBe("Computer Science");
    expect(res.chapterName).toBe("Data Structures");
    expect(res.topicName).toBe("Binary Search Trees V1.2");
  });
});
