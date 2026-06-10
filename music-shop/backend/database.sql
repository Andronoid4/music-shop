-- =============================================================================
-- КУРСОВОЙ ПРОЕКТ: ИНФОРМАЦИОННАЯ СИСТЕМА МУЗЫКАЛЬНОГО МАГАЗИНА
-- СУБД: PostgreSQL / SQL
-- =============================================================================

-- =============================================================================
-- 1. СТРУКТУРА ТАБЛИЦ И СВЯЗЕЙ (DDL)
-- =============================================================================

-- Удаление старых таблиц для чистого импорта
DROP TABLE IF EXISTS sales_log CASCADE;
DROP TABLE IF EXISTS disc_performance CASCADE;
DROP TABLE IF EXISTS performances CASCADE;
DROP TABLE IF EXISTS music_works CASCADE;
DROP TABLE IF EXISTS musician_ensemble CASCADE;
DROP TABLE IF EXISTS ensembles CASCADE;
DROP TABLE IF EXISTS musicians CASCADE;
DROP TABLE IF EXISTS discs CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS manufacturers CASCADE;

-- Таблица Музыкантов (Исполнители, композиторы, дирижеры)
CREATE TABLE musicians (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    instruments VARCHAR(255) NOT NULL -- Инструменты или роль (например, 'Скрипка, Фортепиано', 'Композитор', 'Дирижер')
);

-- Таблица Ансамблей / Коллективов (оркестры, джаз-группы, квартеты и др.)
CREATE TABLE ensembles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(100) NOT NULL -- Тип ансамбля (например: 'Оркестр', 'Джаз-группа', 'Квартет', 'Камерный ансамбль')
);

-- Таблица связи многие-ко-многим Музыкант <-> Ансамбль
CREATE TABLE musician_ensemble (
    musician_id INT REFERENCES musicians(id) ON DELETE CASCADE,
    ensemble_id INT REFERENCES ensembles(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'Исполнитель', -- Роль музыканта в данном ансамбле
    PRIMARY KEY (musician_id, ensemble_id)
);

-- Таблица Музыкальных произведений
CREATE TABLE music_works (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    composer_id INT REFERENCES musicians(id) ON DELETE SET NULL -- Автор композиции
);

-- Таблица обстоятельств исполнения (Записи исполнений)
CREATE TABLE performances (
    id SERIAL PRIMARY KEY,
    work_id INT NOT NULL REFERENCES music_works(id) ON DELETE CASCADE,
    ensemble_id INT REFERENCES ensembles(id) ON DELETE CASCADE,
    conductor_id INT REFERENCES musicians(id) ON DELETE SET NULL, -- Ссылка на дирижера (если есть)
    recording_date DATE NOT NULL
);

-- Таблица Компаний-производителей пластинок
CREATE TABLE manufacturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    is_supplier BOOLEAN DEFAULT FALSE -- Указывает, ведет ли компания сама оптовую торговлю
);

-- Таблица Оптовых поставщиков / Дистрибьюторов
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL
);

-- Таблица Компакт-дисков и Пластинок
CREATE TABLE discs (
    matrix_number VARCHAR(50) PRIMARY KEY, -- Уникальный номер матрицы / наклейки
    title VARCHAR(200) NOT NULL,
    manufacturer_id INT REFERENCES manufacturers(id) ON DELETE SET NULL,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    wholesale_price DECIMAL(10, 2) NOT NULL CHECK (wholesale_price >= 0),
    retail_price DECIMAL(10, 2) NOT NULL CHECK (retail_price >= 0),
    release_date DATE NOT NULL,
    sales_last_year INT DEFAULT 0 CHECK (sales_last_year >= 0),
    sales_this_year INT DEFAULT 0 CHECK (sales_this_year >= 0),
    inventory INT DEFAULT 0 CHECK (inventory >= 0),
    image_url TEXT,
    CONSTRAINT chk_prices CHECK (retail_price >= wholesale_price) -- Розничная цена должна быть выше или равна оптовой
);

