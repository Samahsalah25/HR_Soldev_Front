import { useState, useEffect } from "react";
import { Plus, Save, Trash2, Settings } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  getSalaryAdvanceTypes,
  createSalaryAdvanceType,
  updateSalaryAdvanceType,
  deleteSalaryAdvanceType,
} from "@/api/salaryAdvanceTypesApi";

const defaultType = {
  name: "", name_en: "", description: "",
  max_amount: 30000, max_installments: 12,
  salary_ratio: 3, min_service_months: 6,
  requires_manager_approval: true,
  requires_hr_approval: true,
  requires_finance_approval: false,
  finance_approval_threshold: 10000,
  is_active: true,
};

export default function LoanTypeManager({ onClose }) {
  const [types, setTypes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

 const load = async () => {
  const response = await getSalaryAdvanceTypes();
  setTypes(response.data || []);
};
  useEffect(() => { load(); }, []);

 const handleSave = async () => {
  setSaving(true);

  const payload = {
    name: editing.name_en || editing.name,
    name_ar: editing.name,
    description: editing.description,
    maximum_amount: editing.max_amount,
    maximum_installments: editing.max_installments,
    salary_percentage: editing.salary_ratio,
    minimum_service_period: editing.min_service_months,
    direct_manager_approval: editing.requires_manager_approval,
    hr_approval: editing.requires_hr_approval,
    finance_approval: editing.requires_finance_approval,
    finance_approval_limit: editing.finance_approval_threshold,
  };

  try {
    if (editing.id) {
      await updateSalaryAdvanceType(editing.id, payload);
    } else {
      await createSalaryAdvanceType(payload);
    }

    setEditing(null);
    load();
  } finally {
    setSaving(false);
  }
};

const handleDelete = async (id) => {
  if (!confirm("حذف نوع السلفة؟")) return;

  await deleteSalaryAdvanceType(id);

  load();
};

  const set = (k, v) => setEditing(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">إدارة أنواع السلف</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!editing ? (
            <>
              <button onClick={() => setEditing({ ...defaultType })}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                <Plus className="w-4 h-4" />إضافة نوع جديد
              </button>
              <div className="space-y-3">
                {types.map(t => (
                  <div key={t.id} className={`border rounded-xl p-4 ${t.is_active ? "border-border" : "border-border opacity-50"}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">حد أقصى: {t.maximum_amount?.toLocaleString("ar-SA")} ر.س</span>
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">حتى {t.maximum_installments} قسط</span>
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{t.salary_ratio}× الراتب</span>
                          <span className="text-xs bg-slate-50 text-slate-700 px-2 py-0.5 rounded">خدمة ≥ {t.minimum_service_period} شهر</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {t.direct_manager_approval && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">✓ مدير</span>}
                          {t.hr_approval && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">✓ HR</span>}
                          {t.finance_approval && <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">✓ مالية (&gt;{t.finance_approval_threshold?.toLocaleString("ar-SA")})</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() =>
  setEditing({
    id: t.id,

    name: t.name_ar,
    name_en: t.name,

    description: t.description,

    max_amount: t.maximum_amount,
    max_installments: t.maximum_installments,

    salary_ratio: t.salary_ratio,

    min_service_months: t.minimum_service_period,

    requires_manager_approval:
      t.direct_manager_approval,

    requires_hr_approval:
      t.hr_approval,

    requires_finance_approval:
      t.finance_approval,

    finance_approval_threshold:
      t.finance_approval_limit,
  })
} className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted text-foreground">تعديل</button>
                        <button
  onClick={() => handleDelete(t.id)}
  className="text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg"
>
  <Trash2 className="w-3.5 h-3.5" />
</button>
                      </div>
                    </div>
                  </div>
                ))}
                {types.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">لا توجد أنواع سلف — أضف نوعاً جديداً</p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">{editing.id ? "تعديل النوع" : "نوع جديد"}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">اسم النوع (عربي) *</label>
                  <input value={editing.name} onChange={e => set("name", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">الاسم (إنجليزي)</label>
                  <input value={editing.name_en || ""} onChange={e => set("name_en", e.target.value)} dir="ltr"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-foreground">الوصف</label>
                  <input value={editing.description || ""} onChange={e => set("description", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">الحد الأقصى للمبلغ</label>
                  <input type="number" min={0} value={editing.max_amount} onChange={e => set("max_amount", +e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">الحد الأقصى للأقساط</label>
                  <input type="number" min={1} max={60} value={editing.max_installments} onChange={e => set("max_installments", +e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">نسبة الراتب (×)</label>
                  <input type="number" min={1} max={12} value={editing.salary_ratio} onChange={e => set("salary_ratio", +e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">الحد الأدنى للخدمة (أشهر)</label>
                  <input type="number" min={0} value={editing.min_service_months} onChange={e => set("min_service_months", +e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                </div>
              </div>

              <div className="border border-border rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">مستويات الموافقة</p>
                {[
                  { key: "requires_manager_approval", label: "موافقة المدير المباشر" },
                  { key: "requires_hr_approval", label: "موافقة HR" },
                  { key: "requires_finance_approval", label: "موافقة المالية" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={editing[key]} onChange={e => set(key, e.target.checked)} className="w-4 h-4 accent-primary" />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
                {editing.requires_finance_approval && (
                  <div className="space-y-1.5 mt-2">
                    <label className="text-xs font-medium text-muted-foreground">حد مبلغ موافقة المالية (ر.س)</label>
                    <input type="number" value={editing.finance_approval_threshold} onChange={e => set("finance_approval_threshold", +e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted text-foreground">إلغاء</button>
                <button onClick={handleSave} disabled={saving || !editing.name}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
                  <Save className="w-4 h-4" />{saving ? "حفظ..." : "حفظ"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}