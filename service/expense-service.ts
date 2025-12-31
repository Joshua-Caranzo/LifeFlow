import { createClient } from "@/lib/supabase/client";

export interface ExpenseFormData {
  id?: number;
  title: string;
  description: string;
  note?: string;
  amount: string;
  expenseDate: string;
  endExpenseDate?: string | null;
  categoryId: string;
  occurrenceId: string;
}

// Fetch all active expenses
export const fetchExpenses = async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expense")
    .select(`
      id,
      title,
      description,
      note,
      amount,
      expenseDate,
      endExpenseDate,
      categoryId,
      category:categoryId (id, name),
      occurrenceId,
      occurrence:occurrenceId (id, name)
    `)
    .eq("isObsolete", false);

  if (error) throw error;
  return data || [];
};

// Add or update expense
export const upsertExpense = async (expense: ExpenseFormData) => {
  const supabase = createClient();
  const payload: any = {
    title: expense.title,
    description: expense.description,
    note: expense.note,
    amount: Number(expense.amount),
    expenseDate: expense.expenseDate,
    endExpenseDate: expense.endExpenseDate || null,
    categoryId: Number(expense.categoryId),
    occurrenceId: Number(expense.occurrenceId),
  };

  if (expense.id) {
    // Update
    const { error } = await supabase
      .from("expense")
      .update(payload)
      .eq("id", expense.id);
    if (error) throw error;
  } else {
    // Insert
    const { error } = await supabase.from("expense").insert(payload);
    if (error) throw error;
  }
};

// Soft delete expense
export const deleteExpense = async (id: number) => {
  const supabase = createClient();
  const { error } = await supabase
    .from("expense")
    .update({ isObsolete: true })
    .eq("id", id);
  if (error) throw error;
};
