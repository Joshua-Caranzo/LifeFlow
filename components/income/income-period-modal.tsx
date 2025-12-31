"use client";
import { useState, useEffect } from "react";
import { X, Edit, Plus, Save, Trash, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Loader from "../loader";

interface Period {
  id?: number;
  name: string;
  isEditing?: boolean;
  isNew?: boolean;
}

interface ManagePeriodsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManagePeriods({ isOpen, onClose }: ManagePeriodsProps) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPeriods();
    }
  }, [isOpen]);

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

  const addNewPeriod = () => {
    const newPeriod: Period = {
      name: "",
      isEditing: true,
      isNew: true,
    };
    setPeriods([...periods, newPeriod]);
  };

  const toggleEdit = (index: number) => {
    const updated = [...periods];
    updated[index].isEditing = !updated[index].isEditing;
    setPeriods(updated);
  };

  const toggleRemove = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this income period?"
    );

    if (!confirmed) return;
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("incomeperiod")
      .update({ isObsolete: true })
      .eq("id", id);
    if (updateError) throw updateError;

    await loadPeriods();
  };

  const updatePeriod = (index: number, field: keyof Period, value: string) => {
    const updated = [...periods];
    updated[index] = { ...updated[index], [field]: value };
    setPeriods(updated);
  };

  const saveChanges = async () => {
    setSaving(true);
    const supabase = createClient();

    try {
      // Separate new and existing periods
      const newPeriods = periods.filter((p) => p.isNew);
      const existingPeriods = periods.filter((p) => !p.isNew && p.isEditing);

      // Insert new periods
      if (newPeriods.length > 0) {
        const { error: insertError } = await supabase
          .from("incomeperiod")
          .insert(newPeriods.map(({ name }) => ({ name })));

        if (insertError) throw insertError;
      }

      // Update existing periods
      for (const period of existingPeriods) {
        const { error: updateError } = await supabase
          .from("incomeperiod")
          .update({ name: period.name })
          .eq("id", period.id);

        if (updateError) throw updateError;
      }

      // Reset editing states and reload
      await loadPeriods();
      alert("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving periods:", error);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const removeNewPeriod = (index: number) => {
    setPeriods((prev) => prev.filter((_, i) => i !== index));
  };

  const hasEmptyName = periods.some(
    (p) => (p.isNew || p.isEditing) && !p.name.trim()
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-blue-900">Income Periods</h2>
          <button
            onClick={onClose}
            className="text-blue-800 hover:text-blue-950 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <Loader message="Loading income period..." fullScreen={false} />
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-blue-950">
                    Name
                  </th>

                  <th className="px-4 py-3 text-right text-sm font-semibold text-blue-950">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {periods.map((period, index) => (
                  <tr
                    key={period.id || `new-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      {period.isEditing ? (
                        <input
                          type="text"
                          value={period.name}
                          onChange={(e) =>
                            updatePeriod(index, "name", e.target.value)
                          }
                          className="w-full px-2 py-0.5 border bg-white text-blue-800 border-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Period name"
                        />
                      ) : (
                        <span className="text-sm text-blue-900">
                          {period.name}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {period.isNew ? (
                        <button
                          onClick={() => removeNewPeriod(index)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <div>
                          <button
                            onClick={() => toggleEdit(index)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleRemove(period.id || 0)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Add New Row Button */}
                <tr>
                  <td colSpan={3} className="px-4 py-3">
                    <button
                      onClick={addNewPeriod}
                      className="w-full flex items-center justify-center gap-2 py-2 text-blue-600 hover:bg-blue-50 rounded transition-colors border-2 border-dashed border-gray-300"
                    >
                      <Plus className="w-5 h-5" />
                      Add Period
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveChanges}
            disabled={saving || hasEmptyName}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
