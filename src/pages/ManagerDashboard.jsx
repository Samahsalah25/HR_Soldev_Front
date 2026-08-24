import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Users, AlertTriangle, CalendarDays, Building2, ClipboardList } from "lucide-react";
import { getEmployeesList, normalizeEmployee } from "@/api/employeesApi";
import {
  getAllRequests,
  requestAction,
  managerApprove as apiManagerApprove,
  getAllVacationRequests,
  vacationAction,
  managerApproveVacation,
} from "@/api/requestsApi";
import { getViolations, updateViolation } from "@/api/violationApi";
import { getBranches } from "@/api/branchesApi";
import { usePagination } from "@/lib/usePagination";
import TablePagination from "@/components/ui/TablePagination";

const LOAD_TIMEOUT_MS = 15000;

const STATUS_COLORS = {
  "قيد المراجعة": "bg-amber-100 text-amber-700",
  "انتظار موافقة المدير": "bg-purple-100 text-purple-700",
  "قيد مراجعة HR": "bg-blue-100 text-blue-700",
};

const REQUEST_STATUS_LABELS = {
  under_review: "قيد المراجعة",
  waiting_manager_approval: "انتظار موافقة المدير",
  accepted: "مقبولة",
  rejected: "مرفوضة",
  hr_under_review: "قيد مراجعة HR",
};

const VIOLATION_TYPE_LABELS = {
  "Frequent Lateness": "تأخر متكرر",
  "Frequent Absence Without Permission": "غياب بدون إذن",
  "Behaviour penalty": "مخالفة سلوكية",
  "Violation of procedures": "مخالفة إجراءات",
  "Negligence at work": "إهمال في العمل",
  "Other": "أخرى",
};

const PENALTY_TYPE_LABELS = {
  verbal_warning: "إنذار شفهي",
  written_warning: "إنذار كتابي",
  salary_deduction: "خصم من الراتب",
  suspension: "إيقاف عن العمل",
  end_of_service: "إنهاء الخدمة",
  under_review: "قيد التحقيق",
};

