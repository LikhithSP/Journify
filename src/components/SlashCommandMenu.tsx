import React, { useState, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  CheckSquare, 
  Quote, 
  Code, 
  Minus, 
  Table, 
  Image, 
  Highlighter, 
  FileText
} from 'lucide-react';

interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: (editor: Editor) => void;
}

interface SlashCommandMenuProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  query: string;
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: 'Text',
    description: 'Just plain paragraph text',
    icon: <FileText size={16} />,
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: <Heading1 size={16} />,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: <Heading2 size={16} />,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small subsection heading',
    icon: <Heading3 size={16} />,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bulleted list',
    icon: <List size={16} />,
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Checklist',
    description: 'Track tasks with checkboxes',
    icon: <CheckSquare size={16} />,
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: 'Quote',
    description: 'Capture a quote or reflective callout',
    icon: <Quote size={16} />,
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Code Block',
    description: 'Syntax highlighted code snippet',
    icon: <Code size={16} />,
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Table',
    description: 'Insert a 3x3 interactive table',
    icon: <Table size={16} />,
    action: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: 'Divider',
    description: 'Visually divide blocks with a separator',
    icon: <Minus size={16} />,
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: 'Highlight',
    description: 'Highlight key insights in yellow',
    icon: <Highlighter size={16} />,
    action: (editor) => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run(),
  },
  {
    title: 'Image',
    description: 'Embed image from public URL',
    icon: <Image size={16} />,
    action: (editor) => {
      const url = window.prompt('Enter Image URL:');
      if (url) editor.chain().focus().setImage({ src: url }).run();
    },
  },
];

export default function SlashCommandMenu({
  editor,
  isOpen,
  onClose,
  position,
  query,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = SLASH_COMMANDS.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex] && editor) {
          // Delete the slash trigger character before running command
          editor.commands.deleteRange({ from: editor.state.selection.from - (query.length + 1), to: editor.state.selection.from });
          filteredCommands[selectedIndex].action(editor);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, editor, query, onClose]);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={{
        top: `${Math.min(position.top, window.innerHeight - 300)}px`,
        left: `${Math.min(position.left, window.innerWidth - 300)}px`,
      }}
      className="fixed z-50 w-72 max-h-72 overflow-y-auto bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
        Basic Blocks
      </div>
      {filteredCommands.map((item, index) => (
        <button
          key={item.title}
          type="button"
          onMouseEnter={() => setSelectedIndex(index)}
          onClick={() => {
            if (editor) {
              editor.commands.deleteRange({
                from: editor.state.selection.from - (query.length + 1),
                to: editor.state.selection.from,
              });
              item.action(editor);
              onClose();
            }
          }}
          className={`w-full flex items-center px-2.5 py-2 rounded-lg text-left transition-colors ${
            index === selectedIndex
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
          }`}
        >
          <div className="w-7 h-7 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center mr-3 text-neutral-800 dark:text-neutral-200 flex-shrink-0">
            {item.icon}
          </div>
          <div>
            <div className="text-xs font-semibold">{item.title}</div>
            <div className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-tight">
              {item.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
