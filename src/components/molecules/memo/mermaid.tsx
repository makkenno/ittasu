import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

interface MermaidProps {
  code: string;
}

export function Mermaid({ code }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code) return;

      try {
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError("Failed to render diagram");
      }
    };

    renderDiagram();
  }, [code]);

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 text-red-600 rounded">
        {error}
        <pre className="mt-2 text-xs overflow-auto">{code}</pre>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="mermaid w-full flex justify-center p-4 bg-white rounded-lg border border-gray-200 my-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
