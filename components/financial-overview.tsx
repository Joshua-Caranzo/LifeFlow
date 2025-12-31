import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Calendar,
  BarChart3,
  Wallet,
} from "lucide-react";
import {
  LineChart,
  Line,
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
}

interface ExpenseSchedule {
  id: string;
  date: string;
  amount: number;
  isPaid: boolean;
}

interface Saving {
  id: number;
  month: number;
  amount: number;
  isPaid: boolean;
  year: number;
}

interface FinancialOverviewProps {
  incomeSchedules: IncomeSchedule[];
  expenseSchedules: ExpenseSchedule[];
  savings: Saving[];
  currentDate: Date;
}

type PeriodFilter = "monthly" | "yearly";
type ExpectedFilter = "weekly" | "monthly";
type ChartView = "monthly" | "daily";

export default function FinancialOverview({
  incomeSchedules,
  expenseSchedules,
  savings,
  currentDate,
}: FinancialOverviewProps) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("monthly");
  const [expectedFilter, setExpectedFilter] =
    useState<ExpectedFilter>("monthly");
  const [chartView, setChartView] = useState<ChartView>("monthly");

  // Calculate totals based on period filter
  const financialData = useMemo(() => {
    const now = new Date(currentDate);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const filterByPeriod = (date: string) => {
      const itemDate = new Date(date);
      if (periodFilter === "monthly") {
        return (
          itemDate.getFullYear() === currentYear &&
          itemDate.getMonth() === currentMonth
        );
      } else {
        return itemDate.getFullYear() === currentYear;
      }
    };

    const totalIncome = incomeSchedules
      .filter((s) => filterByPeriod(s.date) && s.isReceived)
      .reduce((sum, s) => sum + s.amount, 0);

    const totalExpense = expenseSchedules
      .filter((s) => filterByPeriod(s.date) && s.isPaid)
      .reduce((sum, s) => sum + s.amount, 0);

    // Calculate savings based on period
    let totalSavings = 0;
    if (periodFilter === "monthly") {
      totalSavings = savings
        .filter(
          (s) =>
            s.year === currentYear &&
            s.month === currentMonth + 1 &&
            s.isPaid
        )
        .reduce((sum, s) => sum + s.amount, 0);
    } else {
      totalSavings = savings
        .filter((s) => s.year === currentYear && s.isPaid)
        .reduce((sum, s) => sum + s.amount, 0);
    }

    // Balance = Income - Expenses - Savings
    const remainingBalance = totalIncome - totalExpense - totalSavings;
    
    // Savings rate based on actual savings vs income
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpense,
      totalSavings,
      remainingBalance,
      savingsRate,
    };
  }, [incomeSchedules, expenseSchedules, savings, periodFilter, currentDate]);

  // Calculate expected income/expenses
  const expectedData = useMemo(() => {
    const now = new Date(currentDate);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const filterByExpected = (date: string) => {
      const itemDate = new Date(date);
      if (expectedFilter === "weekly") {
        return itemDate >= startOfWeek && itemDate <= endOfWeek;
      } else {
        return itemDate >= startOfMonth && itemDate <= endOfMonth;
      }
    };

    const expectedIncome = incomeSchedules
      .filter((s) => filterByExpected(s.date) && !s.isReceived)
      .reduce((sum, s) => sum + s.amount, 0);

    const expectedExpense = expenseSchedules
      .filter((s) => filterByExpected(s.date) && !s.isPaid)
      .reduce((sum, s) => sum + s.amount, 0);

    // Calculate expected savings (unpaid savings for the period)
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    let expectedSavings = 0;
    if (expectedFilter === "monthly") {
      expectedSavings = savings
        .filter(
          (s) =>
            s.year === currentYear &&
            s.month === currentMonth &&
            !s.isPaid
        )
        .reduce((sum, s) => sum + s.amount, 0);
    }

    return { expectedIncome, expectedExpense, expectedSavings };
  }, [incomeSchedules, expenseSchedules, savings, expectedFilter, currentDate]);

  // Generate chart data
  const chartData = useMemo(() => {
    const now = new Date(currentDate);

    if (chartView === "monthly") {
      // Generate data for all 12 months of current year
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthIncomes = incomeSchedules.filter((s) => {
          const date = new Date(s.date);
          return (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === i &&
            s.isReceived
          );
        });
        const monthExpenses = expenseSchedules.filter((s) => {
          const date = new Date(s.date);
          return (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === i &&
            s.isPaid
          );
        });
        const monthSavings = savings.filter(
          (s) =>
            s.year === now.getFullYear() &&
            s.month === i + 1 &&
            s.isPaid
        );

        const income = monthIncomes.reduce((sum, s) => sum + s.amount, 0);
        const expense = monthExpenses.reduce((sum, s) => sum + s.amount, 0);
        const saving = monthSavings.reduce((sum, s) => sum + s.amount, 0);

        return {
          name: new Date(now.getFullYear(), i).toLocaleString("en-US", {
            month: "short",
          }),
          income,
          expense,
          savings: saving,
        };
      });

      return monthlyData;
    } else {
      // Generate data for current month (daily view)
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();
      const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dateStr = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const dayIncomes = incomeSchedules.filter(
          (s) => s.date === dateStr && s.isReceived
        );
        const dayExpenses = expenseSchedules.filter(
          (s) => s.date === dateStr && s.isPaid
        );

        const income = dayIncomes.reduce((sum, s) => sum + s.amount, 0);
        const expense = dayExpenses.reduce((sum, s) => sum + s.amount, 0);

        return {
          name: String(day),
          income,
          expense,
          savings: 0, // Savings are monthly, not daily
        };
      });

      return dailyData;
    }
  }, [incomeSchedules, expenseSchedules, savings, chartView, currentDate]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          View:
        </span>
        <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          <button
            onClick={() => setPeriodFilter("monthly")}
            className={`px-4 py-1.5 text-sm font-medium transition ${
              periodFilter === "monthly"
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriodFilter("yearly")}
            className={`px-4 py-1.5 text-sm font-medium transition border-l border-gray-300 dark:border-gray-600 ${
              periodFilter === "yearly"
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Income"
          value={`₱${financialData.totalIncome.toFixed(2)}`}
          icon={TrendingUp}
          color="text-green-600 dark:text-green-400"
          subtitle={`${
            periodFilter === "monthly" ? "This month" : "This year"
          }`}
        />
        <StatCard
          title="Total Expenses"
          value={`₱${financialData.totalExpense.toFixed(2)}`}
          icon={TrendingDown}
          color="text-red-600 dark:text-red-400"
          subtitle={`${
            periodFilter === "monthly" ? "This month" : "This year"
          }`}
        />
        <StatCard
          title={`${periodFilter === "monthly" ? "Monthly" : "Yearly"} Savings`}
          value={`₱${financialData.totalSavings.toFixed(2)}`}
          icon={Wallet}
          color="text-purple-600 dark:text-purple-400"
          subtitle={`Savings rate: ${financialData.savingsRate.toFixed(1)}%`}
        />
        <StatCard
          title="Available Balance"
          value={`₱${financialData.remainingBalance.toFixed(2)}`}
          icon={DollarSign}
          color={
            financialData.remainingBalance >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }
          subtitle={
            financialData.remainingBalance >= 0 
              ? "🟢 Positive" 
              : "🔴 After savings allocation"
          }
        />
        <StatCard
          title="Savings Rate"
          value={`${financialData.savingsRate.toFixed(1)}%`}
          icon={PiggyBank}
          color="text-blue-600 dark:text-blue-400"
          subtitle={`${
            financialData.savingsRate >= 20 ? "Great!" : "Can improve"
          }`}
        />
      </div>

      {/* Expected Income/Expenses */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Expected Transactions
          </h4>
          <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setExpectedFilter("weekly")}
              className={`px-3 py-1 text-xs font-medium transition ${
                expectedFilter === "weekly"
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setExpectedFilter("monthly")}
              className={`px-3 py-1 text-xs font-medium transition border-l border-gray-300 dark:border-gray-600 ${
                expectedFilter === "monthly"
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
              Expected Income
            </p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
              ₱{expectedData.expectedIncome.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Pending receipts
            </p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">
              Expected Expenses
            </p>
            <p className="text-xl font-bold text-red-700 dark:text-red-300">
              ₱{expectedData.expectedExpense.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Pending payments
            </p>
          </div>
          {expectedFilter === "monthly" && expectedData.expectedSavings > 0 && (
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
                Expected Savings
              </p>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                ₱{expectedData.expectedSavings.toFixed(2)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Pending allocation
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Income vs Expenses vs Savings
          </h4>
          <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setChartView("daily")}
              className={`px-3 py-1 text-xs font-medium transition ${
                chartView === "daily"
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setChartView("monthly")}
              className={`px-3 py-1 text-xs font-medium transition border-l border-gray-300 dark:border-gray-600 ${
                chartView === "monthly"
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.1}
            />
            <XAxis
              dataKey="name"
              stroke="#6B7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#6B7280"
              style={{ fontSize: "12px" }}
              tickFormatter={(value: number) => `₱${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: any) => [`₱${value.toFixed(2)}`, ""]}
            />
            <Legend />
            <Bar
              dataKey="income"
              fill="#10B981"
              name="Income"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expense"
              fill="#EF4444"
              name="Expense"
              radius={[4, 4, 0, 0]}
            />
            {chartView === "monthly" && (
              <Bar
                dataKey="savings"
                fill="#9333EA"
                name="Savings"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}