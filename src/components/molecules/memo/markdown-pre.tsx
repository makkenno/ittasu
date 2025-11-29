import { type FC, isValidElement } from "react";

interface PreProps {
  children?: React.ReactNode;
}

export const Pre: FC<PreProps> = ({ children }) => {
  if (
    isValidElement(children) &&
    (children.props as { className?: string }).className?.includes(
      "language-mermaid",
    )
  ) {
    return <>{children}</>;
  }

  return (
    <pre className="bg-[#282c34] text-white p-4 rounded-lg overflow-x-auto mb-4 shadow-md">
      {children}
    </pre>
  );
};
