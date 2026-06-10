import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db, getLogs, clearLogs } from "./db.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Парсинг JSON запросов
  app.use(express.json());

  // Логирование API запросов
  app.use((req, res, next) => {
    console.log(`[API Request] ${req.method} ${req.path}`);
    next();
  });

  // =============================================================================
  // АУТЕНТИФИКАЦИЯ И РОЛИ (С ПРОВЕРКОЙ ПРАВ)
  // =============================================================================

  // Эндпоинт входа в систему по логину и паролю
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "E-mail и пароль обязательны." });
    }

    try {
      const user = await db.findUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: "Пользователь с таким E-mail не зарегистрирован в СУБД. Пожалуйста, пройдите быструю регистрацию в системе." });
      }

      if (user.password_hash !== password) {
        return res.status(400).json({ error: "Неверный пароль. Попробуйте снова или воспользуйтесь подсказками ролей." });
      }

      res.json({
        sessionToken: "session-" + Math.random().toString(36).substring(7),
        email: user.email,
        role: user.role,
        fullName: user.full_name
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Эндпоинт регистрации нового пользователя в СУБД
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, role, fullName } = req.body;
    if (!email || !password || !role || !fullName) {
      return res.status(400).json({ error: "Все поля (E-mail, пароль, роль, ФИО) обязательны для регистрации." });
    }
    const safeRole = role.toUpperCase();
    if (!["OWNER", "ADMIN", "USER", "GUEST"].includes(safeRole)) {
      return res.status(400).json({ error: "Выбрана некорректная роль для создания учетной записи." });
    }

    try {
      const newUser = await db.registerUser(email, password, safeRole, fullName);
      res.status(201).json({
        success: true,
        user: {
          email: newUser.email,
          role: newUser.role,
          fullName: newUser.full_name
        }
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Мидлвар для авторизации по ролям (задается в заголовках)
  const requireRole = (allowedRoles) => {
    return (req, res, next) => {
      const userRole = (req.headers["x-user-role"] || "GUEST").toUpperCase();
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: `Доступ запрещен. Требуется роль: [${allowedRoles.join(", ")}]. Ваша текущая роль в сессии: [${userRole}].`
        });
      }
      next();
    };
  };

  // =============================================================================
  // SQL КОНСОЛЬ И УПРАВЛЕНИЕ БД
  // =============================================================================

  // Получить статус подключения к СУБД (Реальная БД vs Симулятор)
  app.get("/api/db/status", (req, res) => {
    res.json({
      useRealDb: db.isExternal(),
      configString: db.dbConfigString()
    });
  });

  // Запуск сырого SQL-запроса через консоль
  app.post("/api/db/query", async (req, res) => {
    const { sql, userRole } = req.body;
    if (!sql) {
      return res.status(400).json({ error: "Запрос SQL пустой." });
    }

    // Проверка прав для SQL-консоли (Доступна OWNER и ADMIN)
    const role = (userRole || "GUEST").toUpperCase();
    if (!["OWNER", "ADMIN"].includes(role)) {
      return res.status(403).json({
        error: `Отказ безопасности СУБД: Запуск произвольных SQL-запросов ограничен ролями Owner или Admin. Ваша роль: [${role}].`
      });
    }

    try {
      const result = await db.executeSql(sql);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || "Ошибка выполнения SQL." });
    }
  });

  // Сброс БД к базовому состоянию
  app.post("/api/db/reset", requireRole(["OWNER", "ADMIN"]), async (req, res) => {
    try {
      await db.resetToDefault();
      res.json({ success: true, message: "База данных успешно сброшена на начальные значения СУБД." });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Отдача исходного DDL/DML SQL файла структуры для консоли
  app.get("/database.sql", (req, res) => {
    res.sendFile(path.join(process.cwd(), "backend", "database.sql"));
  });

  // Получить лог транзакций/триггеров СУБД
  app.get("/api/db/logs", (req, res) => {
    res.json({ logs: getLogs() });
  });

  // Очистить логи транзакций
  app.post("/api/db/logs/clear", (req, res) => {
    clearLogs();
    res.json({ success: true });
  });

  // =============================================================================
  // REST API СУЩНОСТЕЙ
  // =============================================================================

  // 1. МУЗЫКАНТЫ (Musicians)
  app.get("/api/musicians", async (req, res) => {
    try {
      const list = await db.getMusicians();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/musicians", requireRole(["OWNER", "ADMIN"]), async (req, res) => {
    const { name, instruments } = req.body;
    if (!name || !instruments) {
      return res.status(400).json({ error: "Поля 'ФИО' и 'Инструменты' обязательны." });
    }

    try {
      const newMusician = await db.createMusician(name, instruments);
      res.status(201).json(newMusician);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/musicians/:id", requireRole(["OWNER", "ADMIN"]), async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      await db.deleteMusician(id);
      res.json({ success: true, message: `Музыкант ${id} удален каскадно.` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. АНСАМБЛИ (Ensembles)
  app.get("/api/ensembles", async (req, res) => {
    try {
      const list = await db.getEnsembles();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Создает новый ансамбль (Через процедуру CALL insert_ensemble)
  app.post("/api/ensembles", requireRole(["OWNER", "ADMIN"]), async (req, res) => {
    const { name, type } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "Название и тип ансамбля обязательны для ввода." });
    }
    try {
      const newEnsemble = await db.createEnsemble(name, type);
      res.status(201).json(newEnsemble);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/ensembles/:id", requireRole(["OWNER", "ADMIN"]), async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      await db.deleteEnsemble(id);
      res.json({ success: true, message: `Ансамбль ${id} удален каскадно.` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Связь музыкант-ансамбль (многие-ко-многим)
  app.get("/api/musician-ensemble", async (req, res) => {
    try {
      const list = await db.getMusicianEnsembles();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/musician-ensemble", requireRole(["OWNER", "ADMIN"]), async (req, res) => {
    const { musician_id, ensemble_id, role } = req.body;
    try {
      await db.linkMusicianEnsemble(musician_id, ensemble_id, role);
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/musician-ensemble/:musicianId/:ensembleId", requireRole(["OWNER", "ADMIN"]), async (req, res) => {
    const musId = parseInt(req.params.musicianId);
    const ensId = parseInt(req.params.ensembleId);
    try {
      await db.unlinkMusicianEnsemble(musId, ensId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. МУЗЫКАЛЬНЫЕ ПРОИЗВЕДЕНИЯ (Works)
  app.get("/api/music-works", async (req, res) => {
    try {
      const list = await db.getMusicWorks();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/music-works", requireRole(["OWNER", "ADMIN"]), async (req, res) => {
    const { title, composer_id } = req.body;
    if (!title) return res.status(400).json({ error: "Название произведения обязательно." });
    try {
      const newWork = await db.createMusicWork(title, composer_id);
      res.status(201).json(newWork);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // 4. ИСПОЛНЕНИЯ (Performances)
  app.get("/api/performances", async (req, res) => {
    try {
      const list = await db.getPerformances();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/performances", requireRole(["OWNER", "ADMIN"]), async (req, res) => {
    const { work_id, ensemble_id, conductor_id, recording_date } = req.body;
    if (!work_id || !recording_date) {
      return res.status(400).json({ error: "Произведение и дата записи обязательны." });
    }
    try {
      const newPerformance = await db.createPerformance(work_id, ensemble_id, conductor_id, recording_date);
      res.status(201).json(newPerformance);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // 5. КОМПАНИИ-ПРОИЗВОДИТЕЛИ (Manufacturers)
  app.get("/api/manufacturers", async (req, res) => {
    try {
      const list = await db.getManufacturers();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. ОПТОВЫЕ ПОСТАВЩИКИ (Suppliers)
  app.get("/api/suppliers", async (req, res) => {
    try {
      const list = await db.getSuppliers();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. ДИСКИ / ПЛАСТИНКИ (Discs)
  app.get("/api/discs", async (req, res) => {
    try {
      const list = await db.getDiscs();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Ввод нового диска (Через процедуру CALL insert_disc)
  app.post("/api/discs", requireRole(["OWNER", "ADMIN"]), async (req, res) => {
    const {
      matrix_number,
      title,
      manufacturer_id,
      supplier_id,
      wholesale_price,
      retail_price,
      release_date,
      inventory,
      image_url
    } = req.body;

    try {
      const newDisc = await db.createDisc(
        matrix_number,
        title,
        parseInt(manufacturer_id),
        supplier_id ? parseInt(supplier_id) : null,
        parseFloat(wholesale_price),
        parseFloat(retail_price),
        release_date,
        parseInt(inventory),
        image_url || ""
      );
      res.status(201).json(newDisc);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Изменение параметров диска (Через процедуру CALL update_disc + триггер валидации цен)
  app.put("/api/discs/:matrix", requireRole(["OWNER", "ADMIN"]), async (req, res) => {
    const matrix = req.params.matrix;
    const { title, wholesale_price, retail_price, inventory, image_url } = req.body;
    try {
      const updatedDisc = await db.updateDisc(
        matrix,
        title,
        parseFloat(wholesale_price),
        parseFloat(retail_price),
        parseInt(inventory),
        image_url
      );
      res.json(updatedDisc);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/discs/:matrix", requireRole(["OWNER", "ADMIN"]), async (req, res) => {
    const matrix = req.params.matrix;
    try {
      await db.deleteDisc(matrix);
      res.json({ success: true, message: `Компакт-диск с матрицей ${matrix} удален из базы.` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. СИСТЕМА ОТЗЫВОВ И ОЦЕНОК (Disc Reviews System)
  app.get("/api/reviews", async (req, res) => {
    try {
      const list = await db.getReviews();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    const { disc_matrix_number, reviewer_name, rating, comment, reviewer_email } = req.body;
    if (!disc_matrix_number || !reviewer_name || !rating || !comment) {
      return res.status(400).json({ error: "Поля диска, имя автора, оценка и текст отзыва обязательны." });
    }
    const score = parseInt(rating);
    if (isNaN(score) || score < 1 || score > 5) {
      return res.status(400).json({ error: "Оценка должна быть числом от 1 до 5 звезд." });
    }

    const email = (reviewer_email || req.headers["x-user-email"] || "guest@musicdb.ru").toLowerCase();

    try {
      const newReview = await db.createReview(disc_matrix_number, reviewer_name, rating, comment, email);
      res.status(201).json(newReview);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/reviews/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Неверный ID отзыва." });
    }

    try {
      const reviewsList = await db.getReviews();
      const review = reviewsList.find(r => r.id === id);
      if (!review) {
        return res.status(404).json({ error: "Отзыв не найден в системе." });
      }

      const userRole = (req.headers["x-user-role"] || "GUEST").toUpperCase();
      const userEmail = (req.headers["x-user-email"] || "").toLowerCase();

      // Удалять отзыв могут: Владелец, Админ, либо сам автор по E-mail адресу
      const canDelete = 
        ["OWNER", "ADMIN"].includes(userRole) || 
        (userEmail && review.reviewer_email.toLowerCase() === userEmail);

      if (!canDelete) {
        return res.status(403).json({ error: "Вы можете удалять только свои собственные отзывы." });
      }

      await db.deleteReview(id);
      res.json({ success: true, message: "Отзыв успешно удален." });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Связи дисков с исполнениями (Записи на пластинках)
  app.get("/api/disc-performance", async (req, res) => {
    try {
      const list = await db.getDiscPerformances();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/disc-performance", requireRole(["OWNER", "ADMIN"]), async (req, res) => {
    const { disc_matrix_number, performance_id, track_number } = req.body;
    try {
      await db.associateDiscPerformance(disc_matrix_number, performance_id, track_number);
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/disc-performance/:matrix/:performanceId", requireRole(["OWNER", "ADMIN"]), async (req, res) => {
    const matrix = req.params.matrix;
    const perfId = parseInt(req.params.performanceId);
    try {
      await db.deleteDiscPerformance(matrix, perfId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // =============================================================================
  // ДВИЖОК СКЛАДСКОГО И КАССОВОГО УЧЕТА (ПОКУПКА С ТРИГГЕРОМ)
  // =============================================================================

  // Продажа диска (Логируется в sales_log, триггер SQL списывает inventory и наращивает sales_this_year)
  app.post("/api/discs/purchase", requireRole(["OWNER", "ADMIN", "USER"]), async (req, res) => {
    const { matrix_number, quantity } = req.body;
    const qty = parseInt(quantity || "1");
    if (!matrix_number) {
      return res.status(400).json({ error: "Не указан код матрицы диска." });
    }

    try {
      const purchaseRecord = await db.purchaseDisc(matrix_number, qty);
      const discsList = await db.getDiscs();
      const updatedDisc = discsList.find(d => d.matrix_number === matrix_number);
      res.json({
        success: true,
        message: `Покупка проведена успешно! Сработало триггерное списание со склада в СУБД.`,
        record: purchaseRecord,
        updatedDisc
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Лог продаж для Владельца
  app.get("/api/sales-log", requireRole(["OWNER"]), async (req, res) => {
    try {
      const list = await db.getSalesLog();
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // =============================================================================
  // СПЕЦИАЛИЗИРОВАННЫЕ АНАЛИТИЧЕСКИЕ ЗАПРОСЫ КУРСОВОЙ РАБОТЫ (PL/pgSQL функции)
  // =============================================================================

  // 1) Подсчет количества уникальных произведений конкретного ансамбля
  app.get("/api/analytics/works-count/:ensembleId", async (req, res) => {
    const ensembleId = parseInt(req.params.ensembleId);
    if (isNaN(ensembleId)) {
      return res.status(400).json({ error: "Неверный ID ансамбля" });
    }
    try {
      const count = await db.getWorksCount(ensembleId);
      res.json({ ensembleId, count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2) Вывод всех компакт-дисков заданного ансамбля
  app.get("/api/analytics/discs-by-ensemble/:ensembleId", async (req, res) => {
    const ensembleId = parseInt(req.params.ensembleId);
    if (isNaN(ensembleId)) {
      return res.status(400).json({ error: "Неверный ID ансамбля" });
    }
    try {
      const discs = await db.getDiscsByEnsemble(ensembleId);
      res.json(discs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3) Лидеры продаж года (топ-3 дисков)
  app.get("/api/analytics/sales-leaders", async (req, res) => {
    const limit = parseInt(req.query.limit || "3");
    try {
      const leaders = await db.getSalesLeaders(limit);
      res.json(leaders);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // =============================================================================
  // ИНТЕГРАЦИЯ С ФРОНТЕНДОМ (VITE)
  // =============================================================================

  if (process.env.NODE_ENV !== "production") {
    // В дев-режиме используем встроенный Vite сервер
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // В продакшн-режиме отдаем собранную статику
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express Backend] Сервер музыкального магазина запущен на порту ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Критический сбой запуска сервера:", err);
});
