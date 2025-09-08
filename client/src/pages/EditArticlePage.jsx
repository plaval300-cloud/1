import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ArticleEditor from '../components/editor/ArticleEditor';
import { AuthContext } from '../context/AuthContext';

const EditArticlePage = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [lastPublishedSlug, setLastPublishedSlug] = useState(null);

  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        try {
          const res = await api.get(`/api/articles/id/${articleId}`); // I need to create this private endpoint
          if (res.data.user_id !== user.user_id) {
            navigate('/'); // Not authorized
            return;
          }
          setTitle(res.data.title);
          setContent(res.data.content);
          setStatus(res.data.status);
          setLoading(false);
        } catch (err) {
          console.error(err);
          navigate('/'); // Redirect if article not found
        }
      };
      fetchArticle();
    } else {
      setLoading(false);
    }
  }, [articleId, user, navigate]);

  // Self-correction: I need a private route to get an article by ID for editing,
  // as the public one only gets published articles. I will add this to the plan.

  const handleSave = async (newStatus) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', JSON.stringify(content));
    formData.append('status', newStatus);
    if (coverImage) {
      formData.append('cover_image', coverImage);
    }

    try {
      let res;
      if (articleId) {
        res = await api.put(`/articles/${articleId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/articles', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      if (res.data.status === 'published') {
        setLastPublishedSlug(res.data.slug);
      } else {
        // Maybe navigate to a "my drafts" page in the future
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Failed to save article', err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>{articleId ? 'Edit Article' : 'Create Article'}</h2>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Article Title"
        style={{ fontSize: '2rem', width: '100%', marginBottom: '1rem' }}
      />
      <ArticleEditor
        content={content}
        onContentChange={setContent}
        onCoverImageChange={(e) => setCoverImage(e.target.files[0])}
      />
      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => handleSave('draft')}>Save Draft</button>
        <button onClick={() => handleSave('published')}>Publish</button>
      </div>
      {lastPublishedSlug && (
        <div style={{ marginTop: '1rem', padding: '10px', backgroundColor: '#e8f5e9' }}>
          <p>
            Successfully published! View your article here:
            <Link to={`/article/${lastPublishedSlug}`} target="_blank" rel="noopener noreferrer">
              /article/{lastPublishedSlug}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default EditArticlePage;
