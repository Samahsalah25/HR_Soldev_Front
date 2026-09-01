import { useState, useEffect, useCallback } from "react";
import { UserX, Plus, X, Save, CheckCircle, FileText, DollarSign, Monitor, Package, Plane, Upload, Eye, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRole } from "../lib/useRole";
import { calcEndOfService, calcLeaveEncashment, calcServiceYears, calcTicketEncashment, formatCurrency } from "../lib/hrUtils";
import { getEmployees } from "@/api/departmentsApi";
import { createEndOfService, getEndOfService, eosAction } from "@/api/endOfService"
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useServerPagination } from "@/lib/useServerPagination";
import TablePagination from "@/components/ui/TablePagination";
const WORKFLOW_STEPS = [
  { key: "Pending Manager", label: "تأكيد المدير", icon: "👔" },
  { key: "Pending HR Review", label: "مراجعة HR", icon: "📋" },
  { key: "Pending Finance", label: "التسوية المالية", icon: "💰" },
  { key: "Pending IT/Assets", label: "IT والعهدة", icon: "💻" },
  { key: "Final Approval", label: "الموافقة النهائية", icon: "✅" },
  { key: "Completed", label: "مكتمل", icon: "🏁" },
];



const STATUS_COLORS = {
  "Draft": "bg-gray-100 text-gray-600",
  "Pending Manager": "bg-blue-100 text-blue-700",
  "Pending HR Review": "bg-purple-100 text-purple-700",
  "Pending Finance": "bg-orange-100 text-orange-700",
  "Pending IT/Assets": "bg-teal-100 text-teal-700",
  "Final Approval": "bg-amber-100 text-amber-700",
  "Completed": "bg-green-100 text-green-700",
  "Cancelled": "bg-red-100 text-red-600",
};

const TYPE_LABELS = {
  resign: "استقالة",
  fired: "إنهاء من الشركة",
  end_of_contract: "انتهاء عقد",
  retirement: "تقاعد",
  end_of_probation: "إنهاء فترة تجربة",
  "end of contract": "انتهاء عقد",
  "end of trial period": "إنهاء فترة تجربة",
  Resignation: "استقالة",
  Resigned: "استقالة",
  resigned: "استقالة",
  resignation: "استقالة",
  "Company Termination": "إنهاء من الشركة",
  company_termination: "إنهاء من الشركة",
  "Contract End": "انتهاء عقد",
  Retirement: "تقاعد",
  "End of Probation": "إنهاء فترة تجربة",
  Fired: "إنهاء من الشركة",
  fired_by_company: "إنهاء من الشركة",
  "End of Contract": "انتهاء عقد",
  "End of Trial Period": "إنهاء فترة تجربة",
  end_of_trial_period: "إنهاء فترة تجربة",
  "استقالة": "استقالة",
  "إنهاء من الشركة": "إنهاء من الشركة",
  "إنهاء من صاحب العمل": "إنهاء من صاحب العمل",
  "انتهاء عقد": "انتهاء عقد",
  "تقاعد": "تقاعد",
  "إنهاء فترة تجربة": "إنهاء فترة تجربة",
};

