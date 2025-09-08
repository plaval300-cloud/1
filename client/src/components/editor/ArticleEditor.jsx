import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import lowlight from 'lowlight';
import Toolbar from './Toolbar';

// load all highlight.js languages
lowlight.registerAlias({
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python'
});

const ArticleEditor = ({ content, onContentChange, onCoverImageChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getJSON());
    },
  });

  const addImage = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="article-editor">
      <div>
        <label>Cover Image: </label>
        <input type="file" accept="image/*" onChange={onCoverImageChange} />
      </div>
      <Toolbar editor={editor} />
      <button onClick={addImage}>Add Image from URL</button>
      <EditorContent editor={editor} style={{ border: '1px solid #ccc', padding: '10px', minHeight: '400px' }} />
      <style jsx>{`
        .article-editor {
          border: 1px solid #ddd;
          padding: 1rem;
        }
      `}</style>
    </div>
  );
};

export default ArticleEditor;
