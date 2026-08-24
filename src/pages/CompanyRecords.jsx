


import { useState, useEffect } from "react";
import {
  FolderOpen,
  Plus,
  X,
  Save,
  Upload,
  AlertTriangle,
  Search,
} from "lucide-react";
import {
  getCompanyRecords,
  deleteCompanyRecord,
  downloadCompanyRecord,
  createCompanyRecord 
} from "../api/companyRecordsApi";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { usePagination } from "@/lib/usePagination";
import TablePagination from "@/components/ui/TablePagination";

const STATUS_COLORS = {
  ساري: "bg-green-100 text-green-700",
  منتهي: "bg-red-100 text-red-600",
  "قيد التجديد": "bg-amber-100 text-amber-700",
  ملغى: "bg-gray-100 text-gray-500",
};

const CATEGORY_OPTIONS = [
  {
    label: "سجل تجاري",
    value: "commercial_register",
  },
  {
    label: "شهادة التأمينات",
    value: "insurance_certificate",
  },
  {
    label: "رخصة العمل",
    value: "work_licence",
  },
  {
    label: "رخصة بلدية",
    value: "municipal_license",
  },
  {
    label: "شهادة الزكاة",
    value: "zakat_certificate",
  },
  {
    label: "عقد إيجار",
    value: "lease_contract",
  },
  {
    label: "ترخيص نشاط",
    value: "activity_license",
  },
  {
    label: "شهادة جودة",
    value: "quality_certificate",
  },
  {
    label: "وثيقة رسمية",
    value: "official_document",
  },
  {
    label: "أخرى",
    value: "other",
  },
];

const CATEGORY_MAP = {
  commercial_register: "سجل تجاري",
  insurance_certificate: "شهادة التأمينات",
  work_licence: "رخصة العمل",
  municipal_license: "رخصة بلدية",
  zakat_certificate: "شهادة الزكاة",
  lease_contract: "عقد إيجار",
  activity_license: "ترخيص نشاط",
  quality_certificate: "شهادة جودة",
  official_document: "وثيقة رسمية",
  other: "أخرى",
};
import { getBranches } from "../api/branchesApi";
function RecordForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: "",
    category: "commercial_register",
    issuing_entity: "",
    number: "",
    issue_date: "",
    expiry_date: "",
    reminder_days: 60,
    work_location_id: "",
  });
const [branches, setBranches] = useState([]);
const [loadingBranches, setLoadingBranches] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [documentBase64, setDocumentBase64] = useState("");
  const [documentName, setDocumentName] = useState("");
