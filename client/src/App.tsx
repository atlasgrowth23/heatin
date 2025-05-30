import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import Scheduling from "@/pages/Scheduling";
import ServiceCalls from "@/pages/ServiceCalls";
import Invoicing from "@/pages/Invoicing";
import Inventory from "@/pages/Inventory";
import Technicians from "@/pages/Technicians";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/customers" component={Customers} />
        <Route path="/scheduling" component={Scheduling} />
        <Route path="/service-calls" component={ServiceCalls} />
        <Route path="/invoicing" component={Invoicing} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/technicians" component={Technicians} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
