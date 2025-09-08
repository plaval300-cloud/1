import React, { useContext, useEffect } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GoalPage from './pages/GoalPage';
import KanbanPage from './pages/KanbanPage';
import NotesPage from './pages/NotesPage';
import EditArticlePage from './pages/EditArticlePage';
import ViewArticlePage from './pages/ViewArticlePage';
import PrivateRoute from './components/routing/PrivateRoute';
import { AuthContext } from './context/AuthContext';

function App() {
  const { isAuthenticated, user, logout, loadUser } = useContext(AuthContext);

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <div>
      <header>
        <h1>Project Goal Digger</h1>
        { user && <h4>Welcome, {user.username}!</h4> }
        <nav>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link> |{' '}
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link> |{' '}
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/article/:slug" element={<ViewArticlePage />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/goal/:goalId" element={<GoalPage />} />
            <Route path="/goal/:goalId/kanban" element={<KanbanPage />} />
            <Route path="/goal/:goalId/notes" element={<NotesPage />} />
            <Route path="/create-article" element={<EditArticlePage />} />
            <Route path="/edit-article/:articleId" element={<EditArticlePage />} />
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
