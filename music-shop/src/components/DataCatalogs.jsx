import React, { useState, useEffect } from "react";
import {
  Disc as DiscIcon,
  Users,
  Music,
  Building2,
  ListPlus,
  Trash2,
  Edit,
  ShoppingCart,
  Search,
  Plus,
  RefreshCw,
  TrendingUp,
  HelpCircle,
  FileSpreadsheet,
  Star,
  MessageSquare
} from "lucide-react";

export default function DataCatalogs({
  userRole,
  userEmail,
  discs,
  musicians,
  ensembles,
  musicianEnsembles,
  musicWorks,
  performances,
  manufacturers,
  suppliers,
  reviews,
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState("discs");
  const [searchQuery, setSearchQuery] = useState("");

  // Система отзывов: состояние раскрытия и полей формы отзыва
  const [expandedReviewsDisc, setExpandedReviewsDisc] = useState(null);
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Автозаполнение имени автора зарегистрированным емэйлом
  useEffect(() => {
    if (expandedReviewsDisc) {
      setNewReviewAuthor(userEmail || "Гость-меломан");
      setNewReviewComment("");
      setNewReviewRating(5);
      setReviewError(null);
      setReviewSuccess(null);
    }
  }, [expandedReviewsDisc, userEmail]);

  // Состояния для CRUD модалок
  const [showDiscModal, setShowDiscModal] = useState(false);
  const [editingDisc, setEditingDisc] = useState(null);
  const [showEnsembleModal, setShowEnsembleModal] = useState(false);
  const [showMusicianModal, setShowMusicianModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);

  // Состояния для форм
  const [imageMethod, setImageMethod] = useState("upload");
  const [discForm, setDiscForm] = useState({
    matrix_number: "",
    title: "",
    manufacturer_id: "",
    supplier_id: "",
    wholesale_price: 150,
    retail_price: 250,
    release_date: new Date().toISOString().substring(0, 10),
    inventory: 10,
    image_url: ""
  });

  const [ensembleForm, setEnsembleForm] = useState({
    name: "",
    type: "Оркестр"
  });

  const [musicianForm, setMusicianForm] = useState({
    name: "",
    instruments: ""
  });

  const [linkForm, setLinkForm] = useState({
    musician_id: "",
    ensemble_id: "",
    role: "Исполнитель"
  });

  const [trackForm, setTrackForm] = useState({
    disc_matrix_number: "",
    performance_id: "",
    track_number: 1
  });

  // Локальные селекты для анализа по ансамблю
  const [selectedEnsembleAnalytic, setSelectedEnsembleAnalytic] = useState("");
  const [ensembleWorksCount, setEnsembleWorksCount] = useState(null);
  const [ensembleDiscs, setEnsembleDiscs] = useState([]);

  // Состояние имитации покупки диска
  const [buyingDisc, setBuyingDisc] = useState(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState(null);

  const [discPerformanceLocal, setDiscPerformanceLocal] = useState([]);
  useEffect(() => {
    fetch("/api/disc-performance")
      .then(res => res.json())
      .then(data => setDiscPerformanceLocal(data))
      .catch(_ => setDiscPerformanceLocal([]));
  }, [discs]);

  const discPerformanceFiltered = () => {
    return Array.isArray(discPerformanceLocal) ? discPerformanceLocal : [];
  };

  function disc_performance_for_disc(matrix) {
    return discPerformanceFiltered().filter(dp => dp.disc_matrix_number === matrix);
  }

  // Сброс форм при переключениях
  const resetDiscForm = () => {
    setDiscForm({
      matrix_number: "",
      title: "",
      manufacturer_id: manufacturers[0]?.id.toString() || "",
      supplier_id: suppliers[0]?.id.toString() || "",
      wholesale_price: 500,
      retail_price: 800,
      release_date: new Date().toISOString().substring(0, 10),
      inventory: 20,
      image_url: ""
    });
    setImageMethod("upload");
    setEditingDisc(null);
  };

  const handleFileChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDiscForm((prev) => ({
        ...prev,
        image_url: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Права по ролям
  const canEdit = ["OWNER", "ADMIN"].includes(userRole);
  const canBuy = ["OWNER", "ADMIN", "USER"].includes(userRole);

  const handleRestrictedAction = (actionName) => {
    alert(`Доступ ограничен СУБД!\n\nДействие "${actionName}" требует прав Владельца (OWNER) или Администратора (ADMIN) базы данных.\n\nТекущая роль сессии: "${userRole}".\n\nЧтобы провести это действие, пожалуйста, смените вашу роль в верхней черной панели оценки (в самом верху страницы) на OWNER или ADMIN, и кнопка станет активной!`);
  };

  // Анализ ансамбля при смене селекта
  useEffect(() => {
    if (selectedEnsembleAnalytic) {
      const ensId = parseInt(selectedEnsembleAnalytic);
      // 1. Считаем количество произведений
      fetch(`/api/analytics/works-count/${ensId}`)
        .then(res => res.json())
        .then(data => setEnsembleWorksCount(data.count))
        .catch(_ => setEnsembleWorksCount(0));

      // 2. Находим список компакт-дисков
      fetch(`/api/analytics/discs-by-ensemble/${ensId}`)
        .then(res => res.json())
        .then(data => setEnsembleDiscs(data))
        .catch(_ => setEnsembleDiscs([]));
    } else {
      setEnsembleWorksCount(null);
      setEnsembleDiscs([]);
    }
  }, [selectedEnsembleAnalytic, discs]);

  // Обработчик отправки отзыва
  const handleCreateReview = async (e, matrix) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) {
      setReviewError("Пожалуйста, заполните имя автора и текст отзыва.");
      return;
    }
    setReviewError(null);
    setReviewSuccess(null);
    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({
          disc_matrix_number: matrix,
          reviewer_name: newReviewAuthor.trim(),
          reviewer_email: userEmail,
          rating: newReviewRating,
          comment: newReviewComment.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Не удалось отправить отзыв.");
      }
      setReviewSuccess("Отзыв успешно добавлен в демонстрационную СУБД!");
      setNewReviewComment("");
      onRefresh(); // Обновляем коллекцию отзывов в фоне
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Обработчик удаления отзыва
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Вы уверены, что хотите надежно удалить этот отзыв из базы СУБД?")) {
      return;
    }
    setReviewError(null);
    setReviewSuccess(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          "x-user-role": userRole,
          "x-user-email": userEmail
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Не удалось удалить отзыв.");
      }
      setReviewSuccess("Отзыв успешно удален из демонстрационной СУБД!");
      onRefresh(); // Обновляем коллекцию отзывов в фоне
    } catch (err) {
      setReviewError(err.message);
    }
  };

  // Запуск форм
  const handleCreateDisc = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const url = editingDisc ? `/api/discs/${encodeURIComponent(editingDisc.matrix_number)}` : "/api/discs";
    const method = editingDisc ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole
        },
        body: JSON.stringify(discForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ошибка заполнения данных о пластинке.");
      }

      setShowDiscModal(false);
      resetDiscForm();
      onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateEnsemble = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ensembles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole
        },
        body: JSON.stringify(ensembleForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка создания ансамбля.");

      setShowEnsembleModal(false);
      setEnsembleForm({ name: "", type: "Оркестр" });
      onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateMusician = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await fetch("/api/musicians", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole
        },
        body: JSON.stringify(musicianForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка добавления музыканта.");

      setShowMusicianModal(false);
      setMusicianForm({ name: "", instruments: "" });
      onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleLinkMusician = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await fetch("/api/musician-ensemble", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole
        },
        body: JSON.stringify(linkForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка привязки исполнителя.");

      setShowLinkModal(false);
      onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleAddTrack = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await fetch("/api/disc-performance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole
        },
        body: JSON.stringify(trackForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка записи на пластинку.");

      setShowTrackModal(false);
      onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteDisc = async (matrix) => {
    if (!window.confirm(`Вы уверены, что хотите удалить компакт-диск ${matrix}? Это повлечет за собой каскадные изменения.`)) return;
    try {
      const res = await fetch(`/api/discs/${encodeURIComponent(matrix)}`, {
        method: "DELETE",
        headers: { "x-user-role": userRole }
      });
      if (res.ok) {
        onRefresh();
      } else {
        const data = await res.json();
        alert(`Ошибка удаления диска: ${data.error || "Неизвестная ошибка СУБД"}`);
      }
    } catch (err) {
      alert("Сбой сети при удалении диска");
    }
  };

  const handleDeleteMusician = async (id) => {
    if (!window.confirm("Удаление музыканта повлечет каскадный сброс его связей с ансамблями и авторства произведений. Продолжить?")) return;
    try {
      const res = await fetch(`/api/musicians/${id}`, {
        method: "DELETE",
        headers: { "x-user-role": userRole }
      });
      if (res.ok) {
        onRefresh();
      } else {
        const data = await res.json();
        alert(`Ошибка удаления музыканта: ${data.error || "Неизвестная ошибка СУБД"}`);
      }
    } catch (err) {
      alert("Сбой сети при удалении музыканта");
    }
  };

  const handleDeleteEnsemble = async (id) => {
    if (!window.confirm("Удаление ансамбля повлечет за собой удаление всех связанных исполнений (треков). Продолжить?")) return;
    try {
      const res = await fetch(`/api/ensembles/${id}`, {
        method: "DELETE",
        headers: { "x-user-role": userRole }
      });
      if (res.ok) {
        onRefresh();
      } else {
        const data = await res.json();
        alert(`Ошибка удаления ансамбля: ${data.error || "Неизвестная ошибка СУБД"}`);
      }
    } catch (err) {
      alert("Сбой сети при удалении ансамбля");
    }
  };

  const handlePurchase = async () => {
    if (!buyingDisc) return;
    setErrorMsg(null);
    try {
      const res = await fetch("/api/discs/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole
        },
        body: JSON.stringify({
          matrix_number: buyingDisc.matrix_number,
          quantity: buyQuantity
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Транзакция отклонена.");
      }

      setBuyingDisc(null);
      setBuyQuantity(1);
      onRefresh();
      alert(`Покупка успешно оформлена!\n${data.message}`);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const editDiscClick = (disc) => {
    setEditingDisc(disc);
    setDiscForm({
      matrix_number: disc.matrix_number,
      title: disc.title,
      manufacturer_id: disc.manufacturer_id?.toString() || "",
      supplier_id: disc.supplier_id?.toString() || "",
      wholesale_price: disc.wholesale_price,
      retail_price: disc.retail_price,
      release_date: disc.release_date,
      inventory: disc.inventory,
      image_url: disc.image_url || ""
    });
    setImageMethod(disc.image_url && disc.image_url.startsWith("http") ? "url" : "upload");
    setShowDiscModal(true);
  };

  // Фильтрация дисков поиском по названию диска или по названию входящих музыкальных произведений
  const filteredDiscs = discs.filter(d => {
    const term = searchQuery.toLowerCase();
    const titleMatch = d.title.toLowerCase().includes(term);
    const matrixMatch = d.matrix_number.toLowerCase().includes(term);

    // Поиск по входящим записям произведений
    const mappedPerfIds = disc_performance_for_disc(d.matrix_number).map(dp => dp.performance_id);
    const performanceTitles = performances
      .filter(p => mappedPerfIds.includes(p.id))
      .map(p => {
        const work = musicWorks.find(w => w.id === p.work_id);
        return work ? work.title.toLowerCase() : "";
      });
    const workMatch = performanceTitles.some(title => title.includes(term));

    return titleMatch || matrixMatch || workMatch;
  });

  // Получить название производителя
  const getManName = (id) => {
    if (!id) return "Не указан";
    return manufacturers.find(m => m.id === id)?.name || `ID ${id}`;
  };

  // Получить название поставщика
  const getSupName = (id) => {
    if (!id) return "Не указан";
    return suppliers.find(s => s.id === id)?.name || `ID ${id}`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Меню навигации каталогов */}
      <div className="flex flex-wrap border-b-4 border-[#141414] gap-1 bg-[#D8D7D4] p-1 border-t border-l border-r border-[#141414]">
        <button
          onClick={() => setActiveTab("discs")}
          className={`flex items-center space-x-2 py-3 px-5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-b-0 transition-all focus:outline-none cursor-pointer rounded-none ${
            activeTab === "discs"
              ? "bg-[#141414] text-white border-[#141414]"
              : "border-transparent text-[#141414] hover:bg-white/50"
          }`}
        >
          <DiscIcon className="w-4 h-4" />
          <span>Пластинки & Компакт-диски</span>
        </button>
        <button
          onClick={() => setActiveTab("musicians")}
          className={`flex items-center space-x-2 py-3 px-5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-b-0 transition-all focus:outline-none cursor-pointer rounded-none ${
            activeTab === "musicians"
              ? "bg-[#141414] text-white border-[#141414]"
              : "border-transparent text-[#141414] hover:bg-white/50"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Музыканты (Исполнители)</span>
        </button>
        <button
          onClick={() => setActiveTab("ensembles")}
          className={`flex items-center space-x-2 py-3 px-5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-b-0 transition-all focus:outline-none cursor-pointer rounded-none ${
            activeTab === "ensembles"
              ? "bg-[#141414] text-white border-[#141414]"
              : "border-transparent text-[#141414] hover:bg-white/50"
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Коллективы (Ансамбли)</span>
        </button>
        <button
          onClick={() => setActiveTab("performances")}
          className={`flex items-center space-x-2 py-3 px-5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-b-0 transition-all focus:outline-none cursor-pointer rounded-none ${
            activeTab === "performances"
              ? "bg-[#141414] text-white border-[#141414]"
              : "border-transparent text-[#141414] hover:bg-white/50"
          }`}
        >
          <ListPlus className="w-4 h-4" />
          <span>Произведения & Исполнения</span>
        </button>
        <button
          onClick={() => setActiveTab("companies")}
          className={`flex items-center space-x-2 py-3 px-5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-b-0 transition-all focus:outline-none cursor-pointer rounded-none ${
            activeTab === "companies"
              ? "bg-[#141414] text-white border-[#141414]"
              : "border-transparent text-[#141414] hover:bg-white/50"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Производители & Поставщики</span>
        </button>
      </div>

      {/* Контент вкладок */}

      {/* ВКЛАДКА 1: КОМПАКТ-ДИСКИ */}
      {activeTab === "discs" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#D8D7D4] p-4 rounded-none border-2 border-[#141414]">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-2.5 text-[#141414] w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white text-[#141414] border border-[#141414] rounded-none text-xs font-mono focus:outline-none placeholder-gray-500"
                placeholder="Поиск по названию диска или музыкального трека..."
              />
            </div>

            {canEdit && (
              <button
                onClick={() => {
                  resetDiscForm();
                  setShowDiscModal(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#141414] hover:bg-white hover:text-[#141414] border-2 border-[#141414] text-white font-mono font-bold text-[11px] uppercase tracking-wider rounded-none transition-all duration-100 w-full sm:w-auto justify-center cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Завести новый диск (CALL)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDiscs.map((disc) => {
              const tracks = disc_performance_for_disc(disc.matrix_number);
              const discReviews = (reviews || []).filter(r => r.disc_matrix_number === disc.matrix_number);
              const avgRating = discReviews.length > 0
                ? (discReviews.reduce((sum, r) => sum + r.rating, 0) / discReviews.length).toFixed(1)
                : null;
              return (
                <div
                  key={disc.matrix_number}
                  className="bg-white border-2 border-[#141414] rounded-none overflow-hidden transition-all flex flex-col justify-between hover:translate-x-0.5 hover:-translate-y-0.5 group"
                >
                  {/* Изображение обложки */}
                  <div className="relative h-44 bg-[#F0EFEA] border-b-2 border-[#141414] overflow-hidden">
                    {disc.image_url ? (
                      <img
                        src={disc.image_url}
                        alt={disc.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full p-4 flex flex-col justify-between bg-gradient-to-br from-[#2D2C28] to-[#141414] text-[#E4E3E0] relative border-b border-[#141414]">
                        <div className="flex justify-between items-start">
                          <span className="text-[8px] font-mono tracking-widest text-gray-400 uppercase">STEREO LP / RUSSIA</span>
                          <DiscIcon className="w-5 h-5 text-zinc-500 animate-[spin_8s_linear_infinite]" />
                        </div>
                        <div className="my-auto text-center px-1">
                          <p className="font-serif italic font-extrabold text-[13px] tracking-tight text-amber-500 line-clamp-2 leading-snug">
                            {disc.title}
                          </p>
                        </div>
                        <div className="flex justify-between items-end text-[8px] font-mono text-gray-400">
                          <span>SDBMS COLLECTIBLES</span>
                          <span>{disc.matrix_number}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-3 z-10 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] font-bold text-white bg-[#141414] border border-[#141414] px-1.5 py-0.5 rounded-none font-mono tracking-tight">
                          {disc.matrix_number}
                        </span>
                        {avgRating ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-400 px-1.5 py-0.5 font-mono" title={`Средняя оценка: ${avgRating} из 5 на основе ${discReviews.length} отзывов`}>
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                            <span>{avgRating} ({discReviews.length})</span>
                          </span>
                        ) : (
                          <span className="text-[9px] bg-neutral-100 text-neutral-500 border border-neutral-300 px-1 py-0.5 font-mono">
                            нет отзывов
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-none border border-[#141414] ${
                          disc.inventory > 10
                            ? "bg-emerald-100 text-emerald-800"
                            : disc.inventory > 0
                            ? "bg-amber-100 text-amber-800 animate-pulse"
                            : "bg-rose-100 text-rose-800 font-extrabold"
                        }`}
                      >
                        НА СКЛАДЕ: {disc.inventory} шт.
                      </span>
                    </div>

                    <div>
                      <h4 className="font-serif font-extrabold italic text-slate-900 text-[15px] leading-snug">
                        {disc.title}
                      </h4>
                      <p className="text-[11px] text-[#141414] mt-1 flex items-center gap-1 font-mono">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Производитель: {getManName(disc.manufacturer_id)}</span>
                      </p>
                      <p className="text-[11px] text-[#141414]/70 font-mono mt-0.5">
                        Поставщик: {getSupName(disc.supplier_id)}
                      </p>
                    </div>

                    {/* Музыкальное наполнение диска (Пластинка хранит несколько исполнений) */}
                    <div className="border-t border-[#141414] pt-3 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                          Произведения на диске:
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => {
                              setTrackForm({
                                ...trackForm,
                                disc_matrix_number: disc.matrix_number,
                                performance_id: performances[0]?.id.toString() || ""
                              });
                              setShowTrackModal(true);
                            }}
                            className="text-[10px] text-[#141414] hover:underline font-mono font-extrabold uppercase focus:outline-none cursor-pointer"
                          >
                            + записать
                          </button>
                        )}
                      </div>
                      {tracks.length === 0 ? (
                        <p className="text-xs text-slate-400 italic font-mono">На диске пустые дорожки.</p>
                      ) : (
                        <div className="space-y-1">
                          {tracks.map((tr) => {
                            const perf = performances.find(p => p.id === tr.performance_id);
                            const work = perf ? musicWorks.find(w => w.id === perf.work_id) : null;
                            const ensembleName = perf?.ensemble_id ? ensembles.find(e => e.id === perf.ensemble_id)?.name : "Соло";
                            return (
                              <div key={tr.performance_id} className="flex items-center justify-between text-[11px] bg-neutral-50 p-2 rounded-none border border-[#141414] font-mono">
                                <div className="truncate pr-2">
                                  <span className="font-extrabold text-[#141414] mr-1.5">{tr.track_number || "•"}</span>
                                  <span className="font-bold underline text-[#141414]">{work ? work.title : "Неизвестно"}</span>
                                  <span className="text-gray-500 block text-[9px] truncate">{ensembleName} ({perf?.recording_date})</span>
                                </div>
                                {canEdit && (
                                  <button
                                    onClick={async () => {
                                      if (confirm("Убрать дорожку этого исполнения с диска?")) {
                                        const res = await fetch(`/api/disc-performance/${encodeURIComponent(disc.matrix_number)}/${tr.performance_id}`, {
                                          method: "DELETE",
                                          headers: { "x-user-role": userRole }
                                        });
                                        if (res.ok) {
                                          onRefresh();
                                        } else {
                                          const data = await res.json();
                                          alert(`Ошибка при урезании дорожки: ${data.error || "Неизвестная ошибка СУБД"}`);
                                        }
                                      }
                                    }}
                                    className="text-gray-400 hover:text-rose-600 p-0.5 focus:outline-none cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#D8D7D4] px-5 py-4 border-t-2 border-[#141414]">
                    <div className="flex justify-between items-center mb-3 text-xs leading-none">
                      <div>
                        <span className="text-slate-600 block text-[9px] uppercase font-mono font-bold">Опт. ценник:</span>
                        <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">
                          {["OWNER", "ADMIN"].includes(userRole) ? `${disc.wholesale_price} ₽` : "🔒 Скрыто"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-600 block text-[9px] uppercase font-mono font-bold">Розничная цена:</span>
                        <span className="font-mono font-extrabold text-[#141414] text-base block mt-0.5">
                          {disc.retail_price} ₽
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {canBuy && (
                        <button
                          onClick={() => {
                            setBuyingDisc(disc);
                            setBuyQuantity(1);
                            setErrorMsg(null);
                          }}
                          disabled={disc.inventory === 0}
                          className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-3 bg-white text-[#141414] hover:bg-[#141414] hover:text-white disabled:bg-neutral-200 disabled:text-neutral-500 disabled:border-neutral-300 border-2 border-[#141414] text-xs font-mono font-bold uppercase tracking-wider rounded-none focus:outline-none cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Купить</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setExpandedReviewsDisc(expandedReviewsDisc === disc.matrix_number ? null : disc.matrix_number);
                        }}
                        className={`px-3 py-1.5 border-2 border-[#141414] rounded-none focus:outline-none cursor-pointer transition-all flex items-center gap-1 text-xs font-bold font-mono uppercase ${
                          expandedReviewsDisc === disc.matrix_number
                            ? "bg-[#141414] text-white"
                            : "bg-white hover:bg-neutral-100 text-[#141414]"
                        }`}
                        title="Посмотреть отзывы и оценки по данной пластинке"
                      >
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        <span>Отзывы ({discReviews.length})</span>
                      </button>

                      {canEdit && (
                        <>
                          <button
                            onClick={() => editDiscClick(disc)}
                            className="p-1.5 border-2 border-[#141414] hover:bg-neutral-900 hover:text-white bg-white rounded-none text-[#141414] focus:outline-none cursor-pointer transition-colors"
                            title="Изменить (CALL update_disc)"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDisc(disc.matrix_number)}
                            className="p-1.5 border-2 border-[#141414] hover:bg-red-500 hover:text-white bg-white rounded-none text-[#141414] focus:outline-none cursor-pointer transition-colors"
                            title="Удалить каскадно"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Collapsible Reviews Tray */}
                    {expandedReviewsDisc === disc.matrix_number && (
                      <div className="mt-4 pt-4 border-t border-dashed border-[#141414] bg-neutral-100 p-3 text-xs space-y-3 animate-fadeIn">
                        <div className="flex justify-between items-center">
                          <h5 className="font-mono font-bold uppercase tracking-wide text-[#141414] flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Отзывы из базы СУБД ({discReviews.length})
                          </h5>
                          {avgRating && (
                            <span className="font-mono bg-[#141414] text-white px-1.5 py-0.5 font-bold">
                              ★ {avgRating}/5
                            </span>
                          )}
                        </div>

                        {/* List of Reviews */}
                        {discReviews.length === 0 ? (
                          <p className="text-[10px] text-gray-500 italic bg-white p-2 border border-slate-300 font-mono">
                            Отзывов на этот компакт-диск еще никто не оставлял. Будьте первым!
                          </p>
                        ) : (
                          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                            {discReviews.map((rev) => (
                              <div key={rev.id} className="bg-white p-2.5 border border-[#141414] rounded-none space-y-1">
                                <div className="flex justify-between items-start text-[9px] font-mono text-gray-500">
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-[#141414]">{rev.reviewer_name}</span>
                                    {rev.reviewer_email && (
                                      <span className="text-[8px] text-gray-400 lowercase leading-none mt-0.5">{rev.reviewer_email}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span>{rev.created_at}</span>
                                    {(["OWNER", "ADMIN"].includes(userRole) ||
                                      (userEmail && rev.reviewer_email && rev.reviewer_email.toLowerCase() === userEmail.toLowerCase())) && (
                                      <button
                                        onClick={() => handleDeleteReview(rev.id)}
                                        className="text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-600 font-bold uppercase text-[8px] tracking-wider px-1 cursor-pointer focus:outline-none ml-1 duration-100 transition-colors"
                                        title="Удалить данный отзыв из базы"
                                      >
                                        Удалить
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-0.5 text-amber-500">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${i < rev.rating ? "fill-amber-500 text-amber-600" : "text-gray-300"}`}
                                    />
                                  ))}
                                </div>
                                <p className="text-[11px] text-[#141414] leading-normal font-mono text-slate-700 whitespace-pre-wrap">
                                  {rev.comment}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Submit a review Form */}
                        <form onSubmit={(e) => handleCreateReview(e, disc.matrix_number)} className="bg-white p-3 border border-[#141414] space-y-2">
                          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-500">Оставить отзыв в СУБД:</p>

                          {reviewError && (
                            <div className="text-[10px] text-rose-700 font-mono p-1 bg-rose-50 border border-rose-300">
                              {reviewError}
                            </div>
                          )}
                          {reviewSuccess && (
                            <div className="text-[10px] text-emerald-800 font-mono p-1 bg-emerald-50 border border-emerald-300">
                              {reviewSuccess}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-mono font-bold text-gray-600 uppercase mb-0.5">Кто ставит:</label>
                              <input
                                type="text"
                                value={newReviewAuthor}
                                onChange={(e) => setNewReviewAuthor(e.target.value)}
                                className="w-full text-[10px] font-mono p-1 border border-neutral-400 bg-neutral-50 focus:outline-none"
                                placeholder="Ваше имя/email"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-mono font-bold text-gray-600 uppercase mb-0.5">Оценка:</label>
                              <select
                                value={newReviewRating}
                                onChange={(e) => setNewReviewRating(parseInt(e.target.value))}
                                className="w-full text-[10px] font-mono p-1 border border-neutral-400 bg-neutral-50 focus:outline-none focus:ring-0 font-bold"
                              >
                                <option value="5">⭐⭐⭐⭐⭐ (5 звезд)</option>
                                <option value="4">⭐⭐⭐⭐ (4 звезды)</option>
                                <option value="3">⭐⭐⭐ (3 звезды)</option>
                                <option value="2">⭐⭐ (2 звезды)</option>
                                <option value="1">⭐ (1 звезда)</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-mono font-bold text-gray-600 uppercase mb-0.5">Впечатление (комментарий):</label>
                            <textarea
                              value={newReviewComment}
                              onChange={(e) => setNewReviewComment(e.target.value)}
                              className="w-full text-[10px] font-mono p-1 border border-neutral-400 bg-neutral-50 h-11 focus:outline-none"
                              placeholder="Напишите пару слов для логов СУБД..."
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmittingReview}
                            className="w-full py-1 bg-neutral-900 hover:bg-black text-white rounded-none text-[10px] font-mono font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
                          >
                            {isSubmittingReview ? "Добавление..." : "Добавить отзыв"}
                          </button>
                        </form>
                      </div>
                    )}
                    <div className="mt-3 text-right">
                      <span className="text-[10px] text-slate-500 font-mono">Продано за год: {disc.sales_this_year} шт.</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ВКЛАДКА 2: МУЗЫКАНТЫ */}
      {activeTab === "musicians" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#D8D7D4] p-4 rounded-none border-2 border-[#141414]">
            <span className="text-xs font-mono font-bold text-[#141414]/80 uppercase">
              Музыканты: исполнители, композиторы, дирижеры
            </span>
            {canEdit && (
              <button
                onClick={() => {
                  setMusicianForm({ name: "", instruments: "" });
                  setShowMusicianModal(true);
                }}
                className="flex items-center space-x-1.5 bg-[#141414] text-white px-4 py-2 border-2 border-[#141414] rounded-none hover:bg-white hover:text-[#141414] font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить музыканта (CALL)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
            {musicians.map((m) => (
              <div
                key={m.id}
                className="bg-white border-2 border-[#141414] rounded-none p-4 shadow-[3px_3px_0px_rgba(20,20,20,0.06)] flex justify-between items-start hover:shadow-[5px_5px_0px_rgba(20,20,20,0.1)] transition-all"
              >
                <div className="space-y-1">
                  <h4 className="font-extrabold text-[#141414] text-sm leading-tight">{m.name}</h4>
                  <p className="text-xs text-rose-850 font-semibold">{m.instruments}</p>
                  <p className="text-[10px] text-slate-400">ID Карточки СУБД: {m.id}</p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleDeleteMusician(m.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 border border-transparent hover:border-rose-250 hover:bg-rose-50 rounded-none transition-all cursor-pointer focus:outline-none"
                    title="Удалить музыканта из БД"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ВКЛАДКА 3: АНСАМБЛИ (КОЛЛЕКТИВЫ) */}
      {activeTab === "ensembles" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#D8D7D4] p-4 rounded-none border-2 border-[#141414]">
              <span className="text-xs font-mono font-bold text-[#141414]/80 uppercase">Музыкальные коллективы и оркестры разных жанров</span>
              {canEdit && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setLinkForm({
                        ...linkForm,
                        musician_id: musicians[0]?.id.toString() || "",
                        ensemble_id: ensembles[0]?.id.toString() || ""
                      });
                      setShowLinkModal(true);
                    }}
                    className="flex items-center space-x-1.5 bg-white border-2 border-[#141414] px-4 py-2 rounded-none text-[#141414] hover:bg-[#141414] hover:text-white font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 font-bold" />
                    <span>Связать музыканта (M2M)</span>
                  </button>
                  <button
                    onClick={() => setShowEnsembleModal(true)}
                    className="flex items-center space-x-1.5 bg-amber-500 border-2 border-[#141414] px-4 py-2 rounded-none text-[#141414] hover:bg-amber-400 font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 font-bold" />
                    <span>Ввод ансамбля (CALL)</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {ensembles.map((e) => {
                const links = musicianEnsembles.filter(me => me.ensemble_id === e.id);
                return (
                  <div key={e.id} className="bg-white border-2 border-[#141414] rounded-none p-5 shadow-[4px_4px_0px_rgba(20,20,20,0.06)] space-y-4">
                    <div className="flex justify-between items-start border-b-2 border-dashed border-[#141414]/20 pb-3">
                      <div>
                        <h4 className="font-extrabold text-[#141414] text-base">{e.name}</h4>
                        <span className="text-xs font-semibold text-slate-400 font-mono">ТИП: {e.type} (ID: {e.id})</span>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteEnsemble(e.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer focus:outline-none"
                          title="Удалить ансамбль"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] font-extrabold text-[#141414]/60 uppercase tracking-widest font-mono mb-2">Состав музыкантов (M2M связи):</p>
                      {links.length === 0 ? (
                        <p className="text-xs text-slate-400 italic font-mono">Связи не установлены. Коллектив пуст.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {links.map((link) => {
                            const musician = musicians.find(m => m.id === link.musician_id);
                            return (
                              <div key={link.musician_id} className="flex items-center justify-between p-2.5 bg-[#E4E3E0] border border-[#141414]/30 rounded-none text-xs font-mono">
                                <div className="truncate pr-1">
                                  <span className="font-bold text-[#141414]">{musician ? musician.name : `Музыкант #${link.musician_id}`}</span>
                                  <span className="text-neutral-500 block text-[10px] italic">{link.role}</span>
                                </div>
                                {canEdit && (
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Разорвать M2M отношение: Исключить музыканта из ансамбля?`)) {
                                        const res = await fetch(`/api/musician-ensemble/${link.musician_id}/${e.id}`, {
                                          method: "DELETE",
                                          headers: { "x-user-role": userRole }
                                        });
                                        if (res.ok) {
                                          onRefresh();
                                        } else {
                                          const data = await res.json();
                                          alert(`Ошибка при выходе из ансамбля: ${data.error || "Неизвестная ошибка СУБД"}`);
                                        }
                                      }
                                    }}
                                    className="text-slate-400 hover:text-rose-600 focus:outline-none cursor-pointer p-0.5"
                                    title="Убрать участника"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4 font-mono">
            <div className="bg-white border-2 border-[#141414] rounded-none p-5 shadow-[4px_4px_0px_rgba(20,20,20,0.06)] space-y-4">
              <h4 className="text-sm font-extrabold text-[#141414] border-b-2 border-dashed border-[#141414]/20 pb-2 flex items-center gap-1.5 uppercase">
                <TrendingUp className="w-4.5 h-4.5 text-[#141414]" />
                Аналитика ансамбля
              </h4>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Выбрать коллектив</label>
                <select
                  value={selectedEnsembleAnalytic}
                  onChange={(e) => setSelectedEnsembleAnalytic(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 border-2 border-[#141414] bg-white text-slate-800 rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Выберите ансамбль --</option>
                  {ensembles.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              {selectedEnsembleAnalytic && (
                <div className="space-y-4 pt-2 border-t-2 border-dashed border-[#141414]/20 animate-fadeIn">
                  {/* 1) Результат get_music_works_count */}
                  <div className="bg-[#E4E3E0] p-3.5 rounded-none border-2 border-[#141414]">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
                      Вызов get_music_works_count():
                    </span>
                    <span className="text-3xl font-extrabold text-amber-600 font-mono block mt-1">
                      {ensembleWorksCount !== null ? ensembleWorksCount : "..."}
                    </span>
                    <span className="text-[11px] font-mono text-slate-700 mt-1 block leading-normal">
                      уникальных музыкальных произведений исполнено данным ансамблем
                    </span>
                  </div>

                  {/* 2) Результат get_discs_by_ensemble */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
                      Вызов get_discs_by_ensemble():
                    </span>
                    {ensembleDiscs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic bg-[#E4E3E0] p-3 rounded-none border-2 border-[#141414] font-mono">У ансамбля нет выпущенных дисков.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {ensembleDiscs.map((d) => (
                          <div key={d.matrix_number} className="bg-white p-2.5 rounded-none border-2 border-[#141414] flex items-center justify-between text-xs font-mono">
                            <div className="truncate pr-2">
                              <span className="font-extrabold text-slate-800 block truncate max-w-[170px]">{d.title}</span>
                              <span className="text-[10px] text-slate-500">{d.matrix_number}</span>
                            </div>
                            <span className="font-bold text-amber-600">{d.retail_price} ₽</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ВКЛАДКА 4: ПРОИЗВЕДЕНИЯ И ИСПОЛНЕНИЯ */}
      {activeTab === "performances" && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#141414] rounded-none p-5 shadow-[4px_4px_0px_rgba(20,20,20,0.06)] space-y-4">
            <h3 className="text-sm font-extrabold text-[#141414] border-b-2 border-dashed border-[#141414]/20 pb-2 font-mono uppercase">Музыкальные произведения каталога</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {musicWorks.map((work) => {
                const composer = musicians.find(m => m.id === work.composer_id);
                return (
                  <div key={work.id} className="p-3 bg-[#E4E3E0] border border-[#141414]/30 rounded-none flex items-center justify-between font-mono">
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm leading-snug">{work.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">Композитор: <span className="font-bold text-[#141414]">{composer ? composer.name : "Неизвестный автор"}</span></p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {work.id}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Обстоятельства исполнения (Исполнения) */}
          <div className="bg-white border-2 border-[#141414] rounded-none p-5 shadow-[4px_4px_0px_rgba(20,20,20,0.06)] space-y-4">
            <h3 className="text-sm font-extrabold text-[#141414] border-b-2 border-dashed border-[#141414]/20 pb-2 font-mono uppercase">Архив записей (Обстоятельства исполнения)</h3>
            <div className="space-y-3">
              {performances.map((perf) => {
                const work = musicWorks.find(w => w.id === perf.work_id);
                const ensemble = ensembles.find(e => e.id === perf.ensemble_id);
                const conductor = musicians.find(m => m.id === perf.conductor_id);
                return (
                  <div key={perf.id} className="p-3.5 bg-white border-2 border-[#141414] hover:bg-[#E4E3E0]/20 rounded-none transition-all flex flex-col sm:flex-row justify-between sm:items-center text-xs gap-3 font-mono">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-amber-600 font-bold">Исполнение #{perf.id}</span>
                        <span className="bg-amber-100 border border-amber-300 text-amber-850 text-[10px] px-2 py-0.5 rounded-none font-bold uppercase tracking-wider">
                          Студийная запись
                        </span>
                      </div>
                      <p className="text-[#141414] text-sm font-extrabold">{work?.title || `Произведение ID ${perf.work_id}`}</p>
                      <div className="text-slate-600 flex flex-wrap gap-x-4 gap-y-1 mt-1 leading-normal">
                        <span>Коллектив: <strong className="text-slate-800 font-extrabold">{ensemble?.name || "Сольное исполнение"}</strong></span>
                        {conductor && <span>Дирижер: <strong className="text-slate-800 font-extrabold">{conductor.name}</strong></span>}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0 font-mono text-[11px] text-slate-400">
                      <span className="bg-[#E4E3E0] text-[#141414] border border-[#141414]/20 font-bold px-2 py-0.5 rounded-none text-[10px] mb-1">ДАТА: {perf.recording_date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ВКЛАДКА 5: ПРОИЗВОДИТЕЛИ И ПОСТАВЩИКИ */}
      {activeTab === "companies" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Фирмы-производители */}
          <div className="bg-white border-2 border-[#141414] rounded-none p-5 shadow-[4px_4px_0px_rgba(20,20,20,0.06)] space-y-4">
            <h4 className="text-sm font-extrabold text-[#141414] border-b-2 border-dashed border-[#141414]/20 pb-2 flex items-center gap-1.5 font-mono uppercase">
              <Building2 className="w-4.5 h-4.5 text-amber-500" />
              Компании-производители (Рекординги)
            </h4>
            <div className="space-y-3 font-mono">
              {manufacturers.map((m) => (
                <div key={m.id} className="p-3 bg-[#E4E3E0] border border-[#141414]/30 rounded-none text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-[#141414] text-sm">{m.name}</span>
                    {m.is_supplier && (
                      <span className="bg-emerald-100 border border-emerald-500 text-emerald-950 text-[10px] px-1.5 py-0.5 rounded-none font-bold uppercase tracking-wider">
                        Является оптовиком
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600">Адрес завода: {m.address}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Оптовые фирмы */}
          <div className="bg-white border-2 border-[#141414] rounded-none p-5 shadow-[4px_4px_0px_rgba(20,20,20,0.06)] space-y-4">
            <h4 className="text-sm font-extrabold text-[#141414] border-b-2 border-dashed border-[#141414]/20 pb-2 flex items-center gap-1.5 font-mono uppercase">
              <FileSpreadsheet className="w-4.5 h-4.5 text-amber-500" />
              Оптовые дистрибьюторские фирмы
            </h4>
            <div className="space-y-3 font-mono">
              {suppliers.map((s) => (
                <div key={s.id} className="p-3 bg-[#E4E3E0] border border-[#141414]/30 rounded-none text-xs space-y-1">
                  <p className="font-extrabold text-[#141414] text-sm">{s.name}</p>
                  <p className="text-slate-600">Фактический адрес фирмы: {s.address}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =============================================================================
          МОДАЛЬНЫЕ ОКНА И ФОРМЫ (Modals)
          ============================================================================= */}

      {/* МОДАЛКА: ЗАВЕСТИ / ИЗМЕНИТЬ ДИСК (CALL insert_disc / update_disc) */}
      {showDiscModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-extrabold text-slate-900 text-sm">
                {editingDisc ? `Изменение диска (CALL update_disc) ${editingDisc.matrix_number}` : "Ввод компакт-диска (CALL insert_disc)"}
              </h4>
              <button onClick={() => setShowDiscModal(false)} className="text-slate-450 hover:text-slate-600 text-xs font-bold focus:outline-none">Закрыть</button>
            </div>

            <form onSubmit={handleCreateDisc} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 font-mono text-xs rounded">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!editingDisc && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Номер матрицы (Unique)*</label>
                    <input
                      type="text"
                      required
                      value={discForm.matrix_number}
                      onChange={(e) => setDiscForm({ ...discForm, matrix_number: e.target.value })}
                      placeholder="EMI-1999-D2"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    />
                  </div>
                )}
                <div className={editingDisc ? "col-span-2" : ""}>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Альбом / Название диска*</label>
                  <input
                    type="text"
                    required
                    value={discForm.title}
                    onChange={(e) => setDiscForm({ ...discForm, title: e.target.value })}
                    placeholder="Chopin: Nocturnes"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Способ добавления картинки */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-550 font-mono">Обложка / Фотография альбома</span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setImageMethod("upload")}
                    className={`py-1.5 px-3 font-mono font-bold border rounded-lg transition-colors cursor-pointer ${
                      imageMethod === "upload" 
                        ? "bg-[#141414] text-white border-transparent" 
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    Загрузить файл (Base64)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMethod("url")}
                    className={`py-1.5 px-3 font-mono font-bold border rounded-lg transition-colors cursor-pointer ${
                      imageMethod === "url" 
                        ? "bg-[#141414] text-white border-transparent" 
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    Вставить URL ссылки
                  </button>
                </div>

                {imageMethod === "upload" ? (
                  <div className="space-y-2">
                    <div 
                      className="border-2 border-dashed border-slate-300 hover:border-[#141414] rounded-xl p-4 text-center cursor-pointer bg-white transition-colors flex flex-col items-center justify-center space-y-1 relative group"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith("image/")) {
                          handleFileChange(file);
                        }
                      }}
                      onClick={() => document.getElementById("disc-image-file")?.click()}
                    >
                      <input 
                        id="disc-image-file"
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileChange(file);
                        }}
                      />
                      <svg className="w-8 h-8 text-slate-400 group-hover:text-slate-600 transition-colors mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[11px] font-bold text-slate-700">Перетащите сюда фото или выберите кликом</span>
                      <span className="text-[9px] text-slate-455 block">JPG, PNG, GIF до 2МБ</span>
                    </div>

                    {discForm.image_url && (
                      <div className="flex items-center space-x-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                        <img 
                          src={discForm.image_url} 
                          alt="Миниатюра" 
                          className="w-12 h-12 object-cover rounded-md border border-neutral-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-emerald-800 font-bold font-mono">Фото успешно загружено!</p>
                          <p className="text-[8px] text-gray-400 truncate max-w-[150px]">Base64 Data URI</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setDiscForm({ ...discForm, image_url: "" })}
                          className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                        >
                          Сбросить
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-600">URL Ссылка на обложку</label>
                    <input
                      type="url"
                      value={discForm.image_url}
                      onChange={(e) => setDiscForm({ ...discForm, image_url: e.target.value })}
                      placeholder="https://images.unsplash.com/... или Base64"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[9px] font-mono text-slate-450 self-center uppercase">Быстрые пресеты:</span>
                      {[
                        { label: "Jazz Sax", url: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400" },
                        { label: "Orchestra", url: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&q=80&w=400" },
                        { label: "Neon Light", url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400" },
                        { label: "Vintage Mic", url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400" }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setDiscForm({ ...discForm, image_url: preset.url })}
                          className="text-[9px] bg-white hover:bg-[#141414] hover:text-white border border-slate-300 rounded-none px-1.5 py-0.5 font-bold font-mono transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!editingDisc && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Фирма-производитель*</label>
                    <select
                      value={discForm.manufacturer_id}
                      onChange={(e) => setDiscForm({ ...discForm, manufacturer_id: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    >
                      {manufacturers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Оптовый поставщик</label>
                    <select
                      value={discForm.supplier_id}
                      onChange={(e) => setDiscForm({ ...discForm, supplier_id: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                    >
                      <option value="">-- Автовыбор / Производитель --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Оптовая цена*</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={discForm.wholesale_price}
                    onChange={(e) => setDiscForm({ ...discForm, wholesale_price: parseFloat(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Розничная цена*</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={discForm.retail_price}
                    onChange={(e) => setDiscForm({ ...discForm, retail_price: parseFloat(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">На складе (шт)*</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={discForm.inventory}
                    onChange={(e) => setDiscForm({ ...discForm, inventory: parseInt(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>
              </div>

              {!editingDisc && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Дата выпуска*</label>
                  <input
                    type="date"
                    required
                    value={discForm.release_date}
                    onChange={(e) => setDiscForm({ ...discForm, release_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>
              )}

              <div className="pt-2 border-t-2 border-dashed border-[#141414]/20 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDiscModal(false)}
                  className="px-4 py-2 border-2 border-[#141414] bg-white text-[#141414] hover:bg-[#E4E3E0] rounded-none font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-[#141414] bg-amber-500 hover:bg-amber-400 text-[#141414] rounded-none font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
                >
                  Записать в СУБД
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: ВВОД НОВОГО АНСАМБЛЯ (CALL insert_ensemble) */}
      {showEnsembleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scaleIn">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-extrabold text-slate-900 text-sm">Ввод нового ансамбля</h4>
              <button onClick={() => setShowEnsembleModal(false)} className="text-slate-450 hover:text-slate-600 text-xs font-bold focus:outline-none">Закрыть</button>
            </div>

            <form onSubmit={handleCreateEnsemble} className="p-5 space-y-4">
              {errorMsg && <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 font-mono text-xs rounded">{errorMsg}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Название ансамбля*</label>
                <input
                  type="text"
                  required
                  value={ensembleForm.name}
                  onChange={(e) => setEnsembleForm({ ...ensembleForm, name: e.target.value })}
                  placeholder="Берлинский филармонический оркестр"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Тип ансамбля*</label>
                <select
                  value={ensembleForm.type}
                  onChange={(e) => setEnsembleForm({ ...ensembleForm, type: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  <option value="Оркестр">Оркестр</option>
                  <option value="Джаз-группа">Джаз-группа / Ансамбль</option>
                  <option value="Квартет">Квартет</option>
                  <option value="Дуэт">Дуэт</option>
                  <option value="Камерный ансамбль">Камерный ансамбль</option>
                </select>
              </div>

              <div className="pt-2 border-t-2 border-dashed border-[#141414]/20 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEnsembleModal(false)}
                  className="px-4 py-2 border-2 border-[#141414] bg-white text-[#141414] hover:bg-[#E4E3E0] rounded-none font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-[#141414] bg-amber-500 hover:bg-amber-400 text-[#141414] rounded-none font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
                >
                  Запустить CALL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: ДОБАВИТЬ МУЗЫКАНТА */}
      {showMusicianModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scaleIn">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-extrabold text-slate-900 text-sm">Новый музыкант</h4>
              <button onClick={() => setShowMusicianModal(false)} className="text-slate-450 hover:text-slate-600 text-xs font-bold focus:outline-none">Закрыть</button>
            </div>

            <form onSubmit={handleCreateMusician} className="p-5 space-y-4">
              {errorMsg && <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 font-mono text-xs rounded">{errorMsg}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ФИО Музыканта*</label>
                <input
                  type="text"
                  required
                  value={musicianForm.name}
                  onChange={(e) => setMusicianForm({ ...musicianForm, name: e.target.value })}
                  placeholder="Вольфганг Амадей Моцарт"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Инструменты & Роль*</label>
                <input
                  type="text"
                  required
                  value={musicianForm.instruments}
                  onChange={(e) => setMusicianForm({ ...musicianForm, instruments: e.target.value })}
                  placeholder="Фортепиано, Скрипка (Композитор)"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>

              <div className="pt-2 border-t-2 border-dashed border-[#141414]/20 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowMusicianModal(false)}
                  className="px-4 py-2 border-2 border-[#141414] bg-white text-[#141414] hover:bg-[#E4E3E0] rounded-none font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-[#141414] bg-amber-500 hover:bg-amber-400 text-[#141414] rounded-none font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: СВЯЗЬ МУЗЫКАНТ-АНСАМБЛЬ (M2M) */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scaleIn">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-extrabold text-slate-900 text-sm">Связать Музыканта с Ансамблем</h4>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-450 hover:text-slate-600 text-xs font-bold focus:outline-none">Закрыть</button>
            </div>

            <form onSubmit={handleLinkMusician} className="p-5 space-y-4">
              {errorMsg && <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 font-mono text-xs rounded">{errorMsg}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Исполнитель/Музыкант*</label>
                <select
                  value={linkForm.musician_id}
                  onChange={(e) => setLinkForm({ ...linkForm, musician_id: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  {musicians.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Коллектив (Ансамбль)*</label>
                <select
                  value={linkForm.ensemble_id}
                  onChange={(e) => setLinkForm({ ...linkForm, ensemble_id: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  {ensembles.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Роль в ансамбле*</label>
                <input
                  type="text"
                  required
                  value={linkForm.role}
                  onChange={(e) => setLinkForm({ ...linkForm, role: e.target.value })}
                  placeholder="Солист, Скрипач"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>

              <div className="pt-2 border-t-2 border-dashed border-[#141414]/20 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 border-2 border-[#141414] bg-white text-[#141414] hover:bg-[#E4E3E0] rounded-none font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-[#141414] bg-amber-500 hover:bg-amber-400 text-[#141414] rounded-none font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
                >
                  Сохранить M2M связь
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: ЗАПИСАТЬ ТРЕК НА ПЛАСТИНКУ */}
      {showTrackModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-[#141414] rounded-none shadow-[6px_6px_0px_#141414] w-full max-w-sm overflow-hidden animate-scaleIn">
            <div className="px-5 py-4 bg-amber-500 text-[#141414] border-b-2 border-[#141414] flex justify-between items-center">
              <h4 className="font-extrabold text-[#141414] text-sm uppercase font-mono">Добавить трек к диску</h4>
              <button onClick={() => setShowTrackModal(false)} className="text-[#141414]/70 hover:text-[#141414] font-mono font-bold text-xs uppercase focus:outline-none cursor-pointer">Закрыть</button>
            </div>

            <form onSubmit={handleAddTrack} className="p-5 space-y-4 font-mono">
              {errorMsg && <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 font-mono text-xs rounded-none">{errorMsg}</div>}

              <div>
                <label className="block text-xs font-bold text-[#141414]/70 mb-1 uppercase">Диск (Код матрицы)</label>
                <input
                  type="text"
                  disabled
                  value={trackForm.disc_matrix_number}
                  className="w-full text-xs px-3 py-2 border-2 border-[#141414] rounded-none bg-slate-100 text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141414]/70 mb-1 uppercase">Студийное исполнение*</label>
                <select
                  value={trackForm.performance_id}
                  onChange={(e) => setTrackForm({ ...trackForm, performance_id: e.target.value })}
                  className="w-full text-xs px-3 py-2 border-2 border-[#141414] rounded-none bg-white text-slate-900 font-mono"
                >
                  <option value="">-- Выберите исполнение --</option>
                  {performances.map(p => {
                    const work = musicWorks.find(w => w.id === p.work_id);
                    const ens = p.ensemble_id ? ensembles.find(e => e.id === p.ensemble_id) : null;
                    return (
                      <option key={p.id} value={p.id}>
                        Perf #{p.id}: {work ? work.title : "ID " + p.work_id} ({ens ? ens.name : "Соло"})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141414]/70 mb-1 uppercase">Номер дорожки (Track number)*</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={trackForm.track_number}
                  onChange={(e) => setTrackForm({ ...trackForm, track_number: parseInt(e.target.value) })}
                  className="w-full text-xs px-3 py-2 border-2 border-[#141414] rounded-none bg-white text-slate-900"
                />
              </div>

              <div className="pt-2 border-t-2 border-dashed border-[#141414]/20 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTrackModal(false)}
                  className="px-4 py-2 border-2 border-[#141414] bg-white text-[#141414] hover:bg-[#E4E3E0] rounded-none font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-[#141414] bg-amber-500 hover:bg-amber-400 text-[#141414] rounded-none font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
                >
                  Записать на пластинку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: ИМИТАЦИЯ ПОКУПКИ ДИСКА */}
      {buyingDisc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-[#141414] rounded-none shadow-[6px_6px_0px_#141414] w-full max-w-sm overflow-hidden animate-scaleIn">
            <div className="px-5 py-4 bg-amber-500 text-[#141414] border-b-2 border-[#141414] flex justify-between items-center">
              <h4 className="font-extrabold text-sm flex items-center gap-1.5 uppercase font-mono">
                <ShoppingCart className="w-4 h-4 font-bold" />
                Оформление покупки
              </h4>
              <button onClick={() => setBuyingDisc(null)} className="text-[#141414]/70 hover:text-[#141414] font-mono font-bold text-xs uppercase focus:outline-none cursor-pointer">Закрыть</button>
            </div>

            <div className="p-5 space-y-4 font-mono">
              <div className="bg-[#F5F4F0] p-3 rounded-none border-2 border-[#141414] text-xs space-y-1 text-[#141414]">
                <span className="text-[10px] text-[#141414]/60 font-mono font-bold uppercase tracking-wider block">Пластинка:</span>
                <p className="font-bold text-[#141414] sm:text-sm leading-tight">{buyingDisc.title}</p>
                <p className="text-slate-500 font-mono">Матрица: {buyingDisc.matrix_number}</p>
                <p className="text-[#141414] font-semibold mt-1">
                  Стоимость: <span className="font-mono font-bold">{buyingDisc.retail_price} ₽ / шт</span>
                </p>
                <p className="text-slate-400 font-mono">Остаток на складе: {buyingDisc.inventory} шт.</p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border-2 border-rose-500 text-rose-800 font-mono text-xs rounded-none">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Количество для покупки (экземпляры)*</label>
                <input
                  type="number"
                  min="1"
                  max={buyingDisc.inventory}
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(parseInt(e.target.value) || 1)}
                  className="w-full text-sm font-bold px-3 py-2 border-2 border-[#141414] rounded-none text-slate-900 bg-white"
                />
              </div>

              <div className="bg-[#E4E3E0] p-3 rounded-none border-2 border-[#141414] text-xs text-[#141414] space-y-1">
                <span className="font-bold block uppercase tracking-wide text-[10px] text-[#141414]/70">🧾 Итоговый финансовый расчет:</span>
                <div className="flex justify-between font-mono font-extrabold text-sm text-[#141414]">
                  <span>Общая сумма к оплате:</span>
                  <span>{buyingDisc.retail_price * buyQuantity} ₽</span>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-dashed border-[#141414]/20 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setBuyingDisc(null)}
                  className="px-4 py-2 border-2 border-[#141414] bg-white text-[#141414] hover:bg-[#E4E3E0] rounded-none font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handlePurchase}
                  className="px-5 py-2 border-2 border-[#141414] bg-amber-500 hover:bg-amber-400 text-[#141414] rounded-none font-mono font-bold text-xs uppercase transition-all shadow-[2px_2px_0px_#141414] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#141414] focus:outline-none cursor-pointer"
                >
                  Провести транзакцию в СУБД
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
