import { Navigate, useLocation, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const user = localStorage.getItem("user");
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}