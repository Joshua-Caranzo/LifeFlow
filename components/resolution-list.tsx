import { Check, Trash2 } from "lucide-react";

export function ResolutionList({
  data,
  onToggle,
  onDelete,
}: {
  data: Resolution[];
  onToggle: (id:string, value: boolean) => void;
  onDelete: (id: string) => void;
}) {
  if (data.length === 0) {
    return <p className="text-gray-400 italic">No resolutions</p>;
  }

  return (
    <ul className="space-y-2">
      {data.map(r => (
        <li
          key={r.id}
          className="flex items-center justify-between bg-white border rounded-lg px-4 py-2"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggle(r.id, !r.isCompleted)}
              className={`w-6 h-6 flex items-center justify-center rounded border
                ${r.isCompleted ? "bg-green-500 text-white" : ""}`}
            >
              {r.isCompleted && <Check size={16} />}
            </button>
            <span
              className={r.isCompleted ? "line-through text-gray-400" : ""}
            >
              {r.title}
            </span>
          </div>

          <button
            onClick={() => onDelete(r.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 size={18} />
          </button>
        </li>
      ))}
    </ul>
  );
}