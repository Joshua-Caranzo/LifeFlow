"use client";
import { useMemo, useState } from "react";
import { X, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface IncomeScheduleRecord {
  id: string;
  date: string;
  amount: number;
  isReceived: boolean;
  income?: { name: string };
}

interface IncomeRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: IncomeScheduleRecord[];
  periodLabel: string;
}

type SortField = "date" | "amount";
type SortDir = "asc" | "desc";

export default function IncomeRecordsModal({
  isOpen,
  onClose,
  records,
  periodLabel,
}: IncomeRecordsModalProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    return [...records].sort((a, b) => {
      if (sortField === "date") {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortDir === "asc" ? diff : -diff;
      }
      return sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
    });
  }, [records, sortField, sortDir]);

  const total = records.reduce((sum, r) => sum + r.amount, 0);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3" />
    ) : (
      <ArrowDown className="w-3 h-3" />
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Income Records
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {periodLabel} &middot; {records.length} record
                {records.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Sort controls */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Sort by:
          </span>
          {(["date", "amount"] as SortField[]).map((field) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                sortField === field
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
              <SortIcon field={field} />
            </button>
          ))}
        </div>

        {/* Records list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {sorted.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-500">
              No income records found.
            </div>
          ) : (
            sorted.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {r.income?.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(r.date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600 dark:text-green-400 shrink-0 ml-4">
                  +₱{r.amount.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Income
          </span>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            +₱{total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}