-- Таблица связи Компакт-диск <-> Исполнение (на одном диске записано несколько треков)
CREATE TABLE disc_performance (
    disc_matrix_number VARCHAR(50) REFERENCES discs(matrix_number) ON DELETE CASCADE,
    performance_id INT REFERENCES performances(id) ON DELETE CASCADE,
    track_number INT CHECK (track_number > 0),
    PRIMARY KEY (disc_matrix_number, performance_id)
);

-- Журнал продаж (для демонстрации триггеров складского учета)
CREATE TABLE sales_log (
    id SERIAL PRIMARY KEY,
    disc_matrix_number VARCHAR(50) REFERENCES discs(matrix_number) ON DELETE CASCADE,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quantity INT NOT NULL CHECK (quantity > 0)
);


-- =============================================================================
-- 2. НАПОЛНЕНИЕ ДЕМОНСТРАЦИОННЫМИ ДАННЫМИ (DML)
-- =============================================================================

-- Музыканты (включая композиторов и исполнителей)
INSERT INTO musicians (id, name, instruments) VALUES
(1, 'Иоганн Себастьян Бах', 'Орган, Клавесин (Композитор)'),
(2, 'Людвиг ван Бетховен', 'Фортепиано (Композитор)'),
(3, 'Дюк Эллингтон', 'Фортепиано, Руководитель (Джаз)'),
(4, 'Герберт фон Караян', 'Дирижер'),
(5, 'Давид Ойстрах', 'Скрипка (Исполнитель)'),
(6, 'Жаклин дю Пре', 'Виолончель (Исполнитель)'),
(7, 'Майлз Дэвис', 'Труба (Композитор, Исполнитель)'),
(8, 'Игорь Стравинский', 'Дирижер, Композитор');

-- Ансамбли / Коллективы
INSERT INTO ensembles (id, name, type) VALUES
(1, 'Берлинский филармонический оркестр', 'Оркестр'),
(2, 'The Duke Ellington Orchestra', 'Джаз-оркестр'),
(3, 'Miles Davis Quintet', 'Квинтет'),
(4, 'Бородинский струнный квартет', 'Квартет');

-- Связи Музыканты <-> Ансамбли
INSERT INTO musician_ensemble (musician_id, ensemble_id, role) VALUES
(3, 2, 'Художественный руководитель и пианист'),
(4, 1, 'Главный дирижер'),
(7, 3, 'Лидер, трубач'),
(5, 4, 'Приглашенный солист');

-- Музыкальные произведения
INSERT INTO music_works (id, title, composer_id) VALUES
(1, 'Симфония №9', 2),
(2, 'Бранденбургский концерт №3', 1),
(3, 'Take the A Train', 3),
(4, 'So What', 7),
(5, 'Весна священная', 8);

-- Исполнения (Performances)
INSERT INTO performances (id, work_id, ensemble_id, conductor_id, recording_date) VALUES
(1, 1, 1, 4, '1977-03-15'), -- Симфония 9, Берлинский филарм, Караян
(2, 2, 4, NULL, '1968-10-22'), -- Бранденбургский концерт, Бородинский квартет
(3, 3, 2, 3, '1953-06-02'), -- Take the A Train, Оркестр Эллингтона
(4, 4, 3, 7, '1959-03-02'), -- So What, Квинтет Майлза Дэвиса
(5, 5, 1, 8, '1961-11-10'); -- Весна священная, Стравинский дирижирует Берлинским

-- Компании-производители
INSERT INTO manufacturers (id, name, address, is_supplier) VALUES
(1, 'EMI Records Ltd.', 'Лондон, Эбби Роуд 3', TRUE),
(2, 'Columbia Records', 'Нью-Йорк, Мэдисон Авеню 550', FALSE),
(3, 'Deutsche Grammophon', 'Гамбург, Потсдамер Штрассе 12', TRUE),
(4, 'Мелодия', 'Москва, ул. Тверская 18', TRUE);

