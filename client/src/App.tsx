import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Ministries from "@/pages/Ministries";
import Services from "@/pages/Services";
import Events from "@/pages/Events";
import Schedules from "@/pages/Schedules";
import Locations from "@/pages/Locations";
import Equipments from "@/pages/Equipments";
import NotFound from "@/pages/not-found";
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import AdminUsersPage from "@/pages/Admin/AdminUsers";
import AdminMinistries from "@/pages/Admin/AdminMinistries";
import AdminEvents from "@/pages/Admin/AdminEvents";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.role !== "admin") {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Admin */}
      <Route path="/admin"><AdminRoute component={AdminDashboard} /></Route>
      <Route path="/admin/users"><AdminRoute component={AdminUsersPage} /></Route>
      <Route path="/admin/ministries"><AdminRoute component={AdminMinistries} /></Route>
      <Route path="/admin/events"><AdminRoute component={AdminEvents} /></Route>
      
      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/ministries">
        <ProtectedRoute component={Ministries} />
      </Route>
      <Route path="/services">
        <ProtectedRoute component={Services} />
      </Route>
      <Route path="/events">
        <ProtectedRoute component={Events} />
      </Route>
      <Route path="/schedules">
        <ProtectedRoute component={Schedules} />
      </Route>
      <Route path="/locations">
        <ProtectedRoute component={Locations} />
      </Route>
      <Route path="/equipments">
        <ProtectedRoute component={Equipments} />
      </Route>

      <Route component={NotFound} />
    </Switch>
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
