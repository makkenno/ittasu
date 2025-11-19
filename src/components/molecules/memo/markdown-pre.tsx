import type { FC } from "react";

interface PreProps {
  children?: React.ReactNode;
}

export const Pre: FC<PreProps> = ({ children }) => {
  return (
    <pre
      style={{
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        padding: "16px",
        borderRadius: "8px",
        overflow: "auto",
        marginBottom: "16px",
        boxShadow:
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      }}
    >
      {children}
    </pre>
  );
};
