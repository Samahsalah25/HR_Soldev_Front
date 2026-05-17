import { useState, useRef, useEffect } from "react";
import { Plus, ChevronDown } from "lucide-react";

const USER_TYPES = [
  { value: "admin", label: "مدير النظام", emoji: "🔴", color: "text-red-700" },
  { value: "hr", label: "موارد بشرية (HR)", emoji: "🔵", color: "text-blue-700" },
  { value: "general_manager", label: "مدير عام", emoji: "🟣", color: "text-purple-700" },
  { value: "ceo", label: "الرئيس التنفيذي (CEO)", emoji: "🟠", color: "text-orange-700" },
  { value: "dept_manager", label: "مدير قسم", emoji: "🔷", color: "text-indigo-700" },
  { value: "accountant", label: "محاسب", emoji: "🟡", color: "text-yellow-700" },
  { value: "employee", label: "موظف عادي", emoji: "🟢", color: "text-green-700" },
];

export { USER_TYPES };

export default function AddEmployeeDropdown({ onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
      >
        <Plus className="w-4 h-4" />
        إضافة مستخدم
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground">اختر نوع المستخدم</p>
          </div>
          {USER_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => { onSelect(type.value); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-right"
            >
              <span className="text-base">{type.emoji}</span>
              <span className={`text-sm font-medium ${type.color}`}>{type.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}