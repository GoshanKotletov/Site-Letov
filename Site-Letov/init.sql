-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица отзывов (с привязкой к пользователю)
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    text TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    image VARCHAR(500),
    category VARCHAR(100),
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    total INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица товаров в заказе
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(200),
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL
);

-- Добавляем тестовые товары
INSERT INTO products (name, price, description, image, category, stock) VALUES
('ГрОб - Футболка "Всё идёт по плану"', 1990, 'Хлопковая футболка с принтом. Чёрный цвет, качественная печать.', '/images/merch/tshirt1.jpg', 'Одежда', 50),
('ГрОб - Худи "Русское поле"', 3990, 'Тёплое худи с вышивкой. Унисекс.', '/images/merch/hoodie1.jpg', 'Одежда', 30),
('ГрОб - Шоппер "Гражданская оборона"', 990, 'Экосумка с логотипом. Вместительная и прочная.', '/images/merch/bag1.jpg', 'Аксессуары', 100),
('ГрОб - Значок "Назло"', 290, 'Металлический значок. Диаметр 3.2 см.', '/images/merch/pin1.jpg', 'Аксессуары', 200),
('ГрОб - Кружка "Поперёк"', 790, 'Керамическая кружка 350 мл. Чёрная с белым принтом.', '/images/merch/mug1.jpg', 'Посуда', 75),
('ГрОб - Постер "Вечность пахнет нефтью"', 590, 'Плакат А2 на матовой бумаге.', '/images/merch/poster1.jpg', 'Постеры', 45);

-- Добавляем админа (логин: Iolotopo, пароль: Iolotopo)
INSERT INTO users (username, password, is_admin)
VALUES ('Iolotopo', 'Iolotopo', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Добавляем тестовый отзыв
INSERT INTO reviews (user_id, username, text, likes)
SELECT 1, 'Iolotopo', 'Егор Летов — голос поколения. Спасибо за этот сайт!', 5
WHERE EXISTS (SELECT 1 FROM users WHERE username = 'Iolotopo');