-- Оптовые фирмы-посредники
INSERT INTO suppliers (id, name, address) VALUES
(1, 'Союз-Мьюзик Дистрибьюшн', 'Москва, Ленинский проспект 45'),
(2, 'Classic CD Wholesales', 'Мюнхен, Карлсплац 8'),
(3, 'EMI Records Ltd.', 'Лондон, Эбби Роуд 3'); -- Фирма EMI производитель является и оптовиком

-- Компакт-диски / Пластинки
INSERT INTO discs (matrix_number, title, manufacturer_id, supplier_id, wholesale_price, retail_price, release_date, sales_last_year, sales_this_year, inventory) VALUES
('EMI-1959-A1', 'Miles Davis - Kind of Blue', 2, 1, 1200.00, 1800.00, '1959-08-17', 150, 485, 30),
('DG-1977-K9', 'Beethoven: Symphony No. 9 (Karajan)', 3, 2, 1500.00, 2200.00, '1977-08-01', 80, 240, 15),
('MEL-1961-S5', 'Stravinsky - The Rite of Spring', 4, 1, 600.00, 950.00, '1962-02-15', 310, 520, 100),
('EMI-1953-E1', 'Duke Ellington - Take the A Train Classic', 1, 3, 900.00, 1350.00, '1954-01-10', 45, 120, 5);

-- Связи Компакт-диск <-> Исполнения
INSERT INTO disc_performance (disc_matrix_number, performance_id, track_number) VALUES
('EMI-1959-A1', 4, 1), -- Track 1: So What
('DG-1977-K9', 1, 1),  -- Track 1: Beethoven 9th Symphony
('MEL-1961-S5', 5, 1), -- Track 1: Rite of Spring
('EMI-1953-E1', 3, 1); -- Track 1: Take the A Train


-- =============================================================================
-- 3. ХРАНИМЫЕ ФУНКЦИИ И ПРОЦЕДУРЫ (PL/pgSQL)
-- =============================================================================

-- 1) Функция для подсчета количества музыкальных произведений конкретного ансамбля
CREATE OR REPLACE FUNCTION get_music_works_count(p_ensemble_id INT)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(DISTINCT work_id)
    INTO v_count
    FROM performances
    WHERE ensemble_id = p_ensemble_id;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;


-- 2) Функция/процедура для вывода названий всех дисков заданного ансамбля
CREATE OR REPLACE FUNCTION get_discs_by_ensemble(p_ensemble_id INT)
RETURNS TABLE (
    disc_matrix VARCHAR,
    disc_title VARCHAR,
    wholesale DECIMAL,
    retail DECIMAL,
    current_inventory INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT 
        d.matrix_number,
        d.title,
        d.wholesale_price,
        d.retail_price,
        d.inventory
    FROM discs d
    JOIN disc_performance dp ON d.matrix_number = dp.disc_matrix_number
    JOIN performances p ON dp.performance_id = p.id
    WHERE p.ensemble_id = p_ensemble_id;
END;
$$ LANGUAGE plpgsql;


-- 3) Функция для вывода лидеров продаж текущего года (топ дисков по продажам)
CREATE OR REPLACE FUNCTION get_sales_leaders_this_year(limit_val INT)
RETURNS TABLE (
    matrix_num VARCHAR,
    title VARCHAR,
    sales_this_year INT,
    inventory INT,
    retail_price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.matrix_number,
        d.title,
        d.sales_this_year,
        d.inventory,
        d.retail_price
    FROM discs d
    ORDER BY d.sales_this_year DESC
    LIMIT limit_val;
END;
$$ LANGUAGE plpgsql;


-- 4) Процедура для CRUD: Ввод новых ансамблей (INSERT)
CREATE OR REPLACE PROCEDURE insert_ensemble(
    p_name VARCHAR(150),
    p_type VARCHAR(100)
) AS $$
BEGIN
    INSERT INTO ensembles (name, type)
    VALUES (p_name, p_type);
