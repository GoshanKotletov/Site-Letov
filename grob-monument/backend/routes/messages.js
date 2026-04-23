const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/messages - получить сообщения
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, author, text, city, created_at 
             FROM messages 
             WHERE approved = TRUE 
             ORDER BY created_at DESC 
             LIMIT 50`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка получения сообщений:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// POST /api/messages - добавить сообщение
router.post('/', async (req, res) => {
    const { author, text, city } = req.body;
    
    if (!author || !text) {
        return res.status(400).json({ error: 'Имя и текст обязательны' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO messages (author, text, city, approved) 
             VALUES ($1, $2, $3, TRUE) 
             RETURNING id, author, text, city, created_at`,
            [author, text, city || '']
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка добавления сообщения:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;