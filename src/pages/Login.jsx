import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { loginUser } from "../api/authApi";
import { GoogleLogin } from "@react-oauth/google";
import { googleLoginUser } from "../api/authApi";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [employeeNumber, setEmployeeNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // LOGIN NORMAL
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!employeeNumber || !password) {
      toast({
        title: "خطأ",
        description: "من فضلك املأ جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await loginUser({
        employee_number: employeeNumber,
        password,
      });

      if (res?.success) {
        localStorage.setItem("user", JSON.stringify(res));

        toast({
          title: "تم تسجيل الدخول",
          description: `مرحباً ${res.name}`,
        });

        navigate("/dashboard");
      } else {
        toast({
          title: "فشل تسجيل الدخول",
          description: res?.error || "بيانات غير صحيحة",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "خطأ",
        description:
          err?.response?.data?.error ||
          "Invalid employee number or password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE LOGIN (READY FOR BACKEND)
const handleGoogleSuccess = async (credentialResponse) => {
  try {
    setGoogleLoading(true);

    const id_token = credentialResponse.credential;

    const res = await googleLoginUser(id_token);

    if (res.success) {
      localStorage.setItem("user", JSON.stringify(res));

      toast({
        title: "تم تسجيل الدخول",
        description: `مرحباً ${res.name}`,
      });

      navigate("/dashboard");
    }
  } catch (err) {
    toast({
      title: "خطأ",
      description: "فشل تسجيل الدخول بجوجل",
      variant: "destructive",
    });
  } finally {
    setGoogleLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30" dir="rtl">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-4 text-center">
          <h1 className="text-xl font-bold text-foreground">
            نظام الموارد البشرية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تسجيل الدخول إلى لوحة التحكم
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">

          {/* Employee Number */}
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              الرقم الوظيفي
            </label>

            <input
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              placeholder="EMP-0002"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Lock className="w-4 h-4" />
              كلمة المرور
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* LOGIN BUTTON */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "جاري تسجيل الدخول..." : "دخول النظام"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-muted-foreground">أو</span>
            <div className="h-px bg-border flex-1" />
          </div>

          {/* GOOGLE LOGIN */}
        <GoogleLogin
  onSuccess={handleGoogleSuccess}
  onError={() => {
    toast({
      title: "خطأ",
      description: "Google login failed",
      variant: "destructive",
    });
  }}
/>
        </div>
      </div>
    </div>
  );
}