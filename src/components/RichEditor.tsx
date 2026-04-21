import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Undo, Redo } from 'lucide-react';

interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichEditor({ content, onChange, placeholder }: RichEditorProps) {
  // Use a ref to store the latest content to avoid closing over stale values in onUpdate
  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Only propagate change if it actually changed from what we last received as prop
      if (html !== contentRef.current) {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[300px] p-4 text-sm leading-relaxed text-[#E8EAED] prose-invert',
      },
    },
  });

  // Keep content in sync if it changes externally (e.g. from AI or other parts of the app)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    
    // Process input content: convert plain text with \n to paragraphs for the editor
    let processedContent = content;
    if (content && !content.includes('<p>') && !content.includes('<br>')) {
      processedContent = content
        .trim()
        .split('\n\n')
        .map(para => `<p>${para.split('\n').join('<br>')}</p>`)
        .join('');
    }

    // Only update if content prop is different from editor HTML and the editor isn't being used
    if (processedContent !== currentHtml && !editor.isFocused) {
      editor.commands.setContent(processedContent, false);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-bg focus-within:border-primary/50 transition-colors relative">
      <div className="flex items-center gap-1 p-2 border-b border-dark-border bg-dark-surface/50">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}><Bold className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><Italic className="w-4 h-4" /></ToolbarBtn>
        <div className="w-px h-4 bg-dark-border mx-1" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}><List className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}><ListOrdered className="w-4 h-4" /></ToolbarBtn>
        <div className="flex-1" />
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()}><Undo className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()}><Redo className="w-4 h-4" /></ToolbarBtn>
      </div>
      <EditorContent editor={editor} />
      {placeholder && !editor.getText() && (
        <div className="absolute top-12 left-4 text-text-muted pointer-events-none text-sm">{placeholder}</div>
      )}
    </div>
  );
}

function ToolbarBtn({ children, onClick, active }: any) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-primary text-dark-bg' : 'text-text-muted hover:bg-dark-border hover:text-text-primary'}`}
    >
      {children}
    </button>
  );
}
