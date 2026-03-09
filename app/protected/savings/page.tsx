// UPDATED
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
  Tag,
  ArrowLeftRight,
  CheckCircle2,
} from "lucide-react";
import Loader from "@/components/loader";

interface SavingsType {
  id: number;
  name: string;
}

interface Saving {
  id: number;
  month: number | null;
  amount: number;
  isPaid: boolean;
  isObsolete: boolean;
  borrowedAmount: number | null;
  borrowedAmountPaid: number | null;
  year: number;
  savingsTypeId: number;
  savingsTypeName?: string;
  name: string | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTHLY_SAVINGS_TYPE_ID = 1;

export default function Savings() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [savingsTypes, setSavingsTypes] = useState<SavingsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showSavingModal, setShowSavingModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
  const [formData, setFormData] = useState({
    savingsTypeId: MONTHLY_SAVINGS_TYPE_ID,
    month: 1,
    name: "",
    amount: "",
    isPaid: false,
    year: selectedYear,
  });
  const [borrowData, setBorrowData] = useState({ amount: "" });
  const [settleData, setSettleData] = useState({ amount: "" });
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showManageTypesModal, setShowManageTypesModal] = useState(false);
  const [selectedType, setSelectedType] = useState<SavingsType | null>(null);
  const [typeFormData, setTypeFormData] = useState({ name: "" });

  useEffect(() => { setSelectedYear(new Date().getFullYear()); }, []);
  useEffect(() => { fetchData(); }, [selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();
    const typesResponse = await supabase.from("savingstype").select("*").order("id");
    if (typesResponse.data) setSavingsTypes(typesResponse.data);
    const savingsResponse = await supabase
      .from("savings")
      .select("*, savingstype(name)")
      .eq("isObsolete", false)
      .eq("year", selectedYear)
      .order("month");
    if (savingsResponse.data) {
      setSavings(savingsResponse.data.map((s: any) => ({
        ...s,
        savingsTypeName: s.savingstype?.name ?? "",
      })));
    }
    setLoading(false);
  };

  const isMonthly = (typeId: number) => typeId === MONTHLY_SAVINGS_TYPE_ID;

  // Separate totals by type
  const totalMonthlySavings = savings
    .filter((s) => s.isPaid && isMonthly(s.savingsTypeId))
    .reduce((sum, s) => sum + s.amount, 0);
  const totalOtherSavings = savings
    .filter((s) => s.isPaid && !isMonthly(s.savingsTypeId))
    .reduce((sum, s) => sum + s.amount, 0);
  const totalSavings = totalMonthlySavings + totalOtherSavings;

  // Borrow pool is based on MONTHLY savings only
  const maxBorrowable = totalMonthlySavings / 2;
  // Running balance only from monthly savings rows
  const totalRunningBalance = savings
    .filter((s) => isMonthly(s.savingsTypeId))
    .reduce((sum, s) => sum + Math.max(0, (s.borrowedAmount || 0) - (s.borrowedAmountPaid || 0)), 0);
  // Available recalculates as paidBack reduces the running balance
  const availableToBorrow = Math.max(0, maxBorrowable - totalRunningBalance);
  const canBorrowMore = availableToBorrow > 0;
  const FIXED_THRESHOLD = 100000;
  const thresholdProgress = (totalSavings / FIXED_THRESHOLD) * 100;

  const handleAddSaving = () => {
    setSelectedSaving(null);
    setFormData({ savingsTypeId: MONTHLY_SAVINGS_TYPE_ID, month: 1, name: "", amount: "", isPaid: false, year: selectedYear });
    setShowSavingModal(true);
  };

  const handleEditSaving = (saving: Saving) => {
    setSelectedSaving(saving);
    setFormData({
      savingsTypeId: saving.savingsTypeId,
      month: saving.month ?? 1,
      name: saving.name ?? "",
      amount: saving.amount.toString(),
      isPaid: saving.isPaid,
      year: saving.year,
    });
    setShowSavingModal(true);
  };

  const handleSaveSaving = async () => {
    const supabase = createClient();
    const savingData: any = {
      savingsTypeId: formData.savingsTypeId,
      amount: parseFloat(formData.amount),
      isPaid: formData.isPaid,
      year: formData.year,
      isObsolete: false,
    };
    if (isMonthly(formData.savingsTypeId)) {
      savingData.month = formData.month;
      savingData.name = null;
    } else {
      savingData.month = null;
      savingData.name = formData.name;
    }
    if (selectedSaving) {
      await supabase.from("savings").update(savingData).eq("id", selectedSaving.id);
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
    if (isNaN(borrowAmount) || borrowAmount <= 0) return;
    if (borrowAmount > availableToBorrow) {
      alert(`Cannot borrow ₱${borrowAmount.toFixed(2)}. Maximum available: ₱${availableToBorrow.toFixed(2)}`);
      return;
    }
    const newBorrowed = (selectedSaving.borrowedAmount || 0) + borrowAmount;
    const supabase = createClient();
    await supabase.from("savings").update({ borrowedAmount: newBorrowed }).eq("id", selectedSaving.id);
    setShowBorrowModal(false);
    fetchData();
  };

  // ── Settle (was Repay) ──
  const handleSettle = (saving: Saving) => {
    setSelectedSaving(saving);
    setSettleData({ amount: "" });
    setShowSettleModal(true);
  };

  const settleOutstanding = selectedSaving
    ? (selectedSaving.borrowedAmount || 0) - (selectedSaving.borrowedAmountPaid || 0)
    : 0;

  const handleSettleAll = () => setSettleData({ amount: settleOutstanding.toFixed(2) });

  const handleConfirmSettle = async () => {
    if (!selectedSaving) return;
    const amount = parseFloat(settleData.amount);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > settleOutstanding) {
      return;
    }
    const supabase = createClient();
    await supabase
      .from("savings")
      .update({ borrowedAmountPaid: (selectedSaving.borrowedAmountPaid || 0) + amount })
      .eq("id", selectedSaving.id);
    setShowSettleModal(false);
    fetchData();
  };

  const getSavingLabel = (saving: Saving) => {
    if (isMonthly(saving.savingsTypeId) && saving.month != null)
      return MONTHS[saving.month - 1];
    return saving.name || saving.savingsTypeName || "—";
  };

  const handleAddType = () => {
    setSelectedType(null);
    setTypeFormData({ name: "" });
    setShowTypeModal(true);
  };

  const handleEditType = (type: SavingsType) => {
    setSelectedType(type);
    setTypeFormData({ name: type.name });
    setShowTypeModal(true);
  };

  const handleSaveType = async () => {
    if (!typeFormData.name.trim()) return;
    const supabase = createClient();
    if (selectedType) {
      await supabase.from("savingstype").update({ name: typeFormData.name.trim() }).eq("id", selectedType.id);
    } else {
      await supabase.from("savingstype").insert({ name: typeFormData.name.trim() });
    }
    setShowTypeModal(false);
    fetchData();
  };

  const handleDeleteType = async (id: number) => {
    if (!confirm("Are you sure you want to delete this savings type? This may affect existing savings.")) return;
    const supabase = createClient();
    await supabase.from("savingstype").delete().eq("id", id);
    fetchData();
  };

  if (loading) return <Loader message="Loading savings..." />;

  const settleAmountNum = parseFloat(settleData.amount) || 0;
  const settleError = settleAmountNum > settleOutstanding && settleData.amount !== "";

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Savings</h1>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedYear || 2026}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - 5 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <RefreshCwIcon className="w-4 h-4" /> Refresh
            </button>
            <button onClick={handleAddSaving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <Plus className="w-4 h-4" /> Add Saving
            </button>
            <button onClick={() => setShowManageTypesModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              <Tag className="w-4 h-4" /> Savings Types
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Monthly Savings */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Monthly Savings</h3>
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">₱{totalMonthlySavings.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">Paid monthly entries</p>
          </div>

          {/* Other Savings */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-teal-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Other Savings</h3>
              <Wallet className="w-5 h-5 text-teal-500" />
            </div>
            <p className="text-2xl font-bold text-teal-600">₱{totalOtherSavings.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">Paid non-monthly entries</p>
          </div>

          {/* Total Savings */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Savings</h3>
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">₱{totalSavings.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">All paid entries combined</p>
          </div>

          {/* Outstanding Balance */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Outstanding Balance</h3>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">₱{totalRunningBalance.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">From monthly savings only</p>
          </div>

          {/* Available to Borrow */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Available to Borrow</h3>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">₱{availableToBorrow.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">50% of monthly · cap ₱{maxBorrowable.toFixed(2)}</p>
          </div>

          {/* Yearly Threshold */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Yearly Threshold</h3>
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-500">{thresholdProgress.toFixed(1)}%</p>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-orange-400 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(thresholdProgress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Goal: ₱{FIXED_THRESHOLD.toLocaleString()}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full hidden md:table">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Borrowed
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {savings.map((saving) => {
                  const runningBalance = Math.max(0, (saving.borrowedAmount || 0) - (saving.borrowedAmountPaid || 0));
                  const hasBalance = runningBalance > 0;
                  const canBorrowThis = isMonthly(saving.savingsTypeId) && saving.isPaid && canBorrowMore;
                  return (
                    <tr key={saving.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          {saving.savingsTypeName || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{getSavingLabel(saving)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-green-600">₱{saving.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${saving.isPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {saving.isPaid ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {hasBalance
                          ? <span className="text-sm font-semibold text-red-600">₱{runningBalance.toFixed(2)}</span>
                          : <span className="text-sm text-gray-400">—</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 items-center">
                          <button onClick={() => handleEditSaving(saving)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          {canBorrowThis && (
                            <button onClick={() => handleBorrow(saving)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition">
                              <DollarSign className="w-3.5 h-3.5" /> Borrow
                            </button>
                          )}
                          {hasBalance && (
                            <button onClick={() => handleSettle(saving)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition">
                              <ArrowLeftRight className="w-3.5 h-3.5" /> Settle
                            </button>
                          )}
                          <button onClick={() => handleDeleteSaving(saving.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile */}
            <div className="md:hidden flex flex-col gap-4 p-4">
              {savings.map((saving) => {
                const runningBalance = Math.max(0, (saving.borrowedAmount || 0) - (saving.borrowedAmountPaid || 0));
                const hasBalance = runningBalance > 0;
                const canBorrowThis = isMonthly(saving.savingsTypeId) && saving.isPaid && canBorrowMore;
                return (
                  <div key={saving.id} className="bg-gray-50 p-4 rounded-lg shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="inline-block mb-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          {saving.savingsTypeName || "—"}
                        </span>
                        <h3 className="font-semibold text-gray-900">{getSavingLabel(saving)}</h3>
                        <p className="text-lg font-bold text-green-600">₱{saving.amount.toFixed(2)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${saving.isPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {saving.isPaid ? "Paid" : "Pending"}
                      </span>
                    </div>
                    {hasBalance && (
                      <div className="flex justify-between text-sm mb-3 bg-red-50 rounded-lg px-3 py-2">
                        <span className="text-gray-600">Borrowed (balance):</span>
                        <span className="text-red-600 font-semibold">₱{runningBalance.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => handleEditSaving(saving)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded">
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      {canBorrowThis && (
                        <button onClick={() => handleBorrow(saving)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg">
                          <DollarSign className="w-4 h-4" /> Borrow
                        </button>
                      )}
                      {hasBalance && (
                        <button onClick={() => handleSettle(saving)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <ArrowLeftRight className="w-4 h-4" /> Settle
                        </button>
                      )}
                      <button onClick={() => handleDeleteSaving(saving.id)} className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded">
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
              <p className="text-gray-400 text-sm mt-2">Click "Add Saving" to create your first entry</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Saving Modal */}
      {showSavingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">{selectedSaving ? "Edit Saving" : "Add Saving"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Savings Type</label>
                <select
                  value={formData.savingsTypeId}
                  onChange={(e) => setFormData({ ...formData, savingsTypeId: parseInt(e.target.value), month: 1, name: "" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {savingsTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              {isMonthly(formData.savingsTypeId) ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MONTHS.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Savings Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Emergency Fund, Travel Fund..."
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">Mark as Paid</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowSavingModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSaveSaving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Borrow Modal */}
      {showBorrowModal && selectedSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Borrow from Savings</h3>
                  <p className="text-purple-100 text-sm">{getSavingLabel(selectedSaving)}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Total Monthly Savings</p>
                  <p className="text-base font-bold text-green-600">₱{totalMonthlySavings.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 ring-2 ring-blue-200">
                  <p className="text-xs text-gray-500 mb-1">Available to Borrow</p>
                  <p className="text-base font-bold text-blue-600">₱{availableToBorrow.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">50% cap: ₱{maxBorrowable.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Borrow Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₱</span>
                  <input
                    type="number"
                    value={borrowData.amount}
                    onChange={(e) => setBorrowData({ amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                {parseFloat(borrowData.amount) > availableToBorrow && borrowData.amount !== "" && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Exceeds available amount of ₱{availableToBorrow.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowBorrowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button
                onClick={handleSaveBorrow}
                disabled={!borrowData.amount || parseFloat(borrowData.amount) <= 0 || parseFloat(borrowData.amount) > availableToBorrow}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
              >
                <DollarSign className="w-4 h-4" /> Confirm Borrow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Settle Balance Modal (replaces browser prompt) ── */}
      {showSettleModal && selectedSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">

            {/* Modal header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Settle Balance</h3>
                  <p className="text-emerald-100 text-sm">{getSavingLabel(selectedSaving)}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Summary row */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Total Borrowed</p>
                  <p className="text-base font-bold text-red-600">₱{(selectedSaving.borrowedAmount || 0).toFixed(2)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Already Settled</p>
                  <p className="text-base font-bold text-green-600">₱{(selectedSaving.borrowedAmountPaid || 0).toFixed(2)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 ring-2 ring-orange-200">
                  <p className="text-xs text-gray-500 mb-1">Still Owed</p>
                  <p className="text-base font-bold text-orange-600">₱{settleOutstanding.toFixed(2)}</p>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Payment Amount</label>
                  <button
                    onClick={handleSettleAll}
                    className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Settle in Full
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₱</span>
                  <input
                    type="number"
                    value={settleData.amount}
                    onChange={(e) => setSettleData({ amount: e.target.value })}
                    className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm transition ${
                      settleError
                        ? "border-red-400 focus:ring-red-300 bg-red-50"
                        : "border-gray-300 focus:ring-emerald-400"
                    }`}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                {settleError && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Cannot exceed outstanding balance of ₱{settleOutstanding.toFixed(2)}
                  </p>
                )}
                {!settleError && settleAmountNum > 0 && settleAmountNum < settleOutstanding && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    Remaining after this payment: ₱{(settleOutstanding - settleAmountNum).toFixed(2)}
                  </p>
                )}
                {!settleError && settleAmountNum === settleOutstanding && settleAmountNum > 0 && (
                  <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    This will fully clear the balance
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowSettleModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSettle}
                disabled={!settleData.amount || settleAmountNum <= 0 || settleError}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Savings Types Modal */}
      {showManageTypesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Savings Types</h3>
              <button onClick={handleAddType} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition">
                <Plus className="w-4 h-4" /> Add Type
              </button>
            </div>
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {savingsTypes.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No savings types yet</p>}
              {savingsTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">{type.id}</span>
                    <span className="text-sm font-medium text-gray-800">{type.name}</span>
                    {type.id === MONTHLY_SAVINGS_TYPE_ID && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">Borrowable</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditType(type)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteType(type.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <button onClick={() => setShowManageTypesModal(false)} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Savings Type Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-xl font-semibold mb-4">{selectedType ? "Edit Savings Type" : "Add Savings Type"}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type Name</label>
              <input
                type="text"
                value={typeFormData.name}
                onChange={(e) => setTypeFormData({ name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Emergency Fund, Investment..."
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowTypeModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSaveType} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}