export default function ManagerDashboard() {
  const [requests, setRequests] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [violations, setViolations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("انتهت مهلة تحميل البيانات، السيرفر بياخد وقت أطول من المتوقع.")), LOAD_TIMEOUT_MS)
      );
      const [empsRaw, reqsRes, leavesRes, violsRes, branchesRes] = await Promise.race([
        Promise.all([
          getEmployeesList(),
          getAllRequests(),
          getAllVacationRequests(),
          getViolations(),
          getBranches(),
        ]),
        timeout,
      ]);
      setEmployees((empsRaw || []).map(normalizeEmployee).filter((e) => e.status === "نشط"));
      setRequests(reqsRes?.data || []);
      setLeaves(leavesRes?.data || []);
      setViolations(violsRes?.data || violsRes || []);
      setBranches(branchesRes?.data || []);
    } catch (err) {
      console.error("خطأ أثناء تحميل لوحة تحكم المدير:", err);
      setError(err?.message || err?.response?.data?.error || "تعذّر تحميل بيانات اللوحة، حاول تاني.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pendingRequests = requests.filter((r) => (r.state || r.status) === "waiting_manager_approval");
  const pendingLeaves = leaves.filter((l) => l.state === "waiting_manager_approval");
  const pendingViolations = violations.filter((v) => v.state === "under_review" || v.state === "draft");
  const pendingRequestsPagination = usePagination(pendingRequests, 20);
  const pendingLeavesPagination = usePagination(pendingLeaves, 20);
  const pendingViolationsPagination = usePagination(pendingViolations, 20);

  const approveRequest = async (id) => {
    await apiManagerApprove(id);
    load();
  };

  const rejectRequest = async (id) => {
    await requestAction(id, "reject");
    load();
  };

  const approveLeave = async (id) => {
    await managerApproveVacation(id);
    load();
  };

  const rejectLeave = async (id) => {
    await vacationAction(id, "refuse");
    load();
  };

  // Branch KPIs (توزيع الموظفين ونسبة السعودة لكل فرع)
  const branchKPIs = (branches.length > 0 ? branches : [...new Set(employees.map((e) => e.branch).filter(Boolean))].map((b) => ({ name: b, id: b }))).map((br) => {
    const brName = br.name || br;
    const brEmps = employees.filter((e) => e.branch === brName);
    const saudis = brEmps.filter((e) => e.is_saudi).length;
    return {
      name: brName,
      total: brEmps.length,
      saudizationPct: brEmps.length > 0 ? Math.round((saudis / brEmps.length) * 100) : 0,
    };
  }).filter((b) => b.total > 0);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto" dir="rtl">
        <h1 className="text-2xl font-bold text-foreground mb-6">لوحة تحكم المدير</h1>
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm">جاري تحميل بيانات اللوحة...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto" dir="rtl">
        <h1 className="text-2xl font-bold text-foreground mb-6">لوحة تحكم المدير</h1>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <p className="text-sm text-red-600 max-w-sm">{error}</p>
          <button onClick={load} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto" dir="rtl">
        <h1 className="text-2xl font-bold text-foreground mb-6">لوحة تحكم المدير</h1>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground">
          <Users className="w-10 h-10 opacity-30" />
          <p className="text-sm max-w-sm">لا يوجد موظفون نشطون مسجّلون في النظام حاليًا.</p>
          <button onClick={load} className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted">
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">لوحة تحكم المدير</h1>
        <p className="text-sm text-muted-foreground mt-0.5">المهام المعلقة + مؤشرات الأداء الحية لكل فرع</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "طلبات معلقة", value: pendingRequests.length, color: "text-amber-600", icon: ClipboardList, bg: "bg-amber-50" },
          { label: "إجازات قيد الانتظار", value: pendingLeaves.length, color: "text-blue-600", icon: CalendarDays, bg: "bg-blue-50" },
          { label: "مخالفات قيد المراجعة", value: pendingViolations.length, color: "text-red-600", icon: AlertTriangle, bg: "bg-red-50" },
          { label: "إجمالي موظفون نشطون", value: employees.length, color: "text-green-600", icon: Users, bg: "bg-green-50" },
        ].map((k) => (
          <div key={k.label} className={`${k.bg} rounded-xl border border-border p-4 flex items-center gap-4`}>
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <k.icon className={`w-6 h-6 ${k.color}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Branch KPIs */}
      {branchKPIs.length > 0 && (
        <div>
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />مؤشرات الأداء الحية لكل فرع</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchKPIs.map((br) => (
              <div key={br.name} className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{br.name}</h3>
                  <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium">{br.total} موظف</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>نسبة السعودة</span>
                    <span className={`font-semibold ${br.saudizationPct >= 50 ? "text-green-600" : "text-red-600"}`}>{br.saudizationPct}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${br.saudizationPct >= 50 ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${br.saudizationPct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Tasks */}
      <div>
        <div className="flex gap-1 border-b border-border mb-4">
          {[
            { id: "pending", label: `الطلبات المعلقة (${pendingRequests.length})` },
            { id: "leaves", label: `الإجازات (${pendingLeaves.length})` },
            { id: "violations", label: `المخالفات (${pendingViolations.length})` },
          ].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "pending" && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/30 border-b border-border">
                {["الموظف", "نوع الطلب", "التاريخ", "المبلغ", "الحالة", "إجراء"].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {pendingRequests.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">✅ لا توجد طلبات معلقة</td></tr>
                  : pendingRequestsPagination.pageItems.map((req) => {
                    const status = REQUEST_STATUS_LABELS[req.state || req.status] || (req.state || req.status);
                    return (
                      <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{req.employee || "—"}</p>
                          <p className="text-xs text-muted-foreground">{req.department}</p>
                        </td>
                        <td className="px-4 py-3"><span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded-full">{req.request_type}</span></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{req.date_of_submission ? new Date(req.date_of_submission).toLocaleDateString("ar-SA") : "—"}</td>
                        <td className="px-4 py-3 text-xs">{req.amount > 0 ? `${Number(req.amount).toLocaleString("ar-SA")} ر.س` : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || "bg-muted text-muted-foreground"}`}>{status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => approveRequest(req.id)} className="p-1.5 hover:bg-green-50 text-green-600 rounded" title="اعتماد"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => rejectRequest(req.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded" title="رفض"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            <TablePagination
              page={pendingRequestsPagination.page}
              totalPages={pendingRequestsPagination.totalPages}
              totalItems={pendingRequestsPagination.totalItems}
              pageSize={pendingRequestsPagination.pageSize}
              onPageChange={pendingRequestsPagination.setPage}
            />
          </div>
        )}

        {activeTab === "leaves" && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/30 border-b border-border">
                {["الموظف", "من", "إلى", "الأيام", "إجراء"].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {pendingLeaves.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">✅ لا توجد إجازات قيد الانتظار</td></tr>
                  : pendingLeavesPagination.pageItems.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{l.employee?.name_ar || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{l.from ? new Date(l.from).toLocaleDateString("ar-SA") : "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{l.to ? new Date(l.to).toLocaleDateString("ar-SA") : "—"}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{l.days || "—"} يوم</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => approveLeave(l.id)} className="p-1.5 hover:bg-green-50 text-green-600 rounded"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => rejectLeave(l.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><XCircle className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <TablePagination
              page={pendingLeavesPagination.page}
              totalPages={pendingLeavesPagination.totalPages}
              totalItems={pendingLeavesPagination.totalItems}
              pageSize={pendingLeavesPagination.pageSize}
              onPageChange={pendingLeavesPagination.setPage}
            />
          </div>
        )}

        {activeTab === "violations" && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/30 border-b border-border">
                {["الموظف", "نوع المخالفة", "التاريخ", "العقوبة", "إجراء"].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {pendingViolations.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">✅ لا توجد مخالفات قيد المراجعة</td></tr>
                  : pendingViolationsPagination.pageItems.map((v) => (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{v.employee_name || "—"}</p>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{VIOLATION_TYPE_LABELS[v.violation_type_name] || v.violation_type_name}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{v.date ? new Date(v.date).toLocaleDateString("ar-SA") : "—"}</td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground">{PENALTY_TYPE_LABELS[v.custom_penalty_type] || v.custom_penalty_type || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={async () => { await updateViolation(v.id, { state: "approved" }); load(); }}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 font-medium">تأكيد</button>
                          <button onClick={async () => { await updateViolation(v.id, { state: "rejected" }); load(); }}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 font-medium">إلغاء</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <TablePagination
              page={pendingViolationsPagination.page}
              totalPages={pendingViolationsPagination.totalPages}
              totalItems={pendingViolationsPagination.totalItems}
              pageSize={pendingViolationsPagination.pageSize}
              onPageChange={pendingViolationsPagination.setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
