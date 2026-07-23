import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { Subject } from "../../types";
import { DEFAULT_SUBJECT_COLORS, getSubjectColorDim, PALETTE, NEU_SHADOW } from "../../lib/constants";

type SubjectColorPickerModalProps = {
  subject: Subject | null;
  onClose: () => void;
  onSaveColor: (subjectId: string, color: string, colorDim: string) => void;
};

export function SubjectColorPickerModal({ subject, onClose, onSaveColor }: SubjectColorPickerModalProps) {
  const [selectedColor, setSelectedColor] = useState(subject?.color || DEFAULT_SUBJECT_COLORS[0].color);

  if (!subject) return null;

  const handleSave = () => {
    const colorDim = getSubjectColorDim(selectedColor);
    onSaveColor(subject.id, selectedColor, colorDim);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
          style={{ background: PALETTE.card, boxShadow: NEU_SHADOW, border: `1px solid ${PALETTE.border}` }}
        >
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
            <div>
              <span className="text-[10px] tracking-widest uppercase font-mono text-stone-400">Custom Accent</span>
              <h3 className="font-semibold text-stone-800 text-lg leading-tight">{subject.name} Color</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-xl text-stone-400 hover:text-stone-700">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 my-2">
            {DEFAULT_SUBJECT_COLORS.map((item) => {
              const isSelected = selectedColor.toLowerCase() === item.color.toLowerCase();
              return (
                <button
                  key={item.color}
                  onClick={() => setSelectedColor(item.color)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border"
                  style={{
                    borderColor: isSelected ? item.color : "transparent",
                    background: isSelected ? item.colorDim : "transparent",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                    style={{ background: item.color }}
                  >
                    {isSelected && <Check size={16} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-[10px] font-mono text-stone-600">{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200/80">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-sm"
              style={{ background: selectedColor }}
            >
              Save Accent
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
