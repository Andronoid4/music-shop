// =============================================================================
// СИМУЛЯТОР РЕЛЯЦИОННОЙ СУБД (PostgreSQL / SQL) ДЛЯ КУРСОВОГО ПРОЕКТА
// =============================================================================

// Определение структуры всей БД
class Database {
  musicians = [];
  ensembles = [];
  musician_ensemble = [];
  music_works = [];
  performances = [];
  manufacturers = [];
  suppliers = [];
  discs = [];
  disc_performance = [];
  sales_log = [];
  reviews = [];
  users = [];

  // Лог вызовов триггеров и процедур для вывода в консоль
  executionLogs = [];

  constructor() {
    this.resetToDefault();
  }

  log(msg) {
    const timestamp = new Date().toISOString().substring(11, 19);
    this.executionLogs.push(`[${timestamp}] ${msg}`);
    console.log(`[SQL Sim] ${msg}`);
  }

  getLogs() {
    return this.executionLogs;
  }

  clearLogs() {
    this.executionLogs = [];
  }

  // Очистка и заполнение дефолтными данными (DML)
  resetToDefault() {
    this.log("Сброс базы данных к начальному состоянию (Выполняется DML скрипт)...");

    this.musicians = [
      { id: 1, name: "Иоганн Себастьян Бах", instruments: "Орган, Клавесин (Композитор)" },
      { id: 2, name: "Людвиг ван Бетховен", instruments: "Фортепиано (Композитор)" },
      { id: 3, name: "Дюк Эллингтон", instruments: "Фортепиано, Руководитель (Джаз)" },
      { id: 4, name: "Герберт фон Караян", instruments: "Дирижер" },
      { id: 5, name: "Давид Ойстрах", instruments: "Скрипка (Исполнитель)" },
      { id: 6, name: "Жаклин дю Пре", instruments: "Виолончель (Исполнитель)" },
      { id: 7, name: "Майлз Дэвис", instruments: "Труба (Композитор, Исполнитель)" },
      { id: 10, name: "Игорь Стравинский", instruments: "Дирижер, Композитор" }
    ];

    this.ensembles = [
      { id: 1, name: "Берлинский филармонический оркестр", type: "Оркестр" },
      { id: 2, name: "The Duke Ellington Orchestra", type: "Джаз-оркестр" },
      { id: 3, name: "Miles Davis Quintet", type: "Квинтет" },
      { id: 4, name: "Бородинский струнный квартет", type: "Квартет" }
    ];

    this.musician_ensemble = [
      { musician_id: 3, ensemble_id: 2, role: "Художественный руководитель и пианист" },
      { musician_id: 4, ensemble_id: 1, role: "Главный дирижер" },
      { musician_id: 7, ensemble_id: 3, role: "Лидер, трубач" },
      { musician_id: 5, ensemble_id: 4, role: "Приглашенный солист" }
    ];

    this.music_works = [
      { id: 1, title: "Симфония №9", composer_id: 2 },
      { id: 2, title: "Бранденбургский концерт №3", composer_id: 1 },
      { id: 3, title: "Take the A Train", composer_id: 3 },
      { id: 4, title: "So What", composer_id: 7 },
      { id: 5, title: "Весна священная", composer_id: 10 }
    ];

    this.performances = [
      { id: 1, work_id: 1, ensemble_id: 1, conductor_id: 4, recording_date: "1977-03-15" },
      { id: 2, work_id: 2, ensemble_id: 4, conductor_id: null, recording_date: "1968-10-22" },
      { id: 3, work_id: 3, ensemble_id: 2, conductor_id: 3, recording_date: "1953-06-02" },
      { id: 4, work_id: 4, ensemble_id: 3, conductor_id: 7, recording_date: "1959-03-02" },
      { id: 5, work_id: 5, ensemble_id: 1, conductor_id: 10, recording_date: "1961-11-10" }
    ];

    this.manufacturers = [
      { id: 1, name: "EMI Records Ltd.", address: "Лондон, Эбби Роуд 3", is_supplier: true },
      { id: 2, name: "Columbia Records", address: "Нью-Йорк, Мэдисон Авеню 550", is_supplier: false },
      { id: 3, name: "Deutsche Grammophon", address: "Гамбург, Потсдамер Штрассе 12", is_supplier: true },
      { id: 4, name: "Мелодия", address: "Москва, ул. Тверская 18", is_supplier: true }
    ];

    this.suppliers = [
      { id: 1, name: "Союз-Мьюзик Дистрибьюшн", address: "Москва, Ленинский проспект 45" },
      { id: 2, name: "Classic CD Wholesales", address: "Мюнхен, Карлсплац 8" },
      { id: 3, name: "EMI Records Ltd.", address: "Лондон, Эбби Роуд 3" }
    ];

    this.discs = [
      {
        matrix_number: "EMI-1959-A1",
        title: "Miles Davis - Kind of Blue",
        manufacturer_id: 2,
        supplier_id: 1,
        wholesale_price: 1200.00,
        retail_price: 1800.00,
        release_date: "1959-08-17",
        sales_last_year: 150,
        sales_this_year: 485,
        inventory: 30,
        image_url: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400"
      },
      {
        matrix_number: "DG-1977-K9",
        title: "Beethoven: Symphony No. 9 (Karajan)",
        manufacturer_id: 3,
        supplier_id: 2,
        wholesale_price: 1500.00,
        retail_price: 2200.00,
        release_date: "1977-08-01",
        sales_last_year: 80,
        sales_this_year: 240,
        inventory: 15,
        image_url: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&q=80&w=400"
      },
      {
        matrix_number: "MEL-1961-S5",
        title: "Stravinsky - The Rite of Spring",
        manufacturer_id: 4,
        supplier_id: 1,
        wholesale_price: 600.00,
        retail_price: 950.00,
        release_date: "1962-02-15",
        sales_last_year: 310,
        sales_this_year: 520,
        inventory: 100,
        image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400"
      },
      {
        matrix_number: "EMI-1953-E1",
        title: "Duke Ellington - Take the A Train Classic",
        manufacturer_id: 1,
        supplier_id: 3,
        wholesale_price: 900.00,
        retail_price: 1350.00,
        release_date: "1954-01-10",
        sales_last_year: 45,
        sales_this_year: 120,
        inventory: 5,
        image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400"
      }
    ];

    this.disc_performance = [
      { disc_matrix_number: "EMI-1959-A1", performance_id: 4, track_number: 1 },
      { disc_matrix_number: "DG-1977-K9", performance_id: 1, track_number: 1 },
      { disc_matrix_number: "MEL-1961-S5", performance_id: 5, track_number: 1 },
      { disc_matrix_number: "EMI-1953-E1", performance_id: 3, track_number: 1 }
    ];

    this.sales_log = [];

    this.reviews = [
      { id: 1, disc_matrix_number: "EMI-1959-A1", reviewer_name: "Анатолий Б.", reviewer_email: "user@musicdb.ru", rating: 5, comment: "Шедевр модального джаза! Качество записи на этом диске великолепное, кристально чистый звук трубы Майлза.", created_at: "2026-04-12" },
      { id: 2, disc_matrix_number: "EMI-1959-A1", reviewer_name: "Сергей В.", reviewer_email: "guest@musicdb.ru", rating: 4, comment: "Классика, которая должна быть у каждого коллекционера. Оформление конверта отличное.", created_at: "2026-05-01" },
      { id: 3, disc_matrix_number: "DG-1977-K9", reviewer_name: "Мария К.", reviewer_email: "maria@musicdb.ru", rating: 5, comment: "Девятая симфония в исполнении Караяна — это что-то неземное. Хор в финале пробирает до мурашек.", created_at: "2026-03-20" },
      { id: 4, disc_matrix_number: "MEL-1961-S5", reviewer_name: "Дмитрий Т.", reviewer_email: "dmitry@musicdb.ru", rating: 5, comment: "Стравинский в исполнении советского оркестра звучит мощно и напористо. Диск без нареканий.", created_at: "2026-04-28" }
    ];

    this.users = [
      { id: 1, email: "owner@musicdb.ru", passwordHash: "owner123", role: "OWNER", fullName: "Игорь Петрович (Владелец)" },
      { id: 2, email: "admin@musicdb.ru", passwordHash: "admin123", role: "ADMIN", fullName: "Александр (Администратор)" },
      { id: 3, email: "user@musicdb.ru", passwordHash: "user123", role: "USER", fullName: "Анатолий Б. (Покупатель)" },
      { id: 4, email: "guest@musicdb.ru", passwordHash: "guest123", role: "GUEST", fullName: "Сергей В. (Гость)" }
    ];

    this.clearLogs();
    this.log("База данных успешно инициализирована демонстрационными данными.");
  }

