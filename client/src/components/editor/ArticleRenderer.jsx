import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import lowlight from 'lowlight';

// load all highlight.js languages
lowlight.registerAlias({
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python'
});

const ArticleRenderer = ({ content }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: content,
    editable: false,
  });

  return (
    <div className="article-content">
      <EditorContent editor={editor} />
    </div>
  );
};

export default ArticleRenderer;
