"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ChevronLeft, ChevronRight, Stars, Edit, X } from "lucide-react";
import { generateYear } from "@/service/service";
import Loader from "@/components/loader";
import FinancialOverview from "@/components/financial-overview";
import EditExpenseModal from "@/components/expense/edit-expense-modal";
import EditIncomeModal from "@/components/income/edit-income-modal";

interface IncomeSchedule {
  id: string;
  incomeId: string;
  date: string;
  amount: number;
  isReceived: boolean;
  income?: { name: string };
}

interface ExpenseSchedule {
  id: string;
  expenseId: string;
  date: string;
  amount: number;
  isPaid: boolean;
  expense?: { title: string };
}

interface Saving {
  id: number;
  month: number;
  amount: number;
  isPaid: boolean;
  year: number;
}

export default function Dashboard() {
  const [incomeSchedules, setIncomeSchedules] = useState<IncomeSchedule[]>([]);
  const [expenseSchedules, setExpenseSchedules] = useState<ExpenseSchedule[]>(
    []
  );
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Year generation modal state
  const [showYearModal, setShowYearModal] = useState(false);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modal states
  const [editIncomeModal, setEditIncomeModal] = useState<{
    isOpen: boolean;
    schedule: IncomeSchedule | null;
  }>({ isOpen: false, schedule: null });

  const [editExpenseModal, setEditExpenseModal] = useState<{
    isOpen: boolean;
    schedule: ExpenseSchedule | null;
  }>({ isOpen: false, schedule: null });

  useEffect(() => {
    setCurrentDate(new Date());
    setSelectedDate(new Date().toISOString().split("T")[0]);
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    const supabase = createClient();

    const { data: incomeData, error: incomeError } = await supabase
      .from("incomeschedule")
      .select(
        `
        id,
        incomeId,
        date,
        amount,
        isReceived,
        income:incomeId (
          name
        )
      `
      )
      .order("date", { ascending: true });

    const { data: expenseData, error: expenseError } = await supabase
      .from("expenseschedule")
      .select(
        `
        id,
        expenseId,
        date,
        amount,
        isPaid,
        expense:expenseId (
          title
        )
      `
      )
      .order("date", { ascending: true });

    const { data: savingsData, error: savingsError } = await supabase
      .from("savings")
      .select("*")
      .eq("isObsolete", false)
      .order("year")
      .order("month");

    if (!incomeError && incomeData) {
      const normalized: IncomeSchedule[] = incomeData.map((row: any) => ({
        ...row,
        income: row.income ?? undefined,
      }));

      setIncomeSchedules(normalized);
    }

    if (!expenseError && expenseData) {
      const normalized: ExpenseSchedule[] = expenseData.map((row: any) => ({
        ...row,
        expense: row.expense ?? undefined,
      }));

      setExpenseSchedules(normalized);
    }

    if (!savingsError && savingsData) {
      setSavings(savingsData);
    }

    setLoading(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (dateStr: string) => {
    const incomes = incomeSchedules.filter(
      (schedule) => schedule.date === dateStr
    );
    const expenses = expenseSchedules.filter(
      (schedule) => schedule.date === dateStr
    );
    return { incomes, expenses };
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  const handleOpenYearModal = () => {
    const currentYear = new Date().getFullYear();
    setSelectedYears([currentYear]);
    setShowYearModal(true);
  };

  const handleYearToggle = (year: number) => {
    setSelectedYears((prev) => {
      if (prev.includes(year)) {
        return prev.filter((y) => y !== year);
      } else {
        return [...prev, year].sort();
      }
    });
  };

  const handleGenerateYears = async () => {
    if (selectedYears.length === 0) return;

    try {
      setIsGenerating(true);
      setShowYearModal(false);

      for (const year of selectedYears) {
        await generateYear(year.toString());
      }

      await fetchSchedules();
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrevMonth = () => {
    if (currentDate) {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
      );
    }
  };

  const handleNextMonth = () => {
    if (currentDate) {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
      );
    }
  };

  const handleEditIncome = (schedule: IncomeSchedule) => {
    setEditIncomeModal({ isOpen: true, schedule });
  };

  const handleEditExpense = (schedule: ExpenseSchedule) => {
    setEditExpenseModal({ isOpen: true, schedule });
  };

  const handleModalSuccess = async () => {
    await fetchSchedules();
  };

  if (loading || !currentDate) return <Loader message="Loading..." />;
  if (isGenerating) return <Loader message="Generating schedules..." />;

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentDate);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const selectedEvents = selectedDate
    ? getEventsForDate(selectedDate)
    : { incomes: [], expenses: [] };
  const totalIncome = selectedEvents.incomes.reduce(
    (sum, event) => sum + event.amount,
    0
  );
  const totalExpense = selectedEvents.expenses.reduce(
    (sum, event) => sum + event.amount,
    0
  );
  const netAmount = totalIncome - totalExpense;

  // Generate available years (current year + 4 years)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear + i);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
            Dashboard
          </h1>
          <button
            onClick={handleOpenYearModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition"
          >
            <Stars className="w-5 h-5" />
            Generate Years
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Calendar and Transactions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Calendar Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {monthNames[month]} {year}
                </h2>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {dayNames.map((day, idx) => (
                  <div
                    key={`${day}-${idx}`}
                    className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (day === null) {
                    return (
                      <div key={`empty-${index}`} className="aspect-square" />
                    );
                  }

                  const dateStr = formatDate(year, month, day);
                  const { incomes, expenses } = getEventsForDate(dateStr);
                  const hasEvents = incomes.length > 0 || expenses.length > 0;
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`aspect-square p-1 rounded-md border transition text-xs ${
                        isSelected
                          ? "bg-gray-200 dark:bg-gray-600 border-gray-400 dark:border-gray-500"
                          : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span
                          className={`font-medium ${
                            isSelected
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {day}
                        </span>
                        {hasEvents && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {incomes.length > 0 && (
                              <span className="flex items-center gap-0.5">
                                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                <span
                                  className="text-blue-600 dark:text-blue-400"
                                  style={{ fontSize: "0.6rem" }}
                                >
                                  {incomes.length}
                                </span>
                              </span>
                            )}
                            {expenses.length > 0 && (
                              <span className="flex items-center gap-0.5">
                                <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                <span
                                  className="text-red-600 dark:text-red-400"
                                  style={{ fontSize: "0.6rem" }}
                                >
                                  {expenses.length}
                                </span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transactions Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              {selectedDate ? (
                selectedEvents.incomes.length > 0 ||
                selectedEvents.expenses.length > 0 ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </h3>

                    {selectedEvents.incomes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Income ({selectedEvents.incomes.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedEvents.incomes.map((event) => (
                            <div
                              key={event.id}
                              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                    {event.income?.name}
                                  </p>
                                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-1">
                                    +₱{event.amount.toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                      event.isReceived
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    }`}
                                  >
                                    {event.isReceived ? "Received" : "Pending"}
                                  </div>
                                  <button
                                    onClick={() => handleEditIncome(event)}
                                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                                    title="Edit income"
                                  >
                                    <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEvents.expenses.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          Expenses ({selectedEvents.expenses.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedEvents.expenses.map((event) => (
                            <div
                              key={event.id}
                              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-red-500"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                    {event.expense?.title}
                                  </p>
                                  <p className="text-sm text-red-600 dark:text-red-400 font-semibold mt-1">
                                    -₱{event.amount.toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                      event.isPaid
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    }`}
                                  >
                                    {event.isPaid ? "Paid" : "Pending"}
                                  </div>
                                  <button
                                    onClick={() => handleEditExpense(event)}
                                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                                    title="Edit expense"
                                  >
                                    <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600 space-y-2">
                      {selectedEvents.incomes.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            Total Income:
                          </span>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            +₱{totalIncome.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {selectedEvents.expenses.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            Total Expenses:
                          </span>
                          <span className="text-lg font-bold text-red-600 dark:text-red-400">
                            -₱{totalExpense.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {selectedEvents.incomes.length > 0 &&
                        selectedEvents.expenses.length > 0 && (
                          <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                            <span className="text-base font-semibold text-gray-900 dark:text-white">
                              Net Amount:
                            </span>
                            <span
                              className={`text-xl font-bold ${
                                netAmount >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {netAmount >= 0 ? "+" : ""}₱{netAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No transactions on this date
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Select a date to view transactions
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Financial Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Financial Overview
              </h3>
              <FinancialOverview
                incomeSchedules={incomeSchedules}
                expenseSchedules={expenseSchedules}
                savings={savings}
                currentDate={currentDate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Year Selection Modal */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Select Years to Generate
              </h3>
              <button
                onClick={() => setShowYearModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {availableYears.map((year) => (
                <label
                  key={year}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedYears.includes(year)}
                    onChange={() => handleYearToggle(year)}
                    className="w-5 h-5  accent-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    {year}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowYearModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateYears}
                disabled={selectedYears.length === 0}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Stars className="w-5 h-5" />
                Generate {selectedYears.length > 0 && `(${selectedYears.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modals */}
      {editIncomeModal.schedule && (
        <EditIncomeModal
          isOpen={editIncomeModal.isOpen}
          onClose={() => setEditIncomeModal({ isOpen: false, schedule: null })}
          onSuccess={handleModalSuccess}
          schedule={editIncomeModal.schedule}
        />
      )}

      {editExpenseModal.schedule && (
        <EditExpenseModal
          isOpen={editExpenseModal.isOpen}
          onClose={() => setEditExpenseModal({ isOpen: false, schedule: null })}
          onSuccess={handleModalSuccess}
          schedule={editExpenseModal.schedule}
        />
      )}
    </div>
  );
}