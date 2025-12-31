"use client";
import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Category {
  id: number;
  name: string;
}

interface Occurrence {
  id: number;
  name: string;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  expenseData?: ExpenseFormData | null;
}

export default function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  expenseData,
}: ExpenseModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<ExpenseFormData>({
    title: "",
    description: "",
    note: "",
    amount: "",
    categoryId: "",
    expenseDate: "",
    endExpenseDate: "",
    occurrenceId: "",
  });

  const isEditMode = expenseData && expenseData.id;

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadOccurrences();

      // Set form data based on expenseData prop
      if (expenseData) {
        setFormData({
          id: expenseData.id,
          title: expenseData.title || "",
          description: expenseData.description || "",
          note: expenseData.note || "",
          amount: expenseData.amount || "",
          categoryId: expenseData.categoryId || "",
          expenseDate: expenseData.expenseDate || "",
          endExpenseDate: expenseData.endExpenseDate || "",
          occurrenceId: expenseData.occurrenceId || "",
        });
      } else {
        // Reset form for adding new expense
        setFormData({
          title: "",
          description: "",
          note: "",
          amount: "",
          categoryId: "",
          expenseDate: "",
          endExpenseDate: "",
          occurrenceId: "",
        });
      }
    }
  }, [isOpen, expenseData]);

  const loadCategories = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("expensecategory")
      .select("*")
      .eq("isObsolete", false)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading categories:", error);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const loadOccurrences = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("occurrence")
      .select("*")
      .eq("isObsolete", false)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading categories:", error);
    } else {
      setOccurrences(data || []);
    }
    setLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.title ||
      !formData.amount ||
      !formData.categoryId ||
      !formData.expenseDate
    ) {
      alert(
        "Please fill in all required fields (Title, Amount, Category, and Expense Date)"
      );
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      const expensePayload = {
        title: formData.title,
        description: formData.description,
        note: formData.note,
        amount: parseFloat(formData.amount),
        categoryId: parseInt(formData.categoryId),
        expenseDate: formData.expenseDate,
        endExpenseDate: formData.endExpenseDate || null,
        occurrenceId: parseInt(formData.occurrenceId),
      };

      if (isEditMode) {
        // Update existing expense
        const { error } = await supabase
          .from("expense")
          .update(expensePayload)
          .eq("id", formData.id);

        if (error) throw error;
        alert("Expense updated successfully!");
      } else {
        // Insert new expense
        const { error } = await supabase.from("expense").insert(expensePayload);

        if (error) throw error;
        alert("Expense added successfully!");
      }

      onSave(); // Refresh the parent list
      onClose();
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "adding"} expense:`,
        error
      );
      alert(`Failed to ${isEditMode ? "update" : "add"} expense`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-blue-900">
            {isEditMode ? "Edit Expense" : "Add Expense"}
          </h2>
          <button
            onClick={onClose}
            className="text-blue-800 hover:text-blue-950 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-blue-950 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full px-3 py-2 border bg-white text-blue-800 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Groceries, Electric Bill"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-blue-950 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full px-3 py-2 border bg-white text-blue-800 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              placeholder="Brief description of the expense"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-blue-950 mb-2">
              Note
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => handleChange("note", e.target.value)}
              className="w-full px-3 py-2 border bg-white text-blue-800 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
              placeholder="Additional notes or comments"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-sm font-medium text-blue-950 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => handleChange("categoryId", e.target.value)}
              className="w-full px-3 py-2 border bg-white text-blue-800 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {loading ? (
                <option disabled>Loading categories...</option>
              ) : (
                categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Occurrence Dropdown */}
          <div>
            <label className="block text-sm font-medium text-blue-950 mb-2">
              Occurrence <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.occurrenceId}
              onChange={(e) => handleChange("occurrenceId", e.target.value)}
              className="w-full px-3 py-2 border bg-white text-blue-800 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an occurrence</option>
              {loading ? (
                <option disabled>Loading occurrence...</option>
              ) : (
                occurrences.map((occ) => (
                  <option key={occ.id} value={occ.id}>
                    {occ.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-blue-950 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₱</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                className="w-full pl-8 pr-3 py-2 border bg-white text-blue-800 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expense Date */}
            <div>
              <label className="block text-sm font-medium text-blue-950 mb-2">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.expenseDate}
                onChange={(e) => handleChange("expenseDate", e.target.value)}
                className="w-full px-3 py-2 border bg-white text-blue-800 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Expense Date */}
            <div>
              <label className="block text-sm font-medium text-blue-950 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.endExpenseDate}
                onChange={(e) => handleChange("endExpenseDate", e.target.value)}
                className="w-full px-3 py-2 border bg-white text-blue-800 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving
                ? "Saving..."
                : isEditMode
                ? "Update Expense"
                : "Save Expense"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
