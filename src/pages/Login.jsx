import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogIn } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (email && password) {
      localStorage.setItem("user", JSON.stringify({ email }));
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30" dir="rtl">

      <div className="w-full max-w-md">

        {/* Header Card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-4 text-center">
          <h1 className="text-xl font-bold text-foreground">
            نظام الموارد البشرية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تسجيل الدخول إلى لوحة التحكم
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              البريد الإلكتروني
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
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

          {/* Button */}
          <button
            onClick={handleLogin}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            دخول النظام
          </button>

          {/* Footer hint */}
          <div className="text-xs text-muted-foreground text-center pt-2">
            يمكنك الدخول باستخدام البريد الوظيفي
          </div>
        </div>
      </div>
    </div>
  );
}