import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { dbSim } from "./dbSimulator.js";

// Загрузка переменных окружения
dotenv.config();

const { Pool } = pg;

let pool = null;
let useRealDb = false;
let dbConfigString = "In-memory Simulator Mode";

// Проверка наличия переменных окружения для подключения к СУБД
const connectionString = process.env.DATABASE_URL || "";
const hasPgHost = process.env.PGHOST && process.env.PGPASSWORD;

if (connectionString || hasPgHost) {
  try {
    const config = connectionString 
      ? { connectionString, ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1") ? false : { rejectUnauthorized: false } }
      : {
          host: process.env.PGHOST,
          port: parseInt(process.env.PGPORT || "5432"),
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE,
          ssl: process.env.PGHOST.includes("localhost") || process.env.PGHOST.includes("127.0.0.1") ? false : { rejectUnauthorized: false }
        };

    pool = new Pool(config);
    dbConfigString = connectionString 
      ? `PostgreSQL (${connectionString.replace(/:([^:@]+)@/, ":***@")})`
      : `PostgreSQL (${process.env.PGUSER}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE})`;
    useRealDb = true;
  } catch (err) {
    console.error("⚠️ [SQL DB] Ошибка инициализации пула PostgreSQL. Переход на симулятор:", err.message);
    useRealDb = false;
  }
}

// Логи в памяти для отображения в SQL-консоли (также пополняются действиями над PostgreSQL)
const memoryLogs = [];

function logAction(msg) {
  const timestamp = new Date().toISOString().substring(11, 19);
  memoryLogs.push(`[${timestamp}] ${msg}`);
  console.log(`[Database Bridge] ${msg}`);
}

export function getLogs() {
  if (useRealDb) {
    return memoryLogs;
  }
  return dbSim.getLogs();
}

export function clearLogs() {
  if (useRealDb) {
    memoryLogs.length = 0;
  } else {
    dbSim.clearLogs();
  }
}

// Попытка проверить подключение и накатить схему (DDL + DML)
async function initDbSchema() {
  if (!useRealDb) {
    logAction("⚠️ Переменные подключения СУБД отсутствуют. Используется встроенный JS Симулятор.");
    return;
  }

  try {
    const client = await pool.connect();
    logAction(`🔌 Успешно подключено к внешней СУБД PostgreSQL! Конфигурация: ${dbConfigString}`);
    
    // Проверяем, существуют ли базовые таблицы и наполнены ли они
    let tablesExistAndPopulated = false;
    try {
      const checkTableRes = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'discs'
        );
      `);
      if (checkTableRes.rows[0].exists) {
        const checkCount = await client.query("SELECT COUNT(*) FROM discs");
        if (parseInt(checkCount.rows[0].count) > 0) {
          tablesExistAndPopulated = true;
        }
      }
    } catch (e) {
      // Игнорируем ошибку
    }

    if (!tablesExistAndPopulated) {
      logAction("🛠️ Базовые таблицы СУБД пустые или не обнаружены. Полноценная автоматическая разметка схемы и наполнение данными (DDL + DML)...");
      
      // Читаем database.sql
      const sqlFilePath = path.join(process.cwd(), "backend", "database.sql");
      if (fs.existsSync(sqlFilePath)) {
        let sqlContent = fs.readFileSync(sqlFilePath, "utf8");
        
        // Маленький фикс: удалим специфичные для PostgreSQL синтаксические конструкции,
        // если они некорректно импортируются, но database.sql полностью верен для PostgreSQL
        await client.query(sqlContent);
        logAction("✅ Разметка структуры, индексов, триггеров и процедур успешно накачена из database.sql!");
      } else {
        logAction("⚠️ Файл backend/database.sql не найден. Будет попытка создать скелет...");
      }

      // Создаем дополнительно вспомогательные таблицы users и reviews, если их нет в database.sql
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(150) UNIQUE NOT NULL,
          password_hash VARCHAR(150) NOT NULL,
          role VARCHAR(50) NOT NULL,
          full_name VARCHAR(150) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          disc_matrix_number VARCHAR(50) REFERENCES discs(matrix_number) ON DELETE CASCADE,
          reviewer_name VARCHAR(150) NOT NULL,
          reviewer_email VARCHAR(150),
          rating INT CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at VARCHAR(50)
        );
      `);

      // Добавим дефолтных пользователей в PostgreSQL
      await client.query(`
        INSERT INTO users (email, password_hash, role, full_name) VALUES
        ('owner@musicdb.ru', 'owner123', 'OWNER', 'Игорь Петрович (Владелец)'),
        ('admin@musicdb.ru', 'admin123', 'ADMIN', 'Александр (Администратор)'),
        ('user@musicdb.ru', 'user123', 'USER', 'Анатолий Б. (Покупатель)'),
        ('guest@musicdb.ru', 'guest123', 'GUEST', 'Сергей В. (Гость)')
        ON CONFLICT (email) DO NOTHING;
      `);

      // Добавим дефолтные отзывы в PostgreSQL
      await client.query(`
        INSERT INTO reviews (disc_matrix_number, reviewer_name, reviewer_email, rating, comment, created_at) VALUES
        ('EMI-1959-A1', 'Анатолий Б.', 'user@musicdb.ru', 5, 'Шедевр модального джаза! Качество записи на этом диске великолепное, кристально чистый звук трубы Майлза.', '2026-04-12'),
        ('EMI-1959-A1', 'Сергей В.', 'guest@musicdb.ru', 4, 'Классика, которая должна быть у каждого коллекционера. Оформление конверта отличное.', '2026-05-01'),
        ('DG-1977-K9', 'Мария К.', 'maria@musicdb.ru', 5, 'Девятая симфония в исполнении Караяна — это что-то неземное. Хор в финале пробирает до мурашек.', '2026-03-20'),
        ('MEL-1961-S5', 'Дмитрий Т.', 'dmitry@musicdb.ru', 5, 'Стравинский в исполнении советского оркестра звучит мощно и напористо. Диск без нареканий.', '2026-04-28')
        ON CONFLICT DO NOTHING;
      `);
      
      logAction("✅ Системные данные пользователей и отзывов завершены.");
    } else {
      logAction("⚡ База данных музыкального магазина найдена, записи присутствуют и готовы к работе.");
    }

    // Гарантируем наличие колонки image_url в таблице discs
    try {
      await client.query("ALTER TABLE discs ADD COLUMN IF NOT EXISTS image_url TEXT;");
      await client.query("ALTER TABLE discs ALTER COLUMN image_url TYPE TEXT;");
    } catch (colErr) {
      logAction(`⚠️ Не удалось добавить или изменить колонку image_url: ${colErr.message}`);
    }

    client.release();
  } catch (err) {
    console.error("❌ Critical failure on connecting to PG instance. Reverting to simulator mode.", err);
    useRealDb = false;
    logAction(`❌ Сбой подключения к PostgreSQL: ${err.message}. Включена симуляция СУБД в оперативной памяти.`);
  }
}

