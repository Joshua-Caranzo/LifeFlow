"use client";
import { useEffect, useState } from "react";
import ManageCategories from "@/components/expense/expense-category-modal";
import ManageOccurrences from "@/components/expense/expense-occurency-modal";
import ExpenseModal from "@/components/expense/expense-modal";
import Loader from "@/components/loader";
import {
  Calendar,
  Edit,
  Plus,
  RefreshCwIcon,
  Settings,
  Trash2,
} from "lucide-react";
import { deleteExpense, fetchExpenses } from "@/service/expense-service";

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManageCategories, setshowManageCategories] = useState(false);
  const [showManageOccurrences, setShowManageOccurrences] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] =
    useState<ExpenseFormData | null>(null);

  const getExpense = async () => {
    setLoading(true);
    try {
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getExpense();
  }, []);

  const onExpenseSave = async () => {
    await getExpense();
    setSelectedExpense(null);
  };

  const handleEditExpense = (expense: any) => {
    setSelectedExpense({
      id: expense.id,
      title: expense.title,
      description: expense.description,
      note: expense.note,
      amount: expense.amount.toString(),
      expenseDate: expense.expenseDate,
      endExpenseDate: expense.endExpenseDate,
      categoryId: expense.categoryId.toString(),
      occurrenceId: expense.occurrenceId.toString(),
    });
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );
    if (!confirmed) return;

    try {
      await deleteExpense(id);
      await getExpense();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Loader message="Loading expenses..." />;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
            Expense
          </h1>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            {" "}
            <button
              onClick={getExpense}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
            >
              {" "}
              <RefreshCwIcon className="w-4 h-4 sm:w-5 sm:h-5" />{" "}
              <span className="hidden xs:inline">Refresh</span>{" "}
              <span className="xs:hidden">Refresh</span>{" "}
            </button>{" "}
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
            >
              {" "}
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />{" "}
              <span className="hidden xs:inline">Add Expense</span>{" "}
              <span className="xs:hidden">Add</span>{" "}
            </button>{" "}
            <button
              onClick={() => setshowManageCategories(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
            >
              {" "}
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />{" "}
              <span className="hidden xs:inline">Manage Categories</span>{" "}
              <span className="xs:hidden">Categories</span>{" "}
            </button>{" "}
            <button
              onClick={() => setShowManageOccurrences(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
            >
              {" "}
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />{" "}
              <span className="hidden xs:inline">Occurrences</span>{" "}
              <span className="xs:hidden">Occurrences</span>{" "}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto md:overflow-x-visible">
            <table className="w-full hidden md:table">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-950">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-950">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-950">
                    Notes
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-blue-950">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-950">
                    Category
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-950">
                    Occurrence
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-950">
                    Expense Date
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-950">
                    End Date
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-blue-950">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-blue-900">
                      {expense.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-900">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-900">
                      {expense.note}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-red-600 text-right">
                      ₱{expense.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-900 text-center">
                      {expense.category.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-900 text-center">
                      {expense.occurrence.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-900 text-center">
                      {expense.expenseDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-900 text-center">
                      {expense.endExpenseDate}
                    </td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id || 0)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden flex flex-col gap-4 bg-blue-50 p-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white p-4 rounded-lg shadow flex flex-col gap-2"
              >
                <div className="text-blue-900">
                  <strong>Title:</strong> {expense.title}
                </div>
                <div className="text-blue-900">
                  <strong>Description:</strong> {expense.description}
                </div>
                <div className="text-blue-900">
                  <strong>Notes:</strong> {expense.note}
                </div>
                <div className="text-blue-900">
                  <strong>Amount:</strong>{" "}
                  <span className="text-green-600">
                    ₱{expense.amount.toLocaleString()}
                  </span>
                </div>
                <div className="text-blue-900 text-center">
                  <strong>Category:</strong> {expense.category.name}
                </div>
                <div className="text-blue-900 text-center">
                  <strong>Expense Date:</strong> {expense.expenseDate}
                </div>
                <div className="text-blue-900 text-center">
                  <strong>End Date:</strong> {expense.endExpenseDate}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEditExpense(expense)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(expense.id || 0)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1 text-sm text-red-600 bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {expenses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-blue-500 text-lg">No expense records found</p>
              <p className="text-blue-400 text-sm mt-2">
                Click "Add Expense" to create your first entry
              </p>
            </div>
          )}
        </div>

        <ManageCategories
          isOpen={showManageCategories}
          onClose={() => setshowManageCategories(false)}
        />

        <ManageOccurrences
          isOpen={showManageOccurrences}
          onClose={() => setShowManageOccurrences(false)}
        />
        <ExpenseModal
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          onSave={onExpenseSave}
          expenseData={selectedExpense}
        />
      </div>
    </div>
  );
}
