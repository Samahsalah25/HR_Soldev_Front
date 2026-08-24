// import { useEffect } from "react";
// import { base44 } from "@/api/base44Client";

// export default function EmployeeEntry() {
//   useEffect(() => {
//     base44.auth.redirectToLogin("/dashboard");
//   }, []);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
//       <div className="text-center space-y-3">
//         <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
//         <p className="text-gray-500 text-sm">جاري تحويلك...</p>
//       </div>
//     </div>
//   );
// }

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function EmployeeEntry() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/login");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm">جاري تحويلك...</p>
      </div>
    </div>
  );
}