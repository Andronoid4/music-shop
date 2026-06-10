import React, { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Package, ShoppingCart, Award, Calendar, Receipt, ShieldCheck } from "lucide-react";

export default function FinanceDashboard({ userRole, discs, onRefresh }) {
  const [salesLog, setSalesLog] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userRole === "OWNER") {
      fetchSalesAndLeaders();
    }
  }, [userRole, discs]);

  const fetchSalesAndLeaders = async () => {
    setLoading(true);
    try {
      // 1. Получаем лог всех продаж с бэкенда
      const resSales = await fetch("/api/sales-log", {
        headers: { "x-user-role": userRole }
      });
      const dataSales = await resSales.json();
      if (Array.isArray(dataSales)) {
        setSalesLog(dataSales);
      }

      // 2. Вызываем хранимую функцию get_sales_leaders_this_year
      const resLeaders = await fetch("/api/analytics/sales-leaders?limit=3");
      const dataLeaders = await resLeaders.json();
      if (Array.isArray(dataLeaders)) {
        setLeaders(dataLeaders);
      }
    } catch (err) {
      console.error("Ошибка аналитики:", err);
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== "OWNER") {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 font-sans">
        <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h4 className="font-bold text-slate-800 text-sm">Доступ ограничен</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Финансовые отчеты, маржинальный анализ и расширенная аналитика продаж доступны исключительно пользователю с ролью <strong className="text-emerald-700">Владелец (Owner)</strong> согласно ТЗ проекта.
        </p>
      </div>
    );
  }

  // Расчет общих финансовых показателей
  // Выручка = Сумма (Количество * Розничная цена)
  // Себестоимость оптовая = Сумма (Количество * Оптовая цена)
  // Прибыль маржинальная = Выручка - Себестоимость
  let totalRevenue = 0;
  let totalWholesaleCost = 0;
  let totalPiecesSold = 0;

  salesLog.forEach((log) => {
    const disc = discs.find(d => d.matrix_number === log.disc_matrix_number);
    if (disc) {
      totalRevenue += log.quantity * disc.retail_price;
      totalWholesaleCost += log.quantity * disc.wholesale_price;
      totalPiecesSold += log.quantity;
    }
  });

  const totalProfit = totalRevenue - totalWholesaleCost;

  // Оценка склада
  // Текущая стоимость склада в ценах реализации
  const warehouseRetailValue = discs.reduce((sum, d) => sum + (d.inventory * d.retail_price), 0);
  const warehouseWholesaleValue = discs.reduce((sum, d) => sum + (d.inventory * d.wholesale_price), 0);
  const totalStockItems = discs.reduce((sum, d) => sum + d.inventory, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Сетка индикаторов */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Карточка 1 */}
        <div className="bg-white border-2 border-[#141414] rounded-none p-5 shadow-none flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[#141414] text-[10px] uppercase font-mono font-bold tracking-widest block">Общая выручка</span>
            <h4 className="text-2xl font-black text-[#141414] font-mono">
              {totalRevenue.toLocaleString()} ₽
            </h4>
            <span className="text-xs font-serif italic text-gray-600 block">По розничной стоимости</span>
          </div>
          <div className="p-3 bg-white border border-[#141414] text-[#141414] rounded-none">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Карточка 2 */}
        <div className="bg-white border-2 border-[#141414] rounded-none p-5 shadow-none flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[#141414] text-[10px] uppercase font-mono font-bold tracking-widest block">Чистая прибыль</span>
            <h4 className="text-2xl font-black text-emerald-700 font-mono">
              {totalProfit.toLocaleString()} ₽
            </h4>
            <span className="text-xs font-serif italic text-gray-600 block">Наценка (розница - опт)</span>
          </div>
          <div className="p-3 bg-emerald-550 text-white border border-[#141414] rounded-none bg-neutral-900">
            <TrendingUp className="w-6 h-6 text-[#E4E3E0]" />
          </div>
        </div>

        {/* Карточка 3 */}
        <div className="bg-white border-2 border-[#141414] rounded-none p-5 shadow-none flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[#141414] text-[10px] uppercase font-mono font-bold tracking-widest block">Капитал на складе</span>
            <h4 className="text-2xl font-black text-[#141414] font-mono">
              {warehouseRetailValue.toLocaleString()} ₽
            </h4>
            <span className="text-xs font-serif italic text-gray-600 block">Закупка: {warehouseWholesaleValue.toLocaleString()} ₽</span>
          </div>
          <div className="p-3 bg-white border border-[#141414] text-[#141414] rounded-none">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Карточка 4 */}
        <div className="bg-white border-2 border-[#141414] rounded-none p-5 shadow-none flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[#141414] text-[10px] uppercase font-mono font-bold tracking-widest block">Продано за сессию</span>
            <h4 className="text-2xl font-black text-[#141414] font-mono">
              {totalPiecesSold} шт.
            </h4>
            <span className="text-xs font-serif italic text-gray-600 block">Остаток: {totalStockItems} шт.</span>
          </div>
          <div className="p-3 bg-white border border-[#141414] text-[#141414] rounded-none">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ТОП ПРОДАЖ (Функция get_sales_leaders_this_year) */}
        <div className="lg:col-span-5 bg-white border-2 border-[#141414] rounded-none p-6 shadow-none flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414] flex items-center gap-1.5 border-b border-[#141414] pb-3 mb-4">
              <Award className="w-4.5 h-4.5" />
              Лидеры продаж (PL/pgSQL TOP-3)
            </h4>
            <p className="text-xs font-serif italic text-gray-600 mb-4 font-normal">
              Отображаются пластинки, пользующиеся наивысшим спросом в нынешнем году:
            </p>

            {loading ? (
              <p className="text-xs text-[#141414]/60 italic py-6 font-mono uppercase tracking-widest">Обновление топа...</p>
            ) : leaders.length === 0 ? (
              <p className="text-xs text-[#141414]/60 italic py-6 font-mono">Рейтинг пуст. Зарегистрируйте первую продажу.</p>
            ) : (
              <div className="space-y-5">
                {leaders.map((disc, index) => (
                  <div key={disc.matrix_number} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-[#141414] break-words max-w-[200px]">
                        🏆 #{index + 1} {disc.title}
                      </span>
                      <span className="font-extrabold text-[#141414]">{disc.sales_this_year} шт.</span>
                    </div>
                    {/* Визуальная шкала */}
                    <div className="w-full bg-gray-100 h-3 border border-[#141414] rounded-none overflow-hidden">
                      <div
                        className="bg-[#141414] h-full rounded-none transition-all duration-550"
                        style={{ width: `${Math.min(100, (disc.sales_this_year / 600) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono block">Матрица: {disc.matrix_number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={fetchSalesAndLeaders}
            className="w-full text-center mt-6 text-xs font-mono font-bold uppercase tracking-wider text-white bg-[#141414] hover:bg-white hover:text-[#141414] border-2 border-[#141414] py-2.5 rounded-none transition-all duration-150 cursor-pointer"
          >
            Обновить сводку продаж
          </button>
        </div>

        {/* ЖУРНАЛ ПРОДАЖ (SALES LOG) */}
        <div className="lg:col-span-7 bg-white border-2 border-[#141414] rounded-none p-6 shadow-none flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414] flex items-center gap-1.5 border-b border-[#141414] pb-3 mb-4">
              <Receipt className="w-4.5 h-4.5" />
              Операционный журнал продаж (sales_log)
            </h4>
            <p className="text-xs font-serif italic text-gray-600 mb-4 font-normal">
              Все проведенные покупки дисков заносятся в данную аудиторскую таблицу бэкенда. Каждая запись инициирует триггер списания СУБД:
            </p>

            <div className="max-h-[220px] overflow-y-auto border border-[#141414] rounded-none bg-white">
              {salesLog.length === 0 ? (
                <p className="text-xs text-[#141414]/60 italic py-12 text-center font-mono">Продажи не совершались. Перейдите в каталог и совершите покупку.</p>
              ) : (
                <table className="w-full text-left font-mono text-[11px] text-[#141414] border-collapse">
                  <thead className="bg-[#141414] text-white border-b border-[#141414] sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">ID</th>
                      <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">Матрица диска</th>
                      <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">Кол-во</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider text-[10px]">Выручка</th>
                      <th className="px-3 py-2 text-right font-bold uppercase tracking-wider text-[10px]">Время заказа</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141414]/20">
                    {salesLog.map((log) => {
                      const d = discs.find(di => di.matrix_number === log.disc_matrix_number);
                      const rev = d ? d.retail_price * log.quantity : 0;
                      return (
                        <tr key={log.id} className="hover:bg-neutral-100 transition-all font-mono">
                          <td className="px-3 py-2 text-gray-400">#{log.id}</td>
                          <td className="px-3 py-2 font-bold text-[#141414]">{log.disc_matrix_number}</td>
                          <td className="px-3 py-2 text-stone-900 font-extrabold">{log.quantity} шт.</td>
                          <td className="px-3 py-2 text-right text-emerald-700 font-bold">{rev} ₽</td>
                          <td className="px-3 py-2 text-right text-gray-400 text-[10px]">
                            {new Date(log.purchase_date).toLocaleTimeString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="bg-[#D8D7D4] border border-[#141414] p-4 rounded-none flex items-start gap-2.5 text-[11px] leading-relaxed text-[#141414] mt-5 font-mono">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block uppercase tracking-wider mb-0.5">Целостность данных гарантирована:</span>
              <p>В соответствии с архитектурными требованиями проекта, продажа не может превысить количество товара на складе. Каждое списание транзакционно контролируется триггером <code className="font-bold">trg_on_sale_insert</code> на уровне сервера базы данных.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
