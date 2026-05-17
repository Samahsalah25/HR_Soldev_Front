import { useState, useEffect } from "react";
import { FolderOpen, Plus, X, Save, Upload, AlertTriangle, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_COLORS = {
  "ساري":"bg-green-100 text-green-700","منتهي":"bg-red-100 text-red-600",
  "قيد التجديد":"bg-amber-100 text-amber-700","ملغى":"bg-gray-100 text-gray-500"
};

function RecordForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    title:"",record_type:"سجل تجاري",issuing_authority:"",record_number:"",
    issue_date:"",expiry_date:"",reminder_days:60,status:"ساري",notes:""
  });
  const [saving,setSaving] = useState(false);
  const [fileUrl,setFileUrl] = useState("");
  const [uploading,setUploading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleFile = async(e) => {
    const file = e.target.files[0]; if(!file) return;
    setUploading(true);
    const {file_url} = await base44.integrations.Core.UploadFile({file});
    setFileUrl(file_url); setUploading(false);
  };

  const handleSave = async() => {
    setSaving(true);
    await base44.entities.CompanyRecord.create({...form,file_url:fileUrl});
    onSave();
  };

  const daysToExpiry = form.expiry_date ? Math.ceil((new Date(form.expiry_date)-new Date())/86400000) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2"><FolderOpen className="w-5 h-5 text-primary"/>إضافة سجل / وثيقة</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1.5"><label className="text-sm font-medium">اسم الوثيقة *</label>
            <input value={form.title} onChange={e=>set("title",e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-sm font-medium">نوع السجل</label>
              <select value={form.record_type} onChange={e=>set("record_type",e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                {["سجل تجاري","رخصة بلدية","شهادة التأمينات","رخصة العمل","شهادة الزكاة","عقد إيجار","ترخيص نشاط","شهادة جودة","وثيقة رسمية","أخرى"].map(t=><option key={t}>{t}</option>)}
              </select></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">رقم السجل</label>
              <input value={form.record_number} onChange={e=>set("record_number",e.target.value)} dir="ltr"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"/></div>
          </div>
          <div className="space-y-1.5"><label className="text-sm font-medium">الجهة المصدرة</label>
            <input value={form.issuing_authority} onChange={e=>set("issuing_authority",e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-sm font-medium">تاريخ الإصدار</label>
              <input type="date" value={form.issue_date} onChange={e=>set("issue_date",e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"/></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">تاريخ الانتهاء *</label>
              <input type="date" value={form.expiry_date} onChange={e=>set("expiry_date",e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"/>
              {daysToExpiry!==null&&daysToExpiry<90&&<p className={`text-xs mt-1 ${daysToExpiry<0?"text-red-600":"text-amber-600"}`}>
                {daysToExpiry<0?`منتهي منذ ${Math.abs(daysToExpiry)} يوم`:`ينتهي خلال ${daysToExpiry} يوم`}
              </p>}</div>
          </div>
          <div className="space-y-1.5"><label className="text-sm font-medium">تذكير قبل انتهاء الوثيقة (يوم)</label>
            <input type="number" min={0} value={form.reminder_days} onChange={e=>set("reminder_days",+e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"/></div>
          <div className="space-y-2"><label className="text-sm font-medium">رفع الوثيقة</label>
            {fileUrl?(<div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-xs text-green-700 flex-1">✅ تم رفع الملف</span>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">عرض</a>
              <button onClick={()=>setFileUrl("")} className="text-xs text-red-500">إزالة</button>
            </div>):(
              <label className="flex items-center gap-2 p-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30">
                <Upload className="w-4 h-4 text-muted-foreground"/>
                <span className="text-sm text-muted-foreground">{uploading?"جاري الرفع...":"اختر ملف"}</span>
                <input type="file" className="hidden" onChange={handleFile} disabled={uploading}/>
              </label>
            )}</div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave} disabled={saving||!form.title||!form.expiry_date}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4"/>{saving?"حفظ...":"حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  const load = async () => {
    const rs = await base44.entities.CompanyRecord.list("-expiry_date");
    setRecords(rs); setLoading(false);
  };
  useEffect(()=>{load();},[]);

  const deleteRecord = async(id) => { if(confirm("حذف السجل؟")){await base44.entities.CompanyRecord.delete(id);load();} };

  const today = new Date();
  const expiringSoon = records.filter(r=>{
    if(!r.expiry_date||r.status==="ملغى") return false;
    const days = Math.ceil((new Date(r.expiry_date)-today)/86400000);
    return days<=60&&days>=0;
  });
  const expired = records.filter(r=>r.expiry_date&&new Date(r.expiry_date)<today&&r.status!=="ملغى");

  const filtered = records.filter(r=>
    (!search||r.title?.includes(search)||r.record_number?.includes(search))&&
    (!filterType||r.record_type===filterType)
  );

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><FolderOpen className="w-6 h-6 text-primary"/>سجلات الشركة</h1>
          <p className="text-sm text-muted-foreground mt-0.5">الوثائق الرسمية والتراخيص والسجلات</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4"/>إضافة سجل
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {label:"إجمالي الوثائق",value:records.length,color:"text-primary"},
          {label:"تنتهي قريباً",value:expiringSoon.length,color:"text-amber-600"},
          {label:"منتهية الصلاحية",value:expired.length,color:"text-red-600"},
        ].map(s=>(
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {(expiringSoon.length>0||expired.length>0)&&(
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>تنبيهات الوثائق:</p>
          {expired.map(r=>(
            <div key={r.id} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg">
              ❌ {r.title} — انتهت في {new Date(r.expiry_date).toLocaleDateString("ar-SA")}
            </div>
          ))}
          {expiringSoon.map(r=>{
            const days = Math.ceil((new Date(r.expiry_date)-today)/86400000);
            return <div key={r.id} className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg">
              ⚠️ {r.title} — ينتهي خلال {days} يوم ({new Date(r.expiry_date).toLocaleDateString("ar-SA")})
            </div>;
          })}
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"/>
        </div>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
          <option value="">كل الأنواع</option>
          {["سجل تجاري","رخصة بلدية","شهادة التأمينات","رخصة العمل","شهادة الزكاة","عقد إيجار","ترخيص نشاط","شهادة جودة","وثيقة رسمية","أخرى"].map(t=><option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/30 border-b border-border">
            {["اسم الوثيقة","النوع","الجهة المصدرة","رقم السجل","إصدار","انتهاء","الحالة","ملف","حذف"].map(h=>(
              <th key={h} className="text-right px-3 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading?<tr><td colSpan={9} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
            :filtered.length===0?<tr><td colSpan={9} className="text-center py-8 text-muted-foreground">لا توجد سجلات</td></tr>
            :filtered.map(r=>{
              const days = r.expiry_date?Math.ceil((new Date(r.expiry_date)-today)/86400000):null;
              const expired_ = days!==null&&days<0;
              const warn = days!==null&&days>=0&&days<=60;
              return (
                <tr key={r.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${expired_?"bg-red-50/30":warn?"bg-amber-50/30":""}`}>
                  <td className="px-3 py-3 font-medium text-foreground">{r.title}</td>
                  <td className="px-3 py-3"><span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{r.record_type}</span></td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{r.issuing_authority||"—"}</td>
                  <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{r.record_number||"—"}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{r.issue_date?new Date(r.issue_date).toLocaleDateString("ar-SA"):"—"}</td>
                  <td className="px-3 py-3 text-xs">
                    {r.expiry_date?new Date(r.expiry_date).toLocaleDateString("ar-SA"):"—"}
                    {warn&&<span className="text-amber-600 block text-xs">({days} يوم)</span>}
                    {expired_&&<span className="text-red-600 block text-xs">منتهية</span>}
                  </td>
                  <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]||""}`}>{r.status}</span></td>
                  <td className="px-3 py-3">{r.file_url?<a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">عرض</a>:"—"}</td>
                  <td className="px-3 py-3"><button onClick={()=>deleteRecord(r.id)} className="text-xs text-red-500 hover:underline">حذف</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm&&<RecordForm onSave={()=>{setShowForm(false);load();}} onClose={()=>setShowForm(false)}/>}
    </div>
  );
}