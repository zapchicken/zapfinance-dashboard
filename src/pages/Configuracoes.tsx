import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, User, Bell, Database } from "lucide-react";

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Configurações do sistema ZapFinance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Empresa</Label>
              <Input defaultValue="ZapChicken" />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input defaultValue="00.000.000/0001-00" />
            </div>
            <div className="space-y-2">
              <Label>Fuso Horário</Label>
              <Input defaultValue="America/Sao_Paulo" />
            </div>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>

        {/* Configurações de Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input defaultValue="Administrador" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input defaultValue="admin@zapchicken.com" />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              Atualizar Perfil
            </Button>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Contas vencendo hoje</span>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span>Contas vencidas</span>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span>Relatórios mensais</span>
              <input type="checkbox" />
            </div>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              Salvar Notificações
            </Button>
          </CardContent>
        </Card>

        {/* Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup e Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Último backup: 15/07/2025 - 03:00
            </div>
            <Button variant="outline" className="w-full">
              Fazer Backup Agora
            </Button>
            <Button variant="outline" className="w-full">
              Restaurar Backup
            </Button>
            <Button variant="destructive" className="w-full">
              Limpar Dados
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}