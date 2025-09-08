import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Container, Box, Avatar, Typography, Button, TextField, Alert } from '@mui/material';

const EditProfilePage = () => {
  const { user, loadUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    website_url: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/profile/me')
      .then(res => {
        setFormData({
          full_name: res.data.full_name || '',
          bio: res.data.bio || '',
          website_url: res.data.website_url || '',
        });
      })
      .catch(err => {
        setError('Could not load profile data.');
        console.error(err);
      });
  }, []);

  const { full_name, bio, website_url } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onFileChange = e => setAvatarFile(e.target.files[0]);

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      // Update text fields
      await api.put('/profile/me', formData);

      // If there's a new avatar, upload it
      if (avatarFile) {
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', avatarFile);
        await api.post('/profile/me/avatar', avatarFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSuccess('Profile updated successfully!');
      // Refresh user context to get new avatar/info in the app bar
      loadUser();
      // Redirect back to profile page after a short delay
      setTimeout(() => navigate(`/profile/user/${user.user_id}`), 1500);

    } catch (err) {
      setError('Failed to update profile.');
      console.error(err);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" sx={{ my: 4 }}>Edit Profile</Typography>
      <Box component="form" onSubmit={onSubmit}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar src={user?.avatar_url} sx={{ width: 80, height: 80, mr: 2 }} />
          <Button variant="contained" component="label">
            Upload New Avatar
            <input type="file" hidden onChange={onFileChange} accept="image/*" />
          </Button>
        </Box>
        <TextField
          label="Full Name"
          name="full_name"
          value={full_name}
          onChange={onChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Bio"
          name="bio"
          value={bio}
          onChange={onChange}
          fullWidth
          margin="normal"
          multiline
          rows={4}
        />
        <TextField
          label="Website URL"
          name="website_url"
          value={website_url}
          onChange={onChange}
          fullWidth
          margin="normal"
        />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        <Button type="submit" variant="contained" size="large" sx={{ mt: 3 }}>
          Save Changes
        </Button>
      </Box>
    </Container>
  );
};

export default EditProfilePage;
