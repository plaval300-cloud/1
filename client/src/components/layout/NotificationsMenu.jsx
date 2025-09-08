import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { IconButton, Badge, Menu, MenuItem, Typography, Button, Box } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

const NotificationsMenu = () => {
  const [invitations, setInvitations] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const fetchInvitations = async () => {
    try {
      const res = await api.get('/invitations');
      setInvitations(res.data);
    } catch (err) {
      console.error('Failed to fetch invitations', err);
    }
  };

  useEffect(() => {
    fetchInvitations();
    // Optional: Poll for new invitations every minute
    const interval = setInterval(fetchInvitations, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleResponse = async (invitationId, status) => {
    try {
      await api.put(`/invitations/${invitationId}`, { status });
      // Refresh list after responding
      fetchInvitations();
    } catch (err) {
      console.error(`Failed to ${status} invitation`, err);
    }
    handleClose();
  };

  return (
    <div>
      <IconButton
        size="large"
        aria-label="show new notifications"
        color="inherit"
        onClick={handleMenu}
      >
        <Badge badgeContent={invitations.length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        id="menu-notifications"
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        keepMounted
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={open}
        onClose={handleClose}
      >
        {invitations.length === 0 ? (
          <MenuItem disabled>No new invitations</MenuItem>
        ) : (
          invitations.map(inv => (
            <MenuItem key={inv.invitation_id} sx={{ display: 'block' }}>
              <Typography variant="body2">
                <b>{inv.inviter_username}</b> invited you to join the goal: <b>{inv.goal_title}</b>
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Button size="small" variant="contained" onClick={() => handleResponse(inv.invitation_id, 'accepted')}>Accept</Button>
                <Button size="small" sx={{ ml: 1 }} onClick={() => handleResponse(inv.invitation_id, 'declined')}>Decline</Button>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </div>
  );
};

export default NotificationsMenu;
