import { useState, useEffect } from "react";
import { Plus, X, Save, ChevronRight, ChevronDown, Edit2, ToggleLeft, ToggleRight, BookOpen } from "lucide-react";
import {
  createAccount,
  updateAccount,
  getAccounts,
} from "@/api/accountingApi";
import { useToast } from "@/components/ui/use-toast";

// ====== أنواع الحسابات زي ما هي موثقة في الباك إند (قيمة إنجليزية → تسمية عربية) ======
const ACCOUNT_TYPES = {
  asset_receivable: "ذمم مدينة",
  asset_cash: "بنوك ونقدية",
  asset_current: "أصول متداولة",
  asset_non_current: "أصول غير متداولة",
  asset_prepayments: "مصروفات مقدمة",
  asset_fixed: "أصول ثابتة",
  liability_payable: "ذمم دائنة",
  liability_credit_card: "بطاقة ائتمان",
  liability_current: "التزامات متداولة",
  liability_non_current: "التزامات غير متداولة",
  equity: "حقوق ملكية",
  equity_unaffected: "أرباح السنة الحالية",
  income: "إيرادات",
  income_other: "إيرادات أخرى",
  expense: "مصروفات",
  expense_depreciation: "إهلاك",
  expense_direct_cost: "تكلفة الإيرادات",
  off_balance: "خارج الميزانية",
};

// تجميع كل نوع حساب تحت مجموعة رئيسية (للعرض والتلوين فقط)
const ACCOUNT_TYPE_GROUPS = {
  asset_receivable: "أصول", asset_cash: "أصول", asset_current: "أصول",
  asset_non_current: "أصول", asset_prepayments: "أصول", asset_fixed: "أصول",
  liability_payable: "التزامات", liability_credit_card: "التزامات",
  liability_current: "التزامات", liability_non_current: "التزامات",
  equity: "حقوق الملكية", equity_unaffected: "حقوق الملكية",
  income: "إيرادات", income_other: "إيرادات",
  expense: "مصروفات", expense_depreciation: "مصروفات", expense_direct_cost: "مصروفات",
  off_balance: "أخرى",
};

const GROUPS = ["أصول", "التزامات", "حقوق الملكية", "إيرادات", "مصروفات", "أخرى"];

const GROUP_COLORS = {
  "أصول": "bg-blue-100 text-blue-700",
  "التزامات": "bg-red-100 text-red-600",
  "حقوق الملكية": "bg-purple-100 text-purple-700",
  "إيرادات": "bg-green-100 text-green-700",
  "مصروفات": "bg-amber-100 text-amber-700",
  "أخرى": "bg-gray-100 text-gray-600",
};

