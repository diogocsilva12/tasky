import React, { useState } from 'react';
import { Check, Copy, Code, Terminal, FileCode2, Database } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Map languages to friendly display labels and icons
function getLangInfo(lang: string) {
  const normalized = lang.toLowerCase().trim();
  switch (normalized) {
    case 'ts':
    case 'typescript':
      return { label: 'TypeScript', icon: <FileCode2 className="h-3 w-3 text-blue-500" /> };
    case 'js':
    case 'javascript':
      return { label: 'JavaScript', icon: <FileCode2 className="h-3 w-3 text-amber-500" /> };
    case 'bash':
    case 'sh':
    case 'shell':
    case 'zsh':
      return { label: 'Bash', icon: <Terminal className="h-3 w-3 text-emerald-500" /> };
    case 'json':
      return { label: 'JSON', icon: <Code className="h-3 w-3 text-orange-500" /> };
    case 'python':
    case 'py':
      return { label: 'Python', icon: <FileCode2 className="h-3 w-3 text-blue-400" /> };
    case 'sql':
      return { label: 'SQL', icon: <Database className="h-3 w-3 text-purple-500" /> };
    default:
      return {
        label: lang ? lang.toUpperCase() : 'Code',
        icon: <Code className="h-3 w-3 text-muted-foreground" />,
      };
  }
}

// Tokenize and highlight code lines with semantic syntax classes
function highlightCodeLine(line: string, lang: string): React.ReactNode[] {
  const normalizedLang = lang.toLowerCase();
  const nodes: React.ReactNode[] = [];

  // Check for whole-line comment first
  if (
    line.trim().startsWith('//') ||
    line.trim().startsWith('#') ||
    line.trim().startsWith('--')
  ) {
    return [
      <span key="comment" className="text-muted-foreground/75 italic">
        {line}
      </span>,
    ];
  }

  // Common keywords across TS/JS, Python, SQL, Bash
  const tsKeywords = new Set([
    'const', 'let', 'var', 'function', 'return', 'import', 'export', 'from',
    'default', 'interface', 'type', 'class', 'extends', 'implements', 'async',
    'await', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'new',
    'try', 'catch', 'throw', 'typeof', 'instanceof', 'void', 'this',
  ]);

  const pyKeywords = new Set([
    'def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for',
    'while', 'try', 'except', 'finally', 'with', 'as', 'lambda', 'yield',
    'async', 'await', 'pass', 'raise', 'in', 'is', 'not', 'and', 'or',
  ]);

  const sqlKeywords = new Set([
    'select', 'from', 'where', 'insert', 'into', 'update', 'delete', 'join',
    'inner', 'left', 'right', 'outer', 'on', 'group', 'by', 'order', 'having',
    'limit', 'create', 'table', 'alter', 'drop', 'and', 'or', 'not', 'as',
  ]);

  const bashKeywords = new Set([
    'npm', 'npx', 'yarn', 'pnpm', 'git', 'cd', 'ls', 'mkdir', 'rm', 'cp',
    'mv', 'echo', 'curl', 'wget', 'cat', 'grep', 'sudo', 'docker', 'export',
  ]);

  // Tokenize line using regex capturing strings, words, numbers, and symbols
  const tokenRegex =
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/.*$|#.*$|--.*$|\b\d+(\.\d+)?\b|\b[a-zA-Z_]\w*\b|[{}()[\].,;:+\-*/%=<>!&|^~?]+|\s+)/g;

  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = tokenRegex.exec(line)) !== null) {
    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      // String literal
      nodes.push(
        <span key={key} className="text-emerald-600 dark:text-emerald-400">
          {token}
        </span>
      );
    } else if (
      token.startsWith('//') ||
      token.startsWith('#') ||
      token.startsWith('--')
    ) {
      // Inline comment
      nodes.push(
        <span key={key} className="text-muted-foreground/75 italic">
          {token}
        </span>
      );
    } else if (/^\d+(\.\d+)?$/.test(token)) {
      // Numeric literal
      nodes.push(
        <span key={key} className="text-amber-600 dark:text-amber-400 font-mono">
          {token}
        </span>
      );
    } else if (
      (normalizedLang === 'python' && pyKeywords.has(token.toLowerCase())) ||
      (normalizedLang === 'sql' && sqlKeywords.has(token.toLowerCase())) ||
      ((normalizedLang === 'bash' || normalizedLang === 'sh') && bashKeywords.has(token.toLowerCase())) ||
      tsKeywords.has(token)
    ) {
      // Keyword
      nodes.push(
        <span key={key} className="text-purple-600 dark:text-purple-400 font-semibold">
          {token}
        </span>
      );
    } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(token)) {
      // Type or Component name
      nodes.push(
        <span key={key} className="text-blue-600 dark:text-blue-400 font-medium">
          {token}
        </span>
      );
    } else if (token === 'true' || token === 'false' || token === 'null' || token === 'undefined' || token === 'None') {
      // Boolean or Null constant
      nodes.push(
        <span key={key} className="text-orange-600 dark:text-orange-400 font-medium">
          {token}
        </span>
      );
    } else {
      nodes.push(token);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [line];
}

