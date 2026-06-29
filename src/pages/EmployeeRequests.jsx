import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Search, FileText, AlertTriangle, DollarSign, Briefcase, Package, CreditCard, Receipt } from "lucide-react";
import { base44 } from "@/api/base44Client";
import LeaveRequestModal from "../components/requests/LeaveRequestModal";
import ComplaintModal from "../components/requests/ComplaintModal";
import CustodyRequestModal from "../components/requests/CustodyRequestModal";
import CustodySettleModal from "../components/requests/CustodySettleModal";
import LoanRequestModal from "../components/requests/LoanRequestModal";
import ExpenseModal from "../components/requests/ExpenseModal";
import { getEmployees } from "@/api/departmentsApi";
import { getAllRequests, requestAction, sendToManager as apiSendToManager, managerApprove as apiManagerApprove } from "@/api/requestsApi"
import {getSalaryAdvances} from "@/api/salaryAdvancesApi";
import {getCustodyRequests} from "@/api/assetsApi"; 

const REQUEST_TYPES = [
  { type: "طلب إجازة", icon: FileText, color: "bg-blue-50 text-blue-700 border-blue-200", modal: "leave" },
  { type: "تقديم شكوى", icon: AlertTriangle, color: "bg-red-50 text-red-700 border-red-200", modal: "complaint" },
  { type: "تقديم اعتراض", icon: AlertTriangle, color: "bg-amber-50 text-amber-700 border-amber-200", modal: "objection" },
  // { type: "طلب عهدة", icon: Briefcase, color: "bg-purple-50 text-purple-700 border-purple-200", modal: "custody" },
  // { type: "تصفية عهدة", icon: Package, color: "bg-orange-50 text-orange-700 border-orange-200", modal: "settle" },
  // { type: "طلب سلفة", icon: CreditCard, color: "bg-teal-50 text-teal-700 border-teal-200", modal: "loan" },
  { type: "طلب بدل", icon: DollarSign, color: "bg-green-50 text-green-700 border-green-200", modal: "expense" },
  { type: "رفع مصروف/فاتورة", icon: Receipt, color: "bg-indigo-50 text-indigo-700 border-indigo-200", modal: "expense" },
];
const normalizeStatus = (status) => {
  switch (status) {
    case "under_review":
      return "قيد المراجعة";
    case "waiting_manager_approval":
      return "انتظار موافقة المدير";
    case "accepted":
      return "مقبولة";
    case "rejected":
      return "مرفوضة";
    case "hr_under_review":
      return "قيد مراجعة HR";
    default:
      return status;
  }
};

const normalizeLoanStatus = (state) => {
  switch (state) {
    case "waiting_manager":
      return "انتظار موافقة المدير";

    case "waiting_hr":
      return "انتظار موافقة الموارد البشرية";

    case "approved":
      return "معتمد";

    case "certified":
      return "مُعتمد نهائيًا";

    case "rejected":
      return "مرفوض";

    default:
      return state;
  }
};
const STATUS_COLORS = {
  "انتظار موافقة المدير": "bg-purple-100 text-purple-700",
  "قيد المراجعة": "bg-amber-100 text-amber-700",
  "قيد مراجعة HR": "bg-blue-100 text-blue-700",
  "مقبولة": "bg-green-100 text-green-700",
  "مرفوضة": "bg-red-100 text-red-600",
};

