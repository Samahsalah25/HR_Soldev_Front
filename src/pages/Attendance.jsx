import { useState, useEffect, useCallback } from "react";
import { Plus, MapPin, CheckCircle, LogIn, LogOut, AlertCircle, Clock, Users } from "lucide-react";
import { useRole } from "../lib/useRole";
import { useServerPagination } from "@/lib/useServerPagination";
import TablePagination from "@/components/ui/TablePagination";

import {
  getAttendance,
  createAttendance,
  checkInAttendance,
  checkOutAttendance,
} from "@/api/attendanceApi";
import {
  getBranches,
} from "@/api/branchesApi";
import { getEmployees } from "@/api/departmentsApi";
import { useToast } from "@/components/ui/use-toast";
const STATUS_AR = {
  attended: "حاضر",
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  timeoff: "اجازة",
  leave: "اجازة",
  on_leave: "اجازة",
  mission: "مهمة عمل",
  business_trip: "مهمة عمل",
  remote: "عمل عن بُعد",
  work_from_home: "عمل عن بُعد",
};

const STATUS_STYLES = {
  "حاضر": "bg-green-100 text-green-700",
  "غائب": "bg-red-100 text-red-600",
  "متأخر": "bg-amber-100 text-amber-700",
  "اجازة": "bg-blue-100 text-blue-700",
  "مهمة عمل": "bg-purple-100 text-purple-700",
  "عمل عن بُعد": "bg-teal-100 text-teal-700",
};

