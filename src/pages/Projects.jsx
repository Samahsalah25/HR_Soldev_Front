import { useState, useEffect, useCallback } from "react";
import { Plus, X, Save, Trash2, Pencil, FolderKanban, Loader2, Building2 } from "lucide-react";
import { getProjects, createProject, updateProject, deleteProject } from "../api/projectsApi";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useRole } from "../lib/useRole";

// ─── Create / Edit Modal ──────────────────────────────────────────────
function ProjectForm({ project, onSave, onClose }) {
  const isEdit = !!project;
  const [name, setName] = useState(project?.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: name.trim() };
      const res = isEdit
        ? await updateProject(project.id, payload)
        : await createProject(payload);
      onSave(res);
    } catch (err) {
      console.error(err?.response?.data || err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-orange-600" />
            {isEdit ? "تعديل المشروع" : "إضافة مشروع"}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">اسم المشروع *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="مثال: Apartment B - Renovation & Sale"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              autoFocus
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة مشروع"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ──────────────────────────────────────────────────────
function ProjectCard({ project, canManage, onEdit, onDelete }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-orange-50 text-orange-700 border border-orange-200">
          # {project.id}
        </span>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50 border border-orange-200">
          <Building2 className="w-5 h-5 text-orange-600" />
        </div>
      </div>

      <div className="text-right">
        <p className="font-bold text-foreground text-lg">{project.name}</p>
        {project.analytic_account_id != null && (
          <p className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground mt-2">
            حساب تحليلي: {project.analytic_account_id}
          </p>
        )}
      </div>

      {canManage && (
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <button
            onClick={() => onDelete(project)}
            className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />حذف
          </button>
          <button
            onClick={() => onEdit(project)}
            className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600"
          >
            <Pencil className="w-3.5 h-3.5" />تعديل
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function Projects() {
  const { role } = useRole();
  const canManage = ["admin", "hr"].includes(role);
  const confirmDialog = useConfirm();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProjects();
      const list = Array.isArray(res) ? res : res?.data ?? [];
      setProjects(list);
    } catch (err) {
      console.error(err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (project) => {
    const ok = await confirmDialog({
      title: "حذف المشروع",
      message: `هل أنت متأكد من حذف مشروع "${project.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: "حذف",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await deleteProject(project.id);
      load();
    } catch (err) {
      console.error(err?.response?.data || err);
    }
  };

  const openEdit = (project) => { setEditingProject(project); setShowForm(true); };
  const openCreate = () => { setEditingProject(null); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingProject(null); };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
    {/* Header + Add button */}
<div className="flex items-center justify-between w-full">
  {/* المشاريع - اليمين */}
  <h1 className="text-lg font-bold text-foreground">
    المشاريع
  </h1>

  {/* إضافة مشروع - الشمال */}
  <button
    onClick={openCreate}
    className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
  >
    <Plus className="w-4 h-4" />
    إضافة مشروع
  </button>
</div>



      {/* Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">لا توجد مشاريع بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              canManage={canManage}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ProjectForm
          project={editingProject}
          onSave={() => { closeForm(); load(); }}
          onClose={closeForm}
        />
      )}
    </div>
  );
}