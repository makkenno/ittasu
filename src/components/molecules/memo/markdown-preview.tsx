import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/atom-one-dark.min.css";
import { Code } from "./markdown-code";
import { Pre } from "./markdown-pre";

interface MarkdownPreviewProps {
  value: string;
}

export function MarkdownPreview({ value }: MarkdownPreviewProps) {
  return (
    <div className="w-full h-full p-6 overflow-y-auto bg-white">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "16px",
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              style={{
                borderBottom: "1px solid #c9c9c9",
                fontSize: "22px",
                fontWeight: "bold",
                marginTop: "56px",
                marginBottom: "16px",
              }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                marginTop: "32px",
                marginBottom: "16px",
              }}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginTop: "24px",
                marginBottom: "16px",
              }}
            >
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p style={{ marginBottom: "16px", fontSize: "16px" }}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul
              style={{
                paddingInlineStart: "24px",
                marginBottom: "16px",
                listStyleType: "disc",
              }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              style={{
                paddingInlineStart: "24px",
                marginBottom: "16px",
                listStyleType: "decimal",
              }}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li
              style={{
                fontSize: "16px",
              }}
            >
              {children}
            </li>
          ),
          table: ({ children }) => (
            <div
              style={{
                overflowX: "auto",
                marginBottom: "24px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead
              style={{
                backgroundColor: "#f8fafc",
                borderBottom: "2px solid #cbd5e1",
              }}
            >
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr
              style={{
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontWeight: "600",
                color: "#475569",
                fontSize: "14px",
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                padding: "12px 16px",
                color: "#334155",
                fontSize: "14px",
              }}
            >
              {children}
            </td>
          ),
          blockquote: ({ children }) => (
            <blockquote
              style={{
                borderLeft: "4px solid #3b82f6",
                backgroundColor: "#eff6ff",
                padding: "8px 16px",
                marginBottom: "16px",
                fontStyle: "italic",
                color: "#1e40af",
              }}
            >
              {children}
            </blockquote>
          ),
          pre: Pre,
          code: Code,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#2563eb",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              {children}
            </a>
          ),
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}
