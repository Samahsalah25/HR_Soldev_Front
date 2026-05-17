import { useState, useEffect } from "react";
import { Plus, MapPin, CheckCircle, XCircle, LogIn, LogOut, AlertCircle, Clock, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRole } from "../lib/useRole";
import { canDo } from "../lib/crudPermissions";

const STATUS_STYLES = {
  "حاضر": "bg-green-100 text-green-700",
  "غائب": "bg-red-100 text-red-600",
  "متأخر": "bg-amber-100 text-amber-700",
  "إجازة": "bg-blue-100 text-blue-700",
  "مهمة عمل": "bg-purple-100 text-purple-700",
  "عمل عن بُعد": "bg-teal-100 text-teal-700",
};

export default function Attendance() {
  const { user } = useRole();
  const canCreate = canDo(user, "attendance", "create");
  const [activeTab, setActiveTab] = useState("daily");
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: "", employee_name: "", department: "", date: new Date().toISOString().slice(0, 10), check_in: "08:00", check_out: "17:00", status: "حاضر", late_minutes: 0, overtime_hours: 0, notes: "" });
  const [saving, setSaving] = useState(false);
  const [checkInOut, setCheckInOut] = useState({ loading: false, status: null, message: "" });
  const [selectedBranch, setSelectedBranch] = useState(null);

  const load = async () => {
    setLoading(true);
    const [recs, emps, brs] = await Promise.all([
      base44.entities.AttendanceRecord.filter({ date }),
      base44.entities.Employee.filter({ status: "نشط" }),
      base44.entities.Branch.filter({ is_active: true }),
    ]);
    setRecords(recs); setEmployees(emps); setBranches(brs); setLoading(false);
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
        const now = new Date();
        const timeStr = now.toTimeString().slice(0, 5);
        const todayStr = now.toISOString().slice(0, 10);
        await base44.entities.AttendanceRecord.create({
          employee_name: "موظف", employee_id: "", department: selectedBranch.name,
          date: todayStr, check_in: type === "in" ? timeStr : "", check_out: type === "out" ? timeStr : "",
          status: "حاضر", location: `فرع: ${selectedBranch.name} | مسافة: ${Math.round(dist)}م`,
          notes: `تسجيل ${type === "in" ? "حضور" : "انصراف"} بالموقع في ${timeStr}`,
        });
        setCheckInOut({ loading: false, status: "success", message: `تم تسجيل ال${type === "in" ? "حضور" : "انصراف"} في ${timeStr} ✔️` });
        load();
      },
      () => setCheckInOut({ loading: false, status: "error", message: "تعذّر الحصول على موقعك. تأكد من تفعيل خاصية الموقع" })
    );
  };

  useEffect(() => { load(); }, [date]);

  const handleEmpSelect = (id) => {
    const emp = employees.find(e => e.id === id);
    if (emp) setForm(f => ({ ...f, employee_id: id, employee_name: emp.full_name_ar, department: emp.department || "" }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    await base44.entities.AttendanceRecord.create(form);
    setShowForm(false); setSaving(false); load();
  };

  const stats = {
    present: records.filter(r => r.status === "حاضر").length,
    absent: records.filter(r => r.status === "غائب").length,
    late: records.filter(r => r.status === "متأخر").length,
    leave: records.filter(r => r.status === "إجازة").length,
  };
  const totalOT = records.reduce((s, r) => s + (r.overtime_hours || 0), 0);
  const totalLate = records.reduce((s, r) => s + (r.late_minutes || 0), 0);

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
              { label: "إجازة", value: stats.leave, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
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
                <p className="text-xs text-muted-foreground">{records.length} سجل | تأخير إجمالي: {totalLate} دقيقة</p>
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
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
                  ) : records.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">
                      <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      لا توجد سجلات لهذا اليوم
                    </td></tr>
                  ) : records.map(rec => (
                    <tr key={rec.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium text-foreground">{rec.employee_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{rec.department}</td>
                      <td className="px-4 py-3 font-mono text-sm text-green-700">{rec.check_in || "—"}</td>
                      <td className="px-4 py-3 font-mono text-sm text-red-600">{rec.check_out || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[rec.status] || ""}`}>{rec.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {rec.late_minutes > 0 ? <span className="text-amber-600 font-medium">{rec.late_minutes}</span> : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {rec.overtime_hours > 0 ? <span className="text-purple-600 font-medium">{rec.overtime_hours}</span> : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-40 truncate">{rec.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <select value={selectedBranch?.id || ""} onChange={e => setSelectedBranch(branches.find(b => b.id === e.target.value) || null)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option value="">اختر الفرع...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.city})</option>)}
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
                <select value={form.employee_id} onChange={e => handleEmpSelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                  <option value="">اختر الموظف...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar}</option>)}
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