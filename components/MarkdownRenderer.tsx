import React from 'react';

type MarkdownRendererProps = {
  content: string;
};

// Helper for inline formatting
const renderInline = (text: string) => {
    // Note: The order of replacement matters. Strong should be first.
    const html = text
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md text-sm">$1</code>') // Inline code
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Headings
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-bold mt-4 mb-2">{renderInline(line.substring(2))}</h1>);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-bold mt-3 mb-1">{renderInline(line.substring(3))}</h2>);
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-lg font-bold mt-2">{renderInline(line.substring(4))}</h3>);
      i++;
      continue;
    }

    // Unordered List
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        listItems.push(<li key={i}>{renderInline(lines[i].substring(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-2">{listItems}</ul>);
      continue;
    }

    // Ordered List
    if (line.match(/^\d+\.\s/)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        listItems.push(<li key={i}>{renderInline(lines[i].replace(/^\d+\.\s/, ''))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-2">{listItems}</ol>);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].startsWith('> ')) {
            quoteLines.push(lines[i].substring(2));
            i++;
        }
        elements.push(
            <blockquote key={`quote-${i}`} className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 py-2 my-4 bg-slate-100 dark:bg-slate-700/50">
                {quoteLines.map((qLine, qIndex) => <p key={qIndex}>{renderInline(qLine)}</p>)}
            </blockquote>
        );
        continue;
    }

    // Code Block
    if (line.startsWith('```')) {
      const lang = line.substring(3);
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={`code-${i}`} className="bg-slate-900 dark:bg-black text-white p-4 rounded-md my-4 overflow-x-auto">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Table
    if (line.includes('|')) {
        const tableRows: string[][] = [];
        let headerLine = '';
        let separatorLine = '';

        if(lines[i+1] && lines[i+1].includes('|') && lines[i+1].includes('-')) {
            headerLine = lines[i];
            separatorLine = lines[i+1];
            i += 2; // Move past header and separator
            while(i < lines.length && lines[i].includes('|')) {
                tableRows.push(lines[i].split('|').map(s => s.trim()).slice(1, -1));
                i++;
            }
            const headers = headerLine.split('|').map(s => s.trim()).slice(1, -1);
            elements.push(
                <div key={`table-wrapper-${i}`} className="my-4 overflow-x-auto">
                    <table key={`table-${i}`} className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                {headers.map((header, hIndex) => (
                                    <th key={hIndex} className="border-b-2 border-slate-300 dark:border-slate-600 p-2 font-semibold">{renderInline(header)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.map((row, rIndex) => (
                                <tr key={rIndex} className="border-b border-slate-200 dark:border-slate-700">
                                    {row.map((cell, cIndex) => (
                                        <td key={cIndex} className="p-2">{renderInline(cell)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            continue;
        }
    }

    // Paragraph
    if (line.trim() !== '') {
      elements.push(<p key={i}>{renderInline(line)}</p>);
    }

    i++;
  }

  return <div className="space-y-4">{elements}</div>;
};

export default MarkdownRenderer;
