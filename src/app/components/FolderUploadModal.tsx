import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FolderUp, FileText, CheckCircle2, AlertCircle, X, Loader2, FolderPlus, Plus, FileUp } from "lucide-react";
import { UploadedFileItem, processFolderUpload, parsePathHierarchy, UploadOptions } from "../../lib/folderParser";
import { MergeSummary, Subject, Chapter } from "../../types";
import { PALETTE, NEU_SHADOW } from "../../lib/constants";
import { getSubjects, getChapters } from "../../lib/storage";
import { toast } from "sonner";

import { isTauri, pickFolderNative } from "../../lib/desktop";

type FolderUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (summary: MergeSummary) => void;
  initialSubjectId?: string;
  initialChapterId?: string;
};

export function FolderUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  initialSubjectId,
  initialChapterId,
}: FolderUploadModalProps) {
  const [fileItems, setFileItems] = useState<UploadedFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadMode, setUploadMode] = useState<"folder" | "files">("folder");

  // Selection states for target subject & chapter
  const [existingSubjects, setExistingSubjects] = useState<Subject[]>([]);
  const [existingChapters, setExistingChapters] = useState<Chapter[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("AUTO");
  const [newSubjectName, setNewSubjectName] = useState("");

  const [selectedChapterId, setSelectedChapterId] = useState<string>("AUTO");
  const [newChapterName, setNewChapterName] = useState("");

  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId);
    } else {
      setSelectedSubjectId("AUTO");
    }
    if (initialChapterId) {
      setSelectedChapterId(initialChapterId);
    } else {
      setSelectedChapterId("AUTO");
    }
  }, [initialSubjectId, initialChapterId, isOpen]);

  const loadData = async () => {
    try {
      const [subjs, chaps] = await Promise.all([getSubjects(), getChapters()]);
      setExistingSubjects(subjs);
      setExistingChapters(chaps);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  // Filter chapters for current selected subject
  const availableChapters = existingChapters.filter(
    (c) => c.subjectId === selectedSubjectId
  );

  const handleZoneClick = async () => {
    if (uploadMode === "folder") {
      if (isTauri()) {
        const folderPath = await pickFolderNative();
        if (folderPath) {
          toast.info(`Selected directory: ${folderPath}`);
          // Fallback to web input or path scan if needed
          folderInputRef.current?.click();
        } else {
          folderInputRef.current?.click();
        }
      } else {
        folderInputRef.current?.click();
      }
    } else {
      filesInputRef.current?.click();
    }
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    const items: UploadedFileItem[] = filesArray.map((file) => ({
      file,
      relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
    }));
    setFileItems(items);
  };

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    const items: UploadedFileItem[] = filesArray.map((file) => ({
      file,
      relativePath: file.name,
    }));
    setFileItems(items);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.files) return;
    const filesArray = Array.from(e.dataTransfer.files);
    const items: UploadedFileItem[] = filesArray.map((file) => ({
      file,
      relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
    }));
    setFileItems(items);
  };

  const handleStartImport = async () => {
    if (fileItems.length === 0) return;
    setIsProcessing(true);

    try {
      const options: UploadOptions = {};

      if (selectedSubjectId !== "AUTO" && selectedSubjectId !== "NEW") {
        options.targetSubjectId = selectedSubjectId;
      }

      if (selectedChapterId !== "AUTO" && selectedChapterId !== "NEW") {
        options.targetChapterId = selectedChapterId;
      } else if (selectedChapterId === "NEW" && newChapterName.trim()) {
        options.targetChapterName = newChapterName.trim();
      }

      const summary = await processFolderUpload(fileItems, options);
      toast.success(
        `Imported ${summary.totalProcessed} files! (${summary.subjectsAdded} subjects, ${summary.chaptersAdded} chapters, ${summary.topicsAdded} new topics)`,
        { duration: 4000 }
      );
      onUploadSuccess(summary);
      setFileItems([]);
      setNewSubjectName("");
      setNewChapterName("");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse and import study materials.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Preview options
  const previewOptions: UploadOptions = {};
  if (selectedSubjectId !== "AUTO" && selectedSubjectId !== "NEW") {
    previewOptions.targetSubjectId = selectedSubjectId;
  }
  if (selectedChapterId !== "AUTO" && selectedChapterId !== "NEW") {
    previewOptions.targetChapterId = selectedChapterId;
  } else if (selectedChapterId === "NEW" && newChapterName.trim()) {
    previewOptions.targetChapterName = newChapterName.trim();
  }

  const targetSubjObj = existingSubjects.find((s) => s.id === selectedSubjectId);
  const targetChapObj = existingChapters.find((c) => c.id === selectedChapterId);

  const previewSummary = fileItems.slice(0, 6).map((item) => {
    const p = parsePathHierarchy(item.relativePath, previewOptions);
    const sName = targetSubjObj ? targetSubjObj.name : p.subjectName;
    const cName = targetChapObj
      ? targetChapObj.name
      : selectedChapterId === "NEW" && newChapterName.trim()
      ? newChapterName.trim()
      : p.chapterName;

    return `${sName} → ${cName} → ${p.topicName}`;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl rounded-2xl p-6 flex flex-col gap-4 overflow-hidden max-h-[90vh] overflow-y-auto"
          style={{ background: PALETTE.card, boxShadow: NEU_SHADOW, border: `1px solid ${PALETTE.border}` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100/70 text-amber-800">
                <FolderUp size={20} />
              </div>
              <div>
                <span className="text-[10px] tracking-widest uppercase font-mono text-stone-400">Study Materials</span>
                <h3 className="font-semibold text-stone-800 text-lg leading-tight">
                  Upload & Assign Materials
                </h3>
              </div>
            </div>
            <button onClick={onClose} disabled={isProcessing} className="p-1 rounded-xl text-stone-400 hover:text-stone-700">
              <X size={18} />
            </button>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-xl gap-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setUploadMode("folder")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
                uploadMode === "folder"
                  ? "bg-white shadow-sm text-amber-800 font-semibold"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <FolderPlus size={14} />
              Upload Entire Directory
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("files")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
                uploadMode === "files"
                  ? "bg-white shadow-sm text-amber-800 font-semibold"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <FileUp size={14} />
              Upload Individual Files
            </button>
          </div>

          {/* Destination Target Overrides */}
          <div className="bg-stone-50/80 border border-stone-200/80 rounded-xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider font-mono">
                Target Destination
              </span>
              <span className="text-[10px] text-stone-400">Assign to existing or create new</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Target Subject Select */}
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-stone-600 font-medium text-[11px]">Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedChapterId("AUTO");
                  }}
                  className="bg-white border border-stone-200 rounded-lg p-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-xs"
                >
                  <option value="AUTO">✨ Auto-detect from folder path</option>
                  {existingSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      📚 {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Chapter Select */}
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-stone-600 font-medium text-[11px]">Chapter</label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="bg-white border border-stone-200 rounded-lg p-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-xs"
                >
                  <option value="AUTO">✨ Auto-detect from folder path</option>
                  {availableChapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      📖 {c.name}
                    </option>
                  ))}
                  {selectedSubjectId !== "AUTO" && (
                    <option value="NEW">➕ Create New Chapter...</option>
                  )}
                </select>
              </div>
            </div>

            {/* Custom Chapter Name Input */}
            {selectedChapterId === "NEW" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex flex-col gap-1 pt-1"
              >
                <label className="text-[11px] font-medium text-amber-800 flex items-center gap-1">
                  <Plus size={12} /> New Chapter Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Linear Algebra / Quantum Physics"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  className="bg-white border border-amber-300 rounded-lg p-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </motion.div>
            )}
          </div>

          {/* Hidden Inputs */}
          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFolderSelect}
            // @ts-expect-error - webkitdirectory is standard in Web API
            webkitdirectory="true"
            directory="true"
            multiple
            className="hidden"
          />
          <input
            type="file"
            ref={filesInputRef}
            onChange={handleFilesSelect}
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
            className="hidden"
          />

          {/* Dropzone */}
          {fileItems.length === 0 ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={handleZoneClick}
              className="border-2 border-dashed border-amber-300/80 rounded-2xl p-7 flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:bg-amber-50/40 transition-colors text-center"
            >
              <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                <Upload size={22} />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-800">
                  {uploadMode === "folder" ? "Click to pick a study folder" : "Click to select study files"}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  or drag and drop your {uploadMode === "folder" ? "directory" : "PDFs / documents"} here
                </p>
              </div>
              <div className="mt-1 text-[10px] font-mono text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                {uploadMode === "folder"
                  ? "Auto-detected: Subject / Chapter / Topic.pdf"
                  : "Supports PDF, Word, PowerPoint, Text & Images"}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between bg-amber-50/70 p-3 rounded-xl border border-amber-200/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-amber-700" />
                  <span className="text-xs font-semibold text-stone-800">{fileItems.length} study files queued</span>
                </div>
                <button
                  onClick={() => setFileItems([])}
                  className="text-xs text-amber-800 font-mono underline hover:text-amber-900"
                >
                  Clear files
                </button>
              </div>

              {/* Hierarchy Preview */}
              <div className="bg-stone-50 rounded-xl p-3 max-h-40 overflow-y-auto border border-stone-200/80">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block mb-2">
                  Destination Mapping Preview
                </span>
                <div className="flex flex-col gap-1.5">
                  {previewSummary.map((item, idx) => (
                    <div key={idx} className="text-xs font-mono text-stone-700 flex items-center gap-2">
                      <FileText size={12} className="text-amber-600 shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                  {fileItems.length > 6 && (
                    <span className="text-[11px] font-mono text-stone-400 pt-1">
                      ...and {fileItems.length - 6} more files
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 bg-stone-100/80 p-2.5 rounded-xl text-stone-600 text-xs">
                <AlertCircle size={14} className="text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Safe Merge:</strong> Existing progress & schedules will be preserved.
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200/80">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartImport}
              disabled={fileItems.length === 0 || isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Processing...
                </>
              ) : (
                <>Import & Attach Material</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

