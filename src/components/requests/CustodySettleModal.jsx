import { useState } from "react";
import { X, Save, Package } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CustodySettleModal({ employees, custodies, onSave, onClose }) {
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedCustodyId, setSelectedCustodyId] = useState("");
  const [condition, setCondition] = useState("سليمة");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const empCustodies = custodies.filter(c => c.employee_id === selectedEmpId && c.status === "نشطة");
  const selectedCustody = custodies.find(c => c.id === selectedCustodyId);

  const handleEmpSelect = (id) => { setSelectedEmpId(id); setSelectedCustodyId(""); };

  const handleSave = async () => {
    setSaving(true);
    const newStatus = condition === "سليمة" ? "مُرجَعة" : condition === "مفقودة" ? "مفقودة" : "تالفة";
    await base44.entities.Custody.update(selectedCustodyId, {
      status: newStatus,
      actual_return_date: new Date().toISOString().slice(0, 10),
      notes: notes || `تصفية بحالة: ${condition}`,
    });
    await base44.entities.EmployeeRequest.create({
      employee_id: selectedEmpId,
      employee_name: employees.find(e => e.id === selectedEmpId)?.full_name_ar || "",
      department: selectedCustody?.department || "",
      request_type: "تصفية عهدة",
      details: `تصفية عهدة: ${selectedCustody?.item_name} | الحالة: ${condition}${notes ? ` | ملاحظات: ${notes}` : ""}`,
      amount: 0,
      status: "مقبولة",
    });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-foreground">تصفية عهدة</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">الموظف</label>
            <select value={selectedEmpId} onChange={e => handleEmpSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
              <option value="">اختر الموظف...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar}</option>)}
            </select>
          </div>

          {selectedEmpId && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">العهدة المراد تصفيتها</label>
              {empCustodies.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">لا توجد عهد نشطة لهذا الموظف</p>
              ) : (
                <select value={selectedCustodyId} onChange={e => setSelectedCustodyId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
                  <option value="">اختر العهدة...</option>
                  {empCustodies.map(c => <option key={c.id} value={c.id}>{c.item_name} — {c.issue_date}</option>)}
                </select>
              )}
            </div>
          )}

          {selectedCustody && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm space-y-1">
              <p className="font-semibold text-purple-800">{selectedCustody.item_name}</p>
              {selectedCustody.serial_number && <p className="text-xs text-purple-600">رقم تسلسلي: {selectedCustody.serial_number}</p>}
              {selectedCustody.value > 0 && <p className="text-xs text-purple-600">القيمة: {selectedCustody.value?.toLocaleString("ar-SA")} ر.س</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">حالة العهدة عند الإعادة</label>
            <div className="grid grid-cols-3 gap-2">
              {["سليمة", "تالفة", "مفقودة"].map(c => (
                <button key={c} onClick={() => setCondition(c)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${condition === c
                    ? c === "سليمة" ? "bg-green-500 text-white border-green-500"
                      : c === "تالفة" ? "bg-amber-500 text-white border-amber-500"
                        : "bg-red-500 text-white border-red-500"
                    : "border-border text-muted-foreground hover:bg-muted"}`}>{c}</button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">ملاحظات</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted text-foreground">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !selectedCustodyId}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "جاري التصفية..." : "تصفية العهدة"}
          </button>
        </div>
      </div>
    </div>
  );
}