  // =============================================================================
  // БИЗНЕС-ЛОГИКА: ФУНКЦИИ И ПРОЦЕДУРЫ (PL/pgSQL в JS)
  // =============================================================================

  // 1) get_music_works_count(ensemble_id)
  getMusicWorksCount(ensembleId) {
    this.log(`Вызов функции PL/pgSQL: get_music_works_count(${ensembleId})`);
    const works = this.performances
      .filter((p) => p.ensemble_id === ensembleId)
      .map((p) => p.work_id);
    const uniqueWorks = Array.from(new Set(works));
    this.log(`Результат get_music_works_count: ${uniqueWorks.length} произведений.`);
    return uniqueWorks.length;
  }

  // 2) get_discs_by_ensemble(ensemble_id)
  getDiscsByEnsemble(ensembleId) {
    this.log(`Вызов функции PL/pgSQL: get_discs_by_ensemble(${ensembleId})`);
    
    // Находим все ID исполнений заданного ансамбля
    const performanceIds = this.performances
      .filter((p) => p.ensemble_id === ensembleId)
      .map((p) => p.id);

    // Находим номера матриц дисков, содержащих эти исполнения
    const matrixNumbers = this.disc_performance
      .filter((dp) => performanceIds.includes(dp.performance_id))
      .map((dp) => dp.disc_matrix_number);
    
    const uniqueMatrixNumbers = Array.from(new Set(matrixNumbers));

    // Возвращаем данные о дисках
    const resultDiscs = this.discs.filter((d) => uniqueMatrixNumbers.includes(d.matrix_number));
    this.log(`Результат get_discs_by_ensemble: Найдено ${resultDiscs.length} дисков.`);
    return resultDiscs;
  }

