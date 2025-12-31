"use client";
import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Period {
  id: number;
  name: string;
  date: string;
}

interface Person {
  id: number;
  name: string;
}

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  incomeData?: IncomeFormData | null;
}

export default function IncomeModal({
  isOpen,
  onClose,
  onSave,
  incomeData,
}: IncomeModalProps) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<IncomeFormData>({
    name: "",
    periodId: "",
    personId: "",
    date: "",
    amount: "",
    endDate: "",
  });

  const isFormInvalid =
    !formData.name.trim() ||
    !formData.periodId ||
    !formData.personId ||
    !formData.date ||
    !formData.amount;

  const isEditMode = incomeData && incomeData.id;

  useEffect(() => {
    if (isOpen) {
      loadPeriods();
      loadPersons();

      // Set form data based on incomeData prop
      if (incomeData) {
        setFormData({
          id: incomeData.id,
          name: incomeData.name || "",
          periodId: incomeData.periodId || "",
          personId: incomeData.personId || "",
          date: incomeData.date || "",
          amount: incomeData.amount || "",
          endDate: incomeData.endDate || "",
        });
      } else {
        // Reset form for adding new income
        setFormData({
          name: "",
          periodId: "",
          personId: "",
          date: "",
          amount: "",
          endDate: "",
        });
      }
    }
  }, [isOpen, incomeData]);

  const loadPeriods = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("incomeperiod")
      .select("*")
      .eq("isObsolete", false)
      .order("id", { ascending: true });

    if (error) {
      console.error("Error loading periods:", error);
    } else {
      setPeriods(data || []);
    }
    setLoading(false);
  };

  const loadPersons = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("person")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading persons:", error);
    } else {
      setPersons(data || []);
    }
    setLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.name ||
      !formData.periodId ||
      !formData.personId ||
      !formData.date ||
      !formData.amount
    ) {
      alert("Please fill in all fields");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      const incomePayload = {
        name: formData.name,
        incomePeriodId: parseInt(formData.periodId),
        personId: parseInt(formData.personId),
        amount: parseFloat(formData.amount),
        date: formData.date,
        endDate: formData.endDate || null,
      };

      if (isEditMode) {
        // Update existing income
        const { error } = await supabase
          .from("income")
          .update(incomePayload)
          .eq("id", formData.id);

        if (error) throw error;
        alert("Income updated successfully!");
      } else {
        // Insert new income
        const { error } = await supabase.from("income").insert(incomePayload);

        if (error) throw error;
        alert("Income added successfully!");
      }

      onSave(); // Refresh the parent list
      onClose();
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "adding"} income:`,
        error
      );
      alert(`Failed to ${isEditMode ? "update" : "add"} income`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-blue-900">
            {isEditMode ? "Edit Income" : "Add Income"}
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
          {/* Income Name */}
          <div>
            <label className="block text-sm font-medium text-blue-950 mb-2">
              Income Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-3 py-2 border bg-white text-blue-800 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Salary, Freelance Project"
            />
          </div>

          {/* Person Dropdown */}
          <div>
            <label className="block text-sm font-medium text-blue-950 mb-2">
              Person
            </label>
            <select
              value={formData.personId}
              onChange={(e) => handleChange("personId", e.target.value)}
              className="w-full px-3 py-2 border bg-white text-blue-800 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select person</option>
              {loading ? (
                <option disabled>Loading persons...</option>
              ) : (
                persons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Period Dropdown */}
          <div>
            <label className="block text-sm font-medium text-blue-950 mb-2">
              Period
            </label>
            <select
              value={formData.periodId}
              onChange={(e) => handleChange("periodId", e.target.value)}
              className="w-full px-3 py-2 border bg-white text-blue-800 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a period</option>
              {loading ? (
                <option disabled>Loading periods...</option>
              ) : (
                periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-blue-950 mb-2">
              Estimated Amount
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
                placeholder="50000.00"
              />
            </div>
          </div>

          {/* Date (Integer) */}
          <div>
            <label className="block text-sm font-medium text-blue-950 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="w-full px-3 py-2 border bg-white text-blue-800 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-950 mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              className="w-full px-3 py-2 border bg-white text-blue-800 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              disabled={saving || isFormInvalid}
              className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving
                ? "Saving..."
                : isEditMode
                ? "Update Income"
                : "Save Income"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