function AccountForm({ account, onSave, onClose }) {
  const [form, setForm] = useState({
    account_code: "", account_name: "", account_name_en: "",
    account_type: "asset_current", is_active: true,
    ...(account || {}),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setError("");
    try {
      setSaving(true);

      const payload = {
        code: form.account_code,
        name_ar: form.account_name,
        name_en: form.account_name_en,
        account_type: form.account_type,
        active: form.is_active,
      };

      if (account?.id) {
        await updateAccount(account.id, payload);
      } else {
        await createAccount(payload);
      }

      onSave();
    } catch (err) {
      console.error("خطأ أثناء حفظ الحساب:", err);
      setError(err?.response?.data?.message || "حصل خطأ أثناء حفظ الحساب، حاول تاني.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" />{account ? "تعديل حساب" : "حساب جديد"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">رقم الحساب *</label>
              <input value={form.account_code} onChange={e => set("account_code", e.target.value)} dir="ltr"
                placeholder="101" className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">نوع الحساب *</label>
              <select value={form.account_type} onChange={e => set("account_type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                {GROUPS.map(group => (
                  <optgroup key={group} label={group}>
                    {Object.entries(ACCOUNT_TYPES)
                      .filter(([value]) => ACCOUNT_TYPE_GROUPS[value] === group)
                      .map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">اسم الحساب (عربي) *</label>
            <input value={form.account_name} onChange={e => set("account_name", e.target.value)}
              placeholder="النقدية والبنوك" className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">اسم الحساب (إنجليزي)</label>
            <input value={form.account_name_en} onChange={e => set("account_name_en", e.target.value)} dir="ltr"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-sm">نشط</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.account_code || !form.account_name}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "حفظ..." : "حفظ الحساب"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChartOfAccounts() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(
    Object.fromEntries(GROUPS.map(g => [g, true]))
  );
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);

      const data = await getAccounts();

      const mapped = data.map((item) => ({
        id: item.id,
        account_code: item.code,
        account_name: item.name_ar,
        account_name_en: item.name_en,
        account_type: item.account_type,
        is_active: item.active,
      }));

      setAccounts(mapped);
    } catch (err) {
      console.error("خطأ أثناء تحميل الحسابات:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (acc) => {
    try {
      await updateAccount(acc.id, {
        active: !acc.is_active,
      });
      await load();
    } catch (err) {
      console.error("خطأ أثناء تغيير حالة الحساب:", err);
      toast({
        title: "تعذّر تغيير حالة الحساب",
        description: err?.response?.data?.message || "حصل خطأ أثناء الاتصال بالسيرفر، حاول تاني.",
        variant: "destructive",
      });
    }
  };

  const filtered = search
    ? accounts.filter(a => a.account_code?.includes(search) || a.account_name?.includes(search))
    : accounts;

  const getGroupAccounts = (group) => filtered.filter(a => (ACCOUNT_TYPE_GROUPS[a.account_type] || "أخرى") === group);

  const renderAccount = (acc) => (
    <div key={acc.id} className={`flex items-center gap-2 py-2 px-3 hover:bg-muted/30 rounded-lg transition-colors ${!acc.is_active ? "opacity-50" : ""}`}>
      <span className="text-xs text-muted-foreground font-mono w-16 flex-shrink-0" dir="ltr">{acc.account_code}</span>
      <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      <span className="flex-1 text-sm font-medium text-foreground">{acc.account_name}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${GROUP_COLORS[ACCOUNT_TYPE_GROUPS[acc.account_type] || "أخرى"]}`}>
        {ACCOUNT_TYPES[acc.account_type] || acc.account_type}
      </span>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => { setEditAccount(acc); setShowForm(true); }} className="p-1 hover:bg-primary/10 rounded text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => toggleActive(acc)} className={`p-1 rounded ${acc.is_active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"}`}>
          {acc.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary" />دليل الحسابات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">شجرة الحسابات المحاسبية</p>
        </div>
        <button onClick={() => { setEditAccount(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" />حساب جديد
        </button>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {GROUPS.map(group => {
          const count = getGroupAccounts(group).length;
          return (
            <div key={group} className={`rounded-xl border p-3 text-center cursor-pointer hover:shadow-md transition-all ${GROUP_COLORS[group]} border-transparent`}
              onClick={() => setExpandedGroups(e => ({ ...e, [group]: !e[group] }))}>
              <p className="text-lg font-bold">{count}</p>
              <p className="text-xs font-medium">{group}</p>
            </div>
          );
        })}
      </div>

      <div className="relative">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث برقم أو اسم الحساب..."
          className="w-full max-w-xs px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" dir="rtl" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-2 space-y-1">
          {accounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">لا توجد حسابات بعد — ابدأ بإضافة حساب جديد</p>
            </div>
          ) : GROUPS.map(group => {
            const groupAccounts = getGroupAccounts(group);
            if (groupAccounts.length === 0 && !search) return null;
            return (
              <div key={group}>
                <button onClick={() => setExpandedGroups(e => ({ ...e, [group]: !e[group] }))}
                  className="flex items-center gap-2 w-full px-3 py-2 font-bold text-sm rounded-lg hover:bg-muted/50">
                  {expandedGroups[group] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${GROUP_COLORS[group]}`}>{group}</span>
                  <span className="text-muted-foreground text-xs">({groupAccounts.length} حساب)</span>
                </button>
                {expandedGroups[group] && (
                  <div className="mr-2">
                    {groupAccounts.map(acc => renderAccount(acc))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <AccountForm
          account={editAccount}
          onSave={() => {
            setShowForm(false);
            setEditAccount(null);
            load();
          }}
          onClose={() => {
            setShowForm(false);
            setEditAccount(null);
          }}
        />
      )}
    </div>
  );
}
