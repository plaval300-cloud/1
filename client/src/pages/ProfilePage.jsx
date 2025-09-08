import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Container, Box, Avatar, Typography, Button, Paper, Link } from '@mui/material';

const ProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
    fetchProfile();
  }, [userId]);

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!profile) return null;

  const isOwnProfile = currentUser && currentUser.user_id === profile.user_id;

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={profile.avatar_url}
            alt={profile.username}
            sx={{ width: 100, height: 100, mr: 3 }}
          />
          <Box>
            <Typography variant="h4">{profile.full_name || profile.username}</Typography>
            <Typography variant="subtitle1" color="text.secondary">@{profile.username}</Typography>
            {profile.website_url && (
              <Link href={profile.website_url} target="_blank" rel="noopener noreferrer">
                {profile.website_url}
              </Link>
            )}
          </Box>
          {isOwnProfile && (
            <Button
              component={RouterLink}
              to="/profile/edit"
              variant="contained"
              sx={{ ml: 'auto' }}
            >
              Edit Profile
            </Button>
          )}
        </Box>
        <Box>
          <Typography variant="h6">Bio</Typography>
          <Typography variant="body1">{profile.bio || 'This user has not written a bio yet.'}</Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
