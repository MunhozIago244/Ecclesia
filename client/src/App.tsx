"use client"

import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { lazy, Suspense, useEffect } from "react";

// Lazy Loading das páginas
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const UserProfile = lazy(() => import("@/pages/User")); // Nova Página de Perfil
const Ministries = lazy(() => import("@/pages/Ministries"));
const Services = lazy(() => import("@/pages/Services"));
const Events = lazy(() => import("@/pages/Events"));
const Schedules = lazy(() => import("@/pages/Schedules"));
const Locations = lazy(() => import("@/pages/Locations"));
const Equipments = lazy(() => import("@/pages/Equipments"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Admin Pages
const AdminDashboard = lazy(() => import("@/pages/Admin/AdminDashboard"));
const AdminUsersPage = lazy(() => import("@/pages/Admin/AdminUsers"));
const AdminMinistries = lazy(() => import("@/pages/Admin/AdminMinistries"));
const AdminEvents = lazy(() => import("@/pages/Admin/AdminEvents"));
const ApprovalPage = lazy(() => import("@/pages/Admin/ApprovalPage"));
const AdminSchedules = lazy(() => import("@/pages/Admin/AdminSchedules"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}

// Lógica de Pré-carregamento Inteligente
function PrefetchManager() {
  const { data: user } = useUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      // 1. Prefetch de Dados Críticos (TanStack Query)
      // Carrega os dados em background e os mantém "frescos"
      const prefetchOptions = { staleTime: 1000 * 60 * 5 }; // 5 minutos

      queryClient.prefetchQuery({ queryKey: ["/api/equipments"], ...prefetchOptions });
      queryClient.prefetchQuery({ queryKey: ["/api/locations"], ...prefetchOptions });
      queryClient.prefetchQuery({ queryKey: ["/api/ministries"], ...prefetchOptions });

      // 2. Prefetch de Código (JS Chunks)
      // Dispara o import em background sem bloquear a thread principal
      const modulesToPrefetch = [
        () => import("@/pages/Equipments"),
        () => import("@/pages/Locations"),
        () => import("@/pages/User"),
        () => import("@/pages/Schedules")
      ];

      modulesToPrefetch.forEach(fn => fn());
    }
  }, [user, queryClient]);

  return null; // Componente apenas lógico
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading } = useUser();
  if (isLoading) return <PageLoader />;
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading } = useUser();
  if (isLoading) return <PageLoader />;
  if (!user || (user.role !== "admin" && user.role !== "leader")) return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      {/* O PrefetchManager roda aqui dentro para ter acesso ao contexto do Auth */}
      <PrefetchManager />
      
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        {/* Rota de Perfil do Usuário */}
        <Route path="/profile">
          <ProtectedRoute component={UserProfile} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin">
          <AdminRoute component={AdminDashboard} />
        </Route>
        <Route path="/admin/users">
          <AdminRoute component={AdminUsersPage} />
        </Route>
        <Route path="/admin/ministries">
          <AdminRoute component={AdminMinistries} />
        </Route>
        <Route path="/admin/events">
          <AdminRoute component={AdminEvents} />
        </Route>
        <Route path="/admin/approvals">
          <AdminRoute component={ApprovalPage} />
        </Route>
        <Route path="/admin/schedules"> 
          <AdminRoute component={AdminSchedules} />
        </Route>
        
        {/* User Protected Routes - Agora a rota raiz vem por último */}
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

        {/* ROTA RAIZ - MOVIDA PARA O FINAL */}
        <Route path="/">
          <ProtectedRoute component={Dashboard} />
        </Route>

        {/* 404 - Última rota */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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