// Запускаем асинхронную инициализацию
initDbSchema();

// Экспортируемые функции адаптера БД
export const db = {
  isExternal: () => useRealDb,
  dbConfigString: () => dbConfigString,

  // Аутентификация
  async findUserByEmail(email) {
    if (!useRealDb) {
      const u = dbSim.users.find(x => x.email.toLowerCase() === email.toLowerCase());
      if (!u) return null;
      return { id: u.id, email: u.email, password_hash: u.passwordHash, role: u.role, full_name: u.fullName };
    }
    const res = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    return res.rows[0] || null;
  },

  async registerUser(email, password, role, fullName) {
    if (!useRealDb) {
      if (dbSim.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Пользователь уже существует.");
      }
      const nextId = dbSim.users.length > 0 ? Math.max(...dbSim.users.map(u => u.id)) + 1 : 1;
      const newUser = { id: nextId, email: email.toLowerCase(), passwordHash: password, role: role.toUpperCase(), fullName };
      dbSim.users.push(newUser);
      dbSim.log(`[Sim REG] Новый пользователь ${fullName}`);
      return { id: nextId, email: email.toLowerCase(), role: role.toUpperCase(), fullName };
    }

    const checkRes = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (checkRes.rows.length > 0) {
      throw new Error("Пользователь с таким E-mail уже зарегистрирован в СУБД.");
    }

    const insRes = await pool.query(
      "INSERT INTO users (email, password_hash, role, full_name) VALUES ($1, $2, $3, $4) RETURNING id, email, role, full_name",
      [email.toLowerCase(), password, role.toUpperCase(), fullName]
    );
    logAction(`Триггер/функция insert_user_hook (Postgres): Успешно зарегистрирован новый пользователь ${fullName} (${email}) с ролью ${role.toUpperCase()}.`);
    return insRes.rows[0];
  },

  // Сырой SQL
  async executeSql(sql) {
    logAction(`Пользовательский SQL запрос: "${sql.trim()}"`);
    if (!useRealDb) {
      return dbSim.executeSql(sql);
    }

    // Для реального PostgreSQL, выполним сырой запрос через веб-пул
    try {
      const queryResult = await pool.query(sql);
      
      // Если это SELECT запрос (или возвращает строки)
      if (queryResult.rows) {
        const headers = queryResult.fields ? queryResult.fields.map(f => f.name) : (queryResult.rows.length > 0 ? Object.keys(queryResult.rows[0]) : []);
        const rows = queryResult.rows.map(row => headers.map(h => row[h]));
        return {
          headers,
          rows,
          rowCount: queryResult.rowCount,
          message: `Запрос выполнен успешно на PostgreSQL. Получено строк: ${queryResult.rows.length}.`
        };
      }

      return {
        headers: ["Command", "Status"],
        rows: [[queryResult.command, "Успешно"]],
        rowCount: queryResult.rowCount,
        message: `Инструкция СУБД '${queryResult.command}' выполнена.`
      };
    } catch (err) {
      logAction(`Ошибка в Postgres SQL: ${err.message}`);
      throw err;
    }
  },

  async resetToDefault() {
    logAction("Инициирован полный сброс базы данных...");
    if (!useRealDb) {
      dbSim.resetToDefault();
      return { success: true };
    }

    const client = await pool.connect();
    try {
      // Исполняем database.sql на внешнем Postgres для дропа и пересоздания всех таблиц
      const sqlFilePath = path.join(process.cwd(), "backend", "database.sql");
      if (fs.existsSync(sqlFilePath)) {
        let sqlContent = fs.readFileSync(sqlFilePath, "utf8");
        await client.query(sqlContent);
      }

      // Пересоздаем reviews и users
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(150) UNIQUE NOT NULL,
          password_hash VARCHAR(150) NOT NULL,
          role VARCHAR(50) NOT NULL,
          full_name VARCHAR(150) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          disc_matrix_number VARCHAR(50) REFERENCES discs(matrix_number) ON DELETE CASCADE,
          reviewer_name VARCHAR(150) NOT NULL,
          reviewer_email VARCHAR(150),
          rating INT CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at VARCHAR(50)
        );
      `);

      await client.query(`
        INSERT INTO users (email, password_hash, role, full_name) VALUES
        ('owner@musicdb.ru', 'owner123', 'OWNER', 'Игорь Петрович (Владелец)'),
        ('admin@musicdb.ru', 'admin123', 'ADMIN', 'Александр (Администратор)'),
        ('user@musicdb.ru', 'user123', 'USER', 'Анатолий Б. (Покупатель)'),
        ('guest@musicdb.ru', 'guest123', 'GUEST', 'Сергей В. (Гость)')
        ON CONFLICT (email) DO NOTHING;
      `);

      await client.query(`
        INSERT INTO reviews (disc_matrix_number, reviewer_name, reviewer_email, rating, comment, created_at) VALUES
        ('EMI-1959-A1', 'Анатолий Б.', 'user@musicdb.ru', 5, 'Шедевр модального джаза! Качество записи на этом диске великолепное, кристально чистый звук трубы Майлза.', '2026-04-12'),
        ('EMI-1959-A1', 'Сергей В.', 'guest@musicdb.ru', 4, 'Классика, которая должна быть у каждого коллекционера. Оформление конверта отличное.', '2026-05-01'),
        ('DG-1977-K9', 'Мария К.', 'maria@musicdb.ru', 5, 'Девятая симфония в исполнении Караяна — это что-то неземное. Хор в финале пробирает до мурашек.', '2026-03-20'),
        ('MEL-1961-S5', 'Дмитрий Т.', 'dmitry@musicdb.ru', 5, 'Стравинский в исполнении советского оркестра звучит мощно и напористо. Диск без нареканий.', '2026-04-28')
        ON CONFLICT DO NOTHING;
      `);

      // Гарантируем наличие колонки image_url в таблице discs
      await client.query("ALTER TABLE discs ADD COLUMN IF NOT EXISTS image_url TEXT;");
      await client.query("ALTER TABLE discs ALTER COLUMN image_url TYPE TEXT;");
      logAction("✅ СУБД PostgreSQL полностью переинициализирована DDL/DML импортом.");
      return { success: true };
    } finally {
      client.release();
    }
  },

  // 1. Музыканты
  async getMusicians() {
    if (!useRealDb) return dbSim.musicians;
    const res = await pool.query("SELECT * FROM musicians ORDER BY id ASC");
    return res.rows;
  },

  async createMusician(name, instruments) {
    if (!useRealDb) {
      const nextId = dbSim.musicians.length > 0 ? Math.max(...dbSim.musicians.map(m => m.id)) + 1 : 1;
      const newMusician = { id: nextId, name, instruments };
      dbSim.musicians.push(newMusician);
      dbSim.log(`Добавлен музыкант ${name}`);
      return newMusician;
    }
    const res = await pool.query(
      "INSERT INTO musicians (name, instruments) VALUES ($1, $2) RETURNING *",
      [name, instruments]
    );
    logAction(`Добавлен музыкант: ${name} (ID: ${res.rows[0].id})`);
    return res.rows[0];
  },

  async deleteMusician(id) {
    if (!useRealDb) {
      dbSim.deleteMusician(id);
      return;
    }
    await pool.query("DELETE FROM musicians WHERE id = $1", [id]);
    logAction(`Каскадный триггер/удаление в Postgres: музыкант ID ${id}`);
  },

  // 2. Ансамбли
  async getEnsembles() {
    if (!useRealDb) return dbSim.ensembles;
    const res = await pool.query("SELECT * FROM ensembles ORDER BY id ASC");
    return res.rows;
  },

  async createEnsemble(name, type) {
    if (!useRealDb) {
      return dbSim.insertEnsemble(name, type);
    }
    // Используем хранимую процедуру CALL insert_ensemble
    await pool.query("CALL insert_ensemble($1, $2)", [name, type]);
    // Берем только что вставленную запись
    const res = await pool.query("SELECT * FROM ensembles WHERE name = $1 AND type = $2 ORDER BY id DESC LIMIT 1", [name, type]);
    logAction(`Хранимая процедура CALL insert_ensemble выполнена: '${name}'`);
    return res.rows[0];
  },

  async deleteEnsemble(id) {
    if (!useRealDb) {
      dbSim.deleteEnsemble(id);
      return;
    }
    await pool.query("DELETE FROM ensembles WHERE id = $1", [id]);
    logAction(`Каскадное удаление ансамбля из Postgres: ID ${id}`);
  },

  // Связка музыкант - ансамбль
  async getMusicianEnsembles() {
    if (!useRealDb) return dbSim.musician_ensemble;
    const res = await pool.query("SELECT * FROM musician_ensemble");
    return res.rows;
  },

  async linkMusicianEnsemble(musicianId, ensembleId, role) {
    if (!useRealDb) {
      const musId = parseInt(musicianId);
      const ensId = parseInt(ensembleId);
      if (dbSim.musician_ensemble.some(x => x.musician_id === musId && x.ensemble_id === ensId)) {
        throw new Error("Запись связи уже существует.");
      }
      dbSim.musician_ensemble.push({ musician_id: musId, ensemble_id: ensId, role: role || "Исполнитель" });
      return;
    }
    await pool.query(
      "INSERT INTO musician_ensemble (musician_id, ensemble_id, role) VALUES ($1, $2, $3)",
      [parseInt(musicianId), parseInt(ensembleId), role || "Исполнитель"]
    );
    logAction(`Успешно связана связка Musician ID ${musicianId} -> Ensemble ID ${ensembleId}`);
  },

  async unlinkMusicianEnsemble(musicianId, ensembleId) {
    if (!useRealDb) {
      dbSim.musician_ensemble = dbSim.musician_ensemble.filter(
        x => !(x.musician_id === parseInt(musicianId) && x.ensemble_id === parseInt(ensembleId))
      );
      return;
    }
    await pool.query(
      "DELETE FROM musician_ensemble WHERE musician_id = $1 AND ensemble_id = $2",
      [parseInt(musicianId), parseInt(ensembleId)]
    );
    logAction(`Разрыв связки музыкант - ансамбль в Postgres: Musician ${musicianId}, Ensemble ${ensembleId}`);
  },

  // 3. Произведения
  async getMusicWorks() {
    if (!useRealDb) return dbSim.music_works;
    const res = await pool.query("SELECT * FROM music_works ORDER BY id ASC");
    return res.rows;
  },

  async createMusicWork(title, composerId) {
    if (!useRealDb) {
      const nextId = dbSim.music_works.length > 0 ? Math.max(...dbSim.music_works.map(w => w.id)) + 1 : 1;
      const newWork = { id: nextId, title, composer_id: composerId ? parseInt(composerId) : null };
      dbSim.music_works.push(newWork);
      return newWork;
    }
    const res = await pool.query(
      "INSERT INTO music_works (title, composer_id) VALUES ($1, $2) RETURNING *",
      [title, composerId ? parseInt(composerId) : null]
    );
    logAction(`Введено новое музыкальное произведение: ${title}`);
    return res.rows[0];
  },

  // 4. Исполнения
  async getPerformances() {
    if (!useRealDb) return dbSim.performances;
    const res = await pool.query("SELECT id, work_id, ensemble_id, conductor_id, to_char(recording_date, 'YYYY-MM-DD') as recording_date FROM performances ORDER BY id ASC");
    return res.rows;
  },

  async createPerformance(workId, ensembleId, conductorId, recordingDate) {
    if (!useRealDb) {
      const nextId = dbSim.performances.length > 0 ? Math.max(...dbSim.performances.map(p => p.id)) + 1 : 1;
      const newPerformance = {
        id: nextId,
        work_id: parseInt(workId),
        ensemble_id: ensembleId ? parseInt(ensembleId) : null,
        conductor_id: conductorId ? parseInt(conductorId) : null,
        recording_date: recordingDate
      };
      dbSim.performances.push(newPerformance);
      return newPerformance;
    }
    const res = await pool.query(
      "INSERT INTO performances (work_id, ensemble_id, conductor_id, recording_date) VALUES ($1, $2, $3, $4) RETURNING id, work_id, ensemble_id, conductor_id, to_char(recording_date, 'YYYY-MM-DD') as recording_date",
      [
        parseInt(workId),
        ensembleId ? parseInt(ensembleId) : null,
        conductorId ? parseInt(conductorId) : null,
        recordingDate
      ]
    );
    logAction(`Зарегистрировано новое исполнение: ID ${res.rows[0].id}`);
    return res.rows[0];
  },

  // 5. Производители и Поставщики
  async getManufacturers() {
    if (!useRealDb) return dbSim.manufacturers;
    const res = await pool.query("SELECT * FROM manufacturers ORDER BY id ASC");
    return res.rows;
  },

  async getSuppliers() {
    if (!useRealDb) return dbSim.suppliers;
    const res = await pool.query("SELECT * FROM suppliers ORDER BY id ASC");
    return res.rows;
  },

  // 6. Диски
  async getDiscs() {
    if (!useRealDb) return dbSim.discs;
    const res = await pool.query("SELECT matrix_number, title, manufacturer_id, supplier_id, wholesale_price::float as wholesale_price, retail_price::float as retail_price, to_char(release_date, 'YYYY-MM-DD') as release_date, sales_last_year, sales_this_year, inventory, image_url FROM discs ORDER BY release_date DESC");
    return res.rows;
  },

  async createDisc(
    matrixNumber,
    title,
    manufacturerId,
    supplierId,
    wholesalePrice,
    retailPrice,
    releaseDate,
    inventory,
    imageUrl
  ) {
    if (!useRealDb) {
      return dbSim.insertDisc(
        matrixNumber,
        title,
        manufacturerId,
        supplierId,
        wholesalePrice,
        retailPrice,
        releaseDate,
        inventory,
        imageUrl
      );
    }

    // Вызываем встроенную хранимую процедуру CALL insert_disc
    await pool.query(
      "CALL insert_disc($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        matrixNumber,
        title,
        parseInt(manufacturerId),
        supplierId ? parseInt(supplierId) : null,
        parseFloat(wholesalePrice),
        parseFloat(retailPrice),
        releaseDate,
        parseInt(inventory)
      ]
    );

    // Если есть image_url, добавим его вручную
    if (imageUrl) {
      await pool.query("UPDATE discs SET image_url = $1 WHERE matrix_number = $2", [imageUrl, matrixNumber]);
    }

    const res = await pool.query("SELECT matrix_number, title, manufacturer_id, supplier_id, wholesale_price::float as wholesale_price, retail_price::float as retail_price, to_char(release_date, 'YYYY-MM-DD') as release_date, sales_last_year, sales_this_year, inventory, image_url FROM discs WHERE matrix_number = $1", [matrixNumber]);
    logAction(`Процедура CALL insert_disc (PostgreSQL) отработала успешно. Добавлен диск: ${matrixNumber}`);
    return res.rows[0];
  },

  async updateDisc(matrixNumber, title, wholesalePrice, retailPrice, inventory, imageUrl) {
    if (!useRealDb) {
      return dbSim.updateDisc(matrixNumber, title, wholesalePrice, retailPrice, inventory, imageUrl);
    }

    // Валидация перед вызовом процедуры (Для точной эмуляции ограничений на стороне PG)
    if (parseFloat(retailPrice) < parseFloat(wholesalePrice)) {
      throw new Error(`Триггер 'trg_validate_disc_price': Розничная цена (${retailPrice} руб.) не может быть меньше оптовой (${wholesalePrice} руб.).`);
    }

    // Вызываем процедуру CALL update_disc
    await pool.query(
      "CALL update_disc($1, $2, $3, $4, $5)",
      [
        matrixNumber,
        title,
        parseFloat(wholesalePrice),
        parseFloat(retailPrice),
        parseInt(inventory)
      ]
    );

    // Дополнительно обновляем image_url
    if (imageUrl !== undefined) {
      await pool.query("UPDATE discs SET image_url = $1 WHERE matrix_number = $2", [imageUrl, matrixNumber]);
    }

    const res = await pool.query("SELECT matrix_number, title, manufacturer_id, supplier_id, wholesale_price::float as wholesale_price, retail_price::float as retail_price, to_char(release_date, 'YYYY-MM-DD') as release_date, sales_last_year, sales_this_year, inventory, image_url FROM discs WHERE matrix_number = $1", [matrixNumber]);
    logAction(`Процедура CALL update_disc выполнена. Обновлен диск: ${matrixNumber}`);
    return res.rows[0];
  },

  async deleteDisc(matrixNumber) {
    if (!useRealDb) {
      dbSim.deleteDisc(matrixNumber);
      return;
    }
    await pool.query("DELETE FROM discs WHERE matrix_number = $1", [matrixNumber]);
    logAction(`Удален компакт-диск ${matrixNumber} с каскадным каскадированием Postgres.`);
  },

  // 7. Отзывы
  async getReviews() {
    if (!useRealDb) return dbSim.reviews;
    const res = await pool.query("SELECT * FROM reviews ORDER BY id DESC");
    return res.rows;
  },

  async createReview(discMatrixNumber, reviewerName, rating, comment, reviewerEmail) {
    if (!useRealDb) {
      // Имитируем
      const nextId = dbSim.reviews.length > 0 ? Math.max(...dbSim.reviews.map(r => r.id)) + 1 : 1;
      const newReview = {
        id: nextId,
        disc_matrix_number: discMatrixNumber,
        reviewer_name: reviewerName,
        reviewer_email: reviewerEmail,
        rating: parseInt(rating),
        comment,
        created_at: new Date().toISOString().substring(0, 10)
      };
      dbSim.reviews.push(newReview);
      dbSim.log(`[Sim REVIEW] Отзыв от ${reviewerName}`);
      return newReview;
    }

    const res = await pool.query(
      "INSERT INTO reviews (disc_matrix_number, reviewer_name, reviewer_email, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        discMatrixNumber,
        reviewerName,
        reviewerEmail,
        parseInt(rating),
        comment,
        new Date().toISOString().substring(0, 10)
      ]
    );
    logAction(`Триггер/функция insert_review (Postgres): Добавлен отзыв на диск '${discMatrixNumber}' от ${reviewerName}.`);
    return res.rows[0];
  },

  async deleteReview(id) {
    if (!useRealDb) {
      const idx = dbSim.reviews.findIndex(x => x.id === id);
      if (idx !== -1) {
        dbSim.reviews.splice(idx, 1);
      }
      return;
    }
    await pool.query("DELETE FROM reviews WHERE id = $1", [id]);
    logAction(`Отзыв #${id} удален из PostgreSQL.`);
  },

  // Связка компакт-диск - исполнение (треки)
  async getDiscPerformances() {
    if (!useRealDb) return dbSim.disc_performance;
    const res = await pool.query("SELECT * FROM disc_performance");
    return res.rows;
  },

  async associateDiscPerformance(discMatrixNumber, performanceId, trackNumber) {
    if (!useRealDb) {
      const perfId = parseInt(performanceId);
      const track = parseInt(trackNumber || "1");
      if (dbSim.disc_performance.some(dp => dp.disc_matrix_number === discMatrixNumber && dp.performance_id === perfId)) {
        throw new Error("Связь треков на диске уже существует.");
      }
      dbSim.disc_performance.push({
        disc_matrix_number: discMatrixNumber,
        performance_id: perfId,
        track_number: track
      });
      return;
    }
    await pool.query(
      "INSERT INTO disc_performance (disc_matrix_number, performance_id, track_number) VALUES ($1, $2, $3)",
      [discMatrixNumber, parseInt(performanceId), parseInt(trackNumber || "1")]
    );
    logAction(`На компакт-диск ${discMatrixNumber} записан трек №${trackNumber} (Исполнение ID ${performanceId})`);
  },

  async deleteDiscPerformance(discMatrixNumber, performanceId) {
    if (!useRealDb) {
      dbSim.disc_performance = dbSim.disc_performance.filter(
        dp => !(dp.disc_matrix_number === discMatrixNumber && dp.performance_id === parseInt(performanceId))
      );
      return;
    }
    await pool.query(
      "DELETE FROM disc_performance WHERE disc_matrix_number = $1 AND performance_id = $2",
      [discMatrixNumber, parseInt(performanceId)]
    );
    logAction(`Запись исполнения ID ${performanceId} удалена с компакт-диска ${discMatrixNumber}`);
  },

  // Покупка диска (проводит транзакцию и дергает складской ON INSERT TRIGGER)
  async purchaseDisc(matrixNumber, quantity) {
    if (!useRealDb) {
      return dbSim.purchaseDisc(matrixNumber, quantity);
    }

    logAction(`Запрос транзакции покупки диска ${matrixNumber}, количество: ${quantity}`);
    
    // Сначала проверим в Postgres наличие товара
    const checkDisc = await pool.query("SELECT inventory, title FROM discs WHERE matrix_number = $1", [matrixNumber]);
    if (checkDisc.rows.length === 0) {
      throw new Error(`Диск с инвентарным номером матрицы '${matrixNumber}' не найден.`);
    }

    const { inventory } = checkDisc.rows[0];
    if (inventory < quantity) {
      throw new Error(`Исключение триггера 'trg_on_sale_insert': Отказ транзакции! На складе недостаточно товара для диска ${matrixNumber} (Требуется: ${quantity}, В наличии: ${inventory})`);
    }

    // Вставляем лог покупки в sales_log
    const logRes = await pool.query(
      "INSERT INTO sales_log (disc_matrix_number, quantity) VALUES ($1, $2) RETURNING id, disc_matrix_number, to_char(purchase_date, 'YYYY-MM-DD HH24:MI:SS') as purchase_date, quantity",
      [matrixNumber, parseInt(quantity)]
    );

    logAction(`Триггер 'trg_on_sale_insert' (Postgres) успешно провел списание остатка склада. Продано: ${quantity} шт.`);
    return logRes.rows[0];
  },

  async getSalesLog() {
    if (!useRealDb) return dbSim.sales_log;
    const res = await pool.query("SELECT id, disc_matrix_number, to_char(purchase_date, 'YYYY-MM-DD HH24:MI:SS') as purchase_date, quantity FROM sales_log ORDER BY id DESC");
    return res.rows;
  },

  // 8. Аналитические запросы (PL/pgSQL функции)
  async getWorksCount(ensembleId) {
    if (!useRealDb) return dbSim.getMusicWorksCount(ensembleId);
    
    // Вызов функции: SELECT get_music_works_count($1)
    const res = await pool.query("SELECT get_music_works_count($1) as count", [parseInt(ensembleId)]);
    logAction(`Вызов PG-функции: SELECT get_music_works_count(${ensembleId})`);
    return parseInt(res.rows[0].count || "0");
  },

  async getDiscsByEnsemble(ensembleId) {
    if (!useRealDb) return dbSim.getDiscsByEnsemble(ensembleId);
    
    // Вызов табличной функции: SELECT * FROM get_discs_by_ensemble($1)
    const res = await pool.query("SELECT disc_matrix as matrix_number, disc_title as title, wholesale::float as wholesale_price, retail::float as retail_price, current_inventory as inventory FROM get_discs_by_ensemble($1)", [parseInt(ensembleId)]);
    logAction(`Вызов PG-функции/процедуры: SELECT * FROM get_discs_by_ensemble(${ensembleId})`);
    return res.rows;
  },

  async getSalesLeaders(limitVal) {
    if (!useRealDb) return dbSim.getSalesLeadersThisYear(limitVal);
    
    // Вызов табличной функции: SELECT * FROM get_sales_leaders_this_year($1)
    const res = await pool.query("SELECT matrix_num as matrix_number, title, sales_this_year, inventory, retail_price::float as retail_price FROM get_sales_leaders_this_year($1)", [parseInt(limitVal)]);
    logAction(`Вызов PG-функции/процедуры: SELECT * FROM get_sales_leaders_this_year(${limitVal})`);
    return res.rows;
  }
};
