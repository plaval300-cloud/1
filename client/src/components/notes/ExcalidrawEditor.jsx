import React, { useRef, useState, useEffect } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';

const ExcalidrawEditor = ({ initialData, onSave }) => {
  const excalidrawRef = useRef(null);
  const [title, setTitle] = useState(initialData?.title || 'New Excalidraw Note');

  const handleSave = () => {
    if (excalidrawRef.current) {
      const elements = excalidrawRef.current.getSceneElements();
      const appState = excalidrawRef.current.getAppState();
      onSave({
        title,
        content_type: 'excalidraw',
        content: { elements, appState },
      });
    }
  };

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note Title"
        style={{ marginBottom: '10px', width: 'calc(100% - 110px)' }}
      />
      <button onClick={handleSave} style={{ float: 'right' }}>Save Note</button>

      <Excalidraw
        ref={excalidrawRef}
        initialData={initialData?.content}
        // The viewModeEnabled prop can be used to make it read-only
        // viewModeEnabled={false}
      />
    </div>
  );
};

export default ExcalidrawEditor;
