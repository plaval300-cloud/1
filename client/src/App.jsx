import React, { useContext, useEffect } from 'react';
import { Routes, Route, Link as RouterLink, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GoalPage from './pages/GoalPage';
import KanbanPage from './pages/KanbanPage';
import NotesPage from './pages/NotesPage';
import EditArticlePage from './pages/EditArticlePage';
import ViewArticlePage from './pages/ViewArticlePage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import PrivateRoute from './components/routing/PrivateRoute';
import { AuthContext } from './context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Container, Avatar, Menu, MenuItem } from '@mui/material';

function App() {
  const { isAuthenticated, user, logout, loadUser } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    loadUser();
  }, []);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              Goal Digger
            </RouterLink>
          </Typography>
          {isAuthenticated && user ? (
            <div>
              <Button color="inherit" component={RouterLink} to="/dashboard">Dashboard</Button>
              <Button
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                startIcon={<Avatar src={user.avatar_url} sx={{ width: 32, height: 32 }} />}
              >
                {user.username}
              </Button>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={open}
                onClose={handleClose}
              >
                <MenuItem component={RouterLink} to={`/profile/user/${user.user_id}`} onClick={handleClose}>Profile</MenuItem>
                <MenuItem component={RouterLink} to="/profile/edit" onClick={handleClose}>Edit Profile</MenuItem>
                <MenuItem onClick={() => { handleClose(); logout(); }}>Logout</MenuItem>
              </Menu>
            </div>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              <Button color="inherit" component={RouterLink} to="/register">Register</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/article/:slug" element={<ViewArticlePage />} />
          <Route path="/profile/user/:userId" element={<ProfilePage />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/goal/:goalId" element={<GoalPage />} />
            <Route path="/goal/:goalId/kanban" element={<KanbanPage />} />
            <Route path="/goal/:goalId/notes" element={<NotesPage />} />
            <Route path="/create-article" element={<EditArticlePage />} />
            <Route path="/edit-article/:articleId" element={<EditArticlePage />} />
            <Route path="/profile/edit" element={<EditProfilePage />} />
          </Route>

          {/* Redirect root path */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
