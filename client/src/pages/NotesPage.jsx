import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import ExcalidrawEditor from '../components/notes/ExcalidrawEditor';
import MermaidEditor from '../components/notes/MermaidEditor';

const NotesPage = () => {
  const { goalId } = useParams();
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null); // Can be a note object or an object indicating new note type
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await api.get(`/goals/${goalId}/notes`);
        setNotes(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load notes.');
      }
    };
    fetchNotes();
  }, [goalId]);

  const handleSaveNote = async (noteData) => {
    try {
      if (editingNote && editingNote.note_id) {
        // Update existing note
        const res = await api.put(`/notes/${editingNote.note_id}`, noteData);
        setNotes(notes.map(n => n.note_id === res.data.note_id ? res.data : n));
      } else {
        // Create new note
        const res = await api.post(`/goals/${goalId}/notes`, noteData);
        setNotes([...notes, res.data]);
      }
      setEditingNote(null); // Close editor
    } catch (err) {
      console.error(err);
      setError('Failed to save note.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
        try {
            await api.delete(`/notes/${noteId}`);
            setNotes(notes.filter(n => n.note_id !== noteId));
        } catch (err) {
            console.error(err);
            setError('Failed to delete note.');
        }
    }
  }

  const renderEditor = () => {
    if (!editingNote) return null;

    if (editingNote.content_type === 'excalidraw') {
      return <ExcalidrawEditor initialData={editingNote} onSave={handleSaveNote} />;
    }
    if (editingNote.content_type === 'mermaid') {
      return <MermaidEditor initialData={editingNote} onSave={handleSaveNote} />;
    }
    return null;
  };

  return (
    <div>
      <Link to={`/goal/${goalId}`}>Back to Goal</Link>
      <h2>Notes for Goal</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {editingNote ? (
        <div>
          <button onClick={() => setEditingNote(null)}>Cancel</button>
          {renderEditor()}
        </div>
      ) : (
        <div>
          <button onClick={() => setEditingNote({ content_type: 'excalidraw' })}>New Excalidraw Note</button>
          <button onClick={() => setEditingNote({ content_type: 'mermaid' })}>New Mermaid Note</button>
          <hr />
          <h3>Existing Notes</h3>
          <ul>
            {notes.map(note => (
              <li key={note.note_id}>
                {note.title} ({note.content_type})
                <button onClick={() => setEditingNote(note)}>Edit</button>
                <button onClick={() => handleDeleteNote(note.note_id)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
