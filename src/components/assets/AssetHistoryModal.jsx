import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getAssetById, getAssetHistory, getCustodyRequests, getCustodyReturns } from "@/api/assetsApi";

// Action label + colour mapping
const ACTION_MAP = {
  "إنشاء": { label: "إنشاء", color: "bg-green-100 text-green-700" },
  "تخصيص": { label: "تخصيص", color: "bg-blue-100 text-blue-700" },
  "إعادة": { label: "إعادة", color: "bg-orange-100 text-orange-700" },
  "صيانة": { label: "صيانة", color: "bg-amber-100 text-amber-700" },
  create: { label: "إنشاء", color: "bg-green-100 text-green-700" },
  assign: { label: "تخصيص", color: "bg-blue-100 text-blue-700" },
  deliver: { label: "تسليم", color: "bg-blue-100 text-blue-700" },
  return: { label: "إعادة", color: "bg-orange-100 text-orange-700" },
  receive: { label: "استلام", color: "bg-green-100 text-green-700" },
  reject: { label: "رفض", color: "bg-red-100 text-red-700" },
  accept: { label: "قبول", color: "bg-blue-100 text-blue-700" },
  maintenance: { label: "صيانة", color: "bg-amber-100 text-amber-700" },
  custody_request: { label: "طلب تخصيص", color: "bg-blue-100 text-blue-700" },
  custody_return: { label: "طلب إعادة", color: "bg-orange-100 text-orange-700" },
};

function getActionStyle(action) {
  const key = action?.toLowerCase?.() || action;
  return ACTION_MAP[key] || ACTION_MAP[action] || {
    label: action || "—",
    color: "bg-muted text-muted-foreground",
  };
}

export default function AssetHistoryModal({ asset, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assetName, setAssetName] = useState(asset?.name || asset?.asset_name || "—");
  const [assetSub, setAssetSub] = useState(
    asset?.category_type || asset?.classification || asset?.category || "—"
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1. Try dedicated history endpoint
        const histList = await getAssetHistory(asset.id);
        if (histList && histList.length > 0) {
          setHistory(histList);
          setLoading(false);
          return;
        }

        // 2. Fetch full asset detail – history might be embedded
        const detail = await getAssetById(asset.id);
        const data = detail?.data || detail || {};
        setAssetName(data.name || data.asset_name || assetName);
        setAssetSub(data.category_type || data.classification || data.category || assetSub);

        const embedded =
          data.history || data.logs || data.audit_log || data.tracking || asset.history;
        if (Array.isArray(embedded) && embedded.length > 0) {
          setHistory(embedded);
          setLoading(false);
          return;
        }

        // 3. Build history from custody_requests + custody_returns for this asset
        const [reqs, rets] = await Promise.all([
          getCustodyRequests().catch(() => []),
          getCustodyReturns().catch(() => []),
        ]);

        const assetReqs = reqs.filter(r => r.equipment_id === asset.id);
        const assetRets = rets.filter(r => r.equipment_id === asset.id);

        const built = [
          // created entry
          {
            action: "create",
            notes: "تم إنشاء الأصل",
            performed_by: data.created_by || "",
            date: data.create_date || data.created_at || "",
          },
          // requests
          ...assetReqs.map(r => ({
            action: r.request_type || "custody_request",
            notes: `${r.request_type === "custody_request" ? "مخصص لـ" : "طلب إعادة من"} ${r.employee_name || ""}`,
            performed_by: r.employee_name || "",
            date: r.request_date || r.created_at || "",
          })),
          // returns
          ...assetRets.map(r => ({
            action: "custody_return",
            notes: `طلب إعادة من ${r.employee_name || ""}`,
            performed_by: r.employee_name || "",
            date: r.request_date || r.created_at || "",
          })),
        ].filter(e => e.date); // only entries with a date

        // Sort by date descending
        built.sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistory(built);
      } catch (err) {
        console.error("History load error:", err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [asset.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold">سجل الأصل</h2>
            <p className="text-sm text-muted-foreground">{assetName} — {assetSub}</p>
          </div>
          <button onClick={onClose} type="button"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا يوجد سجل لهذا الأصل</p>
          ) : (
            <div className="space-y-3">
              {history.map((entry, i) => {
                const action = entry.action || entry.type || entry.event || "";
                const { label, color } = getActionStyle(action);
                const notes = entry.notes || entry.description || entry.message || "";
                const performedBy = entry.performed_by || entry.user || entry.created_by || entry.by || "";
                const date = entry.date || entry.created_at || entry.timestamp || "";
                return (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                        {label}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{notes || label}</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        {performedBy && <span>بواسطة: {performedBy}</span>}
                        {date && <span>{new Date(date).toLocaleDateString("ar-SA")}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
