"use client";
import { useMemo, useState } from "react";
import { X, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface ExpenseScheduleRecord {
  id: string;
  date: string;
  amount: number;
  isPaid: boolean;
  expense?: {
    title: string;
    category?: { id: string | number; name: string } | null;
  };
}

interface ExpenseRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ExpenseScheduleRecord[];
  periodLabel: string;
}

type SortField = "date" | "amount";
type SortDir = "asc" | "desc";

// Cycling palette for category badges
const BADGE_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
];

export default function ExpenseRecordsModal({
  isOpen,
  onClose,
  records,
  periodLabel,
}: ExpenseRecordsModalProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Unique categories derived from records
  const categories = useMemo(() => {
    const seen = new Map<string, string>(); // name -> name (deduped)
    records.forEach((r) => {
      const name = r.expense?.category?.name ?? "Uncategorized";
      seen.set(name, name);
    });
    return ["all", ...[...seen.keys()].sort()];
  }, [records]);

  // Color map: category name -> badge class
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories
      .filter((c) => c !== "all")
      .forEach((c, i) => {
        map[c] = BADGE_COLORS[i % BADGE_COLORS.length];
      });
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    let result = [...records];

    if (categoryFilter !== "all") {
      result = result.filter(
        (r) =>
          (r.expense?.category?.name ?? "Uncategorized") === categoryFilter
      );
    }

    result.sort((a, b) => {
      if (sortField === "date") {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortDir === "asc" ? diff : -diff;
      }
      return sortDir === "asc" ? a.amount - b.amount : b.amount - a.amount;
    });

    return result;
  }, [records, categoryFilter, sortField, sortDir]);

  const total = filtered.reduce((sum, r) => sum + r.amount, 0);

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
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Expense Records
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {periodLabel} &middot; {filtered.length} record
                {filtered.length !== 1 ? "s" : ""}
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

        {/* Category chips + sort */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 space-y-2.5">
          {/* Category filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition border ${
                  categoryFilter === cat
                    ? "bg-red-500 text-white border-red-500"
                    : cat !== "all"
                    ? `${colorMap[cat]} border-transparent hover:opacity-80`
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>

          {/* Sort buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Sort by:
            </span>
            {(["date", "amount"] as SortField[]).map((field) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  sortField === field
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
                <SortIcon field={field} />
              </button>
            ))}
          </div>
        </div>

        {/* Records list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-500">
              No expense records found.
            </div>
          ) : (
            filtered.map((r) => {
              const catName = r.expense?.category?.name ?? "Uncategorized";
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {r.expense?.title ?? "—"}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                            colorMap[catName] ?? BADGE_COLORS[0]
                          }`}
                        >
                          {catName}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {new Date(r.date + "T00:00:00").toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "short", day: "numeric" }
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400 shrink-0 ml-4">
                    -₱{r.amount.toFixed(2)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {categoryFilter === "all"
              ? "Total Expenses"
              : `Total · ${categoryFilter}`}
          </span>
          <span className="text-lg font-bold text-red-600 dark:text-red-400">
            -₱{total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}