import React, { useState, useEffect } from "react";
import {
  Music,
  User as UserIcon,
  ShieldAlert,
  Terminal,
  TrendingUp,
  FolderTree,
  RotateCcw,
  LogOut,
  Sparkles
} from "lucide-react";
import LoginScreen from "./components/LoginScreen";
import SqlConsole from "./components/SqlConsole";
import DataCatalogs from "./components/DataCatalogs";
import FinanceDashboard from "./components/FinanceDashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("catalog");

  // Состояние СУБД сущностей
  const [discs, setDiscs] = useState([]);
  const [musicians, setMusicians] = useState([]);
  const [ensembles, setEnsembles] = useState([]);
  const [musicianEnsembles, setMusicianEnsembles] = useState([]);
  const [musicWorks, setMusicWorks] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState({ useRealDb: false, configString: "Разведка..." });

  // Запуск загрузки сущностей
  useEffect(() => {
    if (user) {
      fetchEntities();
      fetchDbStatus();
    }
  }, [user]);

  const fetchDbStatus = async () => {
    try {
      const res = await fetch("/api/db/status");
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      console.error("Не удалось получить статус подключения к СУБД:", err);
    }
  };

  const fetchEntities = async () => {
    setIsSyncing(true);
    try {
      const headers = { 
        "x-user-role": user?.role || "GUEST",
        "x-user-email": user?.email || ""
      };
      
      const [
        resDiscs,
        resMusicians,
        resEnsembles,
        resMusicianEnsembles,
        resWorks,
        resPerf,
        resMan,
        resSup,
        resReviews
      ] = await Promise.all([
        fetch("/api/discs", { headers }),
        fetch("/api/musicians", { headers }),
        fetch("/api/ensembles", { headers }),
        fetch("/api/musician-ensemble", { headers }),
        fetch("/api/music-works", { headers }),
        fetch("/api/performances", { headers }),
        fetch("/api/manufacturers", { headers }),
        fetch("/api/suppliers", { headers }),
        fetch("/api/reviews", { headers })
      ]);

      const [
        dataDiscs,
        dataMusicians,
        dataEnsembles,
        dataMusicianEnsembles,
        dataWorks,
        dataPerf,
        dataMan,
        dataSup,
        dataReviews
      ] = await Promise.all([
        resDiscs.json(),
        resMusicians.json(),
        resEnsembles.json(),
        resMusicianEnsembles.json(),
        resWorks.json(),
        resPerf.json(),
        resMan.json(),
        resSup.json(),
        resReviews.json()
      ]);

      setDiscs(Array.isArray(dataDiscs) ? dataDiscs : []);
      setMusicians(Array.isArray(dataMusicians) ? dataMusicians : []);
      setEnsembles(Array.isArray(dataEnsembles) ? dataEnsembles : []);
      setMusicianEnsembles(Array.isArray(dataMusicianEnsembles) ? dataMusicianEnsembles : []);
      setMusicWorks(Array.isArray(dataWorks) ? dataWorks : []);
      setPerformances(Array.isArray(dataPerf) ? dataPerf : []);
      setManufacturers(Array.isArray(dataMan) ? dataMan : []);
      setSuppliers(Array.isArray(dataSup) ? dataSup : []);
      setReviews(Array.isArray(dataReviews) ? dataReviews : []);
    } catch (err) {
      console.error("Ошибка при получении данных СУБД:", err);
    } finally {
      setIsSyncing(false);
      setIsInitialLoading(false);
    }
  };

  const handleLogin = (email, role) => {
    setUser({ email, role });
    setActiveTab("catalog");
  };

  const handleRoleChangeInHeader = (newRole) => {
    if (!user) return;
    setUser({ ...user, role: newRole });
    // Проверка ограничений на вкладки при переключении роли
    if (newRole === "GUEST" && activeTab !== "catalog") {
      setActiveTab("catalog");
    }
    if (newRole === "USER" && activeTab === "sql_playground") {
      setActiveTab("catalog");
    }
  };

  const handleResetDb = async () => {
    if (!window.confirm("Внимание! Будет запущен DDL/DML скрипт сброса таблиц базы данных до начального заводского состояния. Все внесенные изменения и логи транзакций/покупок будут стерты. Продолжить?")) return;
    try {
      const res = await fetch("/api/db/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "GUEST"
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "База данных успешно деинициализирована и залита заново.");
        fetchEntities();
      } else {
        alert(`Ошибка сброса: ${data.error}`);
      }
    } catch (_) {
      alert("Сбой сети при сбросе таблиц.");
    }
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex flex-col font-sans text-[#141414] antialiased p-0 sm:p-4">
      <div className="flex-1 flex flex-col bg-[#E4E3E0] border-4 border-[#141414] rounded-none shadow-none overflow-hidden">
        {/* ПАНЕЛЬ ПРЕПОДАВАТЕЛЯ / ПЕРЕКЛЮЧАТЕЛЬ РОЛЕЙ В ШАПКЕ */}
        <div className="bg-[#141414] text-[#E4E3E0] py-2.5 px-6 border-b border-[#141414] flex flex-col sm:flex-row gap-2 justify-between items-center z-10 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full duration-300 transition-all ${isSyncing ? "bg-amber-400 animate-spin" : "bg-emerald-400"}`}></span>
              <span className="font-bold tracking-wider uppercase text-[#E4E3E0]">
                {isSyncing ? "СУБД СЕССИЯ: ТРАНЗАКЦИОННАЯ СИНХРОНИЗАЦИЯ..." : "СУБД СЕССИЯ: ПАНЕЛЬ ОЦЕНКИ КУРСОВОЙ РАБОТЫ"}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 bg-neutral-800 px-2.5 py-0.5 rounded-none border border-neutral-700 text-[10px]">
              <span className="text-gray-400">ЯДРО БД:</span>
              <span className={dbStatus.useRealDb ? "text-emerald-400 font-bold hover:underline cursor-help" : "text-amber-400 font-bold hover:underline cursor-help"} title={dbStatus.configString}>
                {dbStatus.useRealDb ? "🔌 PostgreSQL (Внешний)" : "💾 Имитатор PL/pgSQL в ОЗУ"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Роль сессии:</label>
            <select
              value={user.role}
              onChange={(e) => handleRoleChangeInHeader(e.target.value)}
              className="text-xs bg-neutral-900 border border-neutral-800 text-white rounded-none px-2.5 py-1 focus:outline-none font-bold uppercase cursor-pointer"
            >
              <option value="OWNER">Владелец (Owner) - All tables</option>
              <option value="ADMIN">Админ (Admin) - Warehouse</option>
              <option value="USER">Покупатель (User) - Interactive</option>
              <option value="GUEST">Гость (Guest) - Read-only</option>
            </select>

            {["OWNER", "ADMIN"].includes(user.role) && (
              <button
                onClick={handleResetDb}
                className="flex items-center space-x-1 px-2.5 py-1 bg-[#E4E3E0] text-[#141414] hover:bg-white border border-[#141414] rounded-none text-[10px] font-bold uppercase transition-all focus:outline-none cursor-pointer font-mono"
                title="Пересобрать и сбросить таблицы SQL обратно на дефолт"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Сбросить данные БД</span>
              </button>
            )}
          </div>
        </div>

        {/* ГЛАВНЫЙ НАДЗАГОЛОВОК И НАВИГАЦИЯ */}
        <header className="bg-white border-b border-[#141414] py-4 px-6 shadow-none">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-2 bg-[#141414] text-white rounded-none border border-[#141414]">
                <Music className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#141414] tracking-tight leading-none uppercase">
                  MusicDB v2.4
                </h1>
                <p className="text-xs font-serif italic text-gray-600 mt-1">
                  Каталог пластинок & СУБД администрирование
                </p>
              </div>
            </div>

            {/* ВКЛАДКИ НАВИГАЦИИ С УЧЕТОМ РОЛЕЙ */}
            <nav className="flex space-x-1 bg-[#D8D7D4] p-1 border border-[#141414]">
              <button
                onClick={() => setActiveTab("catalog")}
                className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all focus:outline-none cursor-pointer ${
                  activeTab === "catalog"
                    ? "bg-[#141414] text-white"
                    : "text-[#141414] hover:bg-white border border-transparent hover:border-[#141414]"
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Реестр & Склад</span>
              </button>

              {user.role === "OWNER" && (
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all focus:outline-none cursor-pointer ${
                    activeTab === "dashboard"
                      ? "bg-[#141414] text-white"
                      : "text-[#141414] hover:bg-white border border-transparent hover:border-[#141414]"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Финансы</span>
                </button>
              )}

              {["OWNER", "ADMIN"].includes(user.role) && (
                <button
                  onClick={() => setActiveTab("sql_playground")}
                  className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-all focus:outline-none cursor-pointer ${
                    activeTab === "sql_playground"
                      ? "bg-[#141414] text-white"
                      : "text-[#141414] hover:bg-white border border-transparent hover:border-[#141414]"
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>SQL-консоль</span>
                </button>
              )}
            </nav>

            {/* ПОЛЬЗОВАТЕЛЬ */}
            <div className="flex items-center space-x-3 border-l border-[#141414] pl-4">
              <div className="text-right font-mono text-xs">
                <p className="font-bold text-[#141414] truncate max-w-[130px]">{user.email}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-bold bg-[#141414] text-white uppercase tracking-wider mt-1">
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => setUser(null)}
                className="p-2 border border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-white rounded-none transition-all focus:outline-none cursor-pointer"
                title="Выйти"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* ГЛАВНЫЙ ИНФОРМАЦИОННЫЙ БЛОК */}
        <main className="flex-1 w-full p-4 sm:p-6 md:p-8 overflow-y-auto">
          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center p-24 text-[#141414] text-center font-mono animate-pulse">
              <RotateCcw className="w-10 h-10 text-[#141414] animate-spin mb-3" />
              <p className="text-sm font-bold uppercase tracking-widest">ПОДКЛЮЧЕНИЕ К СУБД POSTGRESQL...</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase">Загрузка структуры и данных таблиц музыкального магазина...</p>
            </div>
          ) : (
            <div className="animate-fadeIn">
              {activeTab === "catalog" && (
                <DataCatalogs
                  userRole={user.role}
                  userEmail={user.email}
                  discs={discs}
                  musicians={musicians}
                  ensembles={ensembles}
                  musicianEnsembles={musicianEnsembles}
                  musicWorks={musicWorks}
                  performances={performances}
                  manufacturers={manufacturers}
                  suppliers={suppliers}
                  reviews={reviews}
                  onRefresh={fetchEntities}
                />
              )}

              {activeTab === "dashboard" && (
                <FinanceDashboard
                  userRole={user.role}
                  discs={discs}
                  onRefresh={fetchEntities}
                />
              )}

              {activeTab === "sql_playground" && (
                <SqlConsole
                  userRole={user.role}
                  onRefreshData={fetchEntities}
                />
              )}
            </div>
          )}
        </main>

        {/* ПОДВАЛ/ФУТЕР КУРСОВОЙ */}
        <footer className="bg-white border-t border-[#141414] py-4 px-6 text-center text-xs text-[#141414] font-mono leading-normal">
          <p>© 2026 МИРЭА — Российский технологический университет</p>
          <p className="mt-1 text-gray-500">Курсовой проект по базам данных СУБД • Выполнил студент группы ЭФБО-18-24 • Node.js, Express, React, PostgreSQL 15.4</p>
        </footer>
      </div>
    </div>
  );
}
