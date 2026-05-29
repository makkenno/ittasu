import { Keyboard, X } from "lucide-react";
import { useEffect } from "react";

interface ShortcutHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  combos: string[][];
  description: string;
}

interface ShortcutSection {
  title: string;
  items: ShortcutItem[];
}

const sections: ShortcutSection[] = [
  {
    title: "グラフ操作",
    items: [
      {
        combos: [["h"], ["j"], ["k"], ["l"]],
        description: "隣接するタスクへ移動",
      },
      { combos: [["g", "g"]], description: "開始タスクへ移動" },
      { combos: [["G"]], description: "終端タスクへ移動" },
      {
        combos: [["o"]],
        description:
          "兄弟ノードとして追加（選択中なら隣に、無ければ末尾タスクの隣）",
      },
      {
        combos: [["a"]],
        description: "選択中のタスクの後ろに接続して追加",
      },
      { combos: [["i"]], description: "接続なしの新規タスクを追加" },
      { combos: [["Enter"]], description: "選択中タスクの詳細画面を開く" },
      {
        combos: [["r"]],
        description: "タイトルを編集（選択中はそのタスク、未選択なら現タスク）",
      },
      {
        combos: [["e"]],
        description:
          "ノード接続: 1 回目で接続元を確定、2 回目で接続先と確定して接続",
      },
      { combos: [["x"]], description: "完了 / 未完了を切替" },
      {
        combos: [["d", "d"], ["Delete"]],
        description: "選択中のタスクを削除",
      },
      {
        combos: [["v"]],
        description: "選択モード切替（中で hjkl 移動すると選択が拡張）",
      },
      { combos: [["f"]], description: "自動整列" },
      { combos: [["/"]], description: "タスク名で検索してジャンプ" },
      { combos: [["P"]], description: "プレビュー画面を開く" },
      { combos: [[">"]], description: "ズームイン" },
      { combos: [["<"]], description: "ズームアウト" },
      { combos: [["0"]], description: "ビューをフィット" },
      { combos: [["c"]], description: "孤立したタスクを接続" },
      { combos: [["y"]], description: "ノードをクリップボードへコピー" },
      {
        combos: [["p"]],
        description: "クリップボードから貼り付けてインポート",
      },
      { combos: [["m"]], description: "メモエリアにフォーカス" },
      { combos: [["M"]], description: "メモエリアの表示切替" },
      { combos: [["u"]], description: "Undo" },
      { combos: [["Ctrl", "R"]], description: "Redo" },
      {
        combos: [["Esc"], ["Ctrl", "["]],
        description: "選択モード解除 → 選択解除 → 親階層に戻る",
      },
    ],
  },
  {
    title: "サイドバー（プロジェクト）",
    items: [
      {
        combos: [["Ctrl", "E"]],
        description: "サイドバーとグラフのフォーカス切替",
      },
      { combos: [["j"], ["k"]], description: "プロジェクトを上下に移動" },
      { combos: [["Enter"], ["l"]], description: "プロジェクトを開く" },
      { combos: [["n"]], description: "新しいプロジェクトを作成" },
      { combos: [["d"]], description: "プロジェクトを削除" },
      { combos: [["r"]], description: "プロジェクト名を編集" },
      { combos: [["y"]], description: "プロジェクトをマークダウンでコピー" },
      {
        combos: [["Esc"], ["Ctrl", "["], ["h"]],
        description: "サイドバーから抜ける",
      },
    ],
  },
  {
    title: "プレビュー画面",
    items: [
      { combos: [["j"]], description: "下にスクロール" },
      { combos: [["k"]], description: "上にスクロール" },
      { combos: [["Ctrl", "D"]], description: "半画面下スクロール" },
      { combos: [["Ctrl", "U"]], description: "半画面上スクロール" },
      { combos: [["g", "g"]], description: "先頭へ" },
      { combos: [["G"]], description: "末尾へ" },
      { combos: [["y"]], description: "マークダウンをコピー" },
      {
        combos: [["Esc"], ["Ctrl", "["]],
        description: "プレビューを閉じる",
      },
    ],
  },
  {
    title: "確認ダイアログ",
    items: [
      { combos: [["y"], ["Enter"]], description: "確定 / 実行" },
      { combos: [["n"], ["Esc"]], description: "キャンセル" },
    ],
  },
  {
    title: "共通",
    items: [{ combos: [["?"]], description: "このヘルプを表示" }],
  },
];

function KeyCap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.75rem] px-1.5 py-0.5 text-xs font-mono font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded shadow-sm">
      {children}
    </kbd>
  );
}

function renderCombo(combo: string[], comboKey: string) {
  return combo.map((key, idx) => (
    <span
      key={`${comboKey}-${idx}-${key}`}
      className="inline-flex items-center gap-0.5"
    >
      {idx > 0 && <span className="text-xs text-gray-400">+</span>}
      <KeyCap>{key}</KeyCap>
    </span>
  ));
}

export function ShortcutHelpDialog({
  isOpen,
  onClose,
}: ShortcutHelpDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handle = (event: KeyboardEvent) => {
      const isEscape =
        event.key === "Escape" || (event.ctrlKey && event.key === "[");
      if (isEscape) {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="ダイアログを閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div
        className="relative w-full max-w-xl max-h-[80vh] bg-white rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="キーボードショートカット"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900">
              キーボードショートカット
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
            title="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">
          {sections.map((section) => (
            <div key={section.title} className="mb-5 last:mb-0">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li
                    key={`${section.title}-${item.description}`}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-gray-700">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                      {item.combos.map((combo, idx) => {
                        const comboKey = `${item.description}-${combo.join("+")}-${idx}`;
                        return (
                          <span
                            key={comboKey}
                            className="flex items-center gap-1"
                          >
                            {idx > 0 && (
                              <span className="text-xs text-gray-300">/</span>
                            )}
                            <span className="flex items-center gap-0.5">
                              {renderCombo(combo, comboKey)}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
