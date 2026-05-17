import { useState, useRef } from "react";
import { Download, Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Excel template columns (maps to Employee entity fields)
const TEMPLATE_COLUMNS = [
  "full_name_ar", "full_name_en", "employee_number", "job_title",
  "department", "branch", "join_date", "basic_salary",
  "housing_allowance", "transport_allowance", "nationality",
  "is_saudi", "id_number", "id_expiry", "passport_number",
  "passport_expiry", "mobile", "email", "status",
  "role" // HR/Admin role field
];

const COLUMN_LABELS = {
  full_name_ar: "الاسم العربي",
  full_name_en: "الاسم الإنجليزي",
  employee_number: "رقم الموظف",
  job_title: "المسمى الوظيفي",
  department: "القسم",
  branch: "الفرع",
  join_date: "تاريخ الالتحاق (YYYY-MM-DD)",
  basic_salary: "الراتب الأساسي",
  housing_allowance: "بدل السكن",
  transport_allowance: "بدل النقل",
  nationality: "الجنسية",
  is_saudi: "سعودي (true/false)",
  id_number: "رقم الهوية",
  id_expiry: "انتهاء الهوية (YYYY-MM-DD)",
  passport_number: "رقم جواز السفر",
  passport_expiry: "انتهاء الجواز (YYYY-MM-DD)",
  mobile: "الجوال",
  email: "البريد الإلكتروني",
  status: "الحالة (نشط/مُنهي الخدمة/تحت التجربة)",
  role: "الدور (employee/hr/accountant/dept_manager/admin)",
};

function downloadCSV(data, filename) {
  const BOM = "\uFEFF";
  const csv = BOM + data;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EmployeeImportExport({ onImportDone, userRole }) {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const fileRef = useRef();

  // Download empty template CSV
  const handleDownloadTemplate = () => {
    const header = TEMPLATE_COLUMNS.map(c => COLUMN_LABELS[c]).join(",");
    const sampleRow = [
      "محمد أحمد", "Mohammed Ahmed", "EMP001", "مهندس", "تقنية المعلومات",
      "الرياض", "2024-01-01", "8000", "2000", "800",
      "سعودي", "true", "1234567890", "2027-01-01", "",
      "", "0501234567", "m@company.com", "نشط", "employee"
    ].join(",");
    downloadCSV(`${header}\n${sampleRow}`, "employee_template.csv");
  };

  // Parse CSV text
  const parseCSV = (text) => {
    const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    return lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
      return obj;
    });
  };

  // Map CSV row labels back to field names
  const mapRowToFields = (row) => {
    const reversed = {};
    Object.entries(COLUMN_LABELS).forEach(([field, label]) => {
      if (row[label] !== undefined) reversed[field] = row[label];
    });
    return reversed;
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setResults(null);

    const text = await file.text();
    const rows = parseCSV(text);
    let success = 0, failed = 0, errors = [];

    for (const row of rows) {
      const data = mapRowToFields(row);
      if (!data.full_name_ar) { failed++; continue; }
      // clean types
      if (data.basic_salary) data.basic_salary = parseFloat(data.basic_salary) || 0;
      if (data.housing_allowance) data.housing_allowance = parseFloat(data.housing_allowance) || 0;
      if (data.transport_allowance) data.transport_allowance = parseFloat(data.transport_allowance) || 0;
      if (data.is_saudi !== undefined) data.is_saudi = data.is_saudi === "true" || data.is_saudi === "1";
      // remove empty strings
      Object.keys(data).forEach(k => { if (data[k] === "") delete data[k]; });

      try {
        await base44.entities.Employee.create(data);
        success++;
      } catch (err) {
        failed++;
        errors.push(data.full_name_ar + ": " + (err?.message || "خطأ"));
      }
    }

    setResults({ success, failed, errors });
    setImporting(false);
    if (success > 0 && onImportDone) onImportDone();
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-2">
      {/* Download Template */}
      <button
        onClick={handleDownloadTemplate}
        className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="تحميل نموذج Excel فارغ"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">نموذج Excel</span>
      </button>

      {/* Import */}
      <label
        className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        title="استيراد موظفين من CSV"
      >
        <Upload className="w-4 h-4" />
        <span className="hidden sm:inline">{importing ? "جاري الاستيراد..." : "استيراد CSV"}</span>
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileImport} disabled={importing} />
      </label>

      {/* Results Modal */}
      {results && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">نتيجة الاستيراد</h3>
              <button onClick={() => setResults(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">تم استيراد {results.success} موظف بنجاح</span>
              </div>
              {results.failed > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">فشل {results.failed} سجل</span>
                </div>
              )}
              {results.errors.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                  {results.errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}
            </div>
            <button onClick={() => setResults(null)}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
              حسناً
            </button>
          </div>
        </div>
      )}
    </div>
  );
}