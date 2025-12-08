import { useTableOfContents } from "./use-table-of-contents";

interface TableOfContentsProps {
  containerId: string;
}

export function TableOfContents({ containerId }: TableOfContentsProps) {
  const { headings, activeId } = useTableOfContents(containerId);

  const scrollToHeading = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (headings.length === 0) return null;

  return (
    <nav className="p-6 h-full overflow-y-auto">
      <h3 className="font-bold mb-4 text-sm text-muted-foreground uppercase tracking-wider">
        目次
      </h3>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => scrollToHeading(heading.id, e)}
              className={`block transition-colors hover:text-primary truncate border-l-2 pl-2 ${
                activeId === heading.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
