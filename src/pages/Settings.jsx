import { useState } from "react";
import { Settings2, Calculator, Shield, FileText, Save, RefreshCw, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { calcGOSI_Saudi, calcGOSI_NonSaudi, calcEndOfService, calcLeaveEncashment, formatCurrency } from "../lib/hrUtils";
import { 
  getGosiRates,
  updateGosiRates,
  getLaborLawSettings,
  updateLaborLawSettings ,
    getWpsSettings,
  updateWpsSettings,
  runSandboxTest
} from "@/api/settings";
import { useEffect } from "react";

// ═══════════════════════════════════════════
// معدلات GOSI الرسمية — قابلة للتحديث
// المرجع: لوائح GOSI المحدّثة 2024-2025
// ═══════════════════════════════════════════
const DEFAULT_RATES = {
  gosi_saudi_employee: 9.00,          // % — الموظف السعودي
  gosi_saudi_employer_retirement: 9.00, // % — تقاعد
  gosi_saudi_employer_occupational: 2.00, // % — أخطار مهنية
  gosi_saudi_employer_labor_support: 0.75, // % — صندوق العمال
  gosi_nonsaudi_employee: 2.00,       // % — الموظف المقيم (أخطار مهنية)
  gosi_nonsaudi_employer: 2.00,       // % — صاحب العمل (مقيم)
  expat_levy: 400,                     // ريال — رسوم العمالة الوافدة
  overtime_multiplier: 1.50,           // مضاعف — المادة 107 (150%)
  annual_leave_years_threshold: 5,     // سنوات — حد 21→30 يوم
  annual_leave_below: 21,              // أيام — أقل من 5 سنوات
  annual_leave_above: 30,              // أيام — 5 سنوات فأكثر
  eos_min_years_employer: 2,           // سنوات — الحد الأدنى لنهاية الخدمة (فصل)
  eos_half_rate_years: 5,              // سنوات — حد النصف → الكامل
  notice_period_days: 30,              // يوم — فترة الإشعار
  probation_period_days: 90,           // يوم — فترة التجربة
  wps_deadline_day: 10,               // يوم الشهر — الحد الأقصى للدفع
};

const SANDBOX_TESTS = [
  {
    id: "gosi_saudi",
    label: "GOSI — موظف سعودي",
    desc: "أساسي 10,000 + سكن 2,500",
  },
  {
    id: "gosi_resident",
    label: "GOSI — موظف مقيم",
    desc: "أساسي 8,000",
  },
  {
    id: "eos_termination",
    label: "نهاية الخدمة — فصل بعد 6 سنوات",
    desc: "أساسي 10,000 — 6 سنوات — فصل من صاحب العمل",
  },
  {
    id: "eos_resignation",
    label: "نهاية الخدمة — استقالة بعد 4 سنوات",
    desc: "أساسي 8,000 — 4 سنوات — استقالة",
  },
  {
    id: "vacation_settlement",
    label: "تصفية الإجازات",
    desc: "أساسي 6,000 + سكن 1,500 — 15 يوم",
  },
];

const Field = ({ label, children, note }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
    {note && <p className="text-xs text-muted-foreground">{note}</p>}
  </div>
);

export default function Settings() {
  const [rates, setRates] = useState(DEFAULT_RATES);

const [gosiRates, setGosiRates] = useState(null);
const [gosiLoading, setGosiLoading] = useState(false);
const [gosiSaved, setGosiSaved] = useState(false);
const [laborLaw, setLaborLaw] = useState(null);
const [laborLoading, setLaborLoading] = useState(false);
const [laborSaved, setLaborSaved] = useState(false);
const [wpsSettings, setWpsSettings] = useState(null);
const [wpsLoading, setWpsLoading] = useState(false);
const [wpsSaved, setWpsSaved] = useState(false);
const [activeTab, setActiveTab] = useState("gosi");
const [sandboxResults, setSandboxResults] = useState({});
const [saved, setSaved] = useState(false);


const set = (k, v) => {
  setRates(r => ({
    ...r,
    [k]: v
  }));
};


// ===============================
// GOSI API Integration
// ===============================
const loadLaborLaw = async () => {

  try {

    setLaborLoading(true);

    const res = await getLaborLawSettings();

    setLaborLaw({
      vacation: {
        ...res.vacation
      },

      eos_overtime:{
        ...res.eos_overtime
      }
    });


  } catch(error){

    console.error(
      "Failed to load labor law settings",
      error
    );

  } finally {

    setLaborLoading(false);

  }

};
const updateLaborField = (
  section,
  field,
  value
)=>{

  setLaborLaw(prev=>({

    ...prev,

    [section]:{

      ...prev[section],

      [field]:Number(value)

    }

  }));

};

const loadWpsSettings = async () => {
  try {
    setWpsLoading(true);

    const res = await getWpsSettings();

    setWpsSettings({
      payment_day_limit: res.payment_day_limit,
    });

  } catch (error) {
    console.error("Failed to load WPS settings", error);
  } finally {
    setWpsLoading(false);
  }
};
const updateWpsField = (value) => {
  setWpsSettings((prev) => ({
    ...prev,
    payment_day_limit: Number(value),
  }));
};
const saveWpsSettings = async () => {
  if (!wpsSettings) return;

  try {
    await updateWpsSettings(wpsSettings);

    setWpsSaved(true);

    setTimeout(() => {
      setWpsSaved(false);
    }, 2500);

  } catch (error) {
    console.error("Failed to update WPS settings", error);
  }
};
const saveLaborLaw = async()=>{

  if(!laborLaw) return;


  try{

    await updateLaborLawSettings(laborLaw);


    setLaborSaved(true);


    setTimeout(()=>{

      setLaborSaved(false);

    },2500);


  }catch(error){

    console.error(
      "Failed to update labor law",
      error
    );

  }

};
useEffect(() => {
  loadGosiRates();
  loadLaborLaw();
  loadWpsSettings();
}, []);
const loadGosiRates = async () => {
  try {
    setGosiLoading(true);

    const res = await getGosiRates();

    setGosiRates({
      saudi_employee: {
        ...res.saudi_employee
      },
      resident_employee: {
        ...res.resident_employee
      }
    });

  } catch (error) {
    console.error("Failed to load GOSI rates", error);
  } finally {
    setGosiLoading(false);
  }
};


const updateGosiField = (employeeType, field, value) => {
  setGosiRates(prev => ({
    ...prev,
    [employeeType]: {
      ...prev[employeeType],
      [field]: Number(value)
    }
  }));
};


const saveGosiRates = async () => {
  if (!gosiRates) return;

  try {
    await updateGosiRates(gosiRates);

    setGosiSaved(true);

    setTimeout(() => {
      setGosiSaved(false);
    }, 2500);

  } catch (error) {
    console.error("Failed to update GOSI rates", error);
  }
};


// ===============================
// Local Settings Save
// ===============================

const handleSave = () => {
  localStorage.setItem(
    "hr_system_rates",
    JSON.stringify(rates)
  );

  setSaved(true);

  setTimeout(() => {
    setSaved(false);
  }, 2500);
};

// ===============================
// Sandbox
// ===============================

// ===============================
// Sandbox
// ===============================

const runTest = async (test) => {
  try {
    const res = await runSandboxTest({
      scenario: test.id,
    });

    setSandboxResults(prev => ({
      ...prev,
      [test.id]: res,
    }));

  } catch (error) {
    console.error("Failed to run sandbox test", error);
  }
};


const runAllTests = async () => {
  try {
    const results = {};

    for (const test of SANDBOX_TESTS) {
      const res = await runSandboxTest({
        scenario: test.id,
      });

      results[test.id] = res;
    }

    setSandboxResults(results);

  } catch (error) {
    console.error("Failed to run all sandbox tests", error);
  }
};
// ===============================
// GOSI Calculations Display
// ===============================

const gosiEmployerTotal = gosiRates
  ? (
      gosiRates.saudi_employee.retirement +
      gosiRates.saudi_employee.occupational_hazards +
      gosiRates.saudi_employee.workers_support_fund
    ).toFixed(2)
  : "0.00";
  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الإعدادات والمعايير النظامية</h1>
          <p className="text-sm text-muted-foreground mt-0.5">تحديث المعدلات والنسب وفق أحدث اللوائح الرسمية</p>
        </div>

<button 
  onClick={
    activeTab === "gosi"
      ? saveGosiRates
      : activeTab === "labor"
      ? saveLaborLaw
      : activeTab === "wps"
      ? saveWpsSettings
      : handleSave
  }
  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
    (saved || gosiSaved || laborSaved || wpsSaved)
      ? "bg-green-500 text-white"
      : "bg-primary text-primary-foreground hover:bg-primary/90"
  }`}
>
  {(saved || gosiSaved || laborSaved || wpsSaved) ? (
    <>
      <CheckCircle className="w-4 h-4" />
      تم الحفظ
    </>
  ) : (
    <>
      <Save className="w-4 h-4" />
      حفظ الإعدادات
    </>
  )}
</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "gosi", label: "معدلات GOSI", icon: Shield },
          { id: "labor", label: "نظام العمل", icon: FileText },
          { id: "wps", label: "WPS / الرواتب", icon: Settings2 },
          { id: "sandbox", label: "🧪 بيئة الاختبار", icon: Calculator },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

  {activeTab === "gosi" && (
  <div className="space-y-5">

    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
      <p className="font-semibold flex items-center gap-2 mb-1">
        <Info className="w-4 h-4" />
        المرجع: لوائح GOSI المحدّثة 2024-2025
      </p>
      <p>
        وعاء السعودي: الراتب الأساسي + بدل السكن | وعاء المقيم: الراتب الأساسي فقط
      </p>
    </div>


    {gosiLoading || !gosiRates ? (
      <div className="text-center py-10 text-muted-foreground">
        جاري تحميل إعدادات GOSI...
      </div>
    ) : (

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Saudi */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">

          <h3 className="font-semibold text-foreground flex items-center gap-2">
            🇸🇦 الموظف السعودي
          </h3>


          <Field 
            label="اشتراك الموظف (%)"
            note="م.الأساسي + بدل السكن × النسبة"
          >
            <div className="flex items-center gap-2">

              <input
                type="number"
                step={0.25}
                min={0}
                max={20}
                value={
                  gosiRates.saudi_employee.employee_subscription
                }
                onChange={e =>
                  updateGosiField(
                    "saudi_employee",
                    "employee_subscription",
                    e.target.value
                  )
                }
                className="w-28 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />

              <span className="text-sm text-muted-foreground font-medium">
                %
              </span>

            </div>
          </Field>



          <div className="border-t border-border pt-4">

            <p className="text-sm font-medium text-foreground mb-3">
              اشتراك صاحب العمل (إجمالي: {gosiEmployerTotal}%)
            </p>


            {[
              {
                key: "retirement",
                label: "تقاعد (%)"
              },
              {
                key: "occupational_hazards",
                label: "أخطار مهنية (%)"
              },
              {
                key: "workers_support_fund",
                label: "صندوق دعم العمال (%)"
              },

            ].map(f => (

              <Field 
                key={f.key}
                label={f.label}
              >

                <div className="flex items-center gap-2">

                  <input
                    type="number"
                    step={0.25}
                    min={0}
                    max={20}
                    value={
                      gosiRates.saudi_employee[f.key]
                    }
                    onChange={e =>
                      updateGosiField(
                        "saudi_employee",
                        f.key,
                        e.target.value
                      )
                    }
                    className="w-28 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                  />

                  <span className="text-sm text-muted-foreground">
                    %
                  </span>

                </div>

              </Field>

            ))}

          </div>

        </div>



        {/* Non Saudi */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">

          <h3 className="font-semibold text-foreground flex items-center gap-2">
            🌍 الموظف المقيم (غير السعودي)
          </h3>



          <Field
            label="اشتراك الموظف (%)"
            note="أخطار مهنية — من الراتب الأساسي"
          >

            <div className="flex items-center gap-2">

              <input
                type="number"
                step={0.25}
                min={0}
                max={10}
                value={
                  gosiRates.resident_employee.employee_subscription
                }
                onChange={e =>
                  updateGosiField(
                    "resident_employee",
                    "employee_subscription",
                    e.target.value
                  )
                }
                className="w-28 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
              />

              <span className="text-sm text-muted-foreground">
                %
              </span>

            </div>

          </Field>




          <Field
            label="أخطار مهنية (%)"
            note="اشتراك صاحب العمل"
          >

            <div className="flex items-center gap-2">

              <input
                type="number"
                step={0.25}
                min={0}
                max={10}
                value={
                  gosiRates.resident_employee.occupational_hazards
                }
                onChange={e =>
                  updateGosiField(
                    "resident_employee",
                    "occupational_hazards",
                    e.target.value
                  )
                }
                className="w-28 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
              />

              <span className="text-sm text-muted-foreground">
                %
              </span>

            </div>

          </Field>




          <Field
            label="رسوم العمالة الوافدة (ريال/شهر)"
            note="حسب لوائح وزارة الموارد البشرية 2024"
          >

            <div className="flex items-center gap-2">

              <input
                type="number"
                step={50}
                min={0}
                value={
                  gosiRates.resident_employee.expatriate_labor_fees
                }
                onChange={e =>
                  updateGosiField(
                    "resident_employee",
                    "expatriate_labor_fees",
                    e.target.value
                  )
                }
                className="w-28 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
              />

              <span className="text-sm text-muted-foreground">
                ريال
              </span>

            </div>

          </Field>


        </div>

      </div>

    )}

  </div>
)}

     {activeTab === "labor" && (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

    {laborLoading || !laborLaw ? (

      <div className="col-span-2 text-center py-10 text-muted-foreground">
        جاري تحميل إعدادات نظام العمل...
      </div>

    ) : (

      <>

        {/* Vacation */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">

          <h3 className="font-semibold text-foreground">
            الإجازات — المادة 109
          </h3>


          {[
            {
              key:"increase_years_threshold",
              label:"حد سنوات الخدمة للزيادة",
              note:"سنوات",
              max:20
            },
            {
              key:"lower_limit_days",
              label:"أيام الإجازة (الحد الأدنى)",
              note:"يوم",
              max:60
            },
            {
              key:"upper_limit_days",
              label:"أيام الإجازة (الحد الأعلى)",
              note:"يوم",
              max:60
            }

          ].map(f=>(

            <Field 
              key={f.key}
              label={f.label}
            >

              <div className="flex items-center gap-2">

                <input
                  type="number"
                  min={0}
                  max={f.max}
                  value={
                    laborLaw.vacation[f.key]
                  }
                  onChange={e=>
                    updateLaborField(
                      "vacation",
                      f.key,
                      e.target.value
                    )
                  }
                  className="w-24 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                />

                <span className="text-sm text-muted-foreground">
                  {f.note}
                </span>

              </div>

            </Field>

          ))}

        </div>



        {/* EOS + Overtime */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">

          <h3 className="font-semibold text-foreground">
            نهاية الخدمة والعمل الإضافي
          </h3>


          {[
            {
              key:"min_eligibility_fire_years",
              label:"الحد الأدنى للاستحقاق (فصل)",
              note:"سنوات"
            },
            {
              key:"salary_limit_years",
              label:"حد سنوات الراتب",
              note:"سنوات"
            },
            {
              key:"notice_period_days",
              label:"فترة الإشعار",
              note:"يوم"
            },
            {
              key:"trial_period_days",
              label:"فترة التجربة",
              note:"يوم"
            },
            {
              key:"overtime_multiplier",
              label:"مضاعف العمل الإضافي",
              note:"× الأجر",
              step:0.25
            }

          ].map(f=>(

            <Field
              key={f.key}
              label={f.label}
            >

              <div className="flex items-center gap-2">

                <input
                  type="number"
                  step={f.step || 1}
                  min={0}
                  value={
                    laborLaw.eos_overtime[f.key]
                  }
                  onChange={e=>
                    updateLaborField(
                      "eos_overtime",
                      f.key,
                      e.target.value
                    )
                  }
                  className="w-24 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                />

                <span className="text-sm text-muted-foreground">
                  {f.note}
                </span>

              </div>

            </Field>

          ))}


        </div>


      </>

    )}

  </div>
)}

     {activeTab === "wps" && (
  <div className="space-y-5">
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
      <p className="font-semibold flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        نظام حماية الأجور (WPS)
      </p>

      <p className="mt-1">
        يجب دفع الرواتب عبر نظام WPS بنك التسهيلات في موعد أقصاه اليوم{" "}
        {wpsSettings?.payment_day_limit} من كل شهر.
      </p>
    </div>

    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <h3 className="font-semibold">إعدادات WPS</h3>

      <Field 
        label="الحد الأقصى للدفع (يوم من الشهر)" 
        note="وفق لوائح وزارة الموارد البشرية"
      >
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={28}
            value={wpsSettings?.payment_day_limit ?? ""}
            onChange={(e) =>
              setWpsSettings(prev => ({
                ...prev,
                payment_day_limit: Number(e.target.value)
              }))
            }
            className="w-24 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
          />

          <span className="text-sm text-muted-foreground">
            من كل شهر
          </span>
        </div>
      </Field>
    </div>


    {/* WPS File Format Info */}
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <h3 className="font-semibold text-sm">بنية ملف WPS</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/40">
              {["الحقل", "النوع", "الوصف"].map(h => (
                <th 
                  key={h} 
                  className="text-right px-3 py-2 border border-border font-medium"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {[
              ["رقم الهوية", "رقمي 10 خانات", "رقم هوية/إقامة الموظف"],
              ["رقم IBAN", "SA + 22 خانة", "رقم الحساب البنكي"],
              ["صافي الراتب", "رقمي عشري", "المبلغ المحوّل بالريال"],
              ["شهر الراتب", "YYYY-MM", "الشهر المراد صرفه"],
              ["رقم المنشأة", "رقمي", "رقم المنشأة في GOSI"],
            ].map(([f, t, d]) => (
              <tr key={f} className="border-b border-border">
                <td className="px-3 py-2 border border-border font-medium">
                  {f}
                </td>

                <td className="px-3 py-2 border border-border text-muted-foreground font-mono">
                  {t}
                </td>

                <td className="px-3 py-2 border border-border text-muted-foreground">
                  {d}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

   {activeTab === "sandbox" && (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800 flex-1 ml-4">
        <p className="font-semibold flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          بيئة اختبار الحسابات (Sandbox)
        </p>

        <p className="mt-1">
          تحقق من صحة حسابات GOSI ونهاية الخدمة والإجازات قبل تطبيقها على كشف الرواتب الفعلي.
        </p>
      </div>

      <button
        onClick={runAllTests}
        className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium whitespace-nowrap"
      >
        <RefreshCw className="w-4 h-4" />
        تشغيل الكل
      </button>
    </div>


    <div className="space-y-3">
      {SANDBOX_TESTS.map(test => {

        const result = sandboxResults[test.id];

        return (
          <div
            key={test.id}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >

            <div className="flex items-center justify-between px-5 py-3 bg-muted/20 border-b border-border">

              <div>
                <p className="font-semibold text-sm text-foreground">
                  {test.label}
                </p>

                <p className="text-xs text-muted-foreground">
                  {test.desc}
                </p>
              </div>


              <button
                onClick={() => runTest(test)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90"
              >
                <Calculator className="w-3.5 h-3.5" />
                تشغيل
              </button>

            </div>


            {result && (
              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">


                {/* Actual Result */}
                <div>

                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    📊 النتيجة الفعلية
                  </p>


                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">

                    {Object.entries(result.data || {}).map(([k, v]) => (

                      <div
                        key={k}
                        className="flex justify-between gap-3"
                      >

                        <span className="text-xs text-muted-foreground">
                          {k}
                        </span>


                        <span className="text-xs font-bold text-green-700 text-left">

                          {typeof v === "object"
                            ? JSON.stringify(v)
                            : typeof v === "number"
                            ? formatCurrency(v)
                            : v
                          }

                        </span>

                      </div>

                    ))}

                  </div>

                </div>



                {/* Expected Result */}
                <div>

                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    ✅ النتيجة المتوقعة
                  </p>


                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">

                    {Object.entries(result.expected || {}).map(([k, v]) => (

                      <div
                        key={k}
                        className="flex flex-col gap-0.5"
                      >

                        <span className="text-xs text-muted-foreground">
                          {k}
                        </span>


                        <span className="text-xs font-bold text-blue-700">
                          {v}
                        </span>

                      </div>

                    ))}

                  </div>

                </div>


              </div>
            )}

          </div>
        );

      })}
    </div>

  </div>
)}
    </div>
  );
}