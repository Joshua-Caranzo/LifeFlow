"use client";
import IncomeModal from "@/components/income/income-modal";
import ManagePeriods from "@/components/income/income-period-modal";
import Loader from "@/components/loader";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/client";
import { Edit, Plus, RefreshCwIcon, Settings, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Incomes() {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManagePeriods, setShowManagePeriods] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<IncomeFormData | null>(
    null
  );

  useEffect(() => {
    getIncomes();
  }, []);

  const getIncomes = async () => {
    setLoading(true);
    const supabase = createClient();

    supabase
      .from("income")
      .select(
        `
            id,
            name,
            amount,
            personId,
            person:personId (
                id,
                name
            ),
            incomePeriodId,
            incomePeriod: incomePeriodId(
                id,
                name
            ),
            date,
            endDate
        `
      )
      .eq("isObsolete", false)
      .order("date")
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setIncomes(data || []);
        setLoading(false);
      });
  };

  const onIncomeSave = async () => {
    await getIncomes();
    setSelectedIncome(null);
  };

  const handleAddIncome = () => {
    setSelectedIncome(null);
    setShowIncomeModal(true);
  };

  const handleEditIncome = (income: any) => {
    const incomeData: IncomeFormData = {
      id: income.id,
      name: income.name,
      periodId: income.incomePeriodId.toString(),
      personId: income.personId.toString(),
      date: income.date ? income.date.toString() : null,
      amount: income.amount.toString(),
      endDate: income.endDate ? income.endDate.toString() : null,
    };
    setSelectedIncome(incomeData);
    setShowIncomeModal(true);
  };

  const handleCloseModal = () => {
    setShowIncomeModal(false);
    setSelectedIncome(null);
  };

  const toggleRemove = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this income?"
    );

    if (!confirmed) return;
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("income")
      .update({ isObsolete: true })
      .eq("id", id);
    if (updateError) throw updateError;

    await getIncomes();
  };

  if (loading) return <Loader message="Loading incomes..." />;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
            Income
          </h1>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={getIncomes}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
            >
              <RefreshCwIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Refresh</span>
              <span className="xs:hidden">Refresh</span>
            </button>
            <button
              onClick={handleAddIncome}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Add Income</span>
              <span className="xs:hidden">Add</span>
            </button>

            <button
              onClick={() => setShowManagePeriods(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Manage Periods</span>
              <span className="xs:hidden">Periods</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto md:overflow-x-visible">
            <table className="w-full hidden md:table">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-950">
                    Source
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-950">
                    Period
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-950">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-950">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-950">
                    End Date
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-blue-950">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {incomes.map((income) => (
                  <tr
                    key={income.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-blue-900">
                      {income.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-900">
                      {income.incomePeriod.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      ₱{income.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-900">
                      {income.date ? new Date(income.date).getDate() : ""}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-900">
                      {income.endDate ? income.endDate : ""}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEditIncome(income)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleRemove(income.id || 0)}
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
            {incomes.map((income) => (
              <div
                key={income.id}
                className="bg-white p-4 rounded-lg shadow flex flex-col gap-2"
              >
                <div className="text-blue-900">
                  <strong>Source:</strong> {income.name}
                </div>
                <div className="text-blue-900">
                  <strong>Period:</strong> {income.incomePeriod.name}
                </div>
                <div className="text-blue-900">
                  <strong>Amount:</strong>{" "}
                  <span className="text-green-600">
                    ₱{income.amount.toLocaleString()}
                  </span>
                </div>
                <div className="text-blue-900">
                  <strong>Date of the Month:</strong> {income.date}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEditIncome(income)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => toggleRemove(income.id || 0)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1 text-sm text-red-600 bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {incomes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-blue-500 text-lg">No income records found</p>
              <p className="text-blue-400 text-sm mt-2">
                Click "Add Income" to create your first entry
              </p>
            </div>
          )}
        </div>

        <ManagePeriods
          isOpen={showManagePeriods}
          onClose={() => setShowManagePeriods(false)}
        />
        <IncomeModal
          isOpen={showIncomeModal}
          onClose={handleCloseModal}
          onSave={onIncomeSave}
          incomeData={selectedIncome}
        />
      </div>
    </div>
  );
}
