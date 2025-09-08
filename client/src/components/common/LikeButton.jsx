import React, { useState, useEffect } from 'react';
import { IconButton, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';

const LikeButton = ({ contentId, contentType, initialLikes, initialIsLiked }) => {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const socket = useSocket();

  useEffect(() => {
    setLikes(initialLikes);
    setIsLiked(initialIsLiked);
  }, [initialLikes, initialIsLiked]);

  useEffect(() => {
    const room = `${contentType}:${contentId}`;
    socket.emit('join_room', room);

    const handleLikeUpdate = ({ likeCount }) => {
      setLikes(likeCount);
    };

    socket.on('update_like', handleLikeUpdate);

    return () => {
      socket.emit('leave_room', room);
      socket.off('update_like', handleLikeUpdate);
    };
  }, [contentType, contentId, socket]);

  const handleLike = async () => {
    // Optimistic update
    setIsLiked(!isLiked);
    setLikes(likes + (isLiked ? -1 : 1));

    try {
      await api.post('/likes', {
        content_id: contentId,
        content_type: contentType,
      });
    } catch (err) {
      // Revert on error
      setIsLiked(isLiked);
      setLikes(likes);
      console.error('Failed to update like status', err);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <IconButton onClick={handleLike} color="primary">
        {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
      </IconButton>
      <Typography variant="body1">{likes}</Typography>
    </div>
  );
};

export default LikeButton;
