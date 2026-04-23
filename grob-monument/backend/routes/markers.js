const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/markers
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, lat, lng, city, country, listener_name, created_at FROM markers ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка получения меток:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// POST /api/markers
router.post('/', async (req, res) => {
    const { lat, lng, city, country, listener_name } = req.body;
    
    if (!lat || !lng) {
        return res.status(400).json({ error: 'Координаты обязательны' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO markers (lat, lng, city, country, listener_name) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, lat, lng, city, country, listener_name, created_at`,
            [lat, lng, city || 'Неизвестно', country || 'Неизвестно', listener_name || 'Аноним']
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка добавления метки:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// GET /api/markers/stats
router.get('/stats', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT country, COUNT(*) as count 
             FROM markers 
             WHERE country IS NOT NULL 
             GROUP BY country 
             ORDER BY count DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка получения статистики:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;