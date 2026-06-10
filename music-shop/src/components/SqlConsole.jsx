import React, { useState, useEffect } from "react";
import { Terminal, Copy, Check, Play, RefreshCw, Trash2, Database, HelpCircle } from "lucide-react";

export default function SqlConsole({ userRole, onRefreshData }) {
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM discs;");
  const [rawSqlText, setRawSqlText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [systemLogs, setSystemLogs] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Считываем полный DDL/DML скрипт
  const [fullSqlScript, setFullSqlScript] = useState("");

  useEffect(() => {
    // Импровизированный запрос DDL скрипта (будем подгружать из статики)
    fetch("/database.sql")
      .then((res) => res.text())
      .then((text) => setFullSqlScript(text))
      .catch((_) => setFullSqlScript("-- Ошибка подгрузки скрипта database.sql"));
    
    // Автоматический запуск дефолтного запроса при монтировании консоли
    executeQuery("SELECT * FROM discs;");

    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/db/logs");
      const data = await res.json();
      if (data.logs) {
        setSystemLogs(data.logs);
      }
    } catch (_) {
      // Игнорируем ошибки фонового получения логов
    }
  };

  const clearLogs = async () => {
    try {
      await fetch("/api/db/logs/clear", { method: "POST" });
      setSystemLogs([]);
    } catch (_) {}
  };

  const executeQuery = async (queryToRun) => {
    if (!queryToRun.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch("/api/db/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: queryToRun, userRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ошибка выполнения SQL скрипта.");
      }

      setResult(data);
      onRefreshData(); // Обновляем данные в таблицах
      fetchLogs();     // Забираем свежие логи триггеров
    } catch (err) {
      setErrorMsg(err.message || "Неизвестная ошибка СУБД");
    } finally {
      setLoading(false);
    }
  };

  const presetQueries = [
    {
      title: "Выбрать все компакт-диски",
      sql: "SELECT * FROM discs;",
      desc: "Начальное чтение всех пластинок в магазине",
    },
    {
      title: "Функция: Кол-во произведений ансамбля 1",
      sql: "SELECT get_music_works_count(1);",
      desc: "Возвращает число произведений Берлинского филармонического оркестра",
    },
    {
      title: "Функция: Список дисков ансамбля 1",
      sql: "SELECT * FROM get_discs_by_ensemble(1);",
      desc: "Возвращает диски, содержащие записи первого ансамбля",
    },
    {
      title: "Функция: Лидеры продаж (Топ-3)",
      sql: "SELECT * FROM get_sales_leaders_this_year(3);",
      desc: "Возвращает топ пластинок по объемам текущих продаж",
    },
    {
      title: "Процедура: Добавить ансамбль (CALL)",
      sql: "CALL insert_ensemble('Камерный оркестр Гнесиных', 'Оркестр');",
      desc: "Вызов процедуры ввода нового ансамбля",
    },
    {
      title: "Процедура: Добавить диск (CALL)",
      sql: "CALL insert_disc('MEL-1980-X3', 'Чайковский: Лебединое озеро', 4, 1, 800.00, 1200.00, '1980-05-15', 30);",
      desc: "Запуск процедуры заполнения новой компакт-пластинки",
    },
    {
      title: "Каскадный SELECT (Музыканты)",
      sql: "SELECT * FROM musicians;",
      desc: "Список всех дирижеров и исполнителей",
    }
  ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fullSqlScript);
    setCopiedIndex(999);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white text-[#141414] rounded-none shadow-none overflow-hidden border-4 border-[#141414]">
        <div className="flex items-center justify-between px-6 py-4 bg-[#141414] text-[#E4E3E0] border-b border-[#141414] font-mono text-xs">
          <div className="flex items-center space-x-2.5">
            <Terminal className="w-5 h-5 text-white animate-pulse" />
            <span className="font-bold tracking-wider uppercase">
              Интерактивная SQL-консоль (СУБД PostgreSQL Клиент)
            </span>
          </div>
          <div>
            <span className="text-[10px] bg-neutral-900 text-[#E4E3E0] px-2.5 py-1 border border-neutral-800 font-bold uppercase tracking-widest font-mono">
              Транзакции ACTIVE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Слева пресеты */}
          <div className="lg:col-span-5 bg-[#D8D7D4] p-6 border-r-0 lg:border-r-2 border-[#141414] space-y-4">
            <h3 className="text-xs font-mono font-bold text-[#141414] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#141414] pb-2">
              <Database className="w-3.5 h-3.5" />
              Шаблоны запросов (PL/pgSQL)
            </h3>
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {presetQueries.map((pq, idx) => (pq && (
                <button
                  key={idx}
                  onClick={() => {
                    setSqlQuery(pq.sql);
                    executeQuery(pq.sql);
                  }}
                  className="w-full text-left p-3 rounded-none border border-[#141414] bg-white hover:bg-[#141414] hover:text-white transition-all text-xs block focus:outline-none cursor-pointer"
                >
                  <p className="font-mono font-bold uppercase tracking-tight">
                    {pq.title}
                  </p>
                  <p className="opacity-70 text-[11px] mt-1 font-sans leading-snug">{pq.desc}</p>
                </button>
              )))}
            </div>
            <div className="text-[11px] text-[#141414] leading-normal bg-white border border-[#141414] p-3.5 rounded-none font-mono">
              <span className="font-bold uppercase tracking-wider block mb-1">⚠️ Обратите внимание:</span> Запросы изменяют общее состояние базы данных музыкального магазина на сервере. Недопустимые ценники или неверные ключи вызовут срабатывание триггеров.
            </div>
          </div>

          {/* Справа редактор кода и кнопка запуска */}
          <div className="lg:col-span-7 p-6 flex flex-col space-y-4 bg-white">
            <div className="flex flex-col flex-1">
              <label className="block text-xs font-mono font-bold text-[#141414] uppercase tracking-wider mb-2">
                Редактор SQL-запроса (Ввод команд)
              </label>
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="w-full h-[220px] font-mono text-sm leading-relaxed p-4 bg-white border-2 border-[#141414] rounded-none focus:outline-none text-[#141414] shadow-none resize-none select-text"
                placeholder="SELECT * FROM discs;"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 flex items-center space-x-1 font-mono">
                <span>* Заканчивайте запросы точкой с запятой ;</span>
              </div>
              <button
                onClick={() => executeQuery(sqlQuery)}
                disabled={loading || !["OWNER", "ADMIN"].includes(userRole)}
                className="flex items-center space-x-2 px-5 py-3 bg-[#141414] hover:bg-white hover:text-[#141414] disabled:bg-neutral-200 disabled:text-neutral-500 disabled:border-neutral-400 border-2 border-[#141414] rounded-none font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer text-white"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>Запустить запрос (F5)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Окна результатов и логов триггеров */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Панель результатов */}
        <div className="lg:col-span-8 bg-white border-4 border-[#141414] rounded-none p-6 shadow-none overflow-hidden flex flex-col max-h-[500px]">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414] mb-4 flex items-center gap-2 border-b border-[#141414] pb-2">
            <Database className="w-4 h-4" />
            Вывод запроса (Результирующий набор СУБД)
          </h3>

          <div className="flex-1 overflow-auto border-2 border-[#141414] rounded-none bg-[#E4E3E0] min-h-[150px]">
            {loading && (
              <div className="flex flex-col items-center justify-center p-8 text-[#141414] h-full font-mono">
                <RefreshCw className="w-8 h-8 animate-spin text-[#141414] mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">Проверка внешних ключей...</p>
              </div>
            )}

            {!loading && errorMsg && (
              <div className="p-4 bg-rose-950 text-rose-100 font-mono text-xs rounded-none border-l-4 border-rose-500">
                <span className="font-extrabold text-sm block mb-1 uppercase tracking-wider">❌ Сбой выполнения SQL:</span>
                <p className="whitespace-pre-wrap leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {!loading && !errorMsg && result && (
              <div className="overflow-x-auto bg-white">
                <table className="w-full text-left text-xs text-[#141414] font-mono border-collapse">
                  <thead className="bg-[#141414] text-white border-b border-[#141414]">
                    <tr>
                      {result.headers.map((hdr, i) => (
                        <th key={i} className="px-4 py-3 font-bold uppercase tracking-wider whitespace-nowrap text-[10px]">
                          {hdr}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141414]/20">
                    {result.rows.length === 0 ? (
                      <tr>
                        <td colSpan={result.headers.length} className="px-4 py-8 text-center text-gray-400 text-xs">
                          Запрос выполнен успешно. 0 строк возвращено.
                        </td>
                      </tr>
                    ) : (
                      result.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-neutral-150 transition-colors">
                          {row.map((val, cIdx) => (
                            <td key={cIdx} className="px-4 py-2 text-[#141414] border-b border-gray-200">
                              {val === null ? (
                                <span className="text-gray-400 italic font-sans">NULL</span>
                              ) : typeof val === "boolean" ? (
                                <span className={val ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                                  {val ? "TRUE" : "FALSE"}
                                </span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !errorMsg && !result && (
              <div className="flex flex-col items-center justify-center p-12 text-[#141414] text-center h-full font-mono">
                <Terminal className="w-10 h-10 mb-2 text-[#141414]/45" />
                <p className="text-xs font-extrabold uppercase tracking-wider">ОЖИДАНИЕ ВВОДА SQL...</p>
                <p className="text-[10px] text-gray-500 mt-1 max-w-[320px]">Результаты выполнения SQL-запроса будут выведены в структурированной таблице в данной панели.</p>
              </div>
            )}
          </div>

          {result && !errorMsg && (
            <div className="text-[#141414] text-[10px] font-mono mt-3 uppercase tracking-wider">
              📊 {result.message} (Размерность: {result.rows.length} строк × {result.headers.length} полей)
            </div>
          )}
        </div>

        {/* Панель логов и триггеров СУБД */}
        <div className="lg:col-span-4 bg-white border-4 border-[#141414] rounded-none p-6 shadow-none overflow-hidden flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-4 border-b border-[#141414] pb-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414] flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-600 animate-pulse" />
              Трассировка логов (DB LOGS)
            </h3>
            <button
              onClick={clearLogs}
              title="Очистить лог"
              className="p-1.5 border border-[#141414] text-[#141414] hover:bg-red-500 hover:text-white rounded-none transition-all focus:outline-none cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-neutral-900 p-4 rounded-none font-mono text-[11px] space-y-2.5 text-[#E4E3E0] leading-relaxed shadow-none">
            {systemLogs.length === 0 ? (
              <p className="text-neutral-500 italic text-center py-12">Лог транзакций чист. Проведите покупки дисков, CRUD операции или SQL-процедуры для активации триггеров СУБД.</p>
            ) : (
              systemLogs.map((log, index) => {
                let colorClass = "text-[#E4E3E0]";
                if (log.includes("Процедура")) colorClass = "text-cyan-400 font-semibold";
                else if (log.includes("Триггер")) colorClass = "text-emerald-400 font-semibold";
                else if (log.includes("Ошибка") || log.includes("Отказ") || log.includes("Исключение")) colorClass = "text-rose-400";
                
                return (
                  <div key={index} className="border-b border-white/5 pb-1.5">
                    <span className="text-[9px] text-gray-500 block">[{new Date().toLocaleTimeString()}]</span>
                    <span className={colorClass}>{log}</span>
                  </div>
                );
              })
            )}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-2 text-right">
            Автоматическое обновление раз в 4 секунды
          </div>
        </div>
      </div>
    </div>
  );
}
