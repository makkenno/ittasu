import type { FC } from "react";

interface PreProps {
  children?: React.ReactNode;
}

export const Pre: FC<PreProps> = ({ children }) => {
  return (
    <pre className="bg-[#282c34] text-white p-4 rounded-lg overflow-x-auto mb-4 shadow-md">
      {children}
    </pre>
  );
};