export default function EmployeeRequests() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [custodies, setCustodies] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // { type, requestType }
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("requests");

 const load = async () => {
 const [reqs, emps, custodyRes, loanRes] = await Promise.all([
  getAllRequests(),
  getEmployees(),
  getCustodyRequests(),
  getSalaryAdvances(),
]);

setRequests(reqs?.data || []);
setEmployees(emps?.data || emps?.employees || emps || []);
console.log("custodyRes full:", custodyRes);
setCustodies(custodyRes || custodyRes?.data || []);
setLoans(loanRes?.data || []);

 
  setLoading(false);
};
  useEffect(() => { load(); }, []);

  const sendToManager = async (id) => {
    try {
      await apiSendToManager(id);
      load();
    } catch (err) {
      console.error(err?.response?.data || err);
      load(); // refresh anyway in case it partially worked
    }
  };

  const managerApprove = async (id) => {
    try {
      await apiManagerApprove(id);
      load();
    } catch (err) {
      console.error(err?.response?.data || err);
      alert("حصل خطأ");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const action = status === "مقبولة" ? "accept" : "reject";

      await requestAction(id, action);

      // optional: refresh data
      load();
    } catch (err) {
      console.error(err);
      alert("حصل خطأ في تحديث الحالة");
    }
  };

  const settleCustody = async (custodyId) => {
    await base44.entities.Custody.update(custodyId, {
      status: "مُرجَعة",
      actual_return_date: new Date().toISOString().slice(0, 10)
    });
    load();
  };

  const openModal = (modalType, requestType) => setActiveModal({ type: modalType, requestType });
  const closeModal = () => setActiveModal(null);
  const onRequestSaved = () => { closeModal(); load(); };

  const filtered = requests
    .map(r => ({ ...r, _normalizedStatus: normalizeStatus(r.state || r.status || "") }))
    .filter(r => !filterStatus || r._normalizedStatus === filterStatus)
    .filter(r => !search || r.request_type?.includes(search) || r.employee_name?.includes(search))
    .sort((a, b) => {
      const dateA = new Date(b.created_at || b.date_of_submission || b.created || 0);
      const dateB = new Date(a.created_at || a.date_of_submission || a.created || 0);
      if (dateA - dateB !== 0) return dateA - dateB;
      return (b.id || 0) - (a.id || 0); // fallback by ID (bigger = newer)
    });

const activeCustodies = custodies.filter(
  c => c.state !== "rejected"
);
 console.log("  العهد" ,activeCustodies)
