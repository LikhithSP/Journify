import React from 'react';

// Format inline Markdown syntax (**bold**, *italic*, `code`, [link](url))
export function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Tokenize bold, italic, code, links
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-bold text-neutral-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={i} className="italic text-neutral-800 dark:text-neutral-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[13px] text-pink-600 dark:text-pink-400"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:opacity-80"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// Full Markdown document renderer into clean, elegant book typography
export function MarkdownRenderer({ content, className = '' }: { content: string; className?: string }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle (```)
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            className="my-3 p-3 rounded-xl bg-neutral-950 text-neutral-200 font-mono text-xs overflow-x-auto border border-white/10"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-2.5" />);
      continue;
    }

    // Heading 1 (# ...)
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="font-display text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mt-4 mb-2 first:mt-0"
        >
          {renderInlineMarkdown(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    // Heading 2 (## ...)
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="font-display text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white mt-3.5 mb-1.5"
        >
          {renderInlineMarkdown(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    // Heading 3 (### ...)
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="font-display text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mt-3 mb-1"
        >
          {renderInlineMarkdown(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    // Blockquote (> ...)
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-2.5 pl-3.5 border-l-2 border-indigo-500/70 dark:border-indigo-400 italic text-neutral-700 dark:text-neutral-300 font-serif"
        >
          {renderInlineMarkdown(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Bullet list item (- ... or * ...)
    if (trimmed.startsWith('- ') || (trimmed.startsWith('* ') && !trimmed.endsWith('*'))) {
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-1 pl-1.5 text-neutral-800 dark:text-neutral-200">
          <span className="text-neutral-400 dark:text-neutral-500 select-none mt-1 text-xs">•</span>
          <div className="flex-1">{renderInlineMarkdown(trimmed.slice(2))}</div>
        </div>
      );
      continue;
    }

    // Numbered list item (1. ...)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`numli-${i}`} className="flex items-start gap-2 my-1 pl-1.5 text-neutral-800 dark:text-neutral-200">
          <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500 select-none min-w-[16px]">
            {numMatch[1]}.
          </span>
          <div className="flex-1">{renderInlineMarkdown(numMatch[2])}</div>
        </div>
      );
      continue;
    }

    // Standard paragraph line
    elements.push(
      <p key={`p-${i}`} className="my-1.5 leading-relaxed text-neutral-800 dark:text-neutral-200">
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  // Flush remaining open code block
  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <pre
        key="code-eof"
        className="my-3 p-3 rounded-xl bg-neutral-950 text-neutral-200 font-mono text-xs overflow-x-auto border border-white/10"
      >
        <code>{codeBuffer.join('\n')}</code>
      </pre>
    );
  }

  return <div className={`prose-sm max-w-none ${className}`}>{elements}</div>;
}
