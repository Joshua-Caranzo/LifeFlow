import { createClient } from "@/lib/supabase/client";

export const generateYear = async (year: string) => {
  console.log("year", year);
  const supabase = createClient();
  const yearNum = Number(year);

  // Generate income schedules
  await generateIncomeSchedules(supabase, yearNum);

  // Generate expense schedules
  await generateExpenseSchedules(supabase, yearNum);
};

const generateIncomeSchedules = async (supabase: any, yearNum: number) => {
  // Fetch all relevant incomes
  const { data: incomes, error } = await supabase
    .from("income")
    .select(`id, name, amount, incomePeriodId, date, endDate`)
    .eq("isObsolete", false)
    .not("date", "is", null);

  if (error) {
    console.error("Error fetching incomes:", error);
    return;
  }

  for (const income of incomes ?? []) {
    // 1️⃣ Remove unreceived schedules for the target year
    const { error: deleteError } = await supabase
      .from("incomeschedule")
      .delete()
      .eq("incomeId", income.id)
      .eq("isReceived", false)
      .gte("date", `${yearNum}-01-01`)
      .lte("date", `${yearNum}-12-31`);

    if (deleteError) console.error("Error deleting old schedules:", deleteError);

    // 2️⃣ Generate new dates
    const startDate = new Date(income.date);
    if (isNaN(startDate.getTime())) continue;

    let dates: Date[] = [];
    switch (income.incomePeriodId) {
      case 1: dates = generateMonthlyDates(yearNum, startDate, income.endDate); break;
      case 2: dates = generateSemiMonthlyDates(yearNum, startDate, income.endDate); break;
      case 3: dates = generateWeeklyDates(yearNum, startDate, income.endDate); break;
      case 4: dates = generateDailyDates(yearNum, startDate, income.endDate); break;
    }

    const rows = dates.map(d => {
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return {
        incomeId: income.id,
        date: `${yearNum}-${month}-${day}`,
        amount: income.amount,
        isReceived: false,
      };
    });

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("incomeschedule")
        .upsert(rows, { onConflict: "incomeId,date", ignoreDuplicates: true });

      if (insertError) console.error("Error inserting income schedules:", insertError);
    }
  }
};


const generateExpenseSchedules = async (supabase: any, yearNum: number) => {
  const { data: expenses, error } = await supabase
    .from("expense")
    .select(`id, title, amount, occurrenceId, expenseDate, endExpenseDate`)
    .eq("isObsolete", false)
    .not("expenseDate", "is", null);

  if (error) {
    console.error("Error fetching expenses:", error);
    return;
  }

  for (const expense of expenses ?? []) {
    // Remove unpaid schedules for the target year
    const { error: deleteError } = await supabase
      .from("expenseschedule")
      .delete()
      .eq("expenseId", expense.id)
      .eq("isPaid", false)
      .gte("date", `${yearNum}-01-01`)
      .lte("date", `${yearNum}-12-31`);

    if (deleteError) console.error("Error deleting old expense schedules:", deleteError);

    const startDate = new Date(expense.expenseDate);
    if (isNaN(startDate.getTime())) continue;

    let dates: Date[] = [];
    switch (expense.occurrenceId) {
      case 1: dates = generateMonthlyDates(yearNum, startDate, expense.endExpenseDate); break;
      case 2: dates = generateSemiMonthlyDates(yearNum, startDate, expense.endExpenseDate); break;
      case 3: dates = generateWeeklyDates(yearNum, startDate, expense.endExpenseDate); break;
      case 4: dates = generateOnTheSpotDates(yearNum, startDate, expense.endExpenseDate); break;
      case 5: dates = generateBiWeeklyDates(yearNum, startDate, expense.endExpenseDate); break;
    }

    const rows = dates.map(d => {
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return {
        expenseId: expense.id,
        date: `${yearNum}-${month}-${day}`,
        amount: expense.amount,
        isPaid: false,
      };
    });

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("expenseschedule")
        .upsert(rows, { onConflict: "expenseId,date", ignoreDuplicates: true });

      if (insertError) console.error("Error inserting expense schedules:", insertError);
    }
  }
};


// Date generation functions
const generateDailyDates = (
  year: number,
  startDate: Date,
  endDate?: string | null
) => {
  const dates: Date[] = [];
  const d = new Date(startDate);

  if (d.getFullYear() < year) {
    d.setFullYear(year);
    d.setMonth(0);
    d.setDate(1);
  }

  while (d.getFullYear() === year) {
    if (isBeyondEndDate(d, endDate)) break;
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  return dates;
};

const generateWeeklyDates = (
  year: number,
  startDate: Date,
  endDate?: string | null
) => {
  const dates: Date[] = [];
  const d = new Date(startDate);

  if (d.getFullYear() < year) {
    d.setFullYear(year);
    d.setMonth(0);
    d.setDate(1);
  }

  while (d.getFullYear() === year) {
    if (isBeyondEndDate(d, endDate)) break;
    dates.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }

  return dates;
};

const generateSemiMonthlyDates = (
  year: number,
  startDate: Date,
  endDate?: string | null
) => {
  const dates: Date[] = [];
  const day1 = startDate.getDate();
  let d2Day = 0;

  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // First occurrence
    const d1Day = Math.min(day1, daysInMonth);
    const d1 = new Date(year, month, d1Day);

    if (!isBeyondEndDate(d1, endDate)) {
      dates.push(d1);
    }

    // Second occurrence = day1 + 15 (clamped)
    if (day1 == 1) d2Day = Math.min(day1 + 14, daysInMonth);
    else d2Day = Math.min(day1 + 15, daysInMonth);

    if (d2Day !== d1Day) {
      const d2 = new Date(year, month, d2Day);
      if (!isBeyondEndDate(d2, endDate)) {
        dates.push(d2);
      }
    }
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
};

const generateMonthlyDates = (
  year: number,
  startDate: Date,
  endDate?: string | null
) => {
  const dates: Date[] = [];
  const day = startDate.getDate();

  for (let month = 0; month < 12; month++) {
    let d = new Date(year, month, day);
    // If day overflowed to next month (e.g., Feb 31 becomes Mar 3)
    if (d.getMonth() !== month) {
      // Create date for last day of intended month
      d = new Date(year, month + 1, 0);
    }
    if (isBeyondEndDate(d, endDate)) break;
    dates.push(d);
  }

  return dates;
};

const generateOnTheSpotDates = (
  year: number,
  startDate: Date,
  endDate?: string | null
) => {
  const dates: Date[] = [];

  // Only include the date if it falls within the target year
  if (startDate.getFullYear() === year) {
    if (!isBeyondEndDate(startDate, endDate)) {
      dates.push(new Date(startDate));
    }
  }

  return dates;
};

const isBeyondEndDate = (date: Date, endDate?: string | null) => {
  if (!endDate) return false;
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return false;
  return date > end;
};

const generateBiWeeklyDates = (
  year: number,
  startDate: Date,
  endDate?: string | null
) => {
  const dates: Date[] = [];
  const d = new Date(startDate);

  // If the start date is before the target year, jump to first occurrence in year
  if (d.getFullYear() < year) {
    d.setFullYear(year);
    d.setMonth(0);
    d.setDate(1);

    // Align to the same weekday as original startDate
    const targetDay = startDate.getDay();
    while (d.getDay() !== targetDay) {
      d.setDate(d.getDate() + 1);
    }
  }

  while (d.getFullYear() === year) {
    if (isBeyondEndDate(d, endDate)) break;
    dates.push(new Date(d));
    d.setDate(d.getDate() + 14); // 🔥 every other week
  }

  return dates;
};
