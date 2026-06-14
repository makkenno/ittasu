import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../theme-provider";

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
});

interface MermaidProps {
  code: string;
}

async function renderMermaid(code: string, darkMode: boolean) {
  const id = `mermaid-${crypto.randomUUID()}`;

  try {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: darkMode ? "dark" : "default",
    });
    return (await mermaid.render(id, code)).svg;
  } catch (error) {
    document.getElementById(id)?.remove();
    throw error;
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "図を描画できませんでした";
}

export function Mermaid({ code }: MermaidProps) {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    const timer = window.setTimeout(() => {
      if (!code) return;

      renderMermaid(code, resolvedTheme === "dark")
        .then((nextSvg) => {
          if (!cancelled) setSvg(nextSvg);
        })
        .catch((renderError: unknown) => {
          if (cancelled) return;
          console.error("Mermaid rendering error:", renderError);
          setError(getErrorMessage(renderError));
        });
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [code, resolvedTheme]);

  if (error) {
    return (
      <div
        className="p-4 border border-red-200 bg-red-50 text-red-600 rounded"
        role="alert"
      >
        <p className="font-medium">Mermaid図を描画できませんでした</p>
        <p className="mt-1 text-xs whitespace-pre-wrap">{error}</p>
        <pre className="mt-2 text-xs overflow-auto">{code}</pre>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="mermaid w-full flex justify-center p-4 bg-white rounded-lg border border-gray-200 my-4"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid generates safe SVG
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