const { toast } = useToast();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
  const loadBranches = async () => {
    try {
      setLoadingBranches(true);

      const res = await getBranches();

      const list = res?.data ?? res ?? [];
      setBranches(list);
    } catch (err) {
      console.error(err);
      toast({
        title: "خطأ",
        description: "فشل تحميل الفروع",
        variant: "destructive",
      });
    } finally {
      setLoadingBranches(false);
    }
  };

  loadBranches();
}, []);
  const convertFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };

      reader.onerror = (error) => reject(error);
    });

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const base64 = await convertFileToBase64(file);

      setDocumentBase64(base64);
      setDocumentName(file.name);
    } catch (err) {
      console.error(err);
      toast({
        title: "خطأ",
        description: "فشل رفع الملف",
        variant: "destructive",
      });
    }

    setUploading(false);
  };

 const handleSave = async () => {
  try {
    setSaving(true);

    const payload = {
      name: form.name,
      category: form.category,
      number: form.number || null,
      issuing_entity: form.issuing_entity || null,
      issue_date: form.issue_date || null,
      expiry_date: form.expiry_date || null,
      reminder_days: Number(form.reminder_days) || 0,
      work_location_id: form.work_location_id
        ? Number(form.work_location_id)
        : null,
      ...(documentBase64 && {
        document: documentBase64,
        document_name: documentName,
      }),
    };

    await createCompanyRecord(payload);

    onSave();
  } catch (err) {
    console.error(err);
    toast({
      title: "خطأ",
      description: err?.message || "فشل حفظ السجل",
      variant: "destructive",
    });
  } finally {
    setSaving(false);
  }
};
  const daysToExpiry = form.expiry_date
    ? Math.ceil(
        (new Date(form.expiry_date) - new Date()) / 86400000
      )
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      dir="rtl"
    >
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            إضافة سجل / وثيقة
          </h3>

          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              اسم الوثيقة *
            </label>

            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                نوع السجل
              </label>

              <select
                value={form.category}
                onChange={(e) =>
                  set("category", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                رقم السجل
              </label>

              <input
                value={form.number}
                onChange={(e) =>
                  set("number", e.target.value)
                }
                dir="ltr"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              الجهة المصدرة
            </label>

            <input
              value={form.issuing_entity}
              onChange={(e) =>
                set("issuing_entity", e.target.value)
              }
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              رقم الفرع
            </label>

          <select
  value={form.work_location_id}
  onChange={(e) =>
    set("work_location_id", e.target.value)
  }
  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
>
  <option value="">اختار الفرع</option>

  {loadingBranches ? (
    <option disabled>جاري التحميل...</option>
  ) : (
    branches.map((b) => (
      <option key={b.id} value={b.id}>
        {b.name_ar || b.name}
      </option>
    ))
  )}
</select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                تاريخ الإصدار
              </label>

              <input
                type="date"
                value={form.issue_date}
                onChange={(e) =>
                  set("issue_date", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                تاريخ الانتهاء *
              </label>

              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) =>
                  set("expiry_date", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
              />

              {daysToExpiry !== null && daysToExpiry < 90 && (
                <p
                  className={`text-xs mt-1 ${
                    daysToExpiry < 0
                      ? "text-red-600"
                      : "text-amber-600"
                  }`}
                >
                  {daysToExpiry < 0
                    ? `منتهي منذ ${Math.abs(daysToExpiry)} يوم`
                    : `ينتهي خلال ${daysToExpiry} يوم`}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              تذكير قبل انتهاء الوثيقة (يوم)
            </label>

            <input
              type="number"
              min={0}
              value={form.reminder_days}
              onChange={(e) =>
                set("reminder_days", +e.target.value)
              }
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              رفع الوثيقة
            </label>

            {documentName ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-xs text-green-700 flex-1">
                  ✅ {documentName}
                </span>

                <button
                  onClick={() => {
                    setDocumentBase64("");
                    setDocumentName("");
                  }}
                  className="text-xs text-red-500"
                >
                  إزالة
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 p-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30">
                <Upload className="w-4 h-4 text-muted-foreground" />

                <span className="text-sm text-muted-foreground">
                  {uploading
                    ? "جاري الرفع..."
                    : "اختر ملف"}
                </span>

                <input
                  type="file"
                  className="hidden"
                  onChange={handleFile}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
          >
            إلغاء
          </button>

          <button
            onClick={handleSave}
            disabled={
              saving || !form.name || !form.expiry_date
            }
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "حفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyRecords() {
  const confirmDialog = useConfirm();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
const { toast } = useToast();
const load = async () => {
  try {
    setLoading(true);

    const data = await getCompanyRecords();

    setRecords(data?.data || data || []);
  } catch (err) {
    console.error(err);
    toast({
      title: "خطأ",
      description: "فشل تحميل السجلات",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    load();
  }, []);

  const deleteRecord = async (id) => {
    const ok = await confirmDialog({
      title: "حذف السجل",
      message: "هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.",
      confirmText: "حذف",
      variant: "destructive",
    });
    if (!ok) return;

    try {
    await deleteCompanyRecord(id);

      load();
    } catch (err) {
      console.error(err);
      toast({
        title: "خطأ",
        description: "فشل حذف السجل",
        variant: "destructive",
      });
    }
  };

const downloadRecord = async (id, filename) => {
  try {
    await downloadCompanyRecord(id, filename);
  } catch (err) {
    console.error(err);
    toast({
      title: "خطأ",
      description: "فشل التحميل",
      variant: "destructive",
    });
  }
};

  const today = new Date();

  const expiringSoon = records.filter((r) => {
    if (!r.expiry_date) return false;

    const days = Math.ceil(
      (new Date(r.expiry_date) - today) / 86400000
    );

    return days <= 60 && days >= 0;
  });

  const expired = records.filter(
    (r) =>
      r.expiry_date &&
      new Date(r.expiry_date) < today
  );

  const filtered = records.filter(
    (r) =>
      (!search ||
        r.name?.includes(search) ||
        r.number?.includes(search)) &&
      (!filterType || r.category === filterType)
  );
  const recordsPagination = usePagination(filtered, 20);

  return (
    <div
      className="p-6 space-y-5 max-w-6xl mx-auto"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary" />
            سجلات الشركة
          </h1>

          <p className="text-sm text-muted-foreground mt-0.5">
            الوثائق الرسمية والتراخيص والسجلات
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          إضافة سجل
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "إجمالي الوثائق",
            value: records.length,
            color: "text-primary",
          },
          {
            label: "تنتهي قريباً",
            value: expiringSoon.length,
            color: "text-amber-600",
          },
          {
            label: "منتهية الصلاحية",
            value: expired.length,
            color: "text-red-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-xl border border-border p-4 text-center"
          >
            <p
              className={`text-2xl font-bold ${s.color}`}
            >
              {s.value}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {(expiringSoon.length > 0 ||
        expired.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            تنبيهات الوثائق:
          </p>

          {expired.map((r) => (
            <div
              key={r.id}
              className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg"
            >
              ❌ {r.name} — انتهت في{" "}
              {new Date(
                r.expiry_date
              ).toLocaleDateString("ar-SA")}
            </div>
          ))}

          {expiringSoon.map((r) => {
            const days = Math.ceil(
              (new Date(r.expiry_date) - today) /
                86400000
            );

            return (
              <div
                key={r.id}
                className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg"
              >
                ⚠️ {r.name} — ينتهي خلال {days} يوم (
                {new Date(
                  r.expiry_date
                ).toLocaleDateString("ar-SA")}
                )
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) =>
            setFilterType(e.target.value)
          }
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
        >
          <option value="">كل الأنواع</option>

          {CATEGORY_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {[
                "اسم الوثيقة",
                "النوع",
                "الجهة المصدرة",
                "رقم السجل",
                "إصدار",
                "انتهاء",
                "الحالة",
                "ملف",
                "حذف",
              ].map((h) => (
                <th
                  key={h}
                  className="text-right px-3 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  جاري التحميل...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  لا توجد سجلات
                </td>
              </tr>
            ) : (
              recordsPagination.pageItems.map((r) => {
                const days = r.expiry_date
                  ? Math.ceil(
                      (new Date(r.expiry_date) -
                        today) /
                        86400000
                    )
                  : null;

                const expired_ =
                  days !== null && days < 0;

                const warn =
                  days !== null &&
                  days >= 0 &&
                  days <= 60;

                return (
                  <tr
                    key={r.id}
                    className={`border-b border-border last:border-0 hover:bg-muted/20 ${
                      expired_
                        ? "bg-red-50/30"
                        : warn
                        ? "bg-amber-50/30"
                        : ""
                    }`}
                  >
                    <td className="px-3 py-3 font-medium text-foreground">
                      {r.name}
                    </td>

                    <td className="px-3 py-3">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {CATEGORY_MAP[r.category] ||
                          r.category}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {r.issuing_entity || "—"}
                    </td>

                    <td className="px-3 py-3 text-xs font-mono text-muted-foreground">
                      {r.number || "—"}
                    </td>

                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {r.issue_date
                        ? new Date(
                            r.issue_date
                          ).toLocaleDateString("ar-SA")
                        : "—"}
                    </td>

                    <td className="px-3 py-3 text-xs">
                      {r.expiry_date
                        ? new Date(
                            r.expiry_date
                          ).toLocaleDateString("ar-SA")
                        : "—"}

                      {warn && (
                        <span className="text-amber-600 block text-xs">
                          ({days} يوم)
                        </span>
                      )}

                      {expired_ && (
                        <span className="text-red-600 block text-xs">
                          منتهية
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          expired_
                            ? STATUS_COLORS["منتهي"]
                            : STATUS_COLORS["ساري"]
                        }`}
                      >
                        {expired_ ? "منتهي" : "ساري"}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      {r.has_document ? (
                        <button
                          onClick={() =>
                        downloadRecord(r.id, r.document_name || r.name)
                          }
                          className="text-xs text-blue-600 underline"
                        >
                          تحميل
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <button
                        onClick={() =>
                          deleteRecord(r.id)
                        }
                        className="text-xs text-red-500 hover:underline"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <TablePagination
          page={recordsPagination.page}
          totalPages={recordsPagination.totalPages}
          totalItems={recordsPagination.totalItems}
          pageSize={recordsPagination.pageSize}
          onPageChange={recordsPagination.setPage}
        />
      </div>

      {showForm && (
        <RecordForm
          onSave={() => {
            setShowForm(false);
            load();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}