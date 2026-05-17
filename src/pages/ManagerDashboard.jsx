import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, Clock, Users, AlertTriangle, CalendarDays, Briefcase, TrendingUp, Building2, ClipboardList } from "lucide-react";

const STATUS_COLORS = {
  "قيد المراجعة": "bg-amber-100 text-amber-700",
  "انتظار موافقة المدير": "bg-purple-100 text-purple-700",
  "قيد مراجعة HR": "bg-blue-100 text-blue-700",
  "قيد الانتظار": "bg-amber-100 text-amber-700",
  "قيد المراجعة": "bg-amber-100 text-amber-700",
};

export default function ManagerDashboard() {
  const [requests, setRequests] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [violations, setViolations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  const load = async () => {
    const me = await base44.auth.me();
    setUser(me);
    const [reqs, lvs, viols, emps, brs] = await Promise.all([
      base44.entities.EmployeeRequest.list("-created_date"),
      base44.entities.LeaveRequest.list("-created_date"),
      base44.entities.Violation.filter({ status: "قيد المراجعة" }),
      base44.entities.Employee.filter({ status: "نشط" }),
      base44.entities.Branch.list(),
    ]);
    setRequests(reqs); setLeaves(lvs); setViolations(viols);
    setEmployees(emps); setBranches(brs); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const pendingRequests = requests.filter(r => ["قيد المراجعة","انتظار موافقة المدير","قيد مراجعة HR"].includes(r.status));
  const pendingLeaves = leaves.filter(l => l.status === "قيد الانتظار");

  const approveRequest = async (id) => {
    const u = await base44.auth.me();
    await base44.entities.EmployeeRequest.update(id, {
      status: "مقبولة", reviewed_by: u.full_name || u.email,
      review_date: new Date().toISOString().slice(0, 10)
    });
    load();
  };

  const rejectRequest = async (id) => {
    const u = await base44.auth.me();
    await base44.entities.EmployeeRequest.update(id, {
      status: "مرفوضة", reviewed_by: u.full_name || u.email,
      review_date: new Date().toISOString().slice(0, 10)
    });
    load();
  };

  const approveLeave = async (id) => {
    await base44.entities.LeaveRequest.update(id, { status: "معتمدة" });
    load();
  };

  const rejectLeave = async (id) => {
    await base44.entities.LeaveRequest.update(id, { status: "مرفوضة" });
    load();
  };

  // Branch KPIs
  const branchKPIs = (branches.length > 0 ? branches : [...new Set(employees.map(e => e.branch).filter(Boolean))].map(b => ({ name: b, id: b }))).map(br => {
    const brName = br.name || br;
    const brEmps = employees.filter(e => e.branch === brName);
    const brLeaves = pendingLeaves.filter(l => brEmps.find(e => e.id === l.employee_id));
    const brRequests = pendingRequests.filter(r => brEmps.find(e => e.id === r.employee_id));
    const saudis = brEmps.filter(e => e.is_saudi).length;
    return {
      name: brName,
      total: brEmps.length,
      saudizationPct: brEmps.length > 0 ? Math.round((saudis / brEmps.length) * 100) : 0,
      pendingLeaves: brLeaves.length,
      pendingRequests: brRequests.length,
      violations: violations.filter(v => brEmps.find(e => e.id === v.employee_id)).length,
    };
  }).filter(b => b.total > 0);

  const totalPending = pendingRequests.length + pendingLeaves.length + violations.length;

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
          { label: "مخالفات قيد المراجعة", value: violations.length, color: "text-red-600", icon: AlertTriangle, bg: "bg-red-50" },
          { label: "إجمالي موظفون نشطون", value: employees.length, color: "text-green-600", icon: Users, bg: "bg-green-50" },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl border border-border p-4 flex items-center gap-4`}>
            <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm`}>
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
            {branchKPIs.map(br => (
              <div key={br.name} className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{br.name}</h3>
                  <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium">{br.total} موظف</span>
                </div>
                {/* Saudization bar */}
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
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { label: "إجازات", value: br.pendingLeaves, color: "text-blue-600" },
                    { label: "طلبات", value: br.pendingRequests, color: "text-amber-600" },
                    { label: "مخالفات", value: br.violations, color: "text-red-600" },
                  ].map(s => (
                    <div key={s.label} className="text-center bg-muted/30 rounded-lg py-2">
                      <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
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
            { id: "violations", label: `المخالفات (${violations.length})` },
          ].map(t => (
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
                {["الموظف","نوع الطلب","التاريخ","المبلغ","الحالة","إجراء"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
                  : pendingRequests.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">✅ لا توجد طلبات معلقة</td></tr>
                  : pendingRequests.map(req => (
                    <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{req.employee_name}</p>
                        <p className="text-xs text-muted-foreground">{req.department}</p>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded-full">{req.request_type}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{req.created_date ? new Date(req.created_date).toLocaleDateString("ar-SA") : "—"}</td>
                      <td className="px-4 py-3 text-xs">{req.amount > 0 ? `${req.amount?.toLocaleString("ar-SA")} ر.س` : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status] || "bg-muted text-muted-foreground"}`}>{req.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => approveRequest(req.id)} className="p-1.5 hover:bg-green-50 text-green-600 rounded" title="قبول"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => rejectRequest(req.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded" title="رفض"><XCircle className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "leaves" && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/30 border-b border-border">
                {["الموظف","نوع الإجازة","من","إلى","الأيام","إجراء"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {pendingLeaves.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">✅ لا توجد إجازات قيد الانتظار</td></tr>
                  : pendingLeaves.map(l => (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{l.employee_name}</p>
                        <p className="text-xs text-muted-foreground">{l.department}</p>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{l.leave_type}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{l.start_date ? new Date(l.start_date).toLocaleDateString("ar-SA") : "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{l.end_date ? new Date(l.end_date).toLocaleDateString("ar-SA") : "—"}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{l.days_count} يوم</td>
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
          </div>
        )}

        {activeTab === "violations" && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/30 border-b border-border">
                {["الموظف","نوع المخالفة","التاريخ","العقوبة","إجراء"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {violations.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">✅ لا توجد مخالفات قيد المراجعة</td></tr>
                  : violations.map(v => (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{v.employee_name}</p>
                        <p className="text-xs text-muted-foreground">{v.department}</p>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{v.violation_type}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{v.date ? new Date(v.date).toLocaleDateString("ar-SA") : "—"}</td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground">{v.penalty}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={async () => { await base44.entities.Violation.update(v.id, { status: "مؤكدة" }); load(); }}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 font-medium">تأكيد</button>
                          <button onClick={async () => { await base44.entities.Violation.update(v.id, { status: "ملغاة" }); load(); }}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 font-medium">إلغاء</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}