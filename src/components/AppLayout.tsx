import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ReactNode } from "react";
import { BarChart3, DollarSign, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 sm:h-16 border-b bg-card flex items-center justify-between px-3 sm:px-4 md:px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-4" />
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-foreground">ZapFinance</h1>
                <p className="text-xs text-muted-foreground">Controle Financeiro ZapChicken</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-foreground">ZapFinance</h1>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-2">
                <span className="hidden sm:block text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            )}
          </header>
          
          <main className="flex-1 p-3 sm:p-4 md:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}