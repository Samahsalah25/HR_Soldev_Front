import { useState, useEffect } from "react";
import { Search, Eye, Edit, Trash2, AlertCircle } from "lucide-react";
import { getEmployeesList, deleteEmployee, normalizeEmployee } from "@/api/employeesApi";
import { formatCurrency, calcServiceYears, getExpiryStatus } from "../lib/hrUtils";
import EmployeeForm from "../components/EmployeeForm";
import EmployeeDetail from "../components/EmployeeDetail";
import EmployeeImportExport from "../components/employees/EmployeeImportExport";
import AddEmployeeDropdown from "../components/employees/AddEmployeeDropdown";
import { useRole } from "../lib/useRole";

const STATUS_COLORS = {
  "نشط": "bg-green-100 text-green-700",
  "في إجازة": "bg-amber-100 text-amber-700",
  "مُنهي الخدمة": "bg-red-100 text-red-600",
  "تحت التجربة": "bg-blue-100 text-blue-700",
};

export default function Employees() {
  const { user, canDo } = useRole();
  const canAdd = canDo("employees", "create");
  const canEdit = canDo("employees", "edit");
  const canDelete = canDo("employees", "delete");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterNat, setFilterNat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [newUserRole, setNewUserRole] = useState("employee");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getEmployeesList();
      setEmployees(data.map(normalizeEmployee));
    } catch (err) {
      console.error("Load employees error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !search || e.full_name_ar?.toLowerCase().includes(q) ||
      e.full_name_en?.toLowerCase().includes(q) || e.id_number?.includes(q) ||
      e.job_title?.toLowerCase().includes(q) || e.employee_number?.includes(q);
    const matchDept = !filterDept || e.department === filterDept;
    const matchNat = !filterNat || (filterNat === "saudi" ? e.is_saudi : !e.is_saudi);
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchSearch && matchDept && matchNat && matchStatus;
  });

  const handleDelete = async (id) => {
    if (confirm("هل أنت متأكد من حذف هذا الموظف؟")) {
      try {
        await deleteEmployee(id);
        load();
      } catch (err) {
        console.error("Delete employee error:", err);
        alert(err?.response?.data?.message || "حدث خطأ أثناء الحذف");
      }
    }
  };

  const handleSave = () => { setShowForm(false); setEditEmployee(null); load(); };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الموظفين</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{employees.length} موظف مسجل في النظام</p>
        </div>
        <div className="flex items-center gap-2">
          <EmployeeImportExport onImportDone={load} userRole={user?.role} />
          {canAdd && (
            <AddEmployeeDropdown onSelect={(roleType) => {
              setEditEmployee(null);
              setNewUserRole(roleType);
              setShowForm(true);
            }} />
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم، رقم الهوية، المسمى..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">كل الأقسام</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterNat} onChange={e => setFilterNat(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
          <option value="">كل الجنسيات</option>
          <option value="saudi">سعودي</option>
          <option value="nonSaudi">مقيم</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
          <option value="">كل الحالات</option>
          {["نشط", "في إجازة", "مُنهي الخدمة", "تحت التجربة"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || filterDept || filterNat || filterStatus) && (
          <button onClick={() => { setSearch(""); setFilterDept(""); setFilterNat(""); setFilterStatus(""); }}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            مسح الفلاتر
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">الموظف</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">رقم الملف</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">القسم</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الجنسية</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الراتب</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الإقامة</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">سنوات الخدمة</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحالة</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    جاري التحميل...
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">لا توجد نتائج</td></tr>
              ) : filtered.map(emp => {
                const idStatus = getExpiryStatus(emp.id_expiry);
                const years = emp.join_date ? calcServiceYears(emp.join_date) : 0;
                return (
                  <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">{emp.full_name_ar?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{emp.full_name_ar}</p>
                          <p className="text-xs text-muted-foreground">{emp.job_title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{emp.employee_number || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.department || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${emp.is_saudi ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {emp.is_saudi ? "🇸🇦 سعودي" : `🌍 ${emp.nationality || "مقيم"}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatCurrency(emp.basic_salary)}</td>
                    <td className="px-4 py-3">
                      {emp.is_saudi ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : idStatus ? (
                        <span className={`text-xs font-medium ${idStatus.color === "red" ? "text-red-600" :
                          idStatus.color === "amber" ? "text-amber-600" : "text-green-600"
                          }`}>
                          {idStatus.color === "red" && <AlertCircle className="w-3 h-3 inline ml-1" />}
                          {idStatus.label}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.join_date ? `${years.toFixed(1)} سنة` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[emp.status] || "bg-muted text-muted-foreground"}`}>
                        {emp.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewEmployee(emp)} title="عرض"
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button onClick={() => { setEditEmployee(emp); setShowForm(true); }} title="تعديل"
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-secondary">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(emp.id)} title="حذف"
                            className="p-1.5 rounded hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border text-sm text-muted-foreground bg-muted/20">
          عرض {filtered.length} من {employees.length} موظف
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <EmployeeForm
          employee={editEmployee}
          initialRole={!editEmployee ? newUserRole : undefined}
          onClose={() => { setShowForm(false); setEditEmployee(null); }}
          onSave={handleSave}
        />
      )}
      {viewEmployee && (
        <EmployeeDetail
          employee={viewEmployee}
          onClose={() => setViewEmployee(null)}
          onEdit={(emp) => { setViewEmployee(null); setEditEmployee(emp); setShowForm(true); }}
        />
      )}
    </div>
  );
}