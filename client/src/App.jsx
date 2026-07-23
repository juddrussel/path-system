import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { refreshToken } from "./utils/refreshToken";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import AuditTrail from "./pages/AuditTrail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Inbox from "./pages/Inbox";
import Forms from "./pages/Forms";
import TaskAssignment from "./pages/TaskAssignment";
import MyTasks from "./pages/MyTasks";
import TaskAssigned from "./pages/TaskAssigned";
import Tracking from "./pages/Tracking";
import WorkflowDesigner from "./pages/WorkflowDesigner";
import WorkflowDashboard from "./pages/WorkflowDashboard";
import Reports from "./pages/Reports";
import DocumentCategories from ".pages/DocumentCategories";


// Separated so useLocation works inside BrowserRouter
function AppRoutes() {
  const location = useLocation();
  const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/"];

  useEffect(() => {
    // Don't refresh on public pages — user isn't logged in yet
    if (publicPaths.includes(location.pathname)) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    refreshToken();
    const interval = setInterval(refreshToken, 13 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/users" element={<UserManagement />} />
      <Route path="/audit" element={<AuditTrail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/inbox" element={<Inbox />} />
      <Route path="/forms" element={<Forms />} />
      <Route path="/assign-task" element={<TaskAssignment />} />
      <Route path="/tasks" element={<MyTasks />} />
      <Route path="/task-assigned" element={<TaskAssigned />} />
      <Route path="/tracking" element={<Tracking />} />
      <Route path="/workflow-designer" element={<WorkflowDesigner />} />
      <Route path="/workflow-dashboard" element={<WorkflowDashboard />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/document-categories" element={<DocumentCategories />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