  // 3) get_sales_leaders_this_year(limit_val)
  getSalesLeadersThisYear(limitVal) {
    this.log(`Вызов функции PL/pgSQL: get_sales_leaders_this_year(${limitVal})`);
    const sorted = [...this.discs].sort((a, b) => b.sales_this_year - a.sales_this_year);
    const result = sorted.slice(0, limitVal);
    this.log(`Результат get_sales_leaders_this_year: Выведен топ-${result.length} лидеров продаж.`);
    return result;
  }

  // 4) Процедура: insert_ensemble
  insertEnsemble(name, type) {
    this.log(`Вызов процедуры PL/pgSQL: CALL insert_ensemble('${name}', '${type}')`);
    if (!name || !type) {
      throw new Error("Ошибка процедуры: Название и тип ансамбля обязательны для ввода.");
    }
    const nextId = this.ensembles.length > 0 ? Math.max(...this.ensembles.map(e => e.id)) + 1 : 1;
    const newEnsemble = { id: nextId, name, type };
    this.ensembles.push(newEnsemble);
    this.log(`Процедура завершена: Ансамбль [ID: ${nextId}] '${name}' успешно добавлен.`);
    return newEnsemble;
  }

  // 5) Процедура: insert_disc
  insertDisc(
    matrixNumber,
    title,
    manufacturerId,
    supplierId,
    wholesalePrice,
    retailPrice,
    releaseDate,
    inventory,
    imageUrl = ""
  ) {
    this.log(`Вызов процедуры PL/pgSQL: CALL insert_disc('${matrixNumber}', '${title}', ...)`);

    // Валидация
    if (!matrixNumber || !title) {
      throw new Error("Ошибка процедуры: Номер матрицы и название диска обязательны.");
    }

    // Проверка уникального ключа
    if (this.discs.some((d) => d.matrix_number.toLowerCase() === matrixNumber.toLowerCase())) {
      throw new Error(`Ошибка целостности (PRIMARY KEY UNIQUE): Диск с номером матрицы '${matrixNumber}' уже существует.`);
    }

    // Проверка ограничений (CHECK)
    if (retailPrice < wholesalePrice) {
      throw new Error(`Ошибка ограничения СНЕСК: Розничная цена (${retailPrice} руб.) не может быть меньше оптовой (${wholesalePrice} руб.).`);
    }

    if (wholesalePrice < 0 || retailPrice < 0 || inventory < 0) {
      throw new Error("Ошибка ограничения СНЕСК: Цены и остатки на складе не могут быть отрицательными.");
    }

    // Если оптовый посредник не указан, а производитель сам является оптовиком, связываем автоматически
    let finalSupplierId = supplierId;
    if (!finalSupplierId) {
      const manufacturer = this.manufacturers.find((m) => m.id === manufacturerId);
      if (manufacturer && manufacturer.is_supplier) {
        // Ищем оптовика с таким же именем
        const matchedSupplier = this.suppliers.find((s) => s.name.toLowerCase() === manufacturer.name.toLowerCase());
        if (matchedSupplier) {
          finalSupplierId = matchedSupplier.id;
          this.log(`Связывание поставщика: Производитель '${manufacturer.name}' сам является оптовиком, авто-связывание с Supplier ID: ${finalSupplierId}`);
        }
      }
    }

    const newDisc = {
      matrix_number: matrixNumber,
      title,
      manufacturer_id: manufacturerId,
      supplier_id: finalSupplierId,
      wholesale_price: wholesalePrice,
      retail_price: retailPrice,
      release_date: releaseDate || new Date().toISOString().substring(0, 10),
      sales_last_year: 0,
      sales_this_year: 0,
      inventory,
      image_url: imageUrl
    };

    this.discs.push(newDisc);
    this.log(`Процедура заверена: Новый диск '${title}' [${matrixNumber}] добавлен.`);
    return newDisc;
  }

