const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'ГРОБ API'
    });
});

// Routes - ВАЖНО: все должны быть подключены
app.use('/api/markers', require('./routes/markers'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/stats', require('./routes/stats'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Не найдено. Всё идёт по плану.' });
});

app.listen(PORT, () => {
    console.log(`ГРОБ API запущен на порту ${PORT}`);
});