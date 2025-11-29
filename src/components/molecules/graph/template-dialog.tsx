import { LayoutTemplate } from "lucide-react";
import { defaultTemplates } from "../../../data/templates";
import type { TaskTemplate } from "../../../types/template";

interface TemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: TaskTemplate) => void;
}

export function TemplateDialog({
  isOpen,
  onClose,
  onSelect,
}: TemplateDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-800">テンプレート</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {defaultTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className="flex flex-col items-start p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
            >
              <h3 className="font-bold text-gray-800 group-hover:text-blue-600 mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {template.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {template.tasks.map((task, index) => (
                  <span
                    key={`${template.id}-task-${index}`}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                  >
                    {task.title}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