// Code block with header bar and copy code button
const CodeBlock: React.FC<{ code: string; lang: string }> = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);
  const langInfo = getLangInfo(lang);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  return (
    <div className="my-2.5 rounded-xl border border-border/70 overflow-hidden bg-muted/40 shadow-xs">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border/50 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium font-mono text-foreground">
          {langInfo.icon}
          <span>{langInfo.label}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-background/80 hover:text-foreground transition-all cursor-pointer font-medium"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body with Syntax Highlighting */}
      <div className="p-3 overflow-x-auto font-mono text-xs leading-relaxed">
        <pre className="m-0 p-0">
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="table-row">
                <span className="table-cell select-none text-muted-foreground/40 pr-3 text-right text-[10px]">
                  {idx + 1}
                </span>
                <span className="table-cell whitespace-pre">
                  {highlightCodeLine(line, lang)}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};

// Inline Markdown Parser for inline elements
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Matches: `code`, **bold**, *italic*, ~~strikethrough~~, [link](url), @mention, #issue
  const inlineRegex =
    /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\[([^\]]+)\]\(([^)]+)\)|@\w+|#\d+)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith('`') && token.endsWith('`')) {
      // Inline code
      parts.push(
        <code
          key={key}
          className="px-1.5 py-0.5 rounded-md bg-muted/80 text-foreground font-mono text-[11px] border border-border/60"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      // Bold
      parts.push(
        <strong key={key} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      // Italic
      parts.push(
        <em key={key} className="italic text-foreground">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      // Strikethrough
      parts.push(
        <del key={key} className="line-through text-muted-foreground">
          {token.slice(2, -2)}
        </del>
      );
    } else if (match[2] && match[3]) {
      // Markdown link [title](url)
      parts.push(
        <a
          key={key}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {match[2]}
        </a>
      );
    } else if (token.startsWith('@')) {
      // @mention
      parts.push(
        <span
          key={key}
          className="inline-flex items-center px-1.5 py-0.2 rounded font-medium text-[11px] bg-primary/10 text-primary border border-primary/20"
        >
          {token}
        </span>
      );
    } else if (token.startsWith('#')) {
      // #issue
      parts.push(
        <span
          key={key}
          className="inline-flex items-center font-mono text-[11px] text-muted-foreground font-medium"
        >
          {token}
        </span>
      );
    }

    lastIndex = inlineRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  if (!content) return null;

  // Split into blocks by fenced code blocks (```lang ... ```)
  const blocks: React.ReactNode[] = [];
  const lines = content.split('\n');

  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const text = paragraphLines.join('\n');
    paragraphLines = [];

    // Parse list items, headings, blockquotes
    const pLines = text.split('\n');
    pLines.forEach((pLine, idx) => {
      const trimmed = pLine.trim();

      // Heading 1
      if (trimmed.startsWith('# ')) {
        blocks.push(
          <h1
            key={`h1-${blocks.length}-${idx}`}
            className="text-base font-bold text-foreground mt-2 mb-1"
          >
            {parseInlineMarkdown(trimmed.slice(2))}
          </h1>
        );
        return;
      }

      // Heading 2
      if (trimmed.startsWith('## ')) {
        blocks.push(
          <h2
            key={`h2-${blocks.length}-${idx}`}
            className="text-sm font-bold text-foreground mt-2 mb-1"
          >
            {parseInlineMarkdown(trimmed.slice(3))}
          </h2>
        );
        return;
      }

      // Heading 3
      if (trimmed.startsWith('### ')) {
        blocks.push(
          <h3
            key={`h3-${blocks.length}-${idx}`}
            className="text-xs font-bold text-foreground mt-1.5 mb-1"
          >
            {parseInlineMarkdown(trimmed.slice(4))}
          </h3>
        );
        return;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        blocks.push(
          <blockquote
            key={`bq-${blocks.length}-${idx}`}
            className="border-l-2 border-primary/60 pl-3 my-1 text-xs italic text-muted-foreground bg-primary/5 py-1 rounded-r-md"
          >
            {parseInlineMarkdown(trimmed.slice(2))}
          </blockquote>
        );
        return;
      }

      // Checkbox list items: - [ ] or - [x]
      if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
        const isChecked = trimmed.startsWith('- [x] ');
        blocks.push(
          <div
            key={`chk-${blocks.length}-${idx}`}
            className="flex items-start gap-2 my-1 text-xs"
          >
            <input
              type="checkbox"
              checked={isChecked}
              readOnly
              className="mt-0.5 rounded border-border text-primary pointer-events-none"
            />
            <span className={isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}>
              {parseInlineMarkdown(trimmed.slice(6))}
            </span>
          </div>
        );
        return;
      }

      // Unordered list item: - or *
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        blocks.push(
          <div
            key={`li-${blocks.length}-${idx}`}
            className="flex items-start gap-2 my-0.5 text-xs text-foreground/90 pl-2"
          >
            <span className="text-primary mt-1 text-[8px]">•</span>
            <span className="flex-1">{parseInlineMarkdown(trimmed.slice(2))}</span>
          </div>
        );
        return;
      }

      // Numbered list item: 1. 2. etc
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        blocks.push(
          <div
            key={`num-${blocks.length}-${idx}`}
            className="flex items-start gap-2 my-0.5 text-xs text-foreground/90 pl-2"
          >
            <span className="font-mono text-muted-foreground text-[10px] min-w-[16px]">
              {numMatch[1]}.
            </span>
            <span className="flex-1">{parseInlineMarkdown(numMatch[2])}</span>
          </div>
        );
        return;
      }

      // Regular paragraph line
      if (trimmed) {
        blocks.push(
          <p key={`p-${blocks.length}-${idx}`} className="my-1 text-xs leading-relaxed text-foreground/90">
            {parseInlineMarkdown(pLine)}
          </p>
        );
      }
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        // Start of code block
        flushParagraph();
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
        codeLines = [];
      } else {
        // End of code block
        inCodeBlock = false;
        blocks.push(
          <CodeBlock
            key={`code-${blocks.length}`}
            code={codeLines.join('\n')}
            lang={codeLang}
          />
        );
        codeLang = '';
        codeLines = [];
      }
    } else if (inCodeBlock) {
      codeLines.push(line);
    } else {
      paragraphLines.push(line);
    }
  }

  // Flush remaining
  if (inCodeBlock && codeLines.length > 0) {
    blocks.push(
      <CodeBlock
        key={`code-${blocks.length}`}
        code={codeLines.join('\n')}
        lang={codeLang}
      />
    );
  } else {
    flushParagraph();
  }

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
};
