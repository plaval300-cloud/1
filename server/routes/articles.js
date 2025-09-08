const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const db = require('../db');
const slugify = require('slugify');

// --- PROTECTED ROUTES ---

// POST /api/articles - Create a new article
router.post('/', auth, upload.single('cover_image'), async (req, res) => {
    const { title, content, status } = req.body;
    const user_id = req.user.id;

    if (!title) {
        return res.status(400).json({ msg: 'Title is required.' });
    }

    // Create a URL-friendly slug
    const slug = slugify(title, { lower: true, strict: true });

    // Get cover image URL if a file was uploaded
    const cover_image_url = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const newArticle = await db.query(
            `INSERT INTO articles (user_id, title, slug, content, status, cover_image_url)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [user_id, title, slug, content || null, status || 'draft', cover_image_url]
        );
        res.status(201).json(newArticle.rows[0]);
    } catch (err) {
        console.error(err.message);
        // Check for unique constraint violation on slug
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'An article with this title already exists.' });
        }
        res.status(500).send('Server Error');
    }
});

// PUT /api/articles/:articleId - Update an article
router.put('/:articleId', auth, upload.single('cover_image'), async (req, res) => {
    const { articleId } = req.params;
    const { title, content, status } = req.body;

    try {
        const articleResult = await db.query('SELECT * FROM articles WHERE article_id = $1 AND user_id = $2', [articleId, req.user.id]);
        if (articleResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Article not found or user not authorized.' });
        }

        const currentArticle = articleResult.rows[0];
        const newTitle = title !== undefined ? title : currentArticle.title;
        const newSlug = title !== undefined ? slugify(title, { lower: true, strict: true }) : currentArticle.slug;
        const newContent = content !== undefined ? content : currentArticle.content;
        const newStatus = status !== undefined ? status : currentArticle.status;
        const newCoverImageUrl = req.file ? `/uploads/${req.file.filename}` : currentArticle.cover_image_url;

        const updatedArticle = await db.query(
            `UPDATE articles SET title = $1, slug = $2, content = $3, status = $4, cover_image_url = $5
             WHERE article_id = $6 RETURNING *`,
            [newTitle, newSlug, newContent, newStatus, newCoverImageUrl, articleId]
        );
        res.json(updatedArticle.rows[0]);
    } catch (err) {
        console.error(err.message);
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'An article with this title already exists.' });
        }
        res.status(500).send('Server Error');
    }
});

// DELETE /api/articles/:articleId - Delete an article
router.delete('/:articleId', auth, async (req, res) => {
    try {
        const result = await db.query('DELETE FROM articles WHERE article_id = $1 AND user_id = $2', [req.params.articleId, req.user.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ msg: 'Article not found or user not authorized.' });
        }
        res.json({ msg: 'Article deleted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- PUBLIC ROUTES ---

// GET /api/articles - Get all published articles
router.get('/', async (req, res) => {
    try {
        const articles = await db.query(
            `SELECT a.article_id, a.title, a.slug, a.cover_image_url, a.created_at, u.username
             FROM articles a JOIN users u ON a.user_id = u.user_id
             WHERE a.status = 'published' ORDER BY a.created_at DESC`
        );
        res.json(articles.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/articles/slug/:slug - Get a single published article by slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const article = await db.query(
            `SELECT a.*, u.username FROM articles a JOIN users u ON a.user_id = u.user_id
             WHERE a.slug = $1 AND a.status = 'published'`, [req.params.slug]
        );
        if (article.rows.length === 0) {
            return res.status(404).json({ msg: 'Article not found.' });
        }
        res.json(article.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/articles/id/:articleId - (PRIVATE) Get a single article by ID for editing
router.get('/id/:articleId', auth, async (req, res) => {
    try {
        const article = await db.query(
            'SELECT * FROM articles WHERE article_id = $1 AND user_id = $2',
            [req.params.articleId, req.user.id]
        );
        if (article.rows.length === 0) {
            return res.status(404).json({ msg: 'Article not found or user not authorized.' });
        }
        res.json(article.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
