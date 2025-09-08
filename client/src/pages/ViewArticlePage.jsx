import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import ArticleRenderer from '../components/editor/ArticleRenderer';

const ViewArticlePage = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/articles/slug/${slug}`);
        setArticle(res.data);
      } catch (err) {
        console.error(err);
        setError('Article not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!article) return <div>Article not found.</div>;

  return (
    <div className="article-view">
      <h1>{article.title}</h1>
      <p>By {article.username}</p>
      <p>Published on: {new Date(article.created_at).toLocaleDateString()}</p>
      {article.cover_image_url && (
        <img src={article.cover_image_url} alt={article.title} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
      )}
      <ArticleRenderer content={article.content} />
      <style jsx>{`
        .article-view {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
      `}</style>
    </div>
  );
};

export default ViewArticlePage;
