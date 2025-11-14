import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import AuthInfo from "@/pages/auth-info";
import ClientDashboard from "@/pages/client-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import NewRequest from "@/pages/new-request";
import ProjectDetail from "@/pages/project-detail";
import AdminProjectManage from "@/pages/admin-project-manage";
import AdminAssignProjects from "@/pages/admin-assign-projects";
import AdminReports from "@/pages/admin-reports";
import AdminManageAdmins from "@/pages/admin-manage-admins";
import AdminMessages from "@/pages/admin-messages";
import AdminInvite from "@/pages/admin-invite";
import AdminManageRatings from "@/pages/admin-manage-ratings";
import SignupAdmin from "@/pages/signup-admin";
import InvoicePayment from "@/pages/invoice-payment";
import TermsAndConditions from "@/pages/terms-and-conditions";
import CustomerService from "@/pages/customer-service";
import ContactUs from "@/pages/contact-us";
import BrowseProjects from "@/pages/browse-projects";
import AdminInterestRequests from "@/pages/admin-interest-requests";
import AccountSettings from "@/pages/account-settings";
import NotFound from "@/pages/not-found";
import { Footer } from "@/components/footer";
import { ClientDashboardRoute } from "@/components/ClientDashboardRoute";

function Router() {
  const { isAuthenticated, isLoading, isClient, isAdmin, isMasterAdmin } = useAuth();

  return (
    <Switch>
      {/* Public Routes - accessible without authentication */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/signup/admin/:token" component={SignupAdmin} />
      <Route path="/auth-info" component={AuthInfo} />
      <Route path="/terms-and-conditions" component={TermsAndConditions} />
      <Route path="/contact-us" component={ContactUs} />
      
      {/* Role-aware client dashboard route - handles all authentication states */}
      <Route path="/client-dashboard" component={ClientDashboardRoute} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {/* Shared authenticated routes - available to all logged-in users */}
          <Route path="/customer-service" component={CustomerService} />
          <Route path="/account-settings" component={AccountSettings} />
          
          {/* Client Routes */}
          {isClient && (
            <>
              <Route path="/" component={ClientDashboard} />
              <Route path="/new-request" component={NewRequest} />
              <Route path="/project/:id" component={ProjectDetail} />
              <Route path="/invoice/:id/pay" component={InvoicePayment} />
            </>
          )}
          
          {/* Admin Routes */}
          {isAdmin && (
            <>
              <Route path="/" component={AdminDashboard} />
              <Route path="/admin/project/:id" component={AdminProjectManage} />
              <Route path="/admin/browse-projects" component={BrowseProjects} />
              <Route path="/admin/reports" component={AdminReports} />
              <Route path="/admin/messages" component={AdminMessages} />
            </>
          )}
          
          {/* Master Admin Only Routes */}
          {isMasterAdmin && (
            <>
              <Route path="/admin/assign-projects" component={AdminAssignProjects} />
              <Route path="/admin/interest-requests" component={AdminInterestRequests} />
              <Route path="/admin/manage-admins" component={AdminManageAdmins} />
              <Route path="/admin/invite-admin" component={AdminInvite} />
              <Route path="/admin/manage-ratings" component={AdminManageRatings} />
            </>
          )}
          
          {/* If authenticated but no role match, show landing */}
          {!isClient && !isAdmin && (
            <Route path="/" component={Landing} />
          )}
        </>
      )}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          <div className="flex-1">
            <Router />
          </div>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
