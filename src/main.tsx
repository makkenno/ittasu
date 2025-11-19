import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { TaskDetailPage } from "./components/templates/task-detail-page";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <TaskDetailPage />
  </StrictMode>,
);
