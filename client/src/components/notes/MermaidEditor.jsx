import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false });

const MermaidEditor = ({ initialData, onSave }) => {
  const [title, setTitle] = useState(initialData?.title || 'New Mermaid Note');
  const [text, setText] = useState(initialData?.content?.text || 'graph TD;\n    A-->B;');
  const previewRef = useRef(null);

  useEffect(() => {
    const renderMermaid = async () => {
      try {
        const { svg } = await mermaid.render('mermaid-preview', text);
        if (previewRef.current) {
          previewRef.current.innerHTML = svg;
        }
      } catch (e) {
        if (previewRef.current) {
          previewRef.current.innerHTML = 'Error rendering diagram. Check syntax.';
        }
        console.error(e);
      }
    };
    renderMermaid();
  }, [text]);

  const handleSave = () => {
    onSave({
      title,
      content_type: 'mermaid',
      content: { text },
    });
  };

  return (
    <div style={{ display: 'flex', height: '600px' }}>
      <div style={{ flex: 1, paddingRight: '10px' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
          style={{ marginBottom: '10px', width: 'calc(100% - 110px)' }}
        />
        <button onClick={handleSave} style={{ float: 'right' }}>Save Note</button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: '100%', height: 'calc(100% - 40px)' }}
        />
      </div>
      <div ref={previewRef} id="mermaid-preview" style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
        {/* Mermaid diagram will be rendered here */}
      </div>
    </div>
  );
};

export default MermaidEditor;