// ─── New Request Form ─────────────────────────────────────────────────
function NewTerminationForm({ employees, onSave, onClose }) {
  const [form, setForm] = useState({
    employee_id: "",
    departure_reason: "resign",
    notice_period: 30,
    departure_date: "",
    reason: "",
    attachment: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const DEPARTURE_REASONS = [
    { value: "resign", label: "استقالة" },
    { value: "fired", label: "إنهاء من الشركة" },
    { value: "end_of_contract", label: "انتهاء عقد" },
    { value: "retirement", label: "تقاعد" },
    { value: "end_of_probation", label: "إنهاء فترة تجربة" },
  ];

  const handleEmpSelect = (id) => {
    const emp = employees.find(e => String(e.id) === String(id));
    if (emp) set("employee_id", id);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("attachment", file_url); setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        employee_id: form.employee_id,
        departure_reason: form.departure_reason,
        notice_period: form.notice_period,
        departure_date: form.departure_date,
        reason: form.reason,
        attachment: form.attachment || null,
      };
      const res = await createEndOfService(payload);
      onSave(res);
    } catch (err) {
      console.error(err?.response?.data || err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2"><UserX className="w-5 h-5 text-red-600" />طلب إنهاء خدمة جديد</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* الموظف */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">الموظف *</label>
            <select
              value={form.employee_id}
              onChange={e => handleEmpSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
            >
              <option value="">اختر الموظف...</option>
              {employees?.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name_ar || e.name || "بدون اسم"} — {e.department_name || ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* نوع الإنهاء */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">نوع الإنهاء *</label>
              <select
                value={form.departure_reason}
                onChange={e => set("departure_reason", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
              >
                {DEPARTURE_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {/* فترة الإشعار */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">فترة الإشعار (يوم)</label>
              <input type="number" min={0} value={form.notice_period}
                onChange={e => set("notice_period", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
          </div>

          {/* آخر يوم عمل */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">آخر يوم عمل *</label>
            <input type="date" value={form.departure_date}
              onChange={e => set("departure_date", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
          </div>

          {/* سبب الإنهاء */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">سبب الإنهاء *</label>
            <textarea value={form.reason} onChange={e => set("reason", e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
          </div>

          {/* مرفق */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">مرفق (اختياري)</label>
            {form.attachment ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700 flex-1">تم رفع المرفق</span>
                <a href={form.attachment} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">عرض</a>
                <button onClick={() => set("attachment", "")} className="text-xs text-red-500">إزالة</button>
              </div>
            ) : (
              <label className="flex items-center gap-2 p-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{uploading ? "جاري الرفع..." : "رفع مستند"}</span>
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.employee_id || !form.departure_date || !form.reason}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />{saving ? "جاري الإرسال..." : "إنشاء الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail / Workflow Modal ──────────────────────────────────────────
function TerminationDetailModal({ req, employees, user, role, onClose, onUpdate }) {
  const confirmDialog = useConfirm();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [settlement, setSettlement] = useState(null);
  const [ticketCalc, setTicketCalc] = useState(null);
  const [assets, setAssets] = useState([]);
  const [activeTab, setActiveTab] = useState("info");

  const isHR = role === "admin" || role === "hr";
  const isManager = ["admin", "hr", "dept_manager", "general_manager", "ceo"].includes(role);
  const isFinance = role === "admin" || role === "accountant";
  const isIT = role === "admin" || role === "it";

  const emp = employees.find(e => e.id === req.employee_id);

  useEffect(() => {
    if (emp && req.status !== "Draft") {
      const years = calcServiceYears(emp.join_date || "");
      const eos = calcEndOfService(emp.basic_salary || 0, years, req.termination_type === "Resignation" ? "استقالة" : "إنهاء من صاحب العمل", emp.contract_type);
      const leaveEncash = calcLeaveEncashment(emp.basic_salary || 0, emp.housing_allowance || 0, emp.annual_leave_balance || 0);
      const ticket = calcTicketEncashment(emp.join_date, emp.last_ticket_date || null, emp.ticket_entitlement || "سنوياً", emp.ticket_value || 0);
      setTicketCalc(ticket);
      setSettlement({ years, eos, leaveEncash, ticketEncash: ticket.totalValue, total: eos.finalReward + leaveEncash + ticket.totalValue });
    }
    // جلب العهد المخصصة للموظف
    if (req.employee_id) {
      base44.entities.Asset.filter({ assigned_to_employee_id: req.employee_id }).then(setAssets);
    }
  }, [emp, req.employee_id]);

  const handleAction = async (actionType) => {
    setSaving(true);
    try {
      const res = await eosAction(req.id, actionType, notes);
   
      onUpdate();
    } catch (err) {
      console.error("EOS action error:", err?.response?.data || err);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    const ok = await confirmDialog({
      title: "اعتماد المرحلة",
      message: "هل أنت متأكد من اعتماد هذه المرحلة من إجراء إنهاء الخدمة؟",
      confirmText: "اعتماد",
    });
    if (ok) await handleAction("approve");
  };

  const handleReject = async () => {
    const ok = await confirmDialog({
      title: "رفض إنهاء الخدمة",
      message: "هل أنت متأكد من رفض هذه المرحلة من إجراء إنهاء الخدمة؟",
      confirmText: "رفض",
      variant: "destructive",
    });
    if (ok) await handleAction("reject");
  };

  const handleFinalApprove = async () => {
    const ok = await confirmDialog({
      title: "الموافقة النهائية وإغلاق الملف",
      message: "سيتم تلقائيًا عند الموافقة: تغيير حالة الموظف إلى \"مُنهي الخدمة\"، إيقاف الراتب بعد آخر يوم عمل، تعطيل حساب المستخدم، وإنهاء التأمين الاجتماعي. لا يمكن التراجع عن هذا الإجراء.",
      confirmText: "موافقة نهائية",
      variant: "destructive",
    });
    if (ok) await handleAction("approve");
  };

  const stepIndex = WORKFLOW_STEPS.findIndex(s => s.key === req.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />إنهاء خدمة — {req.employee_name}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${STATUS_COLORS[req.status]}`}>{req.status}</span>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-border">
          {[{ id: "info", label: "التفاصيل" }, { id: "assets", label: `العهد (${assets.length})` }, { id: "tickets", label: "التذاكر ✈️" }, { id: "workflow", label: "سير العمل" }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Workflow Progress */}
        <div className="px-6 py-4 border-b border-border bg-muted/10 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {WORKFLOW_STEPS.map((step, idx) => {
              const done = idx < stepIndex;
              const active = idx === stepIndex;
              return (
                <div key={step.key} className="flex items-center gap-1">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all
                    ${done ? "bg-green-100 text-green-700" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <span>{step.icon}</span>
                    <span className="hidden sm:block">{step.label}</span>
                  </div>
                  {idx < WORKFLOW_STEPS.length - 1 && <div className={`w-4 h-0.5 ${done ? "bg-green-400" : "bg-border"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Assets Tab */}
          {activeTab === "assets" && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2"><Package className="w-4 h-4 text-teal-600" />العهد المخصصة للموظف</p>
              {assets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-border">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد عهد مسجلة لهذا الموظف</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assets.map(asset => (
                    <div key={asset.id} className={`flex items-center justify-between border rounded-xl px-4 py-3 ${asset.status === "مُسترد" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${asset.status === "مُسترد" ? "bg-green-100" : "bg-amber-100"}`}>
                          <Package className={`w-4 h-4 ${asset.status === "مُسترد" ? "text-green-600" : "text-amber-600"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{asset.asset_name}</p>
                          <p className="text-xs text-muted-foreground">{asset.asset_type} {asset.serial_number ? `— ${asset.serial_number}` : ""}</p>
                          {asset.delivery_date && <p className="text-xs text-muted-foreground">تاريخ التسليم: {new Date(asset.delivery_date).toLocaleDateString("ar-SA")}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${asset.status === "مُسترد" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {asset.status === "مُسترد" ? "✓ مُسترد" : "⏳ لم يُسترد"}
                        </span>
                        {(isHR || isIT) && asset.status !== "مُسترد" && (
                          <button onClick={async () => {
                            await base44.entities.Asset.update(asset.id, { status: "متاح", assigned_to_employee_id: null, assigned_to_employee_name: null });
                            const updated = await base44.entities.Asset.filter({ assigned_to_employee_id: req.employee_id });
                            setAssets(updated);
                          }} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />استرداد
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className={`p-3 rounded-lg text-xs font-medium ${assets.every(a => a.status === "مُسترد" || a.status === "متاح") ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                    {assets.filter(a => a.status !== "مُسترد" && a.status !== "متاح").length === 0
                      ? "✓ تم استرداد جميع العهد"
                      : `⚠️ ${assets.filter(a => a.status !== "مُسترد" && a.status !== "متاح").length} عهدة لم تُسترد بعد`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === "tickets" && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Plane className="w-4 h-4 text-blue-500" />استحقاق تذاكر السفر غير المستخدمة
              </p>
              {!emp ? (
                <p className="text-sm text-muted-foreground">لا يمكن تحميل بيانات الموظف</p>
              ) : emp.ticket_entitlement === "غير مستحق" || !emp.ticket_value ? (
                <div className="p-4 bg-muted/30 rounded-xl border border-border text-center text-sm text-muted-foreground">
                  <Plane className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>هذا الموظف غير مستحق لتذاكر السفر أو لم تُحدد قيمة التذكرة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* بيانات الاستحقاق */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: "الاستحقاق", value: emp.ticket_entitlement },
                      { label: "درجة السفر", value: emp.ticket_class || "اقتصادية" },
                      { label: "الوجهة", value: emp.ticket_destination || "—" },
                      { label: "قيمة التذكرة", value: formatCurrency(emp.ticket_value) },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/30 rounded-lg px-3 py-2">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-medium text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* آخر استخدام */}
                  <div className="bg-muted/30 rounded-lg px-3 py-2 text-sm">
                    <p className="text-xs text-muted-foreground">آخر تاريخ استخدام تذكرة</p>
                    <p className="font-medium text-foreground">
                      {emp.last_ticket_date ? new Date(emp.last_ticket_date).toLocaleDateString("ar-SA") : "لم يستخدم تذكرة قط — يُحسب من تاريخ المباشرة"}
                    </p>
                  </div>

                  {/* النتيجة */}
                  {ticketCalc && (
                    <div className={`rounded-xl border p-4 ${ticketCalc.unUsedTickets > 0 ? "bg-blue-50 border-blue-200" : "bg-muted/20 border-border"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-foreground">التذاكر المتراكمة غير المستخدمة</p>
                        <span className={`text-lg font-bold ${ticketCalc.unUsedTickets > 0 ? "text-blue-600" : "text-muted-foreground"}`}>
                          {ticketCalc.unUsedTickets} تذكرة
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{ticketCalc.details}</p>
                      {ticketCalc.totalValue > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between">
                          <p className="text-sm font-semibold text-blue-800">إجمالي قيمة التذاكر المستحقة</p>
                          <p className="text-lg font-bold text-blue-700">{formatCurrency(ticketCalc.totalValue)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {ticketCalc?.totalValue > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                      ✅ سيتم إضافة <span className="font-bold">{formatCurrency(ticketCalc.totalValue)}</span> إلى التسوية المالية النهائية تعويضاً عن التذاكر غير المستخدمة
                    </div>
                  )}

                  {/* تحديث آخر استخدام */}
                  {(isHR) && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">تحديث آخر تاريخ استخدام تذكرة (اختياري)</label>
                      <div className="flex gap-2">
                        <input type="date" id="lastTicketInput"
                          defaultValue={emp.last_ticket_date || ""}
                          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                        <button onClick={async () => {
                          const val = document.getElementById("lastTicketInput").value;
                          await base44.entities.Employee.update(emp.id, { last_ticket_date: val || null });
                          onUpdate();
                        }} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90">
                          حفظ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Info Tab */}
          {activeTab !== "assets" && activeTab !== "workflow" && activeTab !== "tickets" && <>
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "نوع الإنهاء", value: TYPE_LABELS[req.termination_type] || req.termination_type },
                { label: "آخر يوم عمل", value: req.last_working_day ? new Date(req.last_working_day).toLocaleDateString("ar-SA") : "—" },
                { label: "القسم", value: req.department },
                { label: "فترة الإشعار", value: `${req.notice_period_days} يوم` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/30 rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>

            <div className="bg-muted/30 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">السبب</p>
              <p className="text-sm text-foreground">{req.reason}</p>
            </div>

            {/* Settlement Preview */}
            {settlement && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" />التسوية المالية التقديرية</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center">
                  <div className="bg-white rounded-lg p-2 border border-amber-100">
                    <p className="font-bold text-amber-700">{formatCurrency(settlement.eos.finalReward)}</p>
                    <p className="text-muted-foreground">مكافأة ن.خدمة</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-amber-100">
                    <p className="font-bold text-amber-700">{formatCurrency(settlement.leaveEncash)}</p>
                    <p className="text-muted-foreground">تصفية إجازات</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-amber-100">
                    <p className={`font-bold ${settlement.ticketEncash > 0 ? "text-blue-600" : "text-muted-foreground"}`}>{formatCurrency(settlement.ticketEncash || 0)}</p>
                    <p className="text-muted-foreground">تعويض تذاكر ✈️</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-amber-100">
                    <p className="font-bold text-green-700">{formatCurrency(settlement.total)}</p>
                    <p className="text-muted-foreground">الإجمالي</p>
                  </div>
                </div>
                {req.outstanding_loans > 0 && (
                  <p className="text-xs text-red-600 mt-2">⚠️ سلف متبقية: {formatCurrency(req.outstanding_loans)} — تُخصم من التسوية</p>
                )}
              </div>
            )}

            {/* Action Area based on status & role */}
            {req.status === "Pending Manager" && isManager && (
              <ActionCard title="تأكيد المدير" icon="👔" color="blue"
                notes={notes} setNotes={setNotes}
                onApprove={handleApprove}
                onReject={handleReject}
                saving={saving} />
            )}

            {req.status === "Pending HR Review" && isHR && (
              <ActionCard title="مراجعة HR وتحديد التسوية" icon="📋" color="purple"
                notes={notes} setNotes={setNotes}
                onApprove={handleApprove}
                onReject={handleReject}
                saving={saving} />
            )}

            {req.status === "Pending Finance" && isFinance && (
              <ActionCard title="تخليص المالية" icon="💰" color="orange"
                notes={notes} setNotes={setNotes}
                onApprove={handleApprove}
                onReject={handleReject}
                saving={saving} />
            )}

            {req.status === "Pending IT/Assets" && (isIT || isHR) && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-teal-800 flex items-center gap-2"><Monitor className="w-4 h-4" />تخليص IT والعهدة والسفر</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: "IT - إلغاء الصلاحيات", field: "it_cleared" },
                    { label: "العهدة - استلام الأصول", field: "assets_cleared" },
                    { label: "السفر - مراجعة التذاكر", field: "travel_cleared" },
                  ].map(item => (
                    <div key={item.field} className="bg-white rounded-lg p-2 border border-teal-100 text-center">
                      <p className="text-muted-foreground">{item.label}</p>
                      <span className="text-green-600">✓ جاهز</span>
                    </div>
                  ))}
                </div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="ملاحظات..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
                <button disabled={saving} onClick={handleApprove}
                  className="w-full py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                  {saving ? "جاري الحفظ..." : "✓ تم التخليص الكامل"}
                </button>
              </div>
            )}

            {req.status === "Final Approval" && isHR && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-green-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" />الموافقة النهائية وإغلاق الملف</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 space-y-1">
                  <p className="font-semibold">⚠️ سيتم تلقائياً عند الموافقة:</p>
                  <p>• تغيير حالة الموظف إلى "مُنهي الخدمة"</p>
                  <p>• إيقاف الراتب بعد آخر يوم عمل</p>
                  <p>• تعطيل حساب المستخدم</p>
                  <p>• إنهاء التأمين الاجتماعي</p>
                </div>
                <button disabled={saving} onClick={handleFinalApprove}
                  className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50">
                  {saving ? "جاري الإغلاق..." : "✓ موافقة نهائية وإغلاق الملف"}
                </button>
              </div>
            )}

            {req.status === "Completed" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-800">تم إنهاء الخدمة بنجاح</p>
                {req.final_approved_at && <p className="text-xs text-muted-foreground mt-1">بواسطة: {req.final_approved_by} — {new Date(req.final_approved_at).toLocaleDateString("ar-SA")}</p>}
                {req.final_settlement_amount > 0 && <p className="text-sm font-bold text-green-700 mt-2">التسوية النهائية: {formatCurrency(req.final_settlement_amount)}</p>}
              </div>
            )}

            {req.attachment_url && (
              <a href={req.attachment_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <FileText className="w-4 h-4" />عرض المرفق
              </a>
            )}
          </>}

          {/* Workflow Tab */}
          {activeTab === "workflow" && (
            <div className="space-y-3 text-sm">
              {[
                { label: "تأكيد المدير", by: req.manager_confirmed_by, at: req.manager_confirmed_at, notes: req.manager_notes, color: "blue" },
                { label: "مراجعة HR", by: req.hr_reviewed_by, at: req.hr_reviewed_at, notes: req.hr_notes, color: "purple" },
                { label: "تخليص المالية", by: req.finance_cleared_by, at: req.finance_cleared_at, notes: req.finance_notes, color: "orange" },
                { label: "تخليص IT", by: req.it_cleared_by, at: req.it_cleared_at, notes: req.it_notes, color: "teal" },
                { label: "الموافقة النهائية", by: req.final_approved_by, at: req.final_approved_at, color: "green" },
              ].map(step => step.by ? (
                <div key={step.label} className="flex gap-3 p-3 bg-muted/20 rounded-xl border border-border">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground">بواسطة: {step.by} — {step.at ? new Date(step.at).toLocaleDateString("ar-SA") : ""}</p>
                    {step.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{step.notes}</p>}
                  </div>
                </div>
              ) : null)}
              {req.outstanding_loans > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  ⚠️ سلف متبقية: {formatCurrency(req.outstanding_loans)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, icon, color, notes, setNotes, onApprove, onReject, saving }) {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
    orange: "bg-orange-50 border-orange-200 text-orange-800",
  };
  return (
    <div className={`rounded-xl border p-4 space-y-3 ${colors[color]}`}>
      <p className="text-sm font-semibold flex items-center gap-2">{icon} {title}</p>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="ملاحظات..."
        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none resize-none" />
      <div className="flex gap-2">
        <button disabled={saving} onClick={onApprove}
          className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
          {saving ? "جاري..." : "✓ موافقة"}
        </button>
        <button disabled={saving} onClick={onReject}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50">
          رفض
        </button>
      </div>
    </div>
  );
}

// ─── Employee View (read-only) ────────────────────────────────────────
function EmployeeTerminationView({ myEmployee }) {
  const [myReqs, setMyReqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (myEmployee) {
      base44.entities.TerminationRequest.filter({ employee_id: myEmployee.id }).then(r => { setMyReqs(r); setLoading(false); });
    } else setLoading(false);
  }, [myEmployee]);

  if (loading) return <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  if (!myEmployee || myReqs.length === 0) return (
    <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
      <UserX className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p className="text-sm">لا توجد إجراءات إنهاء خدمة مرتبطة بحسابك</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {myReqs.map(req => (
        <div key={req.id} className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-foreground">{TYPE_LABELS[req.termination_type] || req.termination_type || "—"}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>{req.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><p className="text-xs text-muted-foreground">آخر يوم عمل</p><p className="font-medium">{req.last_working_day ? new Date(req.last_working_day).toLocaleDateString("ar-SA") : "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">فترة الإشعار</p><p className="font-medium">{req.notice_period_days} يوم</p></div>
          </div>
          <div className="flex gap-1 flex-wrap">
            {WORKFLOW_STEPS.map((step, idx) => {
              const stepIdx = WORKFLOW_STEPS.findIndex(s => s.key === req.status);
              const done = idx < stepIdx || req.status === "Completed";
              const active = idx === stepIdx && req.status !== "Completed";
              return (
                <span key={step.key} className={`text-xs px-2 py-0.5 rounded-full font-medium ${done ? "bg-green-100 text-green-700" : active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {step.icon} {step.label}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function Termination() {
  const { user, role } = useRole();
  const isHR = role === "admin" || role === "hr";
  const isEmployee = role === "employee" || role === "user";
  const canCreate = isHR;

  const [employees, setEmployees] = useState([]);
  const [myEmployee, setMyEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

  const load = async () => {
    setLoading(true);

    try {
      const empsRes = await getEmployees();

      const emps =
        Array.isArray(empsRes)
          ? empsRes
          : empsRes?.data ?? empsRes?.employees ?? [];

      setEmployees(emps);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  // تحويل الـ field names من الـ backend للـ frontend
  const STATE_MAP = {
    "draft": "Draft",
    "manager_approval": "Pending Manager",
    "pending_manager": "Pending Manager",
    "hr_review": "Pending HR Review",
    "pending_hr_review": "Pending HR Review",
    "finance": "Pending Finance",
    "pending_finance": "Pending Finance",
    "financial_settlement": "Pending Finance",
    "it_assets": "Pending IT/Assets",
    "pending_it_assets": "Pending IT/Assets",
    "custody_clearance": "Pending IT/Assets",
    "it_clearance": "Pending IT/Assets",
    "assets_clearance": "Pending IT/Assets",
    "final_approval": "Final Approval",
    "pending_final_approval": "Final Approval",
    "completed": "Completed",
    "done": "Completed",
    "closed": "Completed",
    "refused": "Cancelled",
    "rejected": "Cancelled",
    "cancelled": "Cancelled",
  };

  const [eosKpis, setEosKpis] = useState(null);
  const fetchRequestsPage = useCallback(async (params) => {
    const eosRes = await getEndOfService(params);
    setEosKpis(eosRes?.kpis ?? null);
    const rawReqs = Array.isArray(eosRes) ? eosRes : eosRes?.data ?? eosRes?.requests ?? [];
    return {
      ...eosRes,
      data: rawReqs.map(r => ({
        ...r,
        employee_name: r.employee_name || r.employee || "",
        termination_type: r.termination_type || r.departure_reason || "",
        last_working_day: r.last_working_day || r.departure_date || "",
        status: STATE_MAP[r.status] || STATE_MAP[r.state] || r.status || r.state || "Draft",
        created_date: r.created_date || r.date_of_request || r.created_at || "",
        department: r.department || r.department_name || "",
        reason: r.reason || "",
        notice_period_days: r.notice_period_days ?? r.notice_period ?? 30,
      })),
    };
  }, []);
  const requestsPagination = useServerPagination(fetchRequestsPage, 20);

  const refreshAll = () => {
    load();
    requestsPagination.reload();
  };

  // ملاحظة: "قيد التنفيذ" بيغطي كذا مرحلة مع بعض، والباك بيرجع مرحلة "pending_manager" بس
  // من غير الباقي (HR/Finance/IT/الموافقة النهائية) — فلسه محسوبة محليًا عشان تفضل شاملة
  const stats = {
    pending: requestsPagination.pageItems.filter(r => !["Completed", "Cancelled", "Draft"].includes(r.status)).length,
    completed: eosKpis?.completed ?? requestsPagination.pageItems.filter(r => r.status === "Completed").length,
    total: eosKpis?.total_eos_requests ?? requestsPagination.totalItems,
  };

  const filtered = requestsPagination.pageItems.filter(r => !filterStatus || r.status === filterStatus);

  if (loading || requestsPagination.loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  // Employee view
  if (isEmployee) {
    return (
      <div className="p-6 space-y-5 max-w-2xl mx-auto" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><UserX className="w-6 h-6 text-red-600" />حالة إنهاء الخدمة</h1>
          <p className="text-sm text-muted-foreground mt-0.5">يمكنك متابعة حالة إجراءات إنهاء خدمتك هنا</p>
        </div>
        <EmployeeTerminationView myEmployee={myEmployee} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><UserX className="w-6 h-6 text-red-600" />إدارة إنهاء الخدمة</h1>
          <p className="text-sm text-muted-foreground mt-0.5">نظام مركزي لإدارة Offboarding الموظفين</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            <Plus className="w-4 h-4" />طلب إنهاء خدمة
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "قيد التنفيذ", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { label: "مكتملة", value: stats.completed, color: "text-green-600", bg: "bg-green-50 border-green-200" },
          { label: "إجمالي الطلبات", value: stats.total, color: "text-foreground", bg: "bg-card border-border" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[["", "الكل"], ["Pending Manager", "انتظار المدير"], ["Pending HR Review", "HR"], ["Pending Finance", "المالية"], ["Pending IT/Assets", "IT/العهدة"], ["Final Approval", "موافقة نهائية"], ["Completed", "مكتمل"], ["Cancelled", "ملغي"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilterStatus(val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === val ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/30 border-b border-border">
            {["الموظف", "نوع الإنهاء", "آخر يوم عمل", "الحالة", "تاريخ الطلب", "إجراء"].map(h => (
              <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {requestsPagination.loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">
                <UserX className="w-10 h-10 mx-auto mb-2 opacity-20" />لا توجد طلبات
              </td></tr>
            ) : filtered.map(req => (
              <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{req.employee_name}</p>
                  <p className="text-xs text-muted-foreground">{req.department}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[req.termination_type] || req.termination_type || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {req.last_working_day ? new Date(req.last_working_day).toLocaleDateString("ar-SA") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>{req.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {req.created_date ? new Date(req.created_date).toLocaleDateString("ar-SA") : "—"}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(req)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs hover:bg-primary/20">
                    <Eye className="w-3.5 h-3.5" />تفاصيل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          page={requestsPagination.page}
          totalPages={requestsPagination.totalPages}
          totalItems={requestsPagination.totalItems}
          pageSize={requestsPagination.pageSize}
          onPageChange={requestsPagination.setPage}
        />
      </div>

      {showForm && <NewTerminationForm employees={employees.filter(e => e.active)} onSave={() => { setShowForm(false); refreshAll(); }} onClose={() => setShowForm(false)} />}
      {selected && <TerminationDetailModal req={selected} employees={employees} user={user} role={role} onClose={() => setSelected(null)} onUpdate={() => { refreshAll(); setSelected(null); }} />}
    </div>
  );
}