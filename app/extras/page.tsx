"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Save, Plus, RefreshCw, Target, Users, Globe, Trash2, CheckCircle, Circle } from "lucide-react";
import { ResolutionList } from "@/components/resolution-list";
import Loader from "@/components/loader";

const supabase = createClient();
const CURRENT_YEAR = new Date().getFullYear();

type Resolution = {
  id: string;
  title: string;
  isCompleted: boolean;
  year: number;
  userId: string | null;
};

type Person = {
  id: string;
  name: string;
};

export default function ResolutionsPage() {
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: res }, { data: persons }] = await Promise.all([
      supabase.from("resolution").select("*").eq("year", year),
      supabase.from("person").select("id, name"),
    ]);

    setResolutions(res ?? []);
    setPeople(persons ?? []);
    setLoading(false);
  };

  const addResolution = async () => {
    if (!newTitle.trim()) return;

    setSaving(true);
    try {
      await supabase.from("resolution").insert({
        title: newTitle,
        year,
        userId: selectedPersonId,
        isCompleted: false,
      });

      setNewTitle("");
      setSelectedPersonId(null);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding resolution:", error);
      alert("Failed to add resolution");
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (id: string, value: boolean) => {
    await supabase.from("resolution").update({ isCompleted: value }).eq("id", id);
    fetchData();
  };

  const deleteResolution = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resolution?")) return;
    await supabase.from("resolution").delete().eq("id", id);
    fetchData();
  };

  const globalResolutions = resolutions.filter((r) => r.userId === null);
  const resolutionsByPerson = people.map((person) => ({
    person,
    resolutions: resolutions.filter((r) => r.userId === person.id),
  }));

  // Calculate statistics
  const totalResolutions = resolutions.length;
  const completedResolutions = resolutions.filter(r => r.isCompleted).length;
  const completionRate = totalResolutions > 0 
    ? ((completedResolutions / totalResolutions) * 100).toFixed(1) 
    : 0;

  const isFormInvalid = !newTitle.trim();

  if (loading) return <Loader message="Loading resolutions..." />;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
            New Year's Resolutions
          </h1>

          <div className="flex flex-wrap gap-2">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const y = CURRENT_YEAR - 2 + i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>

            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Resolution
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                Total Resolutions
              </h3>
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {totalResolutions}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                Completed
              </h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {completedResolutions}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                Completion Rate
              </h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {completionRate}%
            </p>
          </div>
        </div>

        {/* Resolutions Content */}
        <div className="space-y-6">
          {/* Global Resolutions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                For Everyone
              </h2>
              <span className="ml-auto text-sm text-gray-500">
                {globalResolutions.length} resolution{globalResolutions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {globalResolutions.length > 0 ? (
              <div className="space-y-2">
                {globalResolutions.map((resolution) => (
                  <div
                    key={resolution.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                  >
                    <button
                      onClick={() => toggleComplete(resolution.id, !resolution.isCompleted)}
                      className="flex-shrink-0"
                    >
                      {resolution.isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <span
                      className={`flex-1 ${
                        resolution.isCompleted
                          ? "line-through text-gray-500"
                          : "text-gray-900"
                      }`}
                    >
                      {resolution.title}
                    </span>
                    <button
                      onClick={() => deleteResolution(resolution.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No global resolutions yet</p>
                <p className="text-sm mt-1">Click "Add Resolution" to create one</p>
              </div>
            )}
          </div>

          {/* Per Person Resolutions */}
          {resolutionsByPerson.map(({ person, resolutions: personResolutions }) => (
            <div key={person.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {person.name}
                </h2>
                <span className="ml-auto text-sm text-gray-500">
                  {personResolutions.length} resolution{personResolutions.length !== 1 ? 's' : ''}
                </span>
              </div>

              {personResolutions.length > 0 ? (
                <div className="space-y-2">
                  {personResolutions.map((resolution) => (
                    <div
                      key={resolution.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                    >
                      <button
                        onClick={() => toggleComplete(resolution.id, !resolution.isCompleted)}
                        className="flex-shrink-0"
                      >
                        {resolution.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <span
                        className={`flex-1 ${
                          resolution.isCompleted
                            ? "line-through text-gray-500"
                            : "text-gray-900"
                        }`}
                      >
                        {resolution.title}
                      </span>
                      <button
                        onClick={() => deleteResolution(resolution.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No resolutions for {person.name} yet</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {resolutions.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No resolutions found for {year}</p>
            <p className="text-gray-400 text-sm mb-4">
              Start the year right by setting your goals!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Add Your First Resolution
            </button>
          </div>
        )}
      </div>

      {/* Add Resolution Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Resolution</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Exercise daily"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Person
                </label>
                <select
                  value={selectedPersonId ?? ""}
                  onChange={(e) =>
                    setSelectedPersonId(e.target.value || null)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">🌍 For Everyone</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      👤 {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={addResolution}
                  disabled={saving || isFormInvalid}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Resolution"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}