import { useState, useCallback, Fragment } from "react";
import { Shield, Search, Loader2 } from "lucide-react";
import RolesBatchEditor from "../components/permissions/RolesBatchEditor";
import CrudPermissionsEditor from "../components/permissions/CrudPermissionsEditor";
import AuditLogViewer from "../components/permissions/AuditLogViewer";
import { getEmployeesListPaged } from "@/api/employeesApi";
import { useServerPagination } from "@/lib/useServerPagination";
import TablePagination from "@/components/ui/TablePagination";

// أدوار النظام بالظبط كما يرجعها الـ API
const ROLE_OPTIONS = [
  { value: "Admin", label: "مدير النظام", color: "bg-red-100 text-red-700" },
  { value: "CEO", label: "الرئيس التنفيذي (CEO)", color: "bg-green-100 text-green-700" },
  { value: "General Manager", label: "مدير عام", color: "bg-amber-100 text-amber-700" },
  { value: "HR", label: "موارد بشرية (HR)", color: "bg-purple-100 text-purple-700" },
  { value: "Department manager", label: "مدير قسم", color: "bg-blue-100 text-blue-700" },
  { value: "Accountant", label: "محاسب", color: "bg-teal-100 text-teal-700" },
  { value: "Employee", label: "موظف", color: "bg-gray-100 text-gray-700" },
];

function getRoleLabel(roleValue) {
  if (!roleValue) return "غير محدد";
  const found = ROLE_OPTIONS.find(
    (r) => r.value.toLowerCase() === roleValue.toLowerCase()
  );
  return found?.label ?? roleValue;
}

function getRoleColor(roleValue) {
  if (!roleValue) return "bg-gray-100 text-gray-700";
  const found = ROLE_OPTIONS.find(
    (r) => r.value.toLowerCase() === roleValue.toLowerCase()
  );
  return found?.color ?? "bg-gray-100 text-gray-700";
}

export default function Permissions() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [activeView, setActiveView] = useState("users");

  const fetchEmployeesPage = useCallback((params) => getEmployeesListPaged(params), []);
  const employeesPagination = useServerPagination(fetchEmployeesPage, 20);

  // ملاحظة: البحث دلوقتي بيشتغل على الصفحة الحالية بس بعد ما بقى الـ pagination من الباك
  const filtered = employeesPagination.pageItems.filter((emp) => {
    if (!search) return true;
    const name = emp.name_ar || emp.name_en || emp.name || emp.full_name || "";
    const email = emp.work_email || emp.email || "";
    return name.includes(search) || email.includes(search);
  });

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />إدارة الصلاحيات
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          تحكم كامل بصلاحيات كل موظف ودور في النظام
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "users", label: "الموظفون" },
          { id: "roles", label: "أدوار النظام" },
          { id: "audit", label: "سجل التدقيق" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveView(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeView === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ======= TAB: الموظفون ======= */}
      {activeView === "users" && (
        <div className="space-y-4">
          <div className="relative max-w-xs">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم أو بريد..."
              className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
            />
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {["الموظف", "الدور الحالي", "تعديل الصلاحيات"].map((h) => (
                    <th
                      key={h}
                      className="text-right px-4 py-3 text-xs font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employeesPagination.loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />جاري التحميل...
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-muted-foreground text-sm">
                      لا يوجد موظفون
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp) => {
                    const empId = emp.id;
                    const empName = emp.name_ar || emp.name_en || emp.name || emp.full_name || "—";
                    const empEmail = emp.work_email || emp.email || "—";
                    const empRole = emp.job_grade || emp.role || "";
                    const isExpanded = expandedId === empId;

                    return (
                      <Fragment key={empId}>
                        <tr className="border-b border-border hover:bg-muted/20">
                          {/* الاسم + البريد */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-primary">
                                  {empName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{empName}</p>
                                {empEmail !== "—" && (
                                  <p className="text-xs text-muted-foreground" dir="ltr">{empEmail}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* البريد — محذوف من column منفصل */}

                          {/* الدور */}
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleColor(empRole)}`}>
                              {getRoleLabel(empRole)}
                            </span>
                          </td>

                          {/* زر التعديل */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : empId)}
                              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium
                                ${isExpanded
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                            >
                              {isExpanded ? "▲ إخفاء" : "▼ تعديل الصلاحيات"}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded: CRUD permissions editor */}
                        {isExpanded && (
                          <tr className="bg-muted/5">
                            <td colSpan={3} className="px-4 py-5">
                              <div className="bg-background rounded-xl border border-border p-4">
                                <h3 className="font-semibold text-sm text-foreground mb-4">
                                  صلاحيات الوصول —{" "}
                                  <span className="text-primary">{empName}</span>
                                </h3>
                                <CrudPermissionsEditor
                                  key={`crud-${empId}`}
                                  employeeId={empId}
                                  employeeRole={empRole}
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
            <TablePagination
              page={employeesPagination.page}
              totalPages={employeesPagination.totalPages}
              totalItems={employeesPagination.totalItems}
              pageSize={employeesPagination.pageSize}
              onPageChange={employeesPagination.setPage}
            />
          </div>
        </div>
      )}

      {/* ======= TAB: أدوار النظام ======= */}
      {activeView === "roles" && <RolesBatchEditor />}

      {/* ======= TAB: سجل التدقيق ======= */}
      {activeView === "audit" && <AuditLogViewer />}
    </div>
  );
}
