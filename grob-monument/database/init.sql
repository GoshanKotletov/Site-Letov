-- Таблица меток на карте
CREATE TABLE IF NOT EXISTS markers (
    id SERIAL PRIMARY KEY,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100),
    listener_name VARCHAR(100) DEFAULT 'Аноним',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для быстрого поиска по координатам
CREATE INDEX IF NOT EXISTS idx_markers_coords ON markers(lat, lng);
CREATE INDEX IF NOT EXISTS idx_markers_country ON markers(country);

-- Таблица сообщений (стена памяти)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    author VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    approved BOOLEAN DEFAULT TRUE
);

-- Таблица цитат
CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    source VARCHAR(200),
    year INTEGER,
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Тестовые данные для карты
INSERT INTO markers (lat, lng, city, country, listener_name) VALUES
(54.9833, 73.3667, 'Омск', 'Россия', 'Егор'),
(55.7558, 37.6173, 'Москва', 'Россия', 'Анархист'),
(59.9343, 30.3351, 'Санкт-Петербург', 'Россия', 'Панк'),
(56.8389, 60.6057, 'Екатеринбург', 'Россия', 'Слушатель'),
(55.0302, 82.9204, 'Новосибирск', 'Россия', 'Сибиряк'),
(50.4501, 30.5234, 'Киев', 'Украина', 'Свобода'),
(53.9045, 27.5615, 'Минск', 'Беларусь', 'Партизан'),
(43.2220, 76.8512, 'Алматы', 'Казахстан', 'Степной'),
(40.7128, -74.0060, 'Нью-Йорк', 'США', 'Эмигрант'),
(51.5074, -0.1278, 'Лондон', 'Великобритания', 'UK Listener');

-- Тестовые сообщения
INSERT INTO messages (author, text, city, approved) VALUES
('Дмитрий', 'ГрОб изменил мою жизнь в 15 лет. Спасибо, Егор.', 'Москва', TRUE),
('Анна', 'Слушаю с 1998 года. Вечная память.', 'Омск', TRUE),
('Сергей', 'Русское поле экспериментов — лучший альбом всех времён.', 'Новосибирск', TRUE),
('Михаил', 'Всё идёт по плану. Всегда.', 'Санкт-Петербург', TRUE);

-- Тестовые цитаты
INSERT INTO quotes (text, source, year, votes) VALUES
('Я всегда буду против', 'Интервью', 1988, 156),
('Всё идёт по плану', 'Всё идёт по плану', 1988, 423),
('Вечная весна в одиночной камере', 'Русское поле экспериментов', 1989, 312),
('Родина слышит, Родина знает', 'Всё идёт по плану', 1988, 278),
('Смерти нет', 'Интервью', 2007, 198);

-- Функция для подсчёта меток по странам
CREATE OR REPLACE FUNCTION get_country_stats()
RETURNS TABLE(country VARCHAR, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT m.country, COUNT(*) as count
    FROM markers m
    WHERE m.country IS NOT NULL
    GROUP BY m.country
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;