import React, { useMemo } from "react";
import katex from "katex";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Safely render LaTeX math using KaTeX without throwing
function renderKatex(math: string, displayMode: boolean): string {
  try {
    return katex.renderToString(math.trim(), {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml",
    });
  } catch (e) {
    return `<span class="katex-error text-amber-400 font-mono text-xs">${escapeHtml(math)}</span>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Inline token renderer (handles inline math, bold, italic, code, links)
function renderInlineText(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // 1. Display Math \[ ... \] or $$ ... $$ within inline flow
    const displayMathMatch = remaining.match(/^(\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\])/);
    if (displayMathMatch) {
      const math = displayMathMatch[2] || displayMathMatch[3];
      const html = renderKatex(math, true);
      nodes.push(
        <div
          key={key++}
          className="my-2.5 overflow-x-auto py-1 text-center font-sans max-w-full"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
      remaining = remaining.slice(displayMathMatch[0].length);
      continue;
    }

    // 2. Inline Math $ ... $ or \( ... \)
    const inlineMathMatch = remaining.match(/^(\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\))/);
    if (inlineMathMatch) {
      const math = inlineMathMatch[2] || inlineMathMatch[3];
      const html = renderKatex(math, false);
      nodes.push(
        <span
          key={key++}
          className="inline-math px-0.5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
      remaining = remaining.slice(inlineMathMatch[0].length);
      continue;
    }

    // 3. Inline Code ` ... `
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      nodes.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded-md bg-slate-800/80 light:bg-slate-200/80 text-violet-300 light:text-violet-700 font-mono text-[0.9em] border border-white/10 light:border-black/10"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 4. Bold ** ... ** or __ ... __
    const boldMatch = remaining.match(/^(\*\*|__)([\s\S]+?)\1/);
    if (boldMatch) {
      nodes.push(
        <strong key={key++} className="font-semibold text-white light:text-slate-900">
          {renderInlineText(boldMatch[2])}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 5. Italic * ... * or _ ... _
    const italicMatch = remaining.match(/^(\*|_)([^\*_]+?)\1/);
    if (italicMatch) {
      nodes.push(
        <em key={key++} className="italic text-slate-200 light:text-slate-800">
          {renderInlineText(italicMatch[2])}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // 6. Links [label](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      nodes.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-400 hover:text-violet-300 light:text-violet-600 light:hover:text-violet-700 underline underline-offset-2 transition-colors"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 7. Regular Text (up to next special character)
    const nextSpecial = remaining.search(/[\$`\*_\[\\]/);
    if (nextSpecial === -1) {
      nodes.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Escape character or lone symbol
      nodes.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      nodes.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return nodes;
}

// Code Block with Copy Button
function CodeBlock({ code, language }: { code: string; language?: string; key?: React.Key }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/10 light:border-black/10 bg-slate-950/90 light:bg-slate-900 shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 light:bg-slate-800/90 border-b border-white/10 light:border-white/5 text-[11px] text-slate-400">
        <span className="font-mono text-violet-300 light:text-violet-400">{language || "text"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    // Normalize raw LaTeX syntax replacements for clean display
    let text = content;

    // Break into blocks
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeBuffer: string[] = [];
    let listBuffer: { type: "ul" | "ol"; items: string[] } | null = null;
    let elementKey = 0;

    const flushList = () => {
      if (listBuffer) {
        if (listBuffer.type === "ul") {
          elements.push(
            <ul key={elementKey++} className="my-2 ml-4 list-disc space-y-1 text-slate-200 light:text-slate-800">
              {listBuffer.items.map((item, i) => (
                <li key={i} className="pl-1">
                  {renderInlineText(item)}
                </li>
              ))}
            </ul>
          );
        } else {
          elements.push(
            <ol key={elementKey++} className="my-2 ml-4 list-decimal space-y-1 text-slate-200 light:text-slate-800">
              {listBuffer.items.map((item, i) => (
                <li key={i} className="pl-1">
                  {renderInlineText(item)}
                </li>
              ))}
            </ol>
          );
        }
        listBuffer = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code Fence Toggle
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <CodeBlock key={elementKey++} code={codeBuffer.join("\n")} language={codeLanguage} />
          );
          codeBuffer = [];
          inCodeBlock = false;
          codeLanguage = "";
        } else {
          flushList();
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Display math block $$ ... $$ on its own line
      if (line.trim().startsWith("$$") && line.trim().endsWith("$$") && line.trim().length > 4) {
        flushList();
        const math = line.trim().slice(2, -2);
        const html = renderKatex(math, true);
        elements.push(
          <div
            key={elementKey++}
            className="my-3 overflow-x-auto py-1 text-center font-sans max-w-full"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        continue;
      }

      // Headings
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        flushList();
        const level = headingMatch[1].length;
        const textContent = headingMatch[2];
        if (level === 1) {
          elements.push(
            <h1 key={elementKey++} className="text-base sm:text-lg font-bold text-white light:text-slate-900 mt-4 mb-2">
              {renderInlineText(textContent)}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2 key={elementKey++} className="text-sm sm:text-base font-bold text-violet-200 light:text-violet-900 mt-3 mb-1.5">
              {renderInlineText(textContent)}
            </h2>
          );
        } else if (level === 3) {
          elements.push(
            <h3 key={elementKey++} className="text-xs sm:text-sm font-semibold text-violet-300 light:text-violet-800 mt-2.5 mb-1">
              {renderInlineText(textContent)}
            </h3>
          );
        } else {
          elements.push(
            <h4 key={elementKey++} className="text-xs font-semibold text-slate-300 light:text-slate-700 mt-2 mb-1">
              {renderInlineText(textContent)}
            </h4>
          );
        }
        continue;
      }

      // Unordered List (- or *)
      const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
      if (ulMatch) {
        if (!listBuffer || listBuffer.type !== "ul") {
          flushList();
          listBuffer = { type: "ul", items: [] };
        }
        listBuffer.items.push(ulMatch[2]);
        continue;
      }

      // Ordered List (1. 2.)
      const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
      if (olMatch) {
        if (!listBuffer || listBuffer.type !== "ol") {
          flushList();
          listBuffer = { type: "ol", items: [] };
        }
        listBuffer.items.push(olMatch[2]);
        continue;
      }

      // Blockquote
      if (line.startsWith(">")) {
        flushList();
        const quoteText = line.replace(/^>\s*/, "");
        elements.push(
          <blockquote
            key={elementKey++}
            className="border-l-2 border-violet-500 pl-3 my-2 text-slate-300 light:text-slate-600 italic"
          >
            {renderInlineText(quoteText)}
          </blockquote>
        );
        continue;
      }

      // Empty Line
      if (!line.trim()) {
        flushList();
        elements.push(<div key={elementKey++} className="h-2" />);
        continue;
      }

      // Normal Paragraph
      flushList();
      elements.push(
        <p key={elementKey++} className="my-1 leading-relaxed break-words">
          {renderInlineText(line)}
        </p>
      );
    }

    flushList();

    if (inCodeBlock && codeBuffer.length > 0) {
      elements.push(
        <CodeBlock key={elementKey++} code={codeBuffer.join("\n")} language={codeLanguage} />
      );
    }

    return elements;
  }, [content]);

  return <div className={`markdown-body ${className}`}>{renderedElements}</div>;
}
