import { LayoutTemplate, Trash2 } from "lucide-react";
import { useTaskStore } from "../../../stores/task-store";
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
  const templates = useTaskStore((state) => state.templates);
  const deleteTemplate = useTaskStore((state) => state.deleteTemplate);

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

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {templates.map((template) => (
            <button
              type="button"
              key={template.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group relative text-left w-full"
              onClick={() => onSelect(template)}
            >
              <h3 className="font-bold text-gray-800 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {template.description}
              </p>
              <div className="text-xs text-gray-500">
                タスク数: {template.tasks.length}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("このテンプレートを削除してもよろしいですか？")) {
                    deleteTemplate(template.id);
                  }
                }}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                title="テンプレートを削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
