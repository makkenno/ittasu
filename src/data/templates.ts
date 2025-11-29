import type { TaskTemplate } from "../types/template";

export const defaultTemplates: TaskTemplate[] = [
  {
    id: "problem-solving",
    name: "問題解決",
    description: "問題解決のための基本的な3ステップ",
    tasks: [
      {
        title: "情報収集",
        memo: "現状の課題に関する情報を集める",
        relativePosition: { x: 0, y: 0 },
      },
      {
        title: "整理",
        memo: "集めた情報を整理・分析する",
        relativePosition: { x: 250, y: 0 },
      },
      {
        title: "解決策の比較",
        memo: "複数の解決策を立案し比較検討する",
        relativePosition: { x: 500, y: 0 },
      },
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
    ],
  },
  {
    id: "idea-generation",
    name: "アイデア出し",
    description: "発散と収束のプロセス",
    tasks: [
      {
        title: "ブレインストーミング",
        memo: "質より量を重視してアイデアを出す",
        relativePosition: { x: 0, y: 0 },
      },
      {
        title: "グルーピング",
        memo: "似たアイデアをまとめる",
        relativePosition: { x: 250, y: 0 },
      },
      {
        title: "評価・選定",
        memo: "実現可能性と効果で評価する",
        relativePosition: { x: 500, y: 0 },
      },
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
    ],
  },
];
