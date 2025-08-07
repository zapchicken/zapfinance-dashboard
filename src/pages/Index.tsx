import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, CreditCard, PieChart } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ZapFinance
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Controle financeiro completo para sua empresa. 
              Gerencie receitas, despesas, contas a pagar e receber de forma simples e eficiente.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6">
              <div className="space-y-3">
                <TrendingUp className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-xl font-semibold">Receitas e Despesas</h3>
                <p className="text-muted-foreground">
                  Controle total sobre suas receitas e despesas com categorização automática
                </p>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="space-y-3">
                <CreditCard className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-xl font-semibold">Contas a Pagar/Receber</h3>
                <p className="text-muted-foreground">
                  Nunca mais perca um prazo. Gerencie todas suas contas em um só lugar
                </p>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="space-y-3">
                <PieChart className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-xl font-semibold">Relatórios Detalhados</h3>
                <p className="text-muted-foreground">
                  Relatórios completos para tomada de decisão inteligente
                </p>
              </div>
            </Card>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/auth">Começar Agora</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/dashboard">Acessar Dashboard</Link>
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