export default function Attendance() {
  const { toast } = useToast();
  const { user, canDo } = useRole();
  const canCreate = canDo("attendance", "create");
  const [activeTab, setActiveTab] = useState("daily");
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: "", employee_name: "", department: "", date: new Date().toISOString().slice(0, 10), check_in: "08:00", check_out: "17:00", status: "حاضر", late_minutes: 0, overtime_hours: 0, notes: "" });
  const [saving, setSaving] = useState(false);
  const [checkInOut, setCheckInOut] = useState({ loading: false, status: null, message: "" });
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [kpis, setKpis] = useState(null);

  const load = async () => {
    try {
      setLoading(true);

      const [emps, brs] = await Promise.all([
        getEmployees(),
        getBranches(),
      ]);

      setEmployees(emps?.data ?? []);

      setBranches(brs?.data ?? []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  // بيجيب صفحة حضور يوم معيّن — الفلتر بتاريخ اليوم بيتبعت مع كل صفحة
  const fetchAttendancePage = useCallback(async (params) => {
    const res = await getAttendance(date, params);
    setKpis(res?.kpis ?? null);
    const attendanceData = res?.data ?? [];
    return {
      ...res,
      data: attendanceData.map((r) => ({
        id: r.id,
        employee_name:
          r.employee_name ||
          r.employee?.full_name_ar ||
          r.employee?.name ||
          "—",
        employee_id:
          r.employee_id ||
          r.employee?.id,
        department:
          r.department_name ||
          r.employee?.department?.name ||
          "—",
        check_in: r.time_of_arrival
          ? r.time_of_arrival.slice(11, 16)
          : "",
        check_out: r.time_of_leave
          ? r.time_of_leave.slice(11, 16)
          : "",
        status:
          r.state_arabic ||
          STATUS_AR[r.state] ||
          r.state ||
          "—",
        raw_status: r.state,
        late_minutes: r.late_minutes || 0,
        overtime_hours: r.extra_hours || 0,
        notes: r.notes || "",
      })),
    };
  }, [date]);
  const attendancePagination = useServerPagination(fetchAttendancePage, 20);

  // لما التاريخ يتغيّر، نرجع لأول صفحة (صفحة ٢ من يوم قديم مالهاش معنى ليوم جديد)
  useEffect(() => { attendancePagination.setPage(1); }, [date]);

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleLocationCheckIn = (type) => {
    if (!selectedBranch) { setCheckInOut({ loading: false, status: "error", message: "يرجى اختيار الفرع أولاً" }); return; }
    if (!selectedBranch.latitude) { setCheckInOut({ loading: false, status: "error", message: "لم يتم تحديد إحداثيات الفرع" }); return; }
    setCheckInOut({ loading: true, status: null, message: "جاري تحديد موقعك..." });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const dist = getDistance(pos.coords.latitude, pos.coords.longitude, +selectedBranch.latitude, +selectedBranch.longitude);
        const radius = selectedBranch.radius_meters || 200;
        if (dist > radius) {
          setCheckInOut({ loading: false, status: "error", message: `أنت خارج نطاق الفرع (${Math.round(dist)}م من ${radius}م المسموحة)` });
          return;
        }
        const payload = {
          branch_id: selectedBranch.id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };

        if (type === "in") {
          await checkInAttendance(payload);
        } else {
          await checkOutAttendance(payload);
        }
        setCheckInOut({
          loading: false,
          status: "success",
          message: `تم تسجيل ${type === "in" ? "الحضور" : "الانصراف"} بنجاح ✔️`
        });
        refreshAll();
      },
      () => setCheckInOut({ loading: false, status: "error", message: "تعذّر الحصول على موقعك. تأكد من تفعيل خاصية الموقع" })
    );
  };

  useEffect(() => { load(); }, []);

  const refreshAll = () => {
    load();
    attendancePagination.reload();
  };

  const handleEmpSelect = (id) => {
    const emp = employees.find((e) => e.id === id);

    if (!emp) return;

    setForm((f) => ({
      ...f,
      employee_id: id,

      employee_name:
        emp.full_name_ar ||
        emp.name ||
        emp.employee_name ||
        "",

      department:
        emp.department?.name ||
        emp.department ||
        emp.department_name ||
        "",
    }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      await createAttendance({
        employee: form.employee_id,

        time_of_arrival: `${form.date}T${form.check_in}:00`,

        time_of_leave: form.check_out
          ? `${form.date}T${form.check_out}:00`
          : null,

        state: form.status,

        late_minutes: Number(form.late_minutes),

        extra_hours: Number(form.overtime_hours),

        notes: form.notes || "",
      });

      setShowForm(false);

      refreshAll();
    } catch (err) {
      console.error("CREATE ERROR:", err);
      toast({
        title: "تعذّر تسجيل الحضور",
        description: err?.response?.data?.error || err?.response?.data?.message || "حدث خطأ أثناء تسجيل الحضور",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // بنفضّل الأرقام الجاهزة من السيرفر (kpis) لأنها بتحسب على كل الموظفين،
  // بينما records بترجع بس السجلات الموجودة فعليًا لليوم ده (ممكن تكون جزء بسيط)
  const stats = {
    present: kpis?.total_present ?? attendancePagination.pageItems.filter(r => r.status === "حاضر").length,
    absent: kpis?.total_absent ?? attendancePagination.pageItems.filter(r => r.status === "غائب").length,
    late: kpis?.total_late ?? attendancePagination.pageItems.filter(r => r.status === "متأخر").length,
    leave: kpis?.total_vacation ?? attendancePagination.pageItems.filter(r => r.status === "اجازة").length,
  };
  const totalOT = kpis?.total_extra_hours ?? attendancePagination.pageItems.reduce((s, r) => s + (r.overtime_hours || 0), 0);
  const totalLate = attendancePagination.pageItems.reduce((s, r) => s + (r.late_minutes || 0), 0);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />الحضور والانصراف
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">تتبع الدوام والغياب والتأخير</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
          {canCreate && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium">
              <Plus className="w-4 h-4" />تسجيل حضور
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "daily", label: "حضور اليوم" },
          { id: "checkin", label: "تسجيل بالموقع" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "daily" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: "حاضر", value: stats.present, color: "text-green-600", bg: "bg-green-50 border-green-200" },
              { label: "غائب", value: stats.absent, color: "text-red-600", bg: "bg-red-50 border-red-200" },
              { label: "متأخر", value: stats.late, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
              { label: "اجازة", value: stats.leave, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
              { label: "إضافي (ساعة)", value: totalOT.toFixed(1), color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Date Header */}
          <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">سجل حضور يوم {new Date(date).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                <p className="text-xs text-muted-foreground">{attendancePagination.totalItems} سجل | تأخير إجمالي: {totalLate} دقيقة</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    {["الموظف", "القسم", "حضور", "انصراف", "الحالة", "تأخير (د)", "إضافي (س)", "ملاحظات"].map(h => (
                      <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading || attendancePagination.loading ? (
                    <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
                  ) : attendancePagination.pageItems.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">
                      <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      لا توجد سجلات لهذا اليوم
                    </td></tr>
                  ) : attendancePagination.pageItems.map(rec => {
                    // غائب/إجازة: الأوقات الجاية من الـ EOD job وقت وهمي مش حضور حقيقي
                    const hasRealAttendance = !["غائب", "اجازة"].includes(rec.status);
                    return (
                    <tr key={rec.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium text-foreground">{rec.employee_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{rec.department || "—"}</td>
                      <td className="px-4 py-3 font-mono text-sm text-green-700">{hasRealAttendance && rec.check_in ? rec.check_in : "—"}</td>
                      <td className="px-4 py-3 font-mono text-sm text-red-600">{hasRealAttendance && rec.check_out ? rec.check_out : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[rec.status] || ""}`}>{rec.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {rec.late_minutes > 0 ? <span className="text-amber-600 font-medium">{rec.late_minutes}د</span> : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {rec.overtime_hours > 0 ? <span className="text-purple-600 font-medium">{rec.overtime_hours}س</span> : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-40 truncate">{rec.notes || "—"}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={attendancePagination.page}
              totalPages={attendancePagination.totalPages}
              totalItems={attendancePagination.totalItems}
              pageSize={attendancePagination.pageSize}
              onPageChange={attendancePagination.setPage}
            />
          </div>
        </>
      )}

      {activeTab === "checkin" && (
        <div className="max-w-lg space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />تسجيل حضور/انصراف بالموقع الجغرافي
            </p>
            <div className="space-y-3">
              <select
                value={selectedBranch?.id || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const branch = branches.find((b) => Number(b.id) === id) || null;
                  setSelectedBranch(branch);
                }}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
              >
                <option value="">اختر الفرع...</option>

                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <button onClick={() => handleLocationCheckIn("in")} disabled={checkInOut.loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50">
                  <LogIn className="w-4 h-4" />تسجيل حضور
                </button>
                <button onClick={() => handleLocationCheckIn("out")} disabled={checkInOut.loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium disabled:opacity-50">
                  <LogOut className="w-4 h-4" />تسجيل انصراف
                </button>
              </div>
            </div>
            {checkInOut.message && (
              <p className={`text-sm font-medium flex items-center gap-1.5 p-3 rounded-lg ${checkInOut.status === "success" ? "bg-green-50 text-green-700" : checkInOut.status === "error" ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground"}`}>
                {checkInOut.status === "error" && <AlertCircle className="w-4 h-4" />}
                {checkInOut.status === "success" && <CheckCircle className="w-4 h-4" />}
                {checkInOut.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && canCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">تسجيل حضور</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الموظف</label>
                <select value={form.employee_id} onChange={(e) => handleEmpSelect(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                  <option value="">اختر الموظف...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name_ar || e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">وقت الحضور</label>
                  <input type="time" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">وقت الانصراف</label>
                  <input type="time" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الحالة</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                  {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">دقائق التأخير</label>
                  <input type="number" min={0} value={form.late_minutes} onChange={e => setForm(f => ({ ...f, late_minutes: +e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">ساعات إضافية</label>
                  <input type="number" min={0} step={0.5} value={form.overtime_hours} onChange={e => setForm(f => ({ ...f, overtime_hours: +e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">ملاحظات</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
              <button onClick={handleSubmit} disabled={saving || !form.employee_id}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium disabled:opacity-50">
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}