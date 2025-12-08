import { useCallback, useEffect, useState } from "react";
import type { MarkdownHeading } from "../../../lib/markdown-utils";

export function useTableOfContents(containerId: string) {
  const [headings, setHeadings] = useState<MarkdownHeading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  const updateHeadings = useCallback(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const elements = Array.from(
      container.querySelectorAll("h1, h2, h3, h4, h5, h6"),
    );
    const newHeadings: MarkdownHeading[] = elements.map((element) => {
      // Ensure element has an ID
      if (!element.id) {
        element.id =
          element.textContent?.toLowerCase().replace(/\s+/g, "-") || "";
      }

      return {
        level: Number.parseInt(element.tagName.substring(1), 10),
        text: element.textContent || "",
        id: element.id,
      };
    });

    setHeadings(newHeadings);
  }, [containerId]);

  useEffect(() => {
    updateHeadings();
    const container = document.getElementById(containerId);
    if (!container) return;

    const mutationObserver = new MutationObserver(updateHeadings);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => mutationObserver.disconnect();
  }, [containerId, updateHeadings]);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      {
        root: container,
        rootMargin: "0px 0px -80% 0px",
      },
    );

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) {
        intersectionObserver.observe(element);
      }
    }

    return () => intersectionObserver.disconnect();
  }, [headings, containerId]);

  return { headings, activeId };
}
