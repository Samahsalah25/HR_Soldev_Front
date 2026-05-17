import { useState, useEffect } from "react";
import { Plus, Calendar, Clock, Users, Building, Video, X, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRole } from "../lib/useRole";
import { canDo } from "../lib/crudPermissions";

function MeetingForm({ meeting, employees, onSave, onClose }) {
  const [form, setForm] = useState({
    title: "", type: "داخلي", date: new Date().toISOString().slice(0, 10),
    time: "09:00", duration_minutes: 60, location: "",
    organizer: "", assigned_employee_id: "", assigned_employee_name: "",
    external_company: "", agenda: "", status: "مجدول", attendees: [], ...(meeting || {})
  });
  const [saving, setSaving] = useState(false);
  const [attendeeInput, setAttendeeInput] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleEmpSelect = (id) => {
    const emp = employees.find(e => e.id === id);
    if (emp) { set("assigned_employee_id", id); set("assigned_employee_name", emp.full_name_ar); }
  };

  const addAttendee = () => {
    if (attendeeInput.trim()) { set("attendees", [...(form.attendees || []), attendeeInput.trim()]); setAttendeeInput(""); }
  };

  const removeAttendee = (i) => set("attendees", form.attendees.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    if (meeting?.id) await base44.entities.Meeting.update(meeting.id, form);
    else await base44.entities.Meeting.create(form);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">{meeting ? "تعديل الاجتماع" : "اجتماع جديد"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">عنوان الاجتماع *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">النوع</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
                <option>داخلي</option><option>خارجي</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">الحالة</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
                <option>مجدول</option><option>مكتمل</option><option>ملغى</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">التاريخ</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">الوقت</label>
              <input type="time" value={form.time} onChange={e => set("time", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">المدة (دقيقة)</label>
              <input type="number" min={15} step={15} value={form.duration_minutes} onChange={e => set("duration_minutes", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">المكان / رابط</label>
            <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="قاعة الاجتماعات / رابط Zoom..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
          </div>
          {form.type === "خارجي" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">الشركة الخارجية</label>
              <input value={form.external_company} onChange={e => set("external_company", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">تعيين موظف مسؤول</label>
            <select value={form.assigned_employee_id} onChange={e => handleEmpSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
              <option value="">بدون تعيين</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">الحضور</label>
            <div className="flex gap-2">
              <input value={attendeeInput} onChange={e => setAttendeeInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addAttendee()}
                placeholder="اسم المشارك..."
                className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
              <button onClick={addAttendee} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80">إضافة</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.attendees || []).map((a, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full">
                  {a} <button onClick={() => removeAttendee(i)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">جدول الأعمال</label>
            <textarea value={form.agenda} onChange={e => set("agenda", e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted text-foreground">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.title}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniCalendar({ meetings, onSelectDate, selectedDate }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const meetingDates = new Set(meetings.map(m => m.date));
  const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewDate(new Date(year, month - 1))}><ChevronRight className="w-4 h-4" /></button>
        <span className="font-semibold text-sm text-foreground">{MONTHS_AR[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1))}><ChevronLeft className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {DAYS.map(d => <div key={d} className="text-xs text-muted-foreground py-1">{d.slice(0, 2)}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === new Date().toISOString().slice(0, 10);
          const hasMeeting = meetingDates.has(dateStr);
          const isSelected = dateStr === selectedDate;
          return (
            <button key={i} onClick={() => onSelectDate(dateStr)}
              className={`w-8 h-8 mx-auto rounded-lg text-xs font-medium transition-colors relative ${isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-amber-400 text-white" : "hover:bg-muted text-foreground"}`}>
              {day}
              {hasMeeting && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-secondary rounded-full" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Meetings() {
  const { user } = useRole();
  const canCreate = canDo(user, "meetings", "create");
  const canEdit   = canDo(user, "meetings", "edit");
  const canDelete = canDo(user, "meetings", "delete");
  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const load = async () => {
    const [ms, emps] = await Promise.all([
      base44.entities.Meeting.list("-date"),
      base44.entities.Employee.filter({ status: "نشط" }),
    ]);
    setMeetings(ms); setEmployees(emps); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteMeeting = async (id) => {
    if (confirm("حذف هذا الاجتماع؟")) { await base44.entities.Meeting.delete(id); load(); }
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayMeetings = meetings.filter(m => m.date === today);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekMeetings = meetings.filter(m => m.date >= weekStart.toISOString().slice(0, 10) && m.date <= weekEnd.toISOString().slice(0, 10));
  const selectedMeetings = meetings.filter(m => m.date === selectedDate);

  const STATUS_COLORS = { "مجدول": "bg-blue-100 text-blue-700", "مكتمل": "bg-green-100 text-green-700", "ملغى": "bg-gray-100 text-gray-500" };

  const MeetingCard = ({ m }) => (
    <div className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[m.status]}`}>{m.status}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.type === "خارجي" ? "bg-purple-100 text-purple-700" : "bg-primary/10 text-primary"}`}>{m.type}</span>
          </div>
          <h3 className="font-semibold text-sm text-foreground">{m.title}</h3>
          {m.external_company && <p className="text-xs text-muted-foreground">{m.external_company}</p>}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.time} ({m.duration_minutes} د)</span>
            {m.location && <span className="flex items-center gap-1"><Building className="w-3 h-3" />{m.location}</span>}
            {m.assigned_employee_name && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{m.assigned_employee_name}</span>}
            {(m.attendees || []).length > 0 && <span>{m.attendees.length} مشارك</span>}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {canEdit && (
            <button onClick={() => { setEditMeeting(m); setShowForm(true); }}
              className="text-xs px-2 py-1 border border-border rounded-lg hover:bg-muted text-foreground">تعديل</button>
          )}
          {canDelete && (
            <button onClick={() => deleteMeeting(m.id)}
              className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">حذف</button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الاجتماعات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">داخلية وخارجية مع الشركاء</p>
        </div>
        {canCreate && (
          <button onClick={() => { setEditMeeting(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />إنشاء اجتماع جديد
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="space-y-4">
          <MiniCalendar meetings={meetings} onSelectDate={setSelectedDate} selectedDate={selectedDate} />

          {/* Today */}
          <div>
            <h3 className="font-semibold text-sm text-primary mb-2">{new Date().toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h3>
            {todayMeetings.length === 0 ? <p className="text-xs text-muted-foreground">لا توجد اجتماعات اليوم</p>
              : todayMeetings.map(m => <MeetingCard key={m.id} m={m} />)}
          </div>

          {/* This Week */}
          <div>
            <h3 className="font-semibold text-sm text-secondary mb-2">اجتماعات الأسبوع</h3>
            {weekMeetings.length === 0 ? <p className="text-xs text-muted-foreground">لا توجد اجتماعات لباقي الأسبوع</p>
              : weekMeetings.slice(0, 3).map(m => <div key={m.id} className="text-xs py-1.5 border-b border-border text-muted-foreground last:border-0">
                  <span className="font-medium text-foreground">{m.title}</span> — {m.date} {m.time && `(${m.time})`}
                </div>)}
          </div>
        </div>

        {/* Selected Date Meetings */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-bold text-foreground">{selectedDate === today ? "اجتماعات اليوم" : `اجتماعات ${new Date(selectedDate + "T00:00:00").toLocaleDateString("ar-SA")}`}</h2>
          {loading ? <p className="text-sm text-muted-foreground">جاري التحميل...</p>
            : selectedMeetings.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد اجتماعات في هذا اليوم</p>
              </div>
            ) : selectedMeetings.map(m => <MeetingCard key={m.id} m={m} />)}

          <div className="mt-6">
            <h2 className="font-bold text-foreground mb-3">جميع الاجتماعات القادمة</h2>
            <div className="space-y-2">
              {meetings.filter(m => m.date >= today && m.status === "مجدول").slice(0, 10).map(m => <MeetingCard key={m.id} m={m} />)}
            </div>
          </div>
        </div>
      </div>

      {showForm && <MeetingForm meeting={editMeeting} employees={employees} onSave={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}