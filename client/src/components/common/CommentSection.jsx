import React, { useState, useEffect, useContext } from 'react';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Box, Button, TextField, Typography, Avatar, Paper } from '@mui/material';

const Comment = ({ comment }) => {
  return (
    <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2 }}>
      <Avatar src={comment.avatar_url} alt={comment.username} />
      <Box>
        <Typography variant="subtitle2">{comment.username}</Typography>
        <Typography variant="body2">{comment.body}</Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(comment.created_at).toLocaleString()}
        </Typography>
      </Box>
    </Paper>
  );
};


const CommentSection = ({ contentId, contentType }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const socket = useSocket();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await api.get(`/comments/${contentType}/${contentId}`);
        setComments(res.data);
      } catch (err) {
        console.error('Failed to fetch comments', err);
      }
    };
    fetchComments();

    // --- WebSocket Logic ---
    const room = `${contentType}:${contentId}`;
    socket.emit('join_room', room);

    const handleNewComment = (comment) => {
      // Add comment only if it's not already in the list (prevents duplicates for the sender)
      setComments((prevComments) =>
        prevComments.find(c => c.comment_id === comment.comment_id)
        ? prevComments
        : [...prevComments, comment]
      );
    };

    socket.on('new_comment', handleNewComment);

    return () => {
      socket.emit('leave_room', room);
      socket.off('new_comment', handleNewComment);
    };
    // --- End WebSocket Logic ---

  }, [contentType, contentId, socket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.post('/comments', {
        content_id: contentId,
        content_type: contentType,
        body: newComment,
      });
      // The server will emit a 'new_comment' event which will be caught by the listener
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Comments</Typography>
      {comments.map(comment => (
        <Comment key={comment.comment_id} comment={comment} />
      ))}
      {isAuthenticated && (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button type="submit" variant="contained" sx={{ mt: 1 }}>
            Post Comment
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CommentSection;
