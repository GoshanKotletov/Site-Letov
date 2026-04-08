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

// Функция ожидания БД с ретраями
async function waitForDB(retries = 10, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            await pool.query('SELECT 1');
            console.log('✅ PostgreSQL готов');
            return true;
        } catch (err) {
            console.log(`⏳ Ждём БД... (${i + 1}/${retries})`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    console.error('❌ Не удалось подключиться к БД');
    return false;
}

// --- Регистрация ---
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    if (password.length < 3) {
        return res.status(400).json({ error: 'Password must be at least 3 characters' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO users(username, password, is_admin) VALUES($1, $2, false) RETURNING id, username, is_admin',
            [username, password]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('Register error:', err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Логин ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const result = await pool.query(
            'SELECT id, username, is_admin FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Получить все отзывы (с именами пользователей) ---
app.get('/reviews', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, text, likes, created_at FROM reviews ORDER BY id DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET /reviews error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Добавить отзыв (только для авторизованных) ---
app.post('/reviews', async (req, res) => {
    const { text, username } = req.body;
    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Text is required' });
    }
    if (!username) {
        return res.status(401).json({ error: 'You must be logged in' });
    }
    try {
        // Найдем user_id по username
        const userResult = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        const userId = userResult.rows[0]?.id || null;
        
        const result = await pool.query(
            'INSERT INTO reviews(user_id, username, text) VALUES($1, $2, $3) RETURNING *',
            [userId, username, text.trim()]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('POST /reviews error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Лайкнуть отзыв ---
app.post('/reviews/:id/like', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE reviews SET likes = likes + 1 WHERE id = $1 RETURNING *',
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

// ========== МЕРЧ / МАГАЗИН ==========

// --- Получить все товары ---
app.get('/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('GET /products error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Создать заказ ---
app.post('/orders', async (req, res) => {
    const { username, items, total, address, phone } = req.body;
    
    if (!username || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing order data' });
    }
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Найдем user_id
        const userResult = await client.query('SELECT id FROM users WHERE username = $1', [username]);
        const userId = userResult.rows[0]?.id || null;
        
        // Создаем заказ
        const orderResult = await client.query(
            'INSERT INTO orders(user_id, username, total, address, phone, status) VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
            [userId, username, total, address, phone, 'new']
        );
        const orderId = orderResult.rows[0].id;
        
        // Добавляем товары в заказ
        for (const item of items) {
            await client.query(
                'INSERT INTO order_items(order_id, product_id, product_name, quantity, price) VALUES($1, $2, $3, $4, $5)',
                [orderId, item.id, item.name, item.quantity, item.price]
            );
            // Уменьшаем остаток на складе
            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.id]
            );
        }
        
        await client.query('COMMIT');
        res.json({ success: true, orderId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('POST /orders error:', err);
        res.status(500).json({ error: 'Database error' });
    } finally {
        client.release();
    }
});

// --- Получить заказы пользователя ---
app.get('/orders/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const orders = await pool.query(
            'SELECT * FROM orders WHERE username = $1 ORDER BY created_at DESC',
            [username]
        );
        for (const order of orders.rows) {
            const items = await pool.query(
                'SELECT * FROM order_items WHERE order_id = $1',
                [order.id]
            );
            order.items = items.rows;
        }
        res.json(orders.rows);
    } catch (err) {
        console.error('GET /orders error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ========== АДМИН-ПАНЕЛЬ ==========

// --- Проверка админа (middleware) ---
async function isAdmin(username) {
    if (!username) return false;
    const result = await pool.query('SELECT is_admin FROM users WHERE username = $1', [username]);
    return result.rows[0]?.is_admin === true;
}

// --- Получить всех пользователей (только для админа) ---
app.get('/admin/users', async (req, res) => {
    const { username } = req.query;
    if (!await isAdmin(username)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const result = await pool.query(
            'SELECT id, username, is_admin, created_at FROM users ORDER BY id'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET /admin/users error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Получить все заказы (только для админа) ---
app.get('/admin/orders', async (req, res) => {
    const { username } = req.query;
    if (!await isAdmin(username)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const orders = await pool.query(
            'SELECT * FROM orders ORDER BY created_at DESC'
        );
        for (const order of orders.rows) {
            const items = await pool.query(
                'SELECT * FROM order_items WHERE order_id = $1',
                [order.id]
            );
            order.items = items.rows;
        }
        res.json(orders.rows);
    } catch (err) {
        console.error('GET /admin/orders error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Обновить статус заказа (только для админа) ---
app.put('/admin/orders/:id/status', async (req, res) => {
    const { username } = req.query;
    const { id } = req.params;
    const { status } = req.body;
    
    if (!await isAdmin(username)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
        res.json({ success: true });
    } catch (err) {
        console.error('PUT /admin/orders/:id/status error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Получить все товары (для админа, с возможностью редактирования) ---
app.get('/admin/products', async (req, res) => {
    const { username } = req.query;
    if (!await isAdmin(username)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('GET /admin/products error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Обновить товар (только для админа) ---
app.put('/admin/products/:id', async (req, res) => {
    const { username } = req.query;
    const { id } = req.params;
    const { name, price, description, category, stock } = req.body;
    
    if (!await isAdmin(username)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        await pool.query(
            'UPDATE products SET name = $1, price = $2, description = $3, category = $4, stock = $5 WHERE id = $6',
            [name, price, description, category, stock, id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('PUT /admin/products/:id error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Запуск сервера ---
async function start() {
    const dbReady = await waitForDB();
    if (!dbReady) {
        console.error('❌ Сервер не стартует: БД недоступна');
        process.exit(1);
    }
    app.listen(3000, () => {
        console.log('✅ API running on port 3000');
    });
}

start();