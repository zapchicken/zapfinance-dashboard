import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ContasReceber from "./pages/ContasReceber";
import ContasPagar from "./pages/ContasPagar";
import FluxoCaixa from "./pages/FluxoCaixa";
import Despesas from "./pages/Despesas";
import Receitas from "./pages/Receitas";
import Fornecedores from "./pages/Fornecedores";
import Bancos from "./pages/Bancos";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import AjustesSaldo from "./pages/AjustesSaldo";
import TestTransacoes from "./pages/TestTransacoes";
import NotFound from "./pages/NotFound";

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contas-receber" element={<ContasReceber />} />
              <Route path="/contas-pagar" element={<ContasPagar />} />
              <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
              <Route path="/despesas" element={<Despesas />} />
              <Route path="/receitas" element={<Receitas />} />
              <Route path="/fornecedores" element={<Fornecedores />} />
              <Route path="/bancos" element={<Bancos />} />
              <Route path="/ajustes-saldo" element={<AjustesSaldo />} />
              <Route path="/test-transacoes" element={<TestTransacoes />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
