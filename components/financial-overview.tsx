import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  Wallet,
  PiggyBank,
} from "lucide-react";
import IncomeRecordsModal from "./income-record-modal";
import ExpenseRecordsModal from "./expense-record-modal";
import SavingsRecordsModal from "./savings-record-modal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface IncomeSchedule {
  id: string;
  date: string;
  amount: number;
  isReceived: boolean;
  income?: { name: string };
}

interface ExpenseSchedule {
  id: string;
  date: string;
  amount: number;
  isPaid: boolean;
  expense?: {
    title: string;
    category?: { id: string | number; name: string } | null;
  };
}

interface Saving {
  id: number;
  month?: number;
  amount: number;
  isPaid: boolean;
  isObsolete: boolean;
  year?: number;
  name?: string;
  savingsTypeId: number;
}

interface FinancialOverviewProps {
  incomeSchedules: IncomeSchedule[];
  expenseSchedules: ExpenseSchedule[];
  savings: Saving[];
  currentDate: Date;
  selectedDate?: string;
}

type PeriodFilter = "monthly" | "yearly";
type ExpectedFilter = "weekly" | "monthly" | "yearly";
type ChartView = "weekly" | "daily" | "monthly" | "yearly";

export default function FinancialOverview({
  incomeSchedules,
  expenseSchedules,
  savings,
  currentDate,
  selectedDate,
}: FinancialOverviewProps) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("monthly");
  const [expectedFilter, setExpectedFilter] = useState<ExpectedFilter>("monthly");
  const [chartView, setChartView] = useState<ChartView>("monthly");
  const [activeModal, setActiveModal] = useState<
    "income" | "expense" | "savings" | "otherSavings" | null
  >(null);

  // Split savings: savingsTypeId === 1 → monthly/primary (has month + year)
  // any other savingsTypeId → other savings (no time concept, name may be null)
  const primarySavings = useMemo(
    () => savings.filter((s) => s.savingsTypeId === 1),
    [savings],
  );
  const otherSavings = useMemo(
    () => savings.filter((s) => s.savingsTypeId !== 1),
    [savings],
  );

  // Modal records
  const modalRecords = useMemo(() => {
    const now = new Date(currentDate);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const inPeriod = (date: string) => {
      const d = new Date(date + "T00:00:00");
      if (periodFilter === "monthly")
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      return d.getFullYear() === currentYear;
    };

    // Primary savings filter: month/year may be nullable, guard with strict equality
    const primaryInPeriod =
      periodFilter === "monthly"
        ? primarySavings.filter(
            (s) => s.isPaid && s.year === currentYear && s.month === currentMonth + 1,
          )
        : primarySavings.filter((s) => s.isPaid && s.year === currentYear);

    return {
      incomeRecords: incomeSchedules.filter((s) => s.isReceived && inPeriod(s.date)),
      expenseRecords: expenseSchedules.filter((s) => s.isPaid && inPeriod(s.date)),
      savingsRecords: primaryInPeriod,
      // Other savings: all paid, no time filter (month/year/name are irrelevant here)
      otherSavingsRecords: otherSavings.filter((s) => s.isPaid),
    };
  }, [incomeSchedules, expenseSchedules, primarySavings, otherSavings, periodFilter, currentDate]);

  // Financial totals (time-filtered, primary savings only)
  const financialData = useMemo(() => {
    const now = new Date(currentDate);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const filterByPeriod = (date: string) => {
      const d = new Date(date);
      if (periodFilter === "monthly")
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      return d.getFullYear() === currentYear;
    };

    const totalIncome = incomeSchedules
      .filter((s) => filterByPeriod(s.date) && s.isReceived)
      .reduce((sum, s) => sum + s.amount, 0);

    const totalExpense = expenseSchedules
      .filter((s) => filterByPeriod(s.date) && s.isPaid)
      .reduce((sum, s) => sum + s.amount, 0);

    // Primary savings only (savingsTypeId === 1); month/year are nullable but expected for this type
    const totalSavings =
      periodFilter === "monthly"
        ? primarySavings
            .filter(
              (s) =>
                s.isPaid &&
                s.year === currentYear &&
                s.month === currentMonth + 1,
            )
            .reduce((sum, s) => sum + s.amount, 0)
        : primarySavings
            .filter((s) => s.isPaid && s.year === currentYear)
            .reduce((sum, s) => sum + s.amount, 0);

    const remainingBalance = totalIncome - totalExpense - totalSavings;
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

    return { totalIncome, totalExpense, totalSavings, remainingBalance, savingsRate };
  }, [incomeSchedules, expenseSchedules, primarySavings, periodFilter, currentDate]);

  // Other Savings totals — NO time filter, just paid vs unpaid
  const otherSavingsData = useMemo(
    () => ({
      received: otherSavings.filter((s) => s.isPaid).reduce((sum, s) => sum + s.amount, 0),
      expected: otherSavings.filter((s) => !s.isPaid).reduce((sum, s) => sum + s.amount, 0),
    }),
    [otherSavings],
  );

  // Expected transactions (time-based; primary savings hidden on weekly)
  const expectedData = useMemo(() => {
    const now = new Date(currentDate);

    const weekAnchor =
      expectedFilter === "weekly" && selectedDate
        ? new Date(selectedDate + "T00:00:00")
        : now;

    const startOfWeek = new Date(weekAnchor);
    startOfWeek.setDate(weekAnchor.getDate() - weekAnchor.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    endOfYear.setHours(23, 59, 59, 999);

    const filterByExpected = (date: string) => {
      const d = new Date(date + "T00:00:00");
      if (expectedFilter === "weekly") return d >= startOfWeek && d <= endOfWeek;
      if (expectedFilter === "yearly") return d >= startOfYear && d <= endOfYear;
      return d >= startOfMonth && d <= endOfMonth;
    };

    const expectedIncome = incomeSchedules
      .filter((s) => filterByExpected(s.date) && !s.isReceived)
      .reduce((sum, s) => sum + s.amount, 0);

    const expectedExpense = expenseSchedules
      .filter((s) => filterByExpected(s.date) && !s.isPaid)
      .reduce((sum, s) => sum + s.amount, 0);

    // Primary savings: only shown on monthly/yearly, not weekly
    // month/year are nullable — guard with nullish checks
    let expectedSavings = 0;
    if (expectedFilter !== "weekly") {
      const cm = now.getMonth() + 1;
      const cy = now.getFullYear();
      expectedSavings =
        expectedFilter === "monthly"
          ? primarySavings
              .filter((s) => !s.isPaid && s.year === cy && s.month === cm)
              .reduce((sum, s) => sum + s.amount, 0)
          : primarySavings
              .filter((s) => !s.isPaid && s.year === cy)
              .reduce((sum, s) => sum + s.amount, 0);
    }

    const weekLabel =
      expectedFilter === "weekly"
        ? `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : null;

    return { expectedIncome, expectedExpense, expectedSavings, weekLabel };
  }, [incomeSchedules, expenseSchedules, primarySavings, expectedFilter, currentDate, selectedDate]);

  // Chart data
  const chartData = useMemo(() => {
    const now = new Date(currentDate);

    if (chartView === "weekly") {
      const weekAnchor = selectedDate ? new Date(selectedDate + "T00:00:00") : now;
      const startOfWeek = new Date(weekAnchor);
      startOfWeek.setDate(weekAnchor.getDate() - weekAnchor.getDay());
      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
        return {
          name: day.toLocaleDateString("en-US", { weekday: "short" }),
          income: incomeSchedules.filter((s) => s.date === dateStr && s.isReceived).reduce((sum, s) => sum + s.amount, 0),
          expense: expenseSchedules.filter((s) => s.date === dateStr && s.isPaid).reduce((sum, s) => sum + s.amount, 0),
          savings: 0,
        };
      });
    }

    if (chartView === "daily") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return {
          name: String(day),
          income: incomeSchedules.filter((s) => s.date === dateStr && s.isReceived).reduce((sum, s) => sum + s.amount, 0),
          expense: expenseSchedules.filter((s) => s.date === dateStr && s.isPaid).reduce((sum, s) => sum + s.amount, 0),
          savings: 0,
        };
      });
    }

    if (chartView === "monthly") {
      return Array.from({ length: 12 }, (_, i) => ({
        name: new Date(now.getFullYear(), i).toLocaleString("en-US", { month: "short" }),
        income: incomeSchedules.filter((s) => new Date(s.date).getFullYear() === now.getFullYear() && new Date(s.date).getMonth() === i && s.isReceived).reduce((sum, s) => sum + s.amount, 0),
        expense: expenseSchedules.filter((s) => new Date(s.date).getFullYear() === now.getFullYear() && new Date(s.date).getMonth() === i && s.isPaid).reduce((sum, s) => sum + s.amount, 0),
        // Primary savings only: guard nullable month/year
        savings: primarySavings.filter((s) => s.isPaid && s.year === now.getFullYear() && s.month === i + 1).reduce((sum, s) => sum + s.amount, 0),
      }));
    }

    // yearly — only derive years from primarySavings (other savings have no meaningful year)
    const years = Array.from(
      new Set([
        ...incomeSchedules.map((s) => new Date(s.date).getFullYear()),
        ...expenseSchedules.map((s) => new Date(s.date).getFullYear()),
        ...primarySavings.filter((s) => s.year != null).map((s) => s.year as number),
      ]),
    ).sort();

    return years.map((yr) => ({
      name: String(yr),
      income: incomeSchedules.filter((s) => new Date(s.date).getFullYear() === yr && s.isReceived).reduce((sum, s) => sum + s.amount, 0),
      expense: expenseSchedules.filter((s) => new Date(s.date).getFullYear() === yr && s.isPaid).reduce((sum, s) => sum + s.amount, 0),
      savings: primarySavings.filter((s) => s.isPaid && s.year === yr).reduce((sum, s) => sum + s.amount, 0),
    }));
  }, [incomeSchedules, expenseSchedules, primarySavings, savings, chartView, currentDate, selectedDate]);

  const StatCard = ({
    title, value, icon: Icon, color, subtitle, onClick,
  }: {
    title: string; value: string | number; icon: any; color: string; subtitle?: string; onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600 transition ${
        onClick ? "cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 active:scale-[0.98]" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
      {onClick && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Click to view records</p>}
    </div>
  );

  const periodLabel = periodFilter === "monthly" ? "This Month" : "This Year";
  const periodSubtitle = periodFilter === "monthly" ? "This month" : "This year";
  const periodPrefix = periodFilter === "monthly" ? "Monthly" : "Yearly";

  return (
    <div className="space-y-6">

      {/* Period Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
        <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          {(["monthly", "yearly"] as PeriodFilter[]).map((f, idx) => (
            <button
              key={f}
              onClick={() => setPeriodFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium transition capitalize ${
                idx > 0 ? "border-l border-gray-300 dark:border-gray-600" : ""
              } ${
                periodFilter === f
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Income"
          value={`₱${financialData.totalIncome.toFixed(2)}`}
          icon={TrendingUp}
          color="text-green-600 dark:text-green-400"
          subtitle={periodSubtitle}
          onClick={() => setActiveModal("income")}
        />
        <StatCard
          title="Total Expenses"
          value={`₱${financialData.totalExpense.toFixed(2)}`}
          icon={TrendingDown}
          color="text-red-600 dark:text-red-400"
          subtitle={periodSubtitle}
          onClick={() => setActiveModal("expense")}
        />
        <StatCard
          title={`${periodPrefix} Savings`}
          value={`₱${financialData.totalSavings.toFixed(2)}`}
          icon={Wallet}
          color="text-purple-600 dark:text-purple-400"
          subtitle={`Savings rate: ${financialData.savingsRate.toFixed(1)}%`}
          onClick={() => setActiveModal("savings")}
        />
        <StatCard
          title="Available Balance"
          value={`₱${financialData.remainingBalance.toFixed(2)}`}
          icon={DollarSign}
          color={financialData.remainingBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
          subtitle={financialData.remainingBalance >= 0 ? "🟢 Positive" : "🔴 After savings allocation"}
        />
      </div>

      {/* Expected Transactions (time-based) */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Expected Transactions
            </h4>
            {expectedFilter === "weekly" && expectedData.weekLabel && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-7">
                Week of {expectedData.weekLabel}
              </p>
            )}
          </div>
          <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            {(["weekly", "monthly", "yearly"] as ExpectedFilter[]).map((f, idx) => (
              <button
                key={f}
                onClick={() => setExpectedFilter(f)}
                className={`px-3 py-1 text-xs font-medium transition capitalize ${
                  idx > 0 ? "border-l border-gray-300 dark:border-gray-600" : ""
                } ${
                  expectedFilter === f
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid gap-4 ${expectedFilter === "weekly" ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Expected Income</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">₱{expectedData.expectedIncome.toFixed(2)}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pending receipts</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Expected Expenses</p>
            <p className="text-xl font-bold text-red-700 dark:text-red-300">₱{expectedData.expectedExpense.toFixed(2)}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pending payments</p>
          </div>
          {/* Savings card — hidden when weekly is selected */}
          {expectedFilter !== "weekly" && (
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Expected Savings</p>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300">₱{expectedData.expectedSavings.toFixed(2)}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pending allocation</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Other Savings — standalone section, no time filter ── */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <PiggyBank className="w-5 h-5 text-teal-500" />
          Other Savings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Received (paid) — clickable, opens modal */}
          <div
            className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg cursor-pointer hover:shadow-md transition active:scale-[0.98]"
            onClick={() => setActiveModal("otherSavings")}
          >
            <p className="text-sm text-teal-600 dark:text-teal-400 font-medium mb-1">Total Received</p>
            <p className="text-xl font-bold text-teal-700 dark:text-teal-300">₱{otherSavingsData.received.toFixed(2)}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Already allocated</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click to view records</p>
          </div>
          {/* Expected (unpaid) */}
          <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
            <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium mb-1">Expected</p>
            <p className="text-xl font-bold text-cyan-700 dark:text-cyan-300">₱{otherSavingsData.expected.toFixed(2)}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pending allocation</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Income vs Expenses vs Savings
          </h4>
          <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            {(["daily", "weekly", "monthly", "yearly"] as ChartView[]).map((view, idx) => (
              <button
                key={view}
                onClick={() => setChartView(view)}
                className={`px-3 py-1 text-xs font-medium transition capitalize ${
                  idx > 0 ? "border-l border-gray-300 dark:border-gray-600" : ""
                } ${
                  chartView === view
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: "12px" }} />
            <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} tickFormatter={(v: number) => `₱${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px", color: "#fff" }}
              formatter={(value: any) => [`₱${value.toFixed(2)}`, ""]}
            />
            <Legend />
            <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#EF4444" name="Expense" radius={[4, 4, 0, 0]} />
            {(chartView === "monthly" || chartView === "yearly") && (
              <Bar dataKey="savings" fill="#9333EA" name="Savings" radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Modals */}
      <IncomeRecordsModal
        isOpen={activeModal === "income"}
        onClose={() => setActiveModal(null)}
        records={modalRecords.incomeRecords}
        periodLabel={periodLabel}
      />
      <ExpenseRecordsModal
        isOpen={activeModal === "expense"}
        onClose={() => setActiveModal(null)}
        records={modalRecords.expenseRecords}
        periodLabel={periodLabel}
      />
      <SavingsRecordsModal
        isOpen={activeModal === "savings"}
        onClose={() => setActiveModal(null)}
        records={modalRecords.savingsRecords}
        periodLabel={periodLabel}
      />
      <SavingsRecordsModal
        isOpen={activeModal === "otherSavings"}
        onClose={() => setActiveModal(null)}
        records={modalRecords.otherSavingsRecords}
        periodLabel="Other Savings · All Time"
      />
    </div>
  );
}