  // 6) Процедура: update_disc
  updateDisc(
    matrixNumber,
    title,
    wholesalePrice,
    retailPrice,
    inventory,
    imageUrl
  ) {
    this.log(`Вызов процедуры PL/pgSQL: CALL update_disc('${matrixNumber}', '${title}', ...)`);

    const disc = this.discs.find((d) => d.matrix_number === matrixNumber);
    if (!disc) {
      throw new Error(`Ошибка процедуры: Диск с номером матрицы '${matrixNumber}' не найден.`);
    }

    // Триггерные проверки цен
    if (retailPrice < wholesalePrice) {
      throw new Error(`Триггер 'trg_validate_disc_price': Розничная цена (${retailPrice} руб.) не может быть меньше оптовой (${wholesalePrice} руб.).`);
    }

    if (wholesalePrice < 0 || retailPrice < 0 || inventory < 0) {
      throw new Error("Ошибка валидации триггера: Цены и остатки не могут быть отрицательными.");
    }

    disc.title = title;
    disc.wholesale_price = wholesalePrice;
    disc.retail_price = retailPrice;
    disc.inventory = inventory;
    if (imageUrl !== undefined) {
      disc.image_url = imageUrl;
    }

    this.log(`Триггер 'trg_validate_disc_price' выполнен успешно для диска ${matrixNumber}. Изменения сохранены.`);
    return disc;
  }

  // 7) Создание покупки (Имитация работы триггера sales_log)
  purchaseDisc(matrixNumber, quantity) {
    this.log(`Инициирован запрос на покупку диска '${matrixNumber}', количество: ${quantity}`);

    const disc = this.discs.find((d) => d.matrix_number === matrixNumber);
    if (!disc) {
      throw new Error(`Ошибка заказа: Диск с номером матрицы '${matrixNumber}' не найден.`);
    }

    // Создаем запись для вставки в sales_log (активирует триггер trg_on_sale_insert)
    const nextLogId = this.sales_log.length > 0 ? Math.max(...this.sales_log.map(s => s.id)) + 1 : 1;
    const newLogItem = {
      id: nextLogId,
      disc_matrix_number: matrixNumber,
      purchase_date: new Date().toISOString(),
      quantity
    };

    // Симуляция СУБД: Активация BEFORE INSERT TRIGGER 'trg_on_sale_insert'
    this.log(`Активирован триггер BEFORE INSERT ON sales_log 'trg_on_sale_insert'`);
    
    // В триггерной функции происходит проверка наличия товара на складе
    if (disc.inventory < quantity) {
      const errorMsg = `Исключение триггера 'trg_on_sale_insert': Отказ транзакции! На складе недостаточно товара для диска ${matrixNumber} (Требуется: ${quantity}, В наличии: ${disc.inventory})`;
      this.log(errorMsg);
      throw new Error(errorMsg);
    }

    // Внутри триггера trg_on_sale_insert происходит автоматическое списание и начисление продаж
    disc.inventory -= quantity;
    disc.sales_this_year += quantity;

    this.sales_log.push(newLogItem);
    
    this.log(`Триггер 'trg_on_sale_insert' успешно обновил складской баланс диска '${matrixNumber}': Текущий остаток = ${disc.inventory}, Продажи за год = ${disc.sales_this_year}`);
    this.log(`Транзакция покупки завершена успешно. Новая запись добавлена в sales_log.`);
    return newLogItem;
  }

