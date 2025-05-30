import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import Services from "@/pages/Services";
import Scheduling from "@/pages/Scheduling";
import ServiceCalls from "@/pages/ServiceCalls";
import Invoicing from "@/pages/Invoicing";
import Inventory from "@/pages/Inventory";
import Technicians from "@/pages/Technicians";
import Reports from "@/pages/Reports";
import Login from "@/pages/Login";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";
import { useAuth, AuthProvider } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {isAuthenticated ? (
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/customers" component={Customers} />
            <Route path="/customers/:id" component={CustomerDetail} />
            <Route path="/services" component={Services} />
            <Route path="/scheduling" component={Scheduling} />
            <Route path="/service-calls" component={ServiceCalls} />
            <Route path="/invoicing" component={Invoicing} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/technicians" component={Technicians} />
            <Route path="/reports" component={Reports} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      ) : (
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/" component={Landing} />
          <Route component={Landing} />
        </Switch>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
