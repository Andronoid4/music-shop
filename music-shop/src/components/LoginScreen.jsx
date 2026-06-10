import React, { useState } from "react";
import { Shield, Key, Eye, User as UserIcon, Music, Check, UserPlus, LogIn } from "lucide-react";

export default function LoginScreen({ onLogin }) {
  const [activeTab, setActiveTab] = useState("login");
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("owner@musicdb.ru");
  const [loginPassword, setLoginPassword] = useState("owner123");
  
  // Registration form state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("USER");

  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Список существующих seeded пользователей для быстрого входа
  const demoUsers = [
    {
      email: "owner@musicdb.ru",
      password: "owner123",
      role: "OWNER",
      title: "Владелец",
      desc: "Полный SQL доступ к аналитике",
      icon: Shield,
    },
    {
      email: "admin@musicdb.ru",
      password: "admin123",
      role: "ADMIN",
      title: "Администратор",
      desc: "Управление каталогом и дисками",
      icon: Key,
    },
    {
      email: "user@musicdb.ru",
      password: "user123",
      role: "USER",
      title: "Покупатель/User",
      desc: "Покупки дисков и отзывы",
      icon: UserIcon,
    },
    {
      email: "guest@musicdb.ru",
      password: "guest123",
      role: "GUEST",
      title: "Гость",
      desc: "Только чтение витрины",
      icon: Eye,
    },
  ];

  const rolesSelectionInfo = [
    {
      role: "OWNER",
      title: "Владелец (Owner)",
      desc: "Полный доступ ко всем таблицам, процедурам и аналитике. Просмотр себестоимости, оптовых цен и маржинальности.",
      icon: Shield,
    },
    {
      role: "ADMIN",
      title: "Администратор (Admin)",
      desc: "Управление каталогом музыкального магазина. Ввод новых дисков, оркестров и исполнителей.",
      icon: Key,
    },
    {
      role: "USER",
      title: "Покупатель (User)",
      desc: "Пользовательский доступ. Оформление покупок дисков со списанием остатков и добавление/удаление отзывов.",
      icon: UserIcon,
    },
    {
      role: "GUEST",
      title: "Гость (Guest)",
      desc: "Ознакомительный доступ. Только просмотр базового каталога дисков. Панели управления и ввода заблокированы.",
      icon: Eye,
    },
  ];

  const handleDemoFill = (email, pass) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setErrorMsg(null);
    setSuccessMsg("Данные демо-аккаунта подставлены! Нажмите войти.");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка аутентификации.");
      }

      setSuccessMsg(`Успешная авторизация! Добро пожаловать, ${data.fullName || data.email}.`);
      setTimeout(() => {
        onLogin(data.email, data.role);
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || "Сбой при подключении к серверу СУБД.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword.trim() || !regFullName.trim()) {
      setErrorMsg("Пожалуйста, заполните все поля регистрации.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail.toLowerCase().trim(),
          password: regPassword.trim(),
          fullName: regFullName.trim(),
          role: regRole,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Не удалось завершить регистрацию.");
      }

      setSuccessMsg(`Пользователь ${data.user.fullName} успешно добавлен в базу СУБД! Вы можете войти.`);
      
      // Переключаем на вкладку входа и предзаполняем поля
      setTimeout(() => {
        setLoginEmail(regEmail.toLowerCase().trim());
        setLoginPassword(regPassword.trim());
        setActiveTab("login");
        setErrorMsg(null);
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || "Сбой соединения с СУБД.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-4 bg-[#141414] text-white border-2 border-[#141414] rounded-none mb-4">
          <Music className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-[#141414] tracking-tight uppercase">
          MusicDB v2.5
        </h2>
        <p className="mt-1 text-sm font-serif italic text-gray-700">
          Информационная система музыкального магазина
        </p>
        <p className="mt-2 text-xs font-mono uppercase tracking-widest text-[#141414] opacity-70">
          Курсовой проект по базам данных СПбПУ
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white shadow-none border-4 border-[#141414] rounded-none overflow-hidden">
          
          {/* Переключатель вкладок авторизации */}
          <div className="flex border-b-4 border-[#141414] font-mono font-bold text-xs uppercase bg-[#D8D7D4]">
            <button
              onClick={() => {
                setActiveTab("login");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 border-r-2 border-[#141414] cursor-pointer focus:outline-none transition-colors ${
                activeTab === "login"
                  ? "bg-white text-[#141414]"
                  : "hover:bg-neutral-100 text-gray-500"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Вход (Аутентификация)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 cursor-pointer focus:outline-none transition-colors ${
                activeTab === "register"
                  ? "bg-white text-[#141414]"
                  : "hover:bg-neutral-100 text-gray-500"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Регистрация в СУБД</span>
            </button>
          </div>

          <div className="py-8 px-6 sm:px-10">
            {/* Окошки ошибок и успехов */}
            {errorMsg && (
              <div className="mb-6 bg-rose-50 border-2 border-rose-600 text-rose-800 p-3 text-xs font-mono">
                <span className="font-extrabold block uppercase tracking-wider">⚠️ ОШИБКА БАЗЫ ДАННЫХ:</span>
                <p className="mt-1">{errorMsg}</p>
              </div>
            )}
            {successMsg && (
              <div className="mb-6 bg-emerald-50 border-2 border-emerald-600 text-emerald-800 p-3 text-xs font-mono animate-fadeIn">
                <span className="font-extrabold block uppercase tracking-wider">✔️ УСПЕШНО:</span>
                <p className="mt-1">{successMsg}</p>
              </div>
            )}

            {/* ВКЛАДКА 1: ВХОД В СИСТЕМУ */}
            {activeTab === "login" && (
              <div className="space-y-6">
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="loginEmail" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-700">
                      Адрес электронной почты (E-mail)
                    </label>
                    <div className="mt-1.5">
                      <input
                        id="loginEmail"
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full px-4 py-2.5 border border-[#141414] rounded-none shadow-none focus:outline-none focus:bg-[#F3F4F6] text-[#141414] font-mono text-sm block"
                        placeholder="user@musicdb.ru"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <label htmlFor="loginPass" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-700">
                        Пароль доступа СУБД
                      </label>
                    </div>
                    <div className="mt-1.5">
                      <input
                        id="loginPass"
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-2.5 border border-[#141414] rounded-none shadow-none focus:outline-none focus:bg-[#F3F4F6] text-[#141414] font-mono text-sm block"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center py-3.5 px-4 border-2 border-[#141414] rounded-none text-xs font-mono font-bold uppercase tracking-wider text-white bg-[#141414] hover:bg-white hover:text-[#141414] transition-all cursor-pointer disabled:bg-neutral-300 disabled:text-neutral-500"
                    >
                      {isLoading ? "Подключение к PostgreSQL..." : "Выполнить вход по паролю"}
                    </button>
                  </div>
                </form>

                {/* Шпаргалка демо-учетных записей */}
                <div className="border-t-2 border-dashed border-[#141414] pt-5">
                  <div className="bg-amber-50 border border-amber-400 p-4 rounded-none">
                    <span className="font-mono font-extrabold text-[11px] uppercase tracking-wider block text-amber-900 mb-2 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      Шпаргалка демо-аккаунтов (Кликните для автозаполнения)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {demoUsers.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.email}
                            type="button"
                            onClick={() => handleDemoFill(item.email, item.password)}
                            className="text-left bg-white hover:bg-[#141414] hover:text-white p-2 border border-neutral-300 font-mono transition-all duration-150 cursor-pointer focus:outline-none"
                          >
                            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-950 hover:text-inherit">
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span>{item.title}</span>
                            </div>
                            <div className="text-[9px] opacity-70 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                              Email: {item.email}
                            </div>
                            <div className="text-[9px] opacity-70">
                              Пароль: <span className="underline font-bold">{item.password}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ВКЛАДКА 2: РЕГИСТРАЦИЯ */}
            {activeTab === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div>
                  <label htmlFor="regName" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-700">
                    Полное ФИО покупателя / сотрудника
                  </label>
                  <div className="mt-1.5">
                    <input
                      id="regName"
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full px-4 py-2 border border-[#141414] rounded-none focus:outline-none focus:bg-[#F3F4F6] text-[#141414] font-mono text-xs block"
                      placeholder="Сергей Николаевич Котов"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="regEmail" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-700">
                    Электронная почта (E-mail лог)
                  </label>
                  <div className="mt-1.5">
                    <input
                      id="regEmail"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-[#141414] rounded-none focus:outline-none focus:bg-[#F3F4F6] text-[#141414] font-mono text-xs block"
                      placeholder="sega@musicdb.ru"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="regPass" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-700">
                    Придумайте пароль
                  </label>
                  <div className="mt-1.5">
                    <input
                      id="regPass"
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-[#141414] rounded-none focus:outline-none focus:bg-[#F3F4F6] text-[#141414] font-mono text-xs block"
                      placeholder="Сложный пароль СУБД"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Выберите роль и иерархию прав СУБД
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rolesSelectionInfo.map((item) => {
                      const Icon = item.icon;
                      const isSelected = regRole === item.role;
                      return (
                        <button
                          key={item.role}
                          type="button"
                          onClick={() => setRegRole(item.role)}
                          className={`field-btn relative flex flex-col text-left p-2.5 rounded-none border-2 transition-colors cursor-pointer outline-none ${
                            isSelected
                              ? "border-[#141414] bg-[#141414] text-white"
                              : "border-gray-300 bg-white hover:bg-neutral-100 text-[#141414]"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono font-bold uppercase tracking-tight">
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.title}</span>
                            {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0 ml-auto" />}
                          </div>
                          <p className={`text-[9px] leading-tight font-sans ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
                            {item.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border-2 border-[#141414] rounded-none text-xs font-mono font-bold uppercase tracking-wider text-white bg-[#141414] hover:bg-white hover:text-[#141414] transition-all cursor-pointer disabled:bg-neutral-300 disabled:text-neutral-500"
                  >
                    {isLoading ? "Регистрация в PostgreSQL..." : "Записать пользователя (INSERT USER)"}
                  </button>
                </div>
              </form>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
