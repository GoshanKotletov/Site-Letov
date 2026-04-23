const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/stats - общая статистика
router.get('/', async (req, res) => {
    try {
        const markersTotal = await pool.query('SELECT COUNT(*) FROM markers');
        const messagesTotal = await pool.query('SELECT COUNT(*) FROM messages WHERE approved = TRUE');
        const quotesTotal = await pool.query('SELECT COUNT(*) FROM quotes');
        const countriesTotal = await pool.query('SELECT COUNT(DISTINCT country) FROM markers WHERE country IS NOT NULL');
        
        const topCountries = await pool.query(
            `SELECT country, COUNT(*) as count 
             FROM markers 
             WHERE country IS NOT NULL 
             GROUP BY country 
             ORDER BY count DESC 
             LIMIT 5`
        );
        
        res.json({
            markers: parseInt(markersTotal.rows[0].count),
            messages: parseInt(messagesTotal.rows[0].count),
            quotes: parseInt(quotesTotal.rows[0].count),
            countries: parseInt(countriesTotal.rows[0].count),
            topCountries: topCountries.rows
        });
    } catch (err) {
        console.error('Ошибка получения статистики:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;