import { useState, useEffect, useCallback } from "react";
import { Plus, CheckCircle, Clock, Search, X, Save, User } from "lucide-react";
import { useRole } from "../lib/useRole";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useServerPagination } from "@/lib/useServerPagination";
import TablePagination from "@/components/ui/TablePagination";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask as deleteTaskApi,
} from "@/api/tasksApi";
import {
  getEmployees,
} from "@/api/departmentsApi";
const PRIORITY_MAP = {
  "عالية": "high",
  "متوسطة": "medium",
  "منخفضة": "low",
};

const PRIORITY_MAP_REVERSE = {
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة",
};

const STATUS_MAP = {
  "قيد العمل": "in_progress",
  "مكتملة": "complete",
  "متأخرة": "late",
  "ملغاة": "cancelled",
};

const STATUS_MAP_REVERSE = {
  in_progress: "قيد العمل",
  complete: "مكتملة",
  late: "متأخرة",
  cancelled: "ملغاة",
};
const PRIORITY_COLORS = {
  "عالية": "bg-red-100 text-red-700",
  "متوسطة": "bg-amber-100 text-amber-700",
  "منخفضة": "bg-green-100 text-green-700",
};
const STATUS_COLORS = {
  "قيد العمل": "bg-blue-100 text-blue-700",
  "مكتملة": "bg-green-100 text-green-700",
  "متأخرة": "bg-red-100 text-red-600",
  "ملغاة": "bg-gray-100 text-gray-500",
};

