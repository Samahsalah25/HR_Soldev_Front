import { useState, useEffect } from "react";
import { Plus, X, Save, ChevronRight, ChevronDown, Edit2, ToggleLeft, ToggleRight, BookOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TYPE_COLORS = {
  "أصول": "bg-blue-100 text-blue-700",
  "التزامات": "bg-red-100 text-red-600",
  "حقوق الملكية": "bg-purple-100 text-purple-700",
  "إيرادات": "bg-green-100 text-green-700",
  "مصروفات": "bg-amber-100 text-amber-700",
};

const DEFAULT_NORMAL_BALANCE = {
  "أصول": "مدين", "مصروفات": "مدين",
  "التزامات": "دائن", "حقوق الملكية": "دائن", "إيرادات": "دائن"
};

function AccountForm({ account, accounts, onSave, onClose }) {
  const [form, setForm] = useState({
    account_code: "", account_name: "", account_name_en: "",
    account_type: "أصول", account_category: "أصول متداولة",
    parent_account_id: "", parent_account_code: "", level: 1,
    is_parent: false, normal_balance: "مدين",
    opening_balance: 0, opening_balance_type: "مدين",
    is_active: true, notes: "",
    ...(account || {})
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleTypeChange = (type) => {
    set("account_type", type);
    set("normal_balance", DEFAULT_NORMAL_BALANCE[type] || "مدين");
  };

  const handleParentSelect = (id) => {
    const parent = accounts.find(a => a.id === id);
    if (parent) {
      set("parent_account_id", id);
      set("parent_account_code", parent.account_code);
      set("level", (parent.level || 1) + 1);
      set("account_type", parent.account_type);
      set("normal_balance", DEFAULT_NORMAL_BALANCE[parent.account_type] || "مدين");
    } else {
      set("parent_account_id", "");
      set("parent_account_code", "");
      set("level", 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    if (account?.id) await base44.entities.AccountChart.update(account.id, form);
    else await base44.entities.AccountChart.create(form);
    onSave();
  };

  const CATEGORIES = {
    "أصول": ["أصول متداولة","أصول ثابتة","أصول أخرى"],
    "التزامات": ["التزامات متداولة","التزامات طويلة الأجل"],
    "حقوق الملكية": ["رأس المال"],
    "إيرادات": ["إيرادات تشغيلية","إيرادات أخرى"],
    "مصروفات": ["مصروفات تشغيلية","مصروفات إدارية","مصروفات مالية","أخرى"],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" />{account ? "تعديل حساب" : "حساب جديد"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">رقم الحساب *</label>
              <input value={form.account_code} onChange={e => set("account_code", e.target.value)} dir="ltr"
                placeholder="101" className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">نوع الحساب *</label>
              <select value={form.account_type} onChange={e => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                {["أصول","التزامات","حقوق الملكية","إيرادات","مصروفات"].map(t => <option key={t}>{t}</option>)}
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">التصنيف الفرعي</label>
              <select value={form.account_category} onChange={e => set("account_category", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                {(CATEGORIES[form.account_type] || []).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الرصيد الطبيعي</label>
              <select value={form.normal_balance} onChange={e => set("normal_balance", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option>مدين</option><option>دائن</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">الحساب الأب</label>
            <select value={form.parent_account_id} onChange={e => handleParentSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option value="">حساب رئيسي (بدون أب)</option>
              {accounts.filter(a => a.id !== account?.id && a.is_parent).map(a => (
                <option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الرصيد الافتتاحي</label>
              <input type="number" min={0} value={form.opening_balance} onChange={e => set("opening_balance", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">نوع الرصيد الافتتاحي</label>
              <select value={form.opening_balance_type} onChange={e => set("opening_balance_type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option>مدين</option><option>دائن</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_parent} onChange={e => set("is_parent", e.target.checked)} className="w-4 h-4 accent-primary" />
              <span className="text-sm">حساب أب (لا يقبل قيوداً)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} className="w-4 h-4 accent-primary" />
              <span className="text-sm">نشط</span>
            </label>
          </div>
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
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [expandedTypes, setExpandedTypes] = useState({ "أصول": true, "التزامات": true, "حقوق الملكية": true, "إيرادات": true, "مصروفات": true });
  const [search, setSearch] = useState("");

  const load = async () => {
    const accs = await base44.entities.AccountChart.list("account_code");
    setAccounts(accs);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (acc) => {
    await base44.entities.AccountChart.update(acc.id, { is_active: !acc.is_active });
    load();
  };

  const TYPES = ["أصول", "التزامات", "حقوق الملكية", "إيرادات", "مصروفات"];

  const filtered = search
    ? accounts.filter(a => a.account_code?.includes(search) || a.account_name?.includes(search))
    : accounts;

  const getChildren = (parentId) => filtered.filter(a => a.parent_account_id === parentId);
  const getRoots = (type) => filtered.filter(a => a.account_type === type && !a.parent_account_id);

  const renderAccount = (acc, depth = 0) => {
    const children = getChildren(acc.id);
    return (
      <div key={acc.id}>
        <div className={`flex items-center gap-2 py-2 px-3 hover:bg-muted/30 rounded-lg transition-colors ${!acc.is_active ? "opacity-50" : ""}`}
          style={{ paddingRight: `${depth * 20 + 12}px` }}>
          <span className="text-xs text-muted-foreground font-mono w-16 flex-shrink-0" dir="ltr">{acc.account_code}</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-sm font-medium text-foreground">{acc.account_name}</span>
          {acc.is_parent && <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">أب</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[acc.account_type]}`}>{acc.account_category || acc.account_type}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${acc.normal_balance === "مدين" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>{acc.normal_balance}</span>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => { setEditAccount(acc); setShowForm(true); }} className="p-1 hover:bg-primary/10 rounded text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => toggleActive(acc)} className={`p-1 rounded ${acc.is_active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"}`}>
              {acc.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        {children.map(child => renderAccount(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary" />دليل الحسابات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">شجرة الحسابات المحاسبية متعددة المستويات</p>
        </div>
        <button onClick={() => { setEditAccount(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" />حساب جديد
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {TYPES.map(type => {
          const count = accounts.filter(a => a.account_type === type).length;
          return (
            <div key={type} className={`rounded-xl border p-3 text-center cursor-pointer hover:shadow-md transition-all ${TYPE_COLORS[type]} border-transparent`}
              onClick={() => setExpandedTypes(e => ({ ...e, [type]: !e[type] }))}>
              <p className="text-lg font-bold">{count}</p>
              <p className="text-xs font-medium">{type}</p>
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
          ) : TYPES.map(type => {
            const roots = getRoots(type);
            if (roots.length === 0 && !search) return null;
            return (
              <div key={type}>
                <button onClick={() => setExpandedTypes(e => ({ ...e, [type]: !e[type] }))}
                  className="flex items-center gap-2 w-full px-3 py-2 font-bold text-sm rounded-lg hover:bg-muted/50">
                  {expandedTypes[type] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${TYPE_COLORS[type]}`}>{type}</span>
                  <span className="text-muted-foreground text-xs">({accounts.filter(a => a.account_type === type).length} حساب)</span>
                </button>
                {expandedTypes[type] && (
                  <div className="mr-2">
                    {roots.map(acc => renderAccount(acc))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && <AccountForm account={editAccount} accounts={accounts} onSave={() => { setShowForm(false); setEditAccount(null); load(); }} onClose={() => { setShowForm(false); setEditAccount(null); }} />}
    </div>
  );
}