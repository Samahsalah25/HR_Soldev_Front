import { X } from "lucide-react";

const ACTION_COLORS = {
  "إنشاء": "bg-green-100 text-green-700",
  "تخصيص": "bg-blue-100 text-blue-700",
  "إعادة": "bg-orange-100 text-orange-700",
  "صيانة": "bg-amber-100 text-amber-700",
};

export default function AssetHistoryModal({ asset, onClose }) {
  const history = asset.history || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold">سجل الأصل</h2>
            <p className="text-sm text-muted-foreground">{asset.asset_name} — {asset.category}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا يوجد سجل لهذا الأصل</p>
          ) : (
            <div className="space-y-3">
              {[...history].reverse().map((entry, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[entry.action] || "bg-muted text-muted-foreground"}`}>
                      {entry.action}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{entry.notes}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span>بواسطة: {entry.performed_by}</span>
                      <span>{entry.date ? new Date(entry.date).toLocaleDateString("ar-SA") : ""}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إغلاق</button>
        </div>
      </div>
    </div>
  );
}