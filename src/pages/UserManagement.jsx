import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Shield, Search, Edit2, Check, X, Mail } from "lucide-react";

const ROLES = [
  { value: "admin", label: "مدير النظام", color: "bg-red-100 text-red-700" },
  { value: "hr", label: "موارد بشرية (HR)", color: "bg-blue-100 text-blue-700" },
  { value: "general_manager", label: "مدير عام", color: "bg-purple-100 text-purple-700" },
  { value: "ceo", label: "الرئيس التنفيذي (CEO)", color: "bg-orange-100 text-orange-700" },
  { value: "dept_manager", label: "مدير قسم", color: "bg-indigo-100 text-indigo-700" },
  { value: "accountant", label: "محاسب", color: "bg-yellow-100 text-yellow-700" },
  { value: "employee", label: "موظف", color: "bg-green-100 text-green-700" },
];

function getRoleBadge(role) {
  const r = ROLES.find(x => x.value === role);
  return r ? (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.color}`}>{r.label}</span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{role || "موظف"}</span>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

  // Edit role
  const [editingId, setEditingId] = useState(null);
  const [editingRole, setEditingRole] = useState("");

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.User.list();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteMsg(null);
    try {
      // Invite with "user" base role first (platform limitation), then update role
      await base44.users.inviteUser(inviteEmail, "user");

      // Wait briefly for user to be created, then update role
      await new Promise(r => setTimeout(r, 1500));
      await load();

      // Find newly created user and update role
      const allUsers = await base44.entities.User.list();
      const newUser = allUsers.find(u => u.email === inviteEmail);
      if (newUser && inviteRole !== "employee") {
        await base44.auth.updateMe && null; // can't update other users from frontend
        // We update using entities SDK
        await base44.entities.User.update(newUser.id, { role: inviteRole });
        await load();
      }

      setInviteMsg({ type: "success", text: `تم إرسال الدعوة إلى ${inviteEmail} بدور: ${ROLES.find(r => r.value === inviteRole)?.label}` });
      setInviteEmail("");
      setInviteRole("employee");
    } catch (err) {
      setInviteMsg({ type: "error", text: "حدث خطأ: " + (err?.message || err?.error || "تعذّر إرسال الدعوة") });
    }
    setInviting(false);
  };

  const saveRole = async (userId) => {
    await base44.entities.User.update(userId, { role: editingRole });
    setEditingId(null);
    load();
  };

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين والأدوار</h1>
        <p className="text-sm text-muted-foreground mt-0.5">دعوة مستخدمين جدد وتحديد صلاحياتهم</p>
      </div>

      {/* Invite Form */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          دعوة مستخدم جديد
        </h2>
        <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-60">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">البريد الإلكتروني</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="example@company.com"
              required
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="min-w-52">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">الدور الوظيفي</label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {inviting ? "جاري الإرسال..." : "إرسال الدعوة"}
          </button>
        </form>
        {inviteMsg && (
          <div className={`mt-3 px-4 py-2.5 rounded-lg text-sm font-medium ${inviteMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
            {inviteMsg.text}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {ROLES.map(r => (
            <span key={r.value} className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.color}`}>
              {r.label}
            </span>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            المستخدمون المسجلون ({users.length})
          </h2>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو البريد..."
              className="pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">المستخدم</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">البريد الإلكتروني</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الدور الحالي</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">تغيير الدور</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    جاري التحميل...
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">لا توجد نتائج</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">{u.full_name?.charAt(0) || "?"}</span>
                      </div>
                      <span className="font-medium text-foreground">{u.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                  <td className="px-4 py-3">{getRoleBadge(u.role)}</td>
                  <td className="px-4 py-3">
                    {editingId === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editingRole}
                          onChange={e => setEditingRole(e.target.value)}
                          className="px-2 py-1.5 border border-border rounded-lg text-xs bg-background focus:outline-none"
                        >
                          {ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        <button onClick={() => saveRole(u.id)} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(u.id); setEditingRole(u.role || "employee"); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        تغيير
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}