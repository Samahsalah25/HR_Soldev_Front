import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { PermissionsProvider } from '@/lib/PermissionsContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { base44 } from '@/api/base44Client';
// Add page imports here
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Leaves from './pages/Leaves';
import Attendance from './pages/Attendance';
import EndOfService from './pages/EndOfService';
import Missions from './pages/Missions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ESS from './pages/ESS';
import BranchesDepartments from './pages/BranchesDepartments';
import Policies from './pages/Policies';
import Tasks from './pages/Tasks';
import EmployeeRequests from './pages/EmployeeRequests';
import Meetings from './pages/Meetings';
import Accounting from './pages/AccountingMain';
import Legal from './pages/Legal';
import Violations from './pages/Violations';
import Recruitment from './pages/Recruitment.jsx';
import CompanyRecords from './pages/CompanyRecords';
import Transfers from './pages/Transfers';
import Deductions from './pages/Deductions';
import Bonuses from './pages/Bonuses';
import FinancialReports from './pages/FinancialReports';
import PublicJobApplication from './pages/PublicJobApplication.jsx';
import ManagerDashboard from './pages/ManagerDashboard';
import Permissions from './pages/Permissions';
import StorageUnits from './pages/StorageUnits';
import StorageBookings from './pages/StorageBookings';
import StorageBookingFlow from './pages/StorageBookingFlow';
import PublicStorageRental from './pages/PublicStorageRental';
import StorageDashboard from './pages/StorageDashboard';
import StorageContracts from './pages/StorageContracts';
import CustomerPortal from './pages/CustomerPortal';
import CustomerLogin from './pages/CustomerLogin';
import StorageCRM from './pages/StorageCRM';
import EmployeeEntry from './pages/EmployeeEntry';
import MyAccount from './pages/MyAccount';
import RoleDashboard from './pages/RoleDashboard';
import UserManagement from './pages/UserManagement';
import AssetManagement from './pages/AssetManagement';
import LoanManagement from './pages/LoanManagement';
import Termination from './pages/Termination';
import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { logoutUser } from "@/api/authApi";
import { useNavigate } from "react-router-dom";
function TerminatedEmployeeScreen() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser(); // 
    } catch (err) {
      console.log("logout error:", err);
    }

    localStorage.removeItem("user");
    navigate("/"); // أو "/"
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background" dir="rtl">
      <div className="max-w-md w-full mx-4 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">تم إنهاء الخدمة</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            لقد تم إنهاء خدمتك في المنظومة.<br />
            لا يمكنك الوصول إلى النظام بعد الآن.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع قسم الموارد البشرية.
          </p>
        </div>
        <button
          onClick={() => handleLogout()}
          className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [terminatedBlock, setTerminatedBlock] = useState(false);
  const [terminatedChecked, setTerminatedChecked] = useState(false);

  // Check if current user's employee record is terminated
  useEffect(() => {
    const publicPaths = ['/rent', '/storage-booking', '/careers', '/customer-login', '/my-account', '/login-employee', '/login-empolyee'];
    const isPublic = window.location.pathname === '/' || publicPaths.some(p => window.location.pathname.startsWith(p));
    // if (isPublic || isLoadingAuth || isLoadingPublicSettings) return;
    if (authError?.type === 'auth_required') { setTerminatedChecked(true); return; }

    base44.auth.me().then(async (user) => {
      if (!user) { setTerminatedChecked(true); return; }
      // admins are never blocked
      if (user.role === 'admin') { setTerminatedChecked(true); return; }
      const emps = await base44.entities.Employee.list();
      const matched = emps.filter(e => e.email?.toLowerCase() === user.email?.toLowerCase());
      // If ALL matched records are terminated → block. If at least one is active → allow.
      const hasActive = matched.some(e => e.status !== "مُنهي الخدمة");
      const allTerminated = matched.length > 0 && !hasActive;
      setTerminatedBlock(allTerminated);
      setTerminatedChecked(true);
    }).catch(() => setTerminatedChecked(true));
  }, [isLoadingAuth, isLoadingPublicSettings, authError]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth || !terminatedChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Allow public pages without login
      const publicPaths = ['/rent', '/storage-booking', '/careers', '/customer-login', '/my-account', '/login-employee', '/login-empolyee'];
      const isPublic = window.location.pathname === '/' || publicPaths.some(p => window.location.pathname.startsWith(p));
      if (!isPublic) {
        navigateToLogin();
        return null;
      }
    }
  }

  // Block terminated employees
  if (terminatedBlock) return <TerminatedEmployeeScreen />;

  // Render the main app
  return (
    <Routes>
      {/* <Route path="/" element={<PublicStorageRental />} /> */}
      <Route path="/" element={<Login />} />
      <Route path="/login-employee" element={<EmployeeEntry />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login-empolyee" element={<EmployeeEntry />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/home" element={<RoleDashboard />} />
          <Route path="/home-dashboard" element={<RoleDashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/end-of-service" element={<EndOfService />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ess" element={<ESS />} />
          <Route path="/branches" element={<BranchesDepartments />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/requests" element={<EmployeeRequests />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/violations" element={<Violations />} />
          <Route path="/recruitment" element={<Recruitment />} />
          <Route path="/company-records" element={<CompanyRecords />} />
          <Route path="/transfers" element={<Transfers />} />
          <Route path="/deductions" element={<Deductions />} />
          <Route path="/bonuses" element={<Bonuses />} />
          <Route path="/financial-reports" element={<FinancialReports />} />
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/storage-units" element={<StorageUnits />} />
          <Route path="/storage-bookings" element={<StorageBookings />} />
          <Route path="/storage-dashboard" element={<StorageDashboard />} />
          <Route path="/storage-contracts" element={<StorageContracts />} />
          <Route path="/storage-crm" element={<StorageCRM />} />
          <Route path="/assets" element={<AssetManagement />} />
          <Route path="/loan-management" element={<LoanManagement />} />
          <Route path="/termination" element={<Termination />} />
        </Route></Route>
      <Route path="/careers" element={<PublicJobApplication />} />
      <Route path="/storage-booking" element={<StorageBookingFlow />} />
      <Route path="/my-storage" element={<CustomerPortal />} />
      <Route path="/customer-login" element={<CustomerLogin />} />
      <Route path="/my-account" element={<MyAccount />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <PermissionsProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </PermissionsProvider>
    </AuthProvider>
  )
}

export default App