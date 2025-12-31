"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Edit,
  Plus,
  RefreshCwIcon,
  Trash2,
  Wallet,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Settings,
} from "lucide-react";
import Loader from "@/components/loader";

interface Saving {
  id: number;
  month: number;
  amount: number;
  isPaid: boolean;
  isObsolete: boolean;
  borrowedAmount: number | null;
  borrowedAmountPaid: number | null;
  year: number;
}

const MONTHS = [
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

export default function Savings() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Modal states
  const [showSavingModal, setShowSavingModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    month: 1,
    amount: "",
    isPaid: false,
    year: selectedYear,
  });

  const [borrowData, setBorrowData] = useState({
    amount: "",
  });

  useEffect(() => {
    setSelectedYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();

    const savingsResponse = await supabase
      .from("savings")
      .select("*")
      .eq("isObsolete", false)
      .eq("year", selectedYear)
      .order("month");

    if (savingsResponse.data) setSavings(savingsResponse.data);
    setLoading(false);
  };

  // Calculate statistics
  const totalSavings = savings.reduce(
    (sum, s) => (s.isPaid ? sum + s.amount : sum),
    0
  );
  const totalBorrowed = savings.reduce(
    (sum, s) => sum + (s.borrowedAmount || 0),
    0
  );
  const totalBorrowedPaid = savings.reduce(
    (sum, s) => sum + (s.borrowedAmountPaid || 0),
    0
  );
  const outstandingBorrowed = totalBorrowed - totalBorrowedPaid;
  const availableToSave = totalSavings - totalBorrowed;
  const maxBorrowable = totalSavings / 2;
  const canBorrowMore = totalBorrowed < maxBorrowable;
  const availableToBorrow = maxBorrowable - totalBorrowed;

  const FIXED_THRESHOLD = 100000; // Fixed threshold of 100k
  const thresholdProgress = (totalSavings / FIXED_THRESHOLD) * 100;

  const handleAddSaving = () => {
    setSelectedSaving(null);
    setFormData({
      month: 1,
      amount: "",
      isPaid: false,
      year: selectedYear,
    });
    setShowSavingModal(true);
  };

  const handleEditSaving = (saving: Saving) => {
    setSelectedSaving(saving);
    setFormData({
      month: saving.month,
      amount: saving.amount.toString(),
      isPaid: saving.isPaid,
      year: saving.year,
    });
    setShowSavingModal(true);
  };

  const handleSaveSaving = async () => {
    const supabase = createClient();

    const savingData = {
      month: formData.month,
      amount: parseFloat(formData.amount),
      isPaid: formData.isPaid,
      year: formData.year,
      isObsolete: false,
    };

    if (selectedSaving) {
      await supabase
        .from("savings")
        .update(savingData)
        .eq("id", selectedSaving.id);
    } else {
      await supabase.from("savings").insert(savingData);
    }

    setShowSavingModal(false);
    fetchData();
  };

  const handleDeleteSaving = async (id: number) => {
    if (!confirm("Are you sure you want to delete this saving?")) return;

    const supabase = createClient();
    await supabase.from("savings").update({ isObsolete: true }).eq("id", id);
    fetchData();
  };

  const handleBorrow = (saving: Saving) => {
    setSelectedSaving(saving);
    setBorrowData({ amount: "" });
    setShowBorrowModal(true);
  };

  const handleSaveBorrow = async () => {
    if (!selectedSaving) return;

    const borrowAmount = parseFloat(borrowData.amount);
    const currentBorrowed = selectedSaving.borrowedAmount || 0;
    const totalBorrowedFromThis = currentBorrowed + borrowAmount;

    // Check if we can borrow this amount
    if (totalBorrowed + borrowAmount > maxBorrowable) {
      alert(
        `Cannot borrow ₱${borrowAmount.toFixed(
          2
        )}. Maximum borrowable amount is ₱${availableToBorrow.toFixed(2)}`
      );
      return;
    }

    const supabase = createClient();
    await supabase
      .from("savings")
      .update({
        borrowedAmount: totalBorrowedFromThis,
      })
      .eq("id", selectedSaving.id);

    setShowBorrowModal(false);
    fetchData();
  };

  const handleRepay = async (saving: Saving) => {
    const borrowedAmount = saving.borrowedAmount || 0;
    const alreadyPaid = saving.borrowedAmountPaid || 0;
    const remaining = borrowedAmount - alreadyPaid;

    const repayAmount = prompt(
      `Enter repayment amount (Outstanding: ₱${remaining.toFixed(2)}):`
    );
    if (!repayAmount) return;

    const amount = parseFloat(repayAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (amount > remaining) {
      alert("Repayment amount cannot exceed outstanding balance");
      return;
    }

    const supabase = createClient();
    await supabase
      .from("savings")
      .update({
        borrowedAmountPaid: alreadyPaid + amount,
      })
      .eq("id", saving.id);

    fetchData();
  };

  const handleOpenThresholdModal = () => {
    alert(
      `Yearly savings threshold is fixed at ₱${FIXED_THRESHOLD.toLocaleString()}`
    );
  };

  if (loading) return <Loader message="Loading savings..." />;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
            Savings
          </h1>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedYear || 2026}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - 5 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>

            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <RefreshCwIcon className="w-4 h-4" />
              Refresh
            </button>

            <button
              onClick={handleAddSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Saving
            </button>

            <button
              onClick={handleOpenThresholdModal}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              <Settings className="w-4 h-4" />
              View Threshold
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                Total Savings
              </h3>
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              ₱{totalSavings.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                Outstanding Borrowed
              </h3>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">
              ₱{outstandingBorrowed.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                Available to Borrow
              </h3>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              ₱{availableToBorrow.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max: ₱{maxBorrowable.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                Yearly Threshold
              </h3>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {thresholdProgress.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Goal: ₱{FIXED_THRESHOLD.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Savings Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full hidden md:table">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Month
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Borrowed
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Paid Back
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Outstanding
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {savings.map((saving) => {
                  const borrowed = saving.borrowedAmount || 0;
                  const paid = saving.borrowedAmountPaid || 0;
                  const outstanding = borrowed - paid;

                  return (
                    <tr
                      key={saving.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {MONTHS[saving.month - 1]}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-green-600">
                        ₱{saving.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            saving.isPaid
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {saving.isPaid ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600">
                        {borrowed > 0 ? `₱${borrowed.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600">
                        {paid > 0 ? `₱${paid.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-orange-600">
                        {outstanding > 0 ? `₱${outstanding.toFixed(2)}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEditSaving(saving)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {saving.isPaid && canBorrowMore && (
                            <button
                              onClick={() => handleBorrow(saving)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded transition"
                              title="Borrow"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          {outstanding > 0 && (
                            <button
                              onClick={() => handleRepay(saving)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                              title="Repay"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSaving(saving.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile view */}
            <div className="md:hidden flex flex-col gap-4 p-4">
              {savings.map((saving) => {
                const borrowed = saving.borrowedAmount || 0;
                const paid = saving.borrowedAmountPaid || 0;
                const outstanding = borrowed - paid;

                return (
                  <div
                    key={saving.id}
                    className="bg-gray-50 p-4 rounded-lg shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {MONTHS[saving.month - 1]}
                        </h3>
                        <p className="text-lg font-bold text-green-600">
                          ₱{saving.amount.toFixed(2)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          saving.isPaid
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {saving.isPaid ? "Paid" : "Pending"}
                      </span>
                    </div>

                    {(borrowed > 0 || paid > 0) && (
                      <div className="text-sm space-y-1 mb-3">
                        {borrowed > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Borrowed:</span>
                            <span className="text-red-600">
                              ₱{borrowed.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {paid > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Paid Back:</span>
                            <span className="text-green-600">
                              ₱{paid.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {outstanding > 0 && (
                          <div className="flex justify-between font-medium">
                            <span className="text-gray-700">Outstanding:</span>
                            <span className="text-orange-600">
                              ₱{outstanding.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSaving(saving)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      {saving.isPaid && canBorrowMore && (
                        <button
                          onClick={() => handleBorrow(saving)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-purple-600 bg-purple-50 rounded"
                        >
                          <DollarSign className="w-4 h-4" /> Borrow
                        </button>
                      )}
                      {outstanding > 0 && (
                        <button
                          onClick={() => handleRepay(saving)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-green-600 bg-green-50 rounded"
                        >
                          <TrendingUp className="w-4 h-4" /> Repay
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSaving(saving.id)}
                        className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {savings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No savings records found</p>
              <p className="text-gray-400 text-sm mt-2">
                Click "Add Saving" to create your first entry
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Saving Modal */}
      {showSavingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {selectedSaving ? "Edit Saving" : "Add Saving"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  value={formData.month}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      month: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MONTHS.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={(e) =>
                    setFormData({ ...formData, isPaid: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Mark as Paid
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSavingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Borrow Modal */}
      {showBorrowModal && selectedSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Borrow from Savings</h3>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Month:</strong> {MONTHS[selectedSaving.month - 1]}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Available to borrow:</strong> ₱
                {availableToBorrow.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Maximum borrowable (50% of total):</strong> ₱
                {maxBorrowable.toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Borrow Amount
              </label>
              <input
                type="number"
                value={borrowData.amount}
                onChange={(e) =>
                  setBorrowData({ ...borrowData, amount: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBorrowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBorrow}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Borrow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
