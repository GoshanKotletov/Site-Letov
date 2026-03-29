const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();


app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const pool = new Pool({
    host: 'db',
    user: 'postgres',
    password: 'postgres',
    database: 'letov',
    port: 5432
});


pool.connect((err, client, release) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err.stack);
    } else {
        console.log('✅ Подключено к PostgreSQL');
        release();
    }
});

app.get('/reviews', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM reviews ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('GET /reviews error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/reviews', async (req, res) => {
    const { text } = req.body;
    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Text is required' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO reviews(text) VALUES($1) RETURNING *',
            [text.trim()]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('POST /reviews error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/reviews/:id/like', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE reviews SET likes = likes + 1 WHERE id=$1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('POST /reviews/:id/like error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.listen(3000, () => console.log('✅ API running on port 3000'));