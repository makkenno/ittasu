import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { ToastContainer } from "./components/molecules/common/toast-container";
import { TaskDetailPage } from "./components/templates/task-detail-page";
import { ThemeProvider } from "./components/theme-provider";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <TaskDetailPage />
      <ToastContainer />
    </ThemeProvider>
  </StrictMode>,
);
