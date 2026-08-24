import { useState, useEffect } from "react";
import { Plus, Search, Package, History, CheckCircle, XCircle, Wrench, RotateCcw } from "lucide-react";

import {
  getAssets, getEmployees, getCustodyRequests, getCustodyReturns,
  acceptCustodyRequest, rejectCustodyRequest,
  acceptCustodyReturn, rejectCustodyReturn,
  stateLabel, categoryTypeLabel, conditionLabel,
  requestStatusLabel, REQUEST_STATUS_COLORS,
} from "@/api/assetsApi";
import { useRole } from "../lib/useRole";
import { useAuth } from "../lib/AuthContext";
import AssetForm from "../components/assets/AssetForm";
import AssetRequestModal from "../components/assets/AssetRequestModal";
import AssetHistoryModal from "../components/assets/AssetHistoryModal";
import CustodyDeliverModal from "../components/assets/CustodyDeliverModal";
import CustodyReceiveModal from "../components/assets/CustodyReceiveModal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { usePagination } from "@/lib/usePagination";
import TablePagination from "@/components/ui/TablePagination";

// State badge colours — in_use treated same as assigned
const STATUS_COLORS = {
  available: "bg-green-100 text-green-700",
  assigned: "bg-blue-100 text-blue-700",
  in_use: "bg-blue-100 text-blue-700",
  maintenance: "bg-amber-100 text-amber-700",
};

const CONDITION_COLORS = {
  new: "bg-emerald-100 text-emerald-700",
  good: "bg-sky-100 text-sky-700",
  damaged: "bg-red-100 text-red-700",
};

export default function AssetManagement() {
  const confirmDialog = useConfirm();
const { role } = useRole();
const { user, isLoadingAuth } = useAuth();
  const isAdminOrHR = ["admin", "hr"].includes(role);

  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [returns, setReturns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("assets");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(null);
  const [deliverModal, setDeliverModal] = useState(null);
  const [receiveModal, setReceiveModal] = useState(null);

  // ── Load ────────────────────────────────────────────────────────────────────
const load = async () => {
  setLoading(true);

  try {
    const [a, reqs, rets, emps] = await Promise.all([
      getAssets(),
      getCustodyRequests(),
      getCustodyReturns(),
      getEmployees(),
    ]);

    const myEmp = emps.find(e => e.email === user?.email);

    setCurrentEmployee(myEmp || null);
    setAssets(Array.isArray(a) ? a : []);
    setRequests(Array.isArray(reqs) ? reqs : []);
    setReturns(Array.isArray(rets) ? rets : []);
    setEmployees(emps);
  } catch (err) {
    console.error("Load assets error:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { load(); }, []);

  // ── Request actions ─────────────────────────────────────────────────────────
  const handleAccept = async (req) => {
    const ok = await confirmDialog({
      title: "قبول الطلب",
      message: "هل أنت متأكد من قبول هذا الطلب؟",
      confirmText: "قبول",
    });
    if (!ok) return;
    try {
      // Use custody_returns endpoint if the request came from returns source
      if (req._source === "returns") {
        await acceptCustodyReturn(req.id);
      } else {
        await acceptCustodyRequest(req.id);
      }
      load();
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  const handleReject = async (req) => {
    const ok = await confirmDialog({
      title: "رفض الطلب",
      message: "هل أنت متأكد من رفض هذا الطلب؟",
      confirmText: "رفض",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      if (req._source === "returns") {
        await rejectCustodyReturn(req.id);
      } else {
        await rejectCustodyRequest(req.id);
      }
      load();
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const visibleAssets = isAdminOrHR
    ? assets
    : assets.filter(a =>
      String(a.employee_id) === String(currentEmployee?.id) ||
      a.employee_name === currentEmployee?.name
    );

  const filteredAssets = visibleAssets.filter(a => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      a.name?.toLowerCase().includes(q) ||
      a.category_type?.toLowerCase().includes(q) ||
      a.classification?.toLowerCase().includes(q) ||
      (a.serial_no || a.serialNumber || a.serial_number)?.toLowerCase().includes(q);
    const matchStatus =
      !filterStatus ||
      a.state === filterStatus ||
      (filterStatus === "assigned" && a.state === "in_use");
    return matchSearch && matchStatus;
  });

  const pendingRequests = requests.filter(r => {
    const s = r.state || r.status || "";
    return s === "pending" || s === "under_review";
  });

  // Tab الطلبات: كل الطلبات (custody_requests + custody_returns مدمجين)
  const allRequestsAndReturns = [
    ...requests.map(r => ({ ...r, _source: "requests" })),
    ...returns.map(r => ({ ...r, _source: "returns" })),
  ];
  const myRequests = isAdminOrHR
    ? allRequestsAndReturns
    : allRequestsAndReturns.filter(r => String(r.employee_id) === String(currentEmployee?.id));

  const returnRequests = isAdminOrHR
    ? returns
    : returns.filter(r =>
      String(r.employee_id) === String(currentEmployee?.id)
    );

  const assetsPagination = usePagination(filteredAssets, 20);
  const requestsPagination = usePagination(myRequests, 20);
  const returnsPagination = usePagination(returnRequests, 20);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الأصول</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{assets.length} أصل مسجل</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
          >
            <Package className="w-4 h-4" /> طلب أصل
          </button>
          {isAdminOrHR && (
            <button
              onClick={() => { setEditAsset(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> إضافة أصل
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "إجمالي الأصول", value: assets.length, color: "text-foreground" },
          { label: "متاحة", value: assets.filter(a => a.state === "available").length, color: "text-green-600" },
          { label: "مخصصة", value: assets.filter(a => a.state === "assigned" || a.state === "in_use").length, color: "text-blue-600" },
          { label: "طلبات معلقة", value: pendingRequests.length, color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(isAdminOrHR
          ? [
            { id: "assets", label: "الأصول" },
            { id: "requests", label: `الطلبات${pendingRequests.length > 0 ? ` (${pendingRequests.length} معلق)` : ""}` },
            { id: "returns", label: "الإعادات" },
          ]
          : [
            { id: "assets", label: "الأصول" },
            { id: "requests", label: "طلباتي" },
            { id: "returns", label: "إعاداتي" },
          ]
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Assets Tab ────────────────────────────────────────────────────── */}
      {activeTab === "assets" && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث باسم الأصل، التصنيف، الرقم التسلسلي..."
                className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                ["", "الكل"],
                ["available", "متاح"],
                ["assigned", "مخصص"],
                ["maintenance", "صيانة"],
              ].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilterStatus(val)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filterStatus === val
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-muted"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {["اسم الأصل", "التصنيف", "الرقم التسلسلي", "الحالة الفعلية", "حالة الأصل", "مخصص لـ", "الإجراءات"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
                ) : filteredAssets.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">لا توجد أصول</td></tr>
                ) : assetsPagination.pageItems.map(asset => (
                  <tr key={asset.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{asset.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{categoryTypeLabel(asset.category_type)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {asset.serial_no || asset.serialNumber || asset.serial_number || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONDITION_COLORS[asset.actual_condition] || "bg-muted text-muted-foreground"}`}>
                        {conditionLabel(asset.actual_condition)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[asset.state] || "bg-muted text-muted-foreground"}`}>
                        {stateLabel(asset.state)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {asset.employee_name || asset.assigned_to_employee_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setHistoryModal(asset)}
                          title="السجل"
                          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {isAdminOrHR && (
                          <button
                            onClick={() => { setEditAsset(asset); setShowForm(true); }}
                            title="تعديل"
                            className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-secondary transition-colors"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination
              page={assetsPagination.page}
              totalPages={assetsPagination.totalPages}
              totalItems={assetsPagination.totalItems}
              pageSize={assetsPagination.pageSize}
              onPageChange={assetsPagination.setPage}
            />
          </div>
        </>
      )}

      {/* ── Requests Tab ──────────────────────────────────────────────────── */}
      {activeTab === "requests" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["الموظف", "الأصل", "السبب", "تاريخ الطلب", "الحالة", "الإجراءات"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myRequests.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">لا توجد طلبات</td></tr>
              ) : requestsPagination.pageItems.map(req => {
                const statusKey = req.state || req.status || "";
                const isPending = statusKey === "pending" || statusKey === "under_review";
                const isAccepted = statusKey === "accepted" || statusKey === "approved";
                return (
                  <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    {/* الموظف */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {req.employee_name || req.employee?.name || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.department || req.employee?.department_name || ""}
                      </p>
                    </td>
                    {/* الأصل */}
                    <td className="px-4 py-3 font-medium text-foreground">
                      {req.equipment_name || req.asset_name || req.equipment?.name || "—"}
                    </td>
                    {/* السبب */}
                    <td className="px-4 py-3 text-muted-foreground text-xs">{req.reason || "—"}</td>
                    {/* تاريخ الطلب */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {req.created_at
                        ? new Date(req.created_at).toLocaleDateString("ar-SA")
                        : req.request_date
                          ? new Date(req.request_date).toLocaleDateString("ar-SA")
                          : "—"}
                    </td>
                    {/* الحالة */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REQUEST_STATUS_COLORS[statusKey] || "bg-muted text-muted-foreground"}`}>
                        {requestStatusLabel(statusKey)}
                      </span>
                    </td>
                    {/* الإجراءات */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1 items-center">
                        {/* طلب إعادة → زرار تسجيل استلام */}
                        {isAdminOrHR && req._source === "returns" && isPending && (
                          <button
                            onClick={() => setReceiveModal(req)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200 transition-colors whitespace-nowrap"
                          >
                            <RotateCcw className="w-3 h-3" /> تسجيل استلام
                          </button>
                        )}
                        {/* طلب أصل عادي → قبول / رفض */}
                        {isAdminOrHR && req._source !== "returns" && isPending && (
                          <>
                            <button
                              onClick={() => handleAccept(req)}
                              className="p-1.5 hover:bg-green-50 text-green-600 rounded transition-colors"
                              title="قبول"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(req)}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
                              title="رفض"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {/* طلب مقبول → تسجيل تسليم */}
                        {isAdminOrHR && req._source !== "returns" && isAccepted && (
                          <button
                            onClick={() => setDeliverModal(req)}
                            className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors whitespace-nowrap"
                          >
                            تسجيل تسليم
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
      )}

      {/* ── Returns Tab ───────────────────────────────────────────────────── */}
      {activeTab === "returns" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["الموظف", "الأصل", "تاريخ الطلب", "الحالة", "الإجراءات"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {returnRequests.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">لا توجد إعادات</td></tr>
              ) : returnsPagination.pageItems.map(ret => {
                const statusKey = ret.state || ret.status || "";
                const isPendingReturn = statusKey === "pending" || statusKey === "under_review";
                return (
                  <tr key={ret.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {ret.employee_name || ret.employee?.name || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {ret.equipment_name || ret.asset_name || ret.equipment?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {ret.created_at
                        ? new Date(ret.created_at).toLocaleDateString("ar-SA")
                        : ret.request_date
                          ? new Date(ret.request_date).toLocaleDateString("ar-SA")
                          : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REQUEST_STATUS_COLORS[statusKey] || "bg-amber-100 text-amber-700"}`}>
                        {requestStatusLabel(statusKey) || "قيد المراجعة"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isAdminOrHR && isPendingReturn && (
                        <button
                          onClick={() => setReceiveModal(ret)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200 transition-colors whitespace-nowrap"
                        >
                          <RotateCcw className="w-3 h-3" /> تسجيل استلام
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <TablePagination
            page={returnsPagination.page}
            totalPages={returnsPagination.totalPages}
            totalItems={returnsPagination.totalItems}
            pageSize={returnsPagination.pageSize}
            onPageChange={returnsPagination.setPage}
          />
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showForm && (
        <AssetForm
          asset={editAsset}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); load(); }}
        />
      )}
      {showRequestModal && (
        <AssetRequestModal
          assets={assets}
          employees={employees}
          onClose={() => setShowRequestModal(false)}
          onSave={() => { setShowRequestModal(false); load(); }}
        />
      )}
      {deliverModal && (
        <CustodyDeliverModal
          request={deliverModal}
          employees={employees}
          onClose={() => setDeliverModal(null)}
          onSave={() => { setDeliverModal(null); load(); }}
        />
      )}
      {receiveModal && (
        <CustodyReceiveModal
          request={receiveModal}
          employees={employees}
          onClose={() => setReceiveModal(null)}
          onSave={() => { setReceiveModal(null); load(); }}
        />
      )}
      {historyModal && (
        <AssetHistoryModal asset={historyModal} onClose={() => setHistoryModal(null)} />
      )}
    </div>
  );
}