const activeLoans = loans;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">طلبات الموظفين</h1>
        <p className="text-sm text-muted-foreground mt-0.5">إدارة ومتابعة جميع طلبات الموظفين</p>
      </div>

      {/* Request Type Buttons */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">الطلبات المتاحة</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 justify-center ">
          {REQUEST_TYPES.map(({ type, icon: Icon, color, modal }) => (
            <button key={type} onClick={() => openModal(modal, type)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center hover:shadow-sm transition-all ${color}`}>
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium leading-tight">{type}</span>
            </button>
          ))}

        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "requests", label: `الطلبات (${requests.length})` },
          { id: "custodies", label: `العهد النشطة (${activeCustodies.length})` },
          { id: "loans", label: `السلف النشطة (${activeLoans.length})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "requests" && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بنوع الطلب أو الموظف..."
                className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
            <div className="flex gap-2">
              {[["", "الكل"], ["انتظار موافقة المدير", "انتظار المدير"], ["قيد المراجعة", "قيد المراجعة"], ["قيد مراجعة HR", "قيد HR"], ["مقبولة", "مقبولة"], ["مرفوضة", "مرفوضة"]].map(([val, label]) => (
                <button key={val} onClick={() => setFilterStatus(val)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === val ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {["اسم الموظف", "نوع الطلب", "تاريخ التقديم", "المبلغ", "الحالة", "الإجراءات"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">لا توجد بيانات</td></tr>
                ) :
                  filtered.map(req => {
                    const status = req._normalizedStatus || normalizeStatus(req.state || req.status || "");

                    return (
                      <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/20">

                        {/* Employee */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{req.employee || "—"}</p>
                          <p className="text-xs text-muted-foreground">{req.department || ""}</p>
                        </td>

                        {/* Request Type */}
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded-full font-medium">
                            {req.request_type || "—"}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {req.date_of_submission
                            ? new Date(req.date_of_submission).toLocaleDateString("ar-SA")
                            : "—"}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-foreground text-sm">
                          {req.amount && req.amount !== "—" && req.amount > 0
                            ? `${Number(req.amount).toLocaleString("ar-SA")} ر.س`
                            : "—"}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {status}
                          </span>
                        </td>

                        {/* Actions */}
                     {/* Actions */}
{/* Actions */}
<td className="px-4 py-3">
  <div className="flex flex-wrap gap-1 items-center">

    {/* الطلب في انتظار موافقة المدير */}
    {status === "انتظار موافقة المدير" ? (
      <>
        <button
          onClick={() => managerApprove(req.id)}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium hover:bg-blue-200"
        >
          ✓ اعتماد المدير
        </button>

        <button
          onClick={() => updateStatus(req.id, "مرفوضة")}
          title="رفض"
          className="p-1.5 hover:bg-red-50 text-red-500 rounded"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </>
    ) : !["مقبولة", "مرفوضة"].includes(status) ? (
      <>
        {/* رفض */}
        <button
          onClick={() => updateStatus(req.id, "مرفوضة")}
          title="رفض"
          className="p-1.5 hover:bg-red-50 text-red-500 rounded"
        >
          <XCircle className="w-4 h-4" />
        </button>

        {/* قبول */}
        <button
          onClick={() => updateStatus(req.id, "مقبولة")}
          title="قبول"
          className="p-1.5 hover:bg-green-50 text-green-600 rounded"
        >
          <CheckCircle className="w-4 h-4" />
        </button>

        {/* أحل للمدير */}
        {status === "قيد المراجعة" && (
          <button
            onClick={() => sendToManager(req.id)}
            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium hover:bg-purple-200"
          >
            ⟳ أحل للمدير
          </button>
        )}
      </>
    ) : null}

  </div>
</td>

                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "custodies" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["الموظف", "العهدة", "الرقم التسلسلي", "السبب", "تاريخ الإصدار", "الحالة"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeCustodies.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">لا توجد عهد نشطة</td></tr>
              ) : activeCustodies.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{c.department}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{c.equipment_name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{c.name || "—"}</td>
                  <td className="px-4 py-3 text-purple-600 font-semibold">{c.reason}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.request_date ? new Date(c.request_date).toLocaleDateString("ar-SA") : "—"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{c.state_label}</span>
                  </td>
                  {/* <td className="px-4 py-3">
                    <button onClick={() => settleCustody(c.id)}
                      className="text-xs px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium">
                      تصفية
                    </button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "loans" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["الموظف", "مبلغ السلفة", "المسدَّد", "المتبقي", "الخصم الشهري", "تاريخ الإصدار", "الحالة"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeLoans.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">لا توجد سلف نشطة</td></tr>
              ) : activeLoans.map(l => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{l.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{l.department}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">{l.amount?.toLocaleString("ar-SA")} ر.س</td>
                  <td className="px-4 py-3 text-green-600">{l.total_paid?.toLocaleString("ar-SA")} ر.س</td>
                  <td className="px-4 py-3 text-red-600 font-semibold">{l.remaining_amount?.toLocaleString("ar-SA")} ر.س</td>
                  <td className="px-4 py-3 text-amber-600">{l.installment_amount?.toLocaleString("ar-SA")} ر.س/شهر</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{l.start_date? new Date(l.start_date).toLocaleDateString("ar-SA") : "—"}</td>
                  <td className="px-4 py-3">
               <span
  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
    l.state === "rejected"
      ? "bg-red-100 text-red-700"
      : l.state === "waiting_manager"
      ? "bg-purple-100 text-purple-700"
      : l.state === "waiting_hr"
      ? "bg-blue-100 text-blue-700"
      : l.state === "approved"
      ? "bg-green-100 text-green-700"
      : "bg-teal-100 text-teal-700"
  }`}
>
  {normalizeLoanStatus(l.state)}
</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {activeModal?.type === "leave" && <LeaveRequestModal employees={employees} onSave={onRequestSaved} onClose={closeModal} />}
      {(activeModal?.type === "complaint" || activeModal?.type === "objection") && (
        <ComplaintModal requestType={activeModal.requestType} employees={employees} onSave={onRequestSaved} onClose={closeModal} />
      )}
      {activeModal?.type === "custody" && <CustodyRequestModal employees={employees} onSave={onRequestSaved} onClose={closeModal} />}
      {activeModal?.type === "settle" && <CustodySettleModal employees={employees} custodies={custodies} onSave={onRequestSaved} onClose={closeModal} />}
      {activeModal?.type === "loan" && <LoanRequestModal employees={employees} onSave={onRequestSaved} onClose={closeModal} />}
      {activeModal?.type === "expense" && <ExpenseModal requestType={activeModal.requestType} employees={employees} onSave={onRequestSaved} onClose={closeModal} />}
    </div>
  );
}