  // =============================================================================
  // ДИРЕКТИВНЫЙ SQL-ИНТЕРПРЕТАТОР ДЛЯ ПОЛЬЗОВАТЕЛЬСКОЙ КОНСОЛИ
  // Поддерживает SELECT, INSERT, UPDATE, DELETE, CALL, get_music_works_count и др.
  // =============================================================================
  executeSql(queryStr) {
    const cleanQuery = queryStr.trim().replace(/;$/, "");
    this.log(`Пользовательский запрос SQL: "${cleanQuery}"`);

    // 1) SELECT get_music_works_count(id)
    const mwCountMatch = cleanQuery.match(/SELECT\s+get_music_works_count\s*\(\s*(\d+)\s*\)/i);
    if (mwCountMatch) {
      const id = parseInt(mwCountMatch[1]);
      const count = this.getMusicWorksCount(id);
      return {
        headers: ["get_music_works_count"],
        rows: [[count]],
        message: "SELECT запрос выполнен успешно (вызов встроенной функции)."
      };
    }

    // 2) SELECT * FROM get_discs_by_ensemble(id)
    const discsEnsembleMatch = cleanQuery.match(/SELECT\s+\*\s+FROM\s+get_discs_by_ensemble\s*\(\s*(\d+)\s*\)/i);
    if (discsEnsembleMatch) {
      const id = parseInt(discsEnsembleMatch[1]);
      const resultDiscs = this.getDiscsByEnsemble(id);
      return {
        headers: ["matrix_number", "title", "wholesale_price", "retail_price", "inventory", "sales_this_year"],
        rows: resultDiscs.map(d => [d.matrix_number, d.title, d.wholesale_price, d.retail_price, d.inventory, d.sales_this_year]),
        message: `SELECT запрос выполнен успешно. Найдено дисков ансамбля: ${resultDiscs.length}.`
      };
    }

    // 3) SELECT * FROM get_sales_leaders_this_year(limit)
    const salesLeadersMatch = cleanQuery.match(/SELECT\s+\*\s+FROM\s+get_sales_leaders_this_year\s*\(\s*(\d+)\s*\)/i);
    if (salesLeadersMatch) {
      const limit = parseInt(salesLeadersMatch[1]);
      const leaders = this.getSalesLeadersThisYear(limit);
      return {
        headers: ["matrix_number", "title", "sales_this_year", "inventory", "retail_price"],
        rows: leaders.map(d => [d.matrix_number, d.title, d.sales_this_year, d.inventory, d.retail_price]),
        message: `SELECT запрос выполнен успешно. Выведены лидеры продаж кусрса (Limit: ${limit}).`
      };
    }

    // 4) Универсальный SELECT-парсер с поддержкой проекции колонок, WHERE-фильтров, ORDER BY и LIMIT
    const selectMatch = cleanQuery.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);
    if (selectMatch) {
      const colsStr = selectMatch[1].trim();
      const tableName = selectMatch[2].trim().toLowerCase();
      const whereStr = selectMatch[3] ? selectMatch[3].trim() : null;
      const orderStr = selectMatch[4] ? selectMatch[4].trim() : null;
      const limitStr = selectMatch[5] ? selectMatch[5].trim() : null;

      let rawRows = [];
      let defaultHeaders = [];

      if (tableName === "musicians") {
        rawRows = this.musicians;
        defaultHeaders = ["id", "name", "instruments"];
      } else if (tableName === "ensembles") {
        rawRows = this.ensembles;
        defaultHeaders = ["id", "name", "type"];
      } else if (tableName === "musician_ensemble") {
        rawRows = this.musician_ensemble;
        defaultHeaders = ["musician_id", "ensemble_id", "role"];
      } else if (tableName === "music_works") {
        rawRows = this.music_works;
        defaultHeaders = ["id", "title", "composer_id"];
      } else if (tableName === "performances") {
        rawRows = this.performances;
        defaultHeaders = ["id", "work_id", "ensemble_id", "conductor_id", "recording_date"];
      } else if (tableName === "manufacturers") {
        rawRows = this.manufacturers;
        defaultHeaders = ["id", "name", "address", "is_supplier"];
      } else if (tableName === "suppliers") {
        rawRows = this.suppliers;
        defaultHeaders = ["id", "name", "address"];
      } else if (tableName === "discs") {
        rawRows = this.discs;
        defaultHeaders = ["matrix_number", "title", "wholesale_price", "retail_price", "inventory", "sales_this_year", "sales_last_year", "manufacturer_id", "supplier_id", "image_url"];
      } else if (tableName === "sales_log") {
        rawRows = this.sales_log;
        defaultHeaders = ["id", "disc_matrix_number", "purchase_date", "quantity"];
      } else if (tableName === "reviews") {
        rawRows = this.reviews;
        defaultHeaders = ["id", "disc_matrix_number", "reviewer_name", "reviewer_email", "rating", "comment", "created_at"];
      } else if (tableName === "users") {
        rawRows = this.users;
        defaultHeaders = ["id", "email", "passwordHash", "role", "fullName"];
      } else {
        throw new Error(`Таблица '${tableName}' не существует в базе данных музыкального магазина.`);
      }

      // Клонируем строки, чтобы не мутировать реальную БД
      let filteredRows = rawRows.map(row => ({ ...row }));

      // Обработка WHERE: Спецификация <колонки> <оператор> <значение>
      if (whereStr) {
        // Поддерживаемые операторы: =, !=, <>, >, <, >=, <=, LIKE
        const whereMatch = whereStr.match(/^(\w+)\s*(=|!=|<>|>|<|>=|<=|LIKE)\s*(.+)$/i);
        if (whereMatch) {
          const colName = whereMatch[1].trim().toLowerCase();
          const operator = whereMatch[2].trim().toUpperCase();
          let operand = whereMatch[3].trim();

          if (operand.startsWith("'") && operand.endsWith("'")) {
            operand = operand.slice(1, -1);
          }

          filteredRows = filteredRows.filter(row => {
            const rowKey = Object.keys(row).find(k => k.toLowerCase() === colName);
            if (!rowKey) return false;
            const val = row[rowKey];

            if (operator === "=") {
              return String(val).toLowerCase() === operand.toLowerCase();
            } else if (operator === "!=" || operator === "<>") {
              return String(val).toLowerCase() !== operand.toLowerCase();
            } else if (operator === ">") {
              return Number(val) > Number(operand);
            } else if (operator === "<") {
              return Number(val) < Number(operand);
            } else if (operator === ">=") {
              return Number(val) >= Number(operand);
            } else if (operator === "<=") {
              return Number(val) <= Number(operand);
            } else if (operator === "LIKE") {
              const cleanLike = operand.replace(/%/g, "").toLowerCase();
              return String(val).toLowerCase().includes(cleanLike);
            }
            return true;
          });
        }
      }

      // Сортировка: ORDER BY <колонка> [ASC|DESC]
      if (orderStr) {
        const orderMatch = orderStr.match(/^(\w+)(?:\s+(ASC|DESC))?$/i);
        if (orderMatch) {
          const colName = orderMatch[1].trim().toLowerCase();
          const direction = orderMatch[2] ? orderMatch[2].trim().toUpperCase() : "ASC";

          filteredRows.sort((a, b) => {
            const keyA = Object.keys(a).find(k => k.toLowerCase() === colName);
            const keyB = Object.keys(b).find(k => k.toLowerCase() === colName);
            if (!keyA || !keyB) return 0;
            const valA = a[keyA];
            const valB = b[keyB];

            if (typeof valA === "number" && typeof valB === "number") {
              return direction === "ASC" ? valA - valB : valB - valA;
            } else {
              return direction === "ASC" 
                ? String(valA).localeCompare(String(valB))
                : String(valB).localeCompare(String(valA));
            }
          });
        }
      }

      // Лимит вывода строк (LIMIT N)
      if (limitStr) {
        const lim = parseInt(limitStr);
        if (!isNaN(lim)) {
          filteredRows = filteredRows.slice(0, lim);
        }
      }

      // Колонки проекции выбора
      let projectHeaders = defaultHeaders;
      if (colsStr !== "*") {
        projectHeaders = colsStr.split(",").map(c => c.trim().toLowerCase());
      }

      const finalRows = filteredRows.map(row => {
        return projectHeaders.map(hdr => {
          const key = Object.keys(row).find(k => k.toLowerCase() === hdr);
          return key ? row[key] : null;
        });
      });

      return {
        headers: projectHeaders,
        rows: finalRows,
        message: `SELECT запрос выполнен над таблицей '${tableName}'. Выведено строк: ${finalRows.length}.`
      };
    }

