import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Download,
  ExternalLink,
  File,
  Image as ImageIcon,
  FolderSearch,
  AlertTriangle,
  FolderOpen,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Topic } from "../../types";
import { getFileBlob } from "../../lib/storage";
import { PALETTE, NEU_SHADOW } from "../../lib/constants";
import { isTauri, openTopicNative, revealInFolderNative, reattachTopicFile } from "../../lib/desktop";
import { toast } from "sonner";

type FileViewerModalProps = {
  topic: Topic | null;
  onClose: () => void;
  onTopicUpdated?: (updatedTopic: Topic) => void;
};

export function FileViewerModal({ topic, onClose, onTopicUpdated }: FileViewerModalProps) {
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(topic);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpeningNative, setIsOpeningNative] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const locateFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentTopic(topic);
  }, [topic]);

  useEffect(() => {
    if (!currentTopic || !currentTopic.fileId) {
      setFileUrl(null);
      return;
    }

    let activeUrl: string | null = null;
    setIsLoading(true);

    getFileBlob(currentTopic.fileId).then((blob) => {
      if (blob) {
        activeUrl = URL.createObjectURL(blob);
        setFileUrl(activeUrl);
      } else {
        setFileUrl(null);
      }
      setIsLoading(false);
    });

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [currentTopic]);

  if (!currentTopic) return null;

  const isImage = currentTopic.mimeType.startsWith("image/");
  const isPdf = currentTopic.mimeType === "application/pdf";

  const handleOpenNative = async () => {
    setIsOpeningNative(true);
    const res = await openTopicNative(currentTopic);
    setIsOpeningNative(false);

    if (res.success) {
      toast.success(`Opened ${currentTopic.fileName} in default application`);
    } else if (res.error === "FILE_NOT_FOUND") {
      toast.error("File not found on disk or in storage. Please use 'Locate File' to re-attach.");
    } else if (res.error === "WEB_MODE") {
      // In web mode, handle preview / download fallback
      handleDownload();
    } else {
      toast.error(`Could not launch file: ${res.error}`);
    }
  };

  const handleShowInFolder = async () => {
    const ok = await revealInFolderNative(currentTopic);
    if (ok) {
      toast.success("Opened containing directory");
    } else {
      toast.info("Folder path is not accessible natively.");
    }
  };

  const handleDownload = () => {
    if (fileUrl) {
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = currentTopic.fileName;
      a.click();
    }
  };

  const handleLocateFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setIsLocating(true);
    try {
      const updated = await reattachTopicFile(currentTopic.id, file);
      if (updated) {
        setCurrentTopic(updated);
        if (onTopicUpdated) onTopicUpdated(updated);
        toast.success(`Re-attached ${file.name} to topic without losing progress!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to re-attach file.");
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
          style={{ background: PALETTE.card, boxShadow: NEU_SHADOW, border: `1px solid ${PALETTE.border}` }}
        >
          {/* Hidden Locate File Input */}
          <input
            type="file"
            ref={locateFileInputRef}
            onChange={handleLocateFileSelect}
            className="hidden"
          />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/50 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                {isImage ? <ImageIcon size={20} /> : isPdf ? <FileText size={20} /> : <File size={20} />}
              </div>
              <div>
                <h3 className="font-semibold text-stone-800 text-base leading-tight">{currentTopic.name}</h3>
                <p className="text-xs text-stone-500 font-mono mt-0.5">{currentTopic.fileName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* OS Default Application Launcher */}
              <button
                onClick={handleOpenNative}
                disabled={isOpeningNative}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm"
                title="Open file using operating system default application (PowerPoint, Word, PDF, etc.)"
              >
                {isOpeningNative ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ExternalLink size={14} />
                )}
                <span>Open in OS App</span>
              </button>

              {/* Show in Folder button for Tauri */}
              {isTauri() && currentTopic.localPath && (
                <button
                  onClick={handleShowInFolder}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                  title="Reveal containing folder in File Explorer"
                >
                  <FolderOpen size={14} /> Show in Folder
                </button>
              )}

              {fileUrl && !isTauri() && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                >
                  <Download size={14} /> Download
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center min-h-[300px]">
            {isLoading ? (
              <div className="text-sm text-stone-400 font-mono flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-amber-600" />
                Loading file reference...
              </div>
            ) : fileUrl ? (
              isImage ? (
                <img src={fileUrl} alt={currentTopic.name} className="max-h-[60vh] object-contain rounded-xl shadow-md" />
              ) : isPdf ? (
                <iframe src={fileUrl} className="w-full h-[60vh] rounded-xl border border-stone-200" title={currentTopic.name} />
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-3 max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <FileText size={36} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-800 text-base">{currentTopic.fileName}</h4>
                    <p className="text-xs text-stone-500 mt-1">
                      Ready to launch with your operating system's default viewer.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={handleOpenNative}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-sm"
                    >
                      <ExternalLink size={15} /> Launch with Default OS Application
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* Missing File Recovery State */
              <div className="text-center py-10 flex flex-col items-center gap-3.5 max-w-md bg-stone-50 p-6 rounded-2xl border border-stone-200/80">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-800 text-base">File Not Found</h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    The source file <strong>"{currentTopic.fileName}"</strong> was moved, renamed, or is missing from local storage.
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => locateFileInputRef.current?.click()}
                    disabled={isLocating}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-sm"
                  >
                    {isLocating ? <Loader2 size={14} className="animate-spin" /> : <FolderSearch size={15} />}
                    Locate & Re-attach File
                  </button>
                </div>
                <span className="text-[11px] text-stone-400">
                  Re-attaching updates the file source while preserving your study progress & streak.
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
