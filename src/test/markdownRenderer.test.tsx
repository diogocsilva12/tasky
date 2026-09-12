import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

describe('MarkdownRenderer Component', () => {
  it('renders null when content is empty', () => {
    const html = renderToString(<MarkdownRenderer content="" />);
    expect(html).toBe('');
  });

  it('renders inline bold, italic, and strikethrough markdown', () => {
    const text = 'This is **bold text**, *italic text*, and ~~deleted text~~.';
    const html = renderToString(<MarkdownRenderer content={text} />);

    expect(html).toContain('bold text');
    expect(html).toContain('<strong');
    expect(html).toContain('italic text');
    expect(html).toContain('<em');
    expect(html).toContain('deleted text');
    expect(html).toContain('<del');
  });

  it('renders inline code and external markdown links safely', () => {
    const text = 'Run `npm run build` or see [GitHub Docs](https://github.com/docs).';
    const html = renderToString(<MarkdownRenderer content={text} />);

    expect(html).toContain('<code');
    expect(html).toContain('npm run build</code>');
    expect(html).toContain('<a');
    expect(html).toContain('href="https://github.com/docs"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('GitHub Docs');
  });

  it('renders mentions and issue tags', () => {
    const text = 'Assigned to @diogocsilva12 regarding #42.';
    const html = renderToString(<MarkdownRenderer content={text} />);

    expect(html).toContain('@diogocsilva12');
    expect(html).toContain('#42');
  });

  it('renders headings and blockquotes', () => {
    const content = `# Project Goals\n## Architecture\n### API Seam\n> Note this critical rule`;
    const html = renderToString(<MarkdownRenderer content={content} />);

    expect(html).toContain('<h1');
    expect(html).toContain('Project Goals');
    expect(html).toContain('<h2');
    expect(html).toContain('Architecture');
    expect(html).toContain('<h3');
    expect(html).toContain('API Seam');
    expect(html).toContain('<blockquote');
    expect(html).toContain('Note this critical rule');
  });

  it('renders interactive checkbox tasks and bullet lists', () => {
    const content = `- [ ] Pending item\n- [x] Completed item\n- Standard bullet item`;
    const html = renderToString(<MarkdownRenderer content={content} />);

    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked=""');
    expect(html).toContain('Pending item');
    expect(html).toContain('Completed item');
    expect(html).toContain('Standard bullet item');
  });

  it('renders fenced TypeScript code block with language indicator and copy button', () => {
    const code = '```ts\nconst port: number = 3000;\nconsole.log(port);\n```';
    const html = renderToString(<MarkdownRenderer content={code} />);

    expect(html).toContain('TypeScript');
    expect(html).toContain('Copy');
    expect(html).toContain('port');
    expect(html).toContain('3000');
  });

  it('renders syntax-highlighted snippets for Bash, Python, SQL, and JSON', () => {
    const bashSnippet = '```bash\ngit commit -m "feat: markdown"\n```';
    const pySnippet = '```py\ndef calculate():\n    return True\n```';
    const sqlSnippet = '```sql\nSELECT id FROM tasks WHERE priority = "P0";\n```';
    const jsonSnippet = '```json\n{"status": "ok", "count": 5}\n```';

    const fullContent = [bashSnippet, pySnippet, sqlSnippet, jsonSnippet].join('\n\n');
    const html = renderToString(<MarkdownRenderer content={fullContent} />);

    expect(html).toContain('Bash');
    expect(html).toContain('Python');
    expect(html).toContain('SQL');
    expect(html).toContain('JSON');
    expect(html).toContain('calculate');
    expect(html).toContain('SELECT');
  });
});
