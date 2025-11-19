import type { FC } from "react";

interface CodeProps {
  children?: React.ReactNode;
  className?: string;
}

export const Code: FC<CodeProps> = ({ children, className }) => {
  if (className) {
    return <code className={className}>{children}</code>;
  }

  return (
    <code
      style={{
        backgroundColor: "#fce7f3",
        color: "#db2777",
        padding: "2px 6px",
        borderRadius: "4px",
        fontSize: "14px",
        fontFamily: "monospace",
      }}
    >
      {children}
    </code>
  );
};
