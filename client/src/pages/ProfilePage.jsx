import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Container, Box, Avatar, Typography, Button, Paper, Link, Grid } from '@mui/material';

const ProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/profile/user/${userId}`);
      setProfile(res.data);
    } catch (err) {
      setError('Profile not found.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const handleFollow = async () => {
    const originalProfile = { ...profile };
    // Optimistic update
    setProfile(p => ({ ...p, is_following: true, follower_count: p.follower_count + 1 }));
    try {
      await api.post(`/profile/${userId}/follow`);
    } catch (err) {
      console.error(err);
      setProfile(originalProfile); // Revert on error
    }
  };

  const handleUnfollow = async () => {
    const originalProfile = { ...profile };
    // Optimistic update
    setProfile(p => ({ ...p, is_following: false, follower_count: p.follower_count - 1 }));
    try {
      await api.delete(`/profile/${userId}/follow`);
    } catch (err) {
      console.error(err);
      setProfile(originalProfile); // Revert on error
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!profile) return null;

  const isOwnProfile = currentUser && currentUser.user_id === profile.user_id;

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Avatar
              src={profile.avatar_url}
              alt={profile.username}
              sx={{ width: 150, height: 150, mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h4" sx={{ mr: 2 }}>{profile.full_name || profile.username}</Typography>
              {isOwnProfile ? (
                <Button component={RouterLink} to="/profile/edit" variant="outlined">Edit Profile</Button>
              ) : (
                profile.is_following ? (
                  <Button variant="contained" onClick={handleUnfollow}>Unfollow</Button>
                ) : (
                  <Button variant="outlined" onClick={handleFollow}>Follow</Button>
                )
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
              <Typography><b>{profile.follower_count}</b> Followers</Typography>
              <Typography><b>{profile.following_count}</b> Following</Typography>
            </Box>
            <Typography variant="subtitle1" color="text.secondary">@{profile.username}</Typography>
            {profile.website_url && (
              <Link href={profile.website_url} target="_blank" rel="noopener noreferrer">
                {profile.website_url}
              </Link>
            )}
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6">Bio</Typography>
            <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
              {profile.bio || 'This user has not written a bio yet.'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