END;
$$ LANGUAGE plpgsql;


-- 5) Процедура для CRUD: Ввод новых дисков (INSERT)
CREATE OR REPLACE PROCEDURE insert_disc(
    p_matrix VARCHAR(50),
    p_title VARCHAR(200),
    p_manufacturer_id INT,
    p_supplier_id INT,
    p_wholesale DECIMAL(10, 2),
    p_retail DECIMAL(10, 2),
    p_release_date DATE,
    p_inventory INT
) AS $$
BEGIN
    -- Если оптовый посредник не указан, а производитель сам является оптовиком, связываем автоматически
    IF p_supplier_id IS NULL AND (SELECT is_supplier FROM manufacturers WHERE id = p_manufacturer_id) = TRUE THEN
        -- Пытаемся найти или подставить соответствующего оптовика
        p_supplier_id := (SELECT id FROM suppliers WHERE name = (SELECT name FROM manufacturers WHERE id = p_manufacturer_id) LIMIT 1);
    END IF;

    INSERT INTO discs (matrix_number, title, manufacturer_id, supplier_id, wholesale_price, retail_price, release_date, sales_last_year, sales_this_year, inventory)
    VALUES (p_matrix, p_title, p_manufacturer_id, p_supplier_id, p_wholesale, p_retail, p_release_date, 0, 0, p_inventory);
END;
$$ LANGUAGE plpgsql;


-- 6) Процедура для CRUD: Изменение данных о диске (UPDATE)
CREATE OR REPLACE PROCEDURE update_disc(
    p_matrix VARCHAR(50),
    p_title VARCHAR(200),
    p_wholesale DECIMAL(10, 2),
    p_retail DECIMAL(10, 2),
    p_inventory INT
) AS $$
BEGIN
    UPDATE discs
    SET title = p_title,
        wholesale_price = p_wholesale,
        retail_price = p_retail,
        inventory = p_inventory
    WHERE matrix_number = p_matrix;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- 4. ТРИГГЕРЫ ДЛЯ ПОДДЕРЖАНИЯ ЦЕЛОСТНОСТИ И СКЛАДСКОГО УЧЕТА
-- =============================================================================

-- Триггерная функция для автоматического списания товара и учета продаж
CREATE OR REPLACE FUNCTION process_sale_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Проверка наличия диска на складе
    IF (SELECT inventory FROM discs WHERE matrix_number = NEW.disc_matrix_number) < NEW.quantity THEN
        RAISE EXCEPTION 'Отказ транзакции: на складе недостаточно товара для диска %', NEW.disc_matrix_number;
    END IF;

    -- 2. Списание остатка и увеличение продаж за текущий год в единой транзакции
    UPDATE discs
    SET inventory = inventory - NEW.quantity,
        sales_this_year = sales_this_year + NEW.quantity
    WHERE matrix_number = NEW.disc_matrix_number;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создание триггера на продажу диска
CREATE TRIGGER trg_on_sale_insert
BEFORE INSERT ON sales_log
FOR EACH ROW
EXECUTE FUNCTION process_sale_transaction();


-- Триггер для автоматического каскадирования изменений при обновлении номера матрицы диска
-- (Так как matrix_number используется во многих M2M таблицах, CASCADE на уровне FK поддерживает связи автоматически, 
-- но мы добавляем триггер логгирования или тонких проверок)
CREATE OR REPLACE FUNCTION log_disc_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Если изменился номер матрицы, каскадные связи SQL отработают благодаря ON UPDATE CASCADE
    -- Мы дополнительно проверяем условия валидности цен при изменении
    IF NEW.retail_price < NEW.wholesale_price THEN
        RAISE EXCEPTION 'Ошибка валидности: Розничная цена (%) не может быть меньше оптовой (%)', NEW.retail_price, NEW.wholesale_price;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_disc_price
BEFORE UPDATE ON discs
FOR EACH ROW
EXECUTE FUNCTION log_disc_changes();
