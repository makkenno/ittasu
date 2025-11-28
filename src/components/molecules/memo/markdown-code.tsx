import type { FC } from "react";
import { Mermaid } from "./mermaid";

interface CodeProps {
  children?: React.ReactNode;
  className?: string;
}

export const Code: FC<CodeProps> = ({ children, className }) => {
  const isMermaid = className?.includes("language-mermaid");

  if (isMermaid) {
    return <Mermaid code={String(children).trim()} />;
  }

  if (className) {
    return <code className={className}>{children}</code>;
  }

  return (
    <code className="bg-muted text-foreground px-1.5 py-0.5 rounded font-mono text-sm">
      {children}
    </code>
  );
};