    // 5) CALL insert_ensemble(name, type)
    const callInsertEnsembleMatch = cleanQuery.match(/CALL\s+insert_ensemble\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/i);
    if (callInsertEnsembleMatch) {
      const name = callInsertEnsembleMatch[1];
      const type = callInsertEnsembleMatch[2];
      const res = this.insertEnsemble(name, type);
      return {
        headers: ["id", "name", "type"],
        rows: [[res.id, res.name, res.type]],
        message: "Процедура CALL insert_ensemble выполнена успешно."
      };
    }

    // 6) CALL insert_disc(...)
    // CALL insert_disc('matrix', 'title', man_id, sup_id_or_null, wholesale, retail, 'date', inventory)
    const callInsertDiscMatch = cleanQuery.match(/CALL\s+insert_disc\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\d+)\s*,\s*(\d+|NULL)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*'([^']+)'\s*,\s*(\d+)\s*\)/i);
    if (callInsertDiscMatch) {
      const matrix = callInsertDiscMatch[1];
      const title = callInsertDiscMatch[2];
      const manId = parseInt(callInsertDiscMatch[3]);
      const supIdRaw = callInsertDiscMatch[4];
      const supId = supIdRaw.toUpperCase() === "NULL" ? null : parseInt(supIdRaw);
      const wholesale = parseFloat(callInsertDiscMatch[5]);
      const retail = parseFloat(callInsertDiscMatch[6]);
      const relDate = callInsertDiscMatch[7];
      const inventory = parseInt(callInsertDiscMatch[8]);

      const res = this.insertDisc(matrix, title, manId, supId, wholesale, retail, relDate, inventory);
      return {
        headers: ["matrix_number", "title", "wholesale_price", "retail_price"],
        rows: [[res.matrix_number, res.title, res.wholesale_price, res.retail_price]],
        message: "Процедура CALL insert_disc выполнена успешно."
      };
    }

    // 7) CALL update_disc(...)
    // CALL update_disc('matrix', 'title', wholesale, retail, inventory)
    const callUpdateDiscMatch = cleanQuery.match(/CALL\s+update_disc\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*(\d+)\s*\)/i);
    if (callUpdateDiscMatch) {
      const matrix = callUpdateDiscMatch[1];
      const title = callUpdateDiscMatch[2];
      const wholesale = parseFloat(callUpdateDiscMatch[3]);
      const retail = parseFloat(callUpdateDiscMatch[4]);
      const inventory = parseInt(callUpdateDiscMatch[5]);

      const res = this.updateDisc(matrix, title, wholesale, retail, inventory);
      return {
        headers: ["matrix_number", "title", "wholesale_price", "retail_price", "inventory"],
        rows: [[res.matrix_number, res.title, res.wholesale_price, res.retail_price, res.inventory]],
        message: "Процедура CALL update_disc выполнена успешно."
      };
    }

    // 8) DELETE FROM <tableName> WHERE <colName> = <val>
    const deleteMatch = cleanQuery.match(/^DELETE\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*(=|LIKE)\s*(.+)$/i);
    if (deleteMatch) {
      const tableName = deleteMatch[1].trim().toLowerCase();
      const colName = deleteMatch[2].trim().toLowerCase();
      const operator = deleteMatch[3].trim().toUpperCase();
      let operand = deleteMatch[4].trim();
      if (operand.startsWith("'") && operand.endsWith("'")) {
        operand = operand.slice(1, -1);
      }

      const matches = (row) => {
        const rowKey = Object.keys(row).find(k => k.toLowerCase() === colName);
        if (!rowKey) return false;
        const val = row[rowKey];
        if (operator === "=") {
          return String(val).toLowerCase() === operand.toLowerCase();
        } else {
          return String(val).toLowerCase().includes(operand.replace(/%/g, "").toLowerCase());
        }
      };

      if (tableName === "musicians") {
        const targets = this.musicians.filter(matches);
        targets.forEach(t => this.deleteMusician(t.id));
        return {
          headers: ["deleted_count"],
          rows: [[targets.length]],
          message: `DML DELETE каскад: успешно удалено музыкантов: ${targets.length} строк.`
        };
      } else if (tableName === "ensembles") {
        const targets = this.ensembles.filter(matches);
        targets.forEach(t => this.deleteEnsemble(t.id));
        return {
          headers: ["deleted_count"],
          rows: [[targets.length]],
          message: `DML DELETE каскад: успешно удалено ансамблей: ${targets.length} строк.`
        };
      } else if (tableName === "discs") {
        const targets = this.discs.filter(matches);
        targets.forEach(t => this.deleteDisc(t.matrix_number));
        return {
          headers: ["deleted_count"],
          rows: [[targets.length]],
          message: `DML DELETE каскад: успешно удалено компакт-дисков: ${targets.length} строк.`
        };
      } else if (tableName === "musician_ensemble") {
        const initialLen = this.musician_ensemble.length;
        this.musician_ensemble = this.musician_ensemble.filter(row => !matches(row));
        const deleted = initialLen - this.musician_ensemble.length;
        return {
          headers: ["deleted_count"],
          rows: [[deleted]],
          message: `DML DELETE: разорвано связей музыкант-ансамбль: ${deleted} строк.`
        };
      } else if (tableName === "reviews") {
        const initialLen = this.reviews.length;
        this.reviews = this.reviews.filter(row => !matches(row));
        const deleted = initialLen - this.reviews.length;
        return {
          headers: ["deleted_count"],
          rows: [[deleted]],
          message: `DML DELETE: удалено отзывов из базы СУБД: ${deleted} строк.`
        };
      } else if (tableName === "music_works") {
        const initialLen = this.music_works.length;
        this.music_works = this.music_works.filter(row => !matches(row));
        const deleted = initialLen - this.music_works.length;
        return {
          headers: ["deleted_count"],
          rows: [[deleted]],
          message: `DML DELETE: удалено музыкальных произведений: ${deleted} строк.`
        };
      } else {
        throw new Error(`Удаление строк из таблицы '${tableName}' не поддерживается симулятором.`);
      }
    }

    // Если запрос не распознан простым парсером
    throw new Error("Синтаксическая ошибка SQL: Данный оператор не поддерживается упрощенным парсером СУБД проекта (Для управления данными воспользуйтесь визуальными CRUD-формами или запустите поддерживаемые SELECT/CALL команды). Примеры: SELECT * FROM discs; CALL insert_ensemble('Новый квартет', 'Квартет'); SELECT get_music_works_count(1);");
  }

  // =============================================================================
  // ДРУГИЕ ОПЕРАЦИИ ДЛЯ ПОЛНОТЫ CRUD ИНТЕРФЕЙСА
  // =============================================================================

  // Удаление записей (например, музыканта, ансамбля или диска) с каскадными эффектами
  deleteMusician(id) {
    this.log(`Каскадное удаление: музыкант [ID: ${id}]`);
    
    // Каскад 1: музыкант удаляется из musician_ensemble
    this.musician_ensemble = this.musician_ensemble.filter(me => me.musician_id !== id);
    
    // Каскад 2: дирижеры в performances обнуляются
    this.performances.forEach(p => {
      if (p.conductor_id === id) p.conductor_id = null;
    });

    // Каскад 3: композиторы в произведениях обнуляются
    this.music_works.forEach(mw => {
      if (mw.composer_id === id) mw.composer_id = null;
    });

    // Сам музыкант удаляется
    this.musicians = this.musicians.filter(m => m.id !== id);
    this.log(`Успешно удален музыкант [ID: ${id}] и связанные записи.`);
  }

  deleteEnsemble(id) {
    this.log(`Каскадное удаление: ансамбль [ID: ${id}]`);
    
    // Каскад 1: удаляется из m2m Ансамбль-Исполнитель
    this.musician_ensemble = this.musician_ensemble.filter(me => me.ensemble_id !== id);
    
    // Каскад 2: удаляется из исполнений (событий)
    this.performances = this.performances.filter(p => p.ensemble_id !== id);

    // Сам ансамбль удаляется
    this.ensembles = this.ensembles.filter(e => e.id !== id);
    this.log(`Успешно удален ансамбль [ID: ${id}] и связанные исполнения.`);
  }

  deleteDisc(matrixNumber) {
    this.log(`Каскадное удаление: компакт-диск [Матрица: ${matrixNumber}]`);
    
    // Каскад 1: удаление связанных композиций в disc_performance
    this.disc_performance = this.disc_performance.filter(dp => dp.disc_matrix_number !== matrixNumber);
    
    // Каскад 2: удаление логов продаж
    this.sales_log = this.sales_log.filter(sl => sl.disc_matrix_number !== matrixNumber);

    // Удаление самого диска
    this.discs = this.discs.filter(d => d.matrix_number !== matrixNumber);
    this.log(`Успешно удален компакт-диск [${matrixNumber}]`);
  }

  // Роли пользователей и управление учетками (Симуляция авторизации)
  // В системе 4 роли: 'OWNER' (Владелец), 'ADMIN' (Админ), 'USER' (Пользователь), 'GUEST' (Гость)
  authenticate(email, role) {
    this.log(`Аутентификация пользователя [E-mail: ${email}, Роль: ${role}]`);
    return {
      sessionToken: "jwt-token-simulated-" + Math.random().toString(36).substring(7),
      email,
      role
    };
  }
}

// Экспортируем единственный экземпляр СУБД для бэкенда
export const dbSim = new Database();