function TaskForm({ task, employees, onSave, onClose }) {
  const [form, setForm] = useState({
    title: "", description: "", assigned_to: "", assigned_to_id: "",
    department: "", priority: "متوسطة", status: "قيد العمل",
    due_date: "", notes: "", ...(task || {})
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleEmpSelect = (id) => {
    const emp = employees.find(e => e.id === id);

    if (emp) {
      set("assigned_to_id", id);
      set("assigned_to", emp.full_name_ar);
      set("department", emp.department || "");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      title: form.title,
      employee_id: form.assigned_to_id || null,
      priority: PRIORITY_MAP[form.priority],
      state: STATUS_MAP[form.status],
      deadline: form.due_date
        ? `${form.due_date} 18:00:00`
        : null,
      description: form.description,
    };

    if (task?.id) {
      await updateTask(task.id, payload);
    } else {
      await createTask(payload);
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">{task ? "تعديل المهمة" : "مهمة جديدة"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">عنوان المهمة *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">مسند إلى</label>
            <select value={form.assigned_to_id} onChange={e => handleEmpSelect(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
              <option value="">اختر موظف...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar} — {e.department}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">الأولوية</label>
              <select value={form.priority} onChange={e => set("priority", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
                <option>عالية</option><option>متوسطة</option><option>منخفضة</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">الحالة</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
                <option>قيد العمل</option><option>مكتملة</option><option>متأخرة</option><option>ملغاة</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">تاريخ الاستحقاق</label>
            <input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">الوصف</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted text-foreground">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.title}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const { user, canDo } = useRole();
  const confirmDialog = useConfirm();
  const canCreate = canDo("tasks", "create");
  const canEdit = canDo("tasks", "edit");
  const canDelete = canDo("tasks", "delete");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);

      const employeesRes = await getEmployees();

      // EMPLOYEES
      const normalizedEmployees =
        employeesRes?.data?.map(
          (emp) => ({
            id: emp.id,

            full_name_ar:
              emp.full_name_ar ||
              emp.name ||
              emp.full_name,

            department:
              emp.department_name ||
              emp.department ||
              "",
          })
        ) || [];

      setEmployees(
        normalizedEmployees
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fetchTasksPage = useCallback(async (params) => {
    const res = await getTasks(params);
    const list = res?.data || [];
    return {
      ...res,
      data: list.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        assigned_to: t.employee_name,
        assigned_to_id: t.employee_id,
        priority: PRIORITY_MAP_REVERSE[t.priority] || "متوسطة",
        status: STATUS_MAP_REVERSE[t.state] || "قيد العمل",
        due_date: t.deadline ? t.deadline.split(" ")[0] : "",
        active: t.active,
      })),
    };
  }, []);
  const tasksPagination = useServerPagination(fetchTasksPage, 20);

  const refreshAll = () => {
    load();
    tasksPagination.reload();
  };

  const deleteTask = async (id) => {
    const ok = await confirmDialog({
      title: "حذف المهمة",
      message: "هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.",
      confirmText: "حذف",
      variant: "destructive",
    });
    if (ok) { await deleteTaskApi(id); refreshAll(); }
  };

  const toggleComplete = async (task) => {
    const newStatus =
      task.status === "مكتملة"
        ? "قيد العمل"
        : "مكتملة";

    await updateTask(task.id, {
      title: task.title,
      employee_id:
        task.assigned_to_id,

      priority:
        PRIORITY_MAP[task.priority],

      state:
        STATUS_MAP[newStatus],

      deadline: task.due_date
        ? `${task.due_date} 18:00:00`
        : null,

      description:
        task.description,
    });

    refreshAll();
  };

  // ملاحظة: العدادات والفلترة دلوقتي بتشتغل على الصفحة الحالية بس
  const filtered = tasksPagination.pageItems
    .filter(t => !filterStatus || t.status === filterStatus)
    .filter(t => !search || t.title?.includes(search) || t.assigned_to?.includes(search));

  const counts = {
    all: tasksPagination.pageItems.length,
    "قيد العمل": tasksPagination.pageItems.filter(t => t.status === "قيد العمل").length,
    "مكتملة": tasksPagination.pageItems.filter(t => t.status === "مكتملة").length,
    "متأخرة": tasksPagination.pageItems.filter(t => t.status === "متأخرة").length,
  };

  const isOverdue = (task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== "مكتملة";

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المهام الداخلية</h1>
          <p className="text-sm text-muted-foreground mt-0.5">إسناد المهام وتتبعها بين الفريق</p>
        </div>
        {canCreate && (
          <button onClick={() => { setEditTask(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />إنشاء مهمة جديدة
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم المهمة..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
          <option value="">تصفية حسب...</option>
          <option value="قيد العمل">قيد العمل</option>
          <option value="مكتملة">مكتملة</option>
          <option value="متأخرة">متأخرة</option>
        </select>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[["", "الكل", counts.all], ["قيد العمل", "قيد العمل", counts["قيد العمل"]], ["مكتملة", "مكتملة", counts["مكتملة"]], ["متأخرة", "متأخرة", counts["متأخرة"]]].map(([val, label, count]) => (
          <button key={val} onClick={() => setFilterStatus(val)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === val ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}>
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {tasksPagination.loading ? <p className="text-center py-10 text-muted-foreground">جاري التحميل...</p>
          : filtered.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">لا توجد مهام</p>
            </div>
          ) : filtered.map(task => (
            <div key={task.id} className={`bg-card rounded-xl border p-4 flex items-start gap-3 ${isOverdue(task) ? "border-red-200 bg-red-50/30" : "border-border"}`}>
              <button onClick={() => toggleComplete(task)} className="mt-0.5 flex-shrink-0">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.status === "مكتملة" ? "bg-green-500 border-green-500" : "border-muted-foreground"}`}>
                  {task.status === "مكتملة" && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-semibold text-sm ${task.status === "مكتملة" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>{task.status}</span>
                  {isOverdue(task) && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">متأخرة!</span>}
                </div>
                {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                  {task.assigned_to && <span className="flex items-center gap-1"><User className="w-3 h-3" />لموظف: {task.assigned_to}</span>}
                  {task.due_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(task.due_date).toLocaleDateString("ar-SA")}</span>}
                  {task.department && <span>{task.department}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {canEdit && (
                  <button onClick={() => { setEditTask(task); setShowForm(true); }}
                    className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted text-foreground">تعديل</button>
                )}
                {canDelete && (
                  <button onClick={() => deleteTask(task.id)}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">حذف</button>
                )}
              </div>
            </div>
          ))}
      </div>
      <TablePagination
        page={tasksPagination.page}
        totalPages={tasksPagination.totalPages}
        totalItems={tasksPagination.totalItems}
        pageSize={tasksPagination.pageSize}
        onPageChange={tasksPagination.setPage}
      />

      {showForm && <TaskForm task={editTask} employees={employees} onSave={() => { setShowForm(false); refreshAll(); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}