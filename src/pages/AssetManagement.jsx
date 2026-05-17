import { useState, useEffect } from "react";
import { Plus, Search, Package, History, CheckCircle, XCircle, Wrench, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRole } from "../lib/useRole";
import AssetForm from "../components/assets/AssetForm";
import AssetRequestModal from "../components/assets/AssetRequestModal";
import AssetDeliveryModal from "../components/assets/AssetDeliveryModal";
import AssetReturnModal from "../components/assets/AssetReturnModal";
import AssetHistoryModal from "../components/assets/AssetHistoryModal";

const STATUS_COLORS = {
  "متاح": "bg-green-100 text-green-700",
  "مخصص": "bg-blue-100 text-blue-700",
  "صيانة": "bg-amber-100 text-amber-700",
};

const CONDITION_COLORS = {
  "جديد": "bg-emerald-100 text-emerald-700",
  "جيد": "bg-sky-100 text-sky-700",
  "تالف": "bg-red-100 text-red-700",
};

const REQUEST_STATUS_COLORS = {
  "قيد المراجعة": "bg-amber-100 text-amber-700",
  "مقبول": "bg-blue-100 text-blue-700",
  "مرفوض": "bg-red-100 text-red-700",
  "منجز": "bg-green-100 text-green-700",
};

export default function AssetManagement() {
  const { role, user } = useRole();
  const isAdminOrHR = ["admin", "hr"].includes(role);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("assets");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [deliveryModal, setDeliveryModal] = useState(null); // assetRequest
  const [returnModal, setReturnModal] = useState(null); // assetRequest
  const [historyModal, setHistoryModal] = useState(null); // asset

  const load = async () => {
    setLoading(true);
    const me = await base44.auth.me();
    setCurrentUser(me);
    const [a, r, e, emps] = await Promise.all([
      base44.entities.Asset.list("-created_date"),
      base44.entities.AssetRequest.list("-created_date"),
      base44.entities.Employee.filter({ status: "نشط" }),
      base44.entities.Employee.filter({ status: "نشط" }),
    ]);
    // Find current employee record by email
    const myEmp = emps.find(emp => emp.email === me?.email);
    setCurrentEmployee(myEmp || null);
    setAssets(a); setRequests(r); setEmployees(e);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApproveRequest = async (req) => {
    const me = await base44.auth.me();
    await base44.entities.AssetRequest.update(req.id, {
      status: "مقبول",
      reviewed_by: me.full_name || me.email,
      review_date: new Date().toISOString().slice(0, 10),
    });
    setDeliveryModal({ ...req, status: "مقبول", reviewed_by: me.full_name || me.email });
    load();
  };

  const handleRejectRequest = async (reqId) => {
    const me = await base44.auth.me();
    await base44.entities.AssetRequest.update(reqId, {
      status: "مرفوض",
      reviewed_by: me.full_name || me.email,
      review_date: new Date().toISOString().slice(0, 10),
    });
    load();
  };

  const handleDeliveryDone = async (reqId, deliveryData) => {
    const req = requests.find(r => r.id === reqId) || deliveryModal;
    const me = await base44.auth.me();
    // Update request
    await base44.entities.AssetRequest.update(reqId, {
      status: "منجز",
      ...deliveryData,
    });
    // Update asset status
    await base44.entities.Asset.update(req.asset_id, {
      status: "مخصص",
      assigned_to_employee_id: req.employee_id,
      assigned_to_employee_name: req.employee_name,
      assigned_date: deliveryData.delivery_date || new Date().toISOString().slice(0, 10),
      delivered_by: deliveryData.delivered_by,
      condition_at_delivery: deliveryData.condition_at_delivery,
      history: [
        ...(assets.find(a => a.id === req.asset_id)?.history || []),
        { action: "تخصيص", performed_by: deliveryData.delivered_by, date: deliveryData.delivery_date || new Date().toISOString().slice(0, 10), notes: `مخصص لـ ${req.employee_name}` }
      ]
    });
    setDeliveryModal(null);
    load();
  };

  const handleReturnDone = async (reqId, returnData) => {
    const req = requests.find(r => r.id === reqId) || returnModal;
    // Update request
    await base44.entities.AssetRequest.update(reqId, { status: "منجز", ...returnData });
    // Update asset back to available
    const asset = assets.find(a => a.id === req.asset_id);
    await base44.entities.Asset.update(req.asset_id, {
      status: "متاح",
      assigned_to_employee_id: "",
      assigned_to_employee_name: "",
      assigned_date: "",
      condition: returnData.condition_at_return || asset?.condition,
      history: [
        ...(asset?.history || []),
        { action: "إعادة", performed_by: returnData.received_by, date: returnData.return_date || new Date().toISOString().slice(0, 10), notes: returnData.notes || "" }
      ]
    });
    setReturnModal(null);
    load();
  };

  // Non-admin/HR users see only their own assigned assets
  const visibleAssets = isAdminOrHR
    ? assets
    : assets.filter(a => a.assigned_to_employee_id === currentEmployee?.id || a.assigned_to_employee_name === currentEmployee?.full_name_ar);

  const filteredAssets = visibleAssets.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search || a.asset_name?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q) || a.serial_number?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingRequests = requests.filter(r => r.status === "قيد المراجعة");
  // Non-admin/HR users see only their own requests
  const myRequests = isAdminOrHR
    ? requests.filter(r => r.request_type === "طلب أصل")
    : requests.filter(r => r.request_type === "طلب أصل" && (r.employee_id === currentEmployee?.id || r.employee_name === currentEmployee?.full_name_ar));
  const returnRequests = isAdminOrHR
    ? requests.filter(r => r.request_type === "إعادة أصل")
    : requests.filter(r => r.request_type === "إعادة أصل" && (r.employee_id === currentEmployee?.id || r.employee_name === currentEmployee?.full_name_ar));

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الأصول</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{assets.length} أصل مسجل</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
            <Package className="w-4 h-4" /> طلب أصل
          </button>
          {isAdminOrHR && (
            <button onClick={() => { setEditAsset(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> إضافة أصل
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "إجمالي الأصول", value: assets.length, color: "text-foreground" },
          { label: "متاحة", value: assets.filter(a => a.status === "متاح").length, color: "text-green-600" },
          { label: "مخصصة", value: assets.filter(a => a.status === "مخصص").length, color: "text-blue-600" },
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
              { id: "requests", label: `الطلبات ${pendingRequests.length > 0 ? `(${pendingRequests.length} معلق)` : ""}` },
              { id: "returns", label: "الإعادات" },
            ]
          : [
              { id: "assets", label: "الأصول" },
              { id: "delivered", label: "عهدي المُسلَّمة" },
              { id: "returned", label: "عهدي المُستلَمة" },
            ]
        ).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assets Tab */}
      {activeTab === "assets" && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث باسم الأصل، التصنيف، الرقم التسلسلي..."
                className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
            <div className="flex gap-2">
              {[["", "الكل"], ["متاح", "متاح"], ["مخصص", "مخصص"], ["صيانة", "صيانة"]].map(([val, label]) => (
                <button key={val} onClick={() => setFilterStatus(val)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filterStatus === val ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}>
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
                ) : filteredAssets.map(asset => (
                  <tr key={asset.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{asset.asset_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{asset.category}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{asset.serial_number || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONDITION_COLORS[asset.condition] || "bg-muted text-muted-foreground"}`}>
                        {asset.condition || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[asset.status] || "bg-muted text-muted-foreground"}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{asset.assigned_to_employee_name || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setHistoryModal(asset)} title="السجل"
                          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors">
                          <History className="w-4 h-4" />
                        </button>
                        {isAdminOrHR && (
                          <>
                            <button onClick={() => { setEditAsset(asset); setShowForm(true); }} title="تعديل"
                              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-secondary transition-colors">
                              <Wrench className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Requests Tab */}
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
              ) : myRequests.map(req => (
                <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{req.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{req.department}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{req.asset_name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{req.reason || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {req.created_date ? new Date(req.created_date).toLocaleDateString("ar-SA") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REQUEST_STATUS_COLORS[req.status] || "bg-muted text-muted-foreground"}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {isAdminOrHR && req.status === "قيد المراجعة" && (
                        <>
                          <button onClick={() => handleApproveRequest(req)}
                            className="p-1.5 hover:bg-green-50 text-green-600 rounded transition-colors" title="قبول">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRejectRequest(req.id)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors" title="رفض">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {isAdminOrHR && req.status === "مقبول" && (
                        <button onClick={() => setDeliveryModal(req)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium hover:bg-blue-200">
                          تسجيل تسليم
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Returns Tab (admin/HR) */}
      {activeTab === "returns" && isAdminOrHR && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["الموظف", "الأصل", "الحالة", "تاريخ الطلب", "الإجراءات"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {returnRequests.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">لا توجد طلبات إعادة</td></tr>
              ) : returnRequests.map(req => (
                <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-foreground">{req.employee_name}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{req.asset_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REQUEST_STATUS_COLORS[req.status] || "bg-muted text-muted-foreground"}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {req.created_date ? new Date(req.created_date).toLocaleDateString("ar-SA") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {req.status === "قيد المراجعة" && (
                      <button onClick={() => setReturnModal(req)}
                        className="flex items-center gap-1 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded font-medium hover:bg-orange-200">
                        <RotateCcw className="w-3 h-3" /> تسجيل استلام
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delivered Custodies Tab (non-admin/HR) */}
      {activeTab === "delivered" && !isAdminOrHR && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">الأصول المخصصة لك حالياً</p>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {["اسم الأصل", "النوع", "الرقم التسلسلي", "تاريخ التخصيص", "سُلِّم بواسطة", "الحالة"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleAssets.filter(a => a.status === "مخصص").length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">لا توجد عهد مسلَّمة</td></tr>
                ) : visibleAssets.filter(a => a.status === "مخصص").map(asset => (
                  <tr key={asset.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{asset.asset_name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{asset.asset_type}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{asset.serial_number || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {asset.assigned_date ? new Date(asset.assigned_date).toLocaleDateString("ar-SA") : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{asset.delivered_by || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">مسلَّمة ✓</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Returned Custodies Tab (non-admin/HR) */}
      {activeTab === "returned" && !isAdminOrHR && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">الأصول التي أعدتها سابقاً</p>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {["اسم الأصل", "نوع الأصل", "تاريخ الطلب", "الحالة"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {returnRequests.filter(r => r.status === "منجز").length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">لا توجد عهد مستلَمة</td></tr>
                ) : returnRequests.filter(r => r.status === "منجز").map(req => (
                  <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{req.asset_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{req.asset_category || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {req.created_date ? new Date(req.created_date).toLocaleDateString("ar-SA") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">مُستلَمة ✓</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <AssetForm asset={editAsset} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); load(); }} />
      )}
      {showRequestModal && (
        <AssetRequestModal assets={assets.filter(a => a.status === "متاح")} employees={employees}
          onClose={() => setShowRequestModal(false)} onSave={() => { setShowRequestModal(false); load(); }} />
      )}
      {deliveryModal && (
        <AssetDeliveryModal request={deliveryModal} employees={employees} onClose={() => setDeliveryModal(null)}
          onSave={(data) => handleDeliveryDone(deliveryModal.id, data)} />
      )}
      {returnModal && (
        <AssetReturnModal request={returnModal} assets={assets} employees={employees} onClose={() => setReturnModal(null)}
          onSave={(data) => handleReturnDone(returnModal.id, data)} />
      )}
      {historyModal && (
        <AssetHistoryModal asset={historyModal} onClose={() => setHistoryModal(null)} />
      )}
    </div>
  );
}