const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/quotes - получить цитаты
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, text, source, year, votes FROM quotes ORDER BY votes DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка получения цитат:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// GET /api/quotes/random - случайная цитата
router.get('/random', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, text, source, year FROM quotes ORDER BY RANDOM() LIMIT 1'
        );
        res.json(result.rows[0] || { text: 'Всё идёт по плану', source: 'Егор Летов', year: 1988 });
    } catch (err) {
        console.error('Ошибка получения случайной цитаты:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// POST /api/quotes/:id/vote - голосовать за цитату
router.post('/:id/vote', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query(
            'UPDATE quotes SET votes = votes + 1 WHERE id = $1 RETURNING votes',
            [id]
        );
        res.json({ votes: result.rows[0]?.votes || 0 });
    } catch (err) {
        console.error('Ошибка голосования:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;