import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, User, Bell, Database, Download, Upload, Mail, Cloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toISODateLocal } from "@/utils/date";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Configuracoes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupEmail, setBackupEmail] = useState("");
  const [backupType, setBackupType] = useState<"local" | "gmail" | "dropbox">("local");

  // Função para gerar backup completo dos dados
  const gerarBackup = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    setBackupLoading(true);
    try {
      // Buscar todos os dados do usuário
      const [
        { data: receitas },
        { data: contasPagar },
        { data: categorias },
        { data: fornecedores },
        { data: bancos }
      ] = await Promise.all([
        supabase.from('receitas').select('*').eq('user_id', user.id),
        supabase.from('contas_pagar').select('*').eq('user_id', user.id),
        supabase.from('categorias').select('*').eq('user_id', user.id),
        supabase.from('fornecedores').select('*').eq('user_id', user.id),
        supabase.from('bancos').select('*').eq('ativo', true).eq('user_id', user.id)
      ]);

      const backupData = {
        timestamp: new Date().toISOString(),
        user_id: user.id,
        receitas: receitas || [],
        contas_pagar: contasPagar || [],
        categorias: categorias || [],
        fornecedores: fornecedores || [],
        bancos: bancos || [],
        metadata: {
          total_receitas: receitas?.length || 0,
          total_contas_pagar: contasPagar?.length || 0,
          total_categorias: categorias?.length || 0,
          total_fornecedores: fornecedores?.length || 0,
          total_bancos: bancos?.length || 0
        }
      };

      // Criar arquivo JSON
      const jsonContent = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });

      if (backupType === "local") {
        // Download local
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `zapfinance_backup_${toISODateLocal(new Date())}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Sucesso",
          description: "Backup gerado e baixado com sucesso!",
        });
      } else if (backupType === "gmail") {
        // Enviar por email
        if (!backupEmail) {
          toast({
            title: "Erro",
            description: "Digite um email para envio",
            variant: "destructive"
          });
          return;
        }

        // Aqui você pode integrar com Gmail API ou usar um serviço de email
        // Por enquanto, vamos simular o envio
        toast({
          title: "Backup por Email",
          description: `Backup será enviado para ${backupEmail}. Funcionalidade em desenvolvimento.`,
        });
      } else if (backupType === "dropbox") {
        // Integração com Dropbox
        toast({
          title: "Backup para Dropbox",
          description: "Funcionalidade de integração com Dropbox em desenvolvimento.",
        });
      }

    } catch (error) {
      console.error('Erro ao gerar backup:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar backup",
        variant: "destructive"
      });
    } finally {
      setBackupLoading(false);
    }
  };

  // Função para restaurar backup
  const restaurarBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setRestoreLoading(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      // Validar estrutura do backup
      if (!backupData.receitas || !backupData.contas_pagar) {
        throw new Error("Arquivo de backup inválido");
      }

      // Aqui você implementaria a lógica de restauração
      // Por segurança, vamos apenas mostrar uma confirmação
      toast({
        title: "Restauração",
        description: "Funcionalidade de restauração em desenvolvimento. Arquivo validado com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast({
        title: "Erro",
        description: "Erro ao restaurar backup. Verifique se o arquivo é válido.",
        variant: "destructive"
      });
    } finally {
      setRestoreLoading(false);
    }
  };

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
              Último backup: {new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            
            {/* Tipo de Backup */}
            <div className="space-y-2">
              <Label>Destino do Backup</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={backupType === "local" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBackupType("local")}
                  className="flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Local
                </Button>
                <Button
                  type="button"
                  variant={backupType === "gmail" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBackupType("gmail")}
                  className="flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  Gmail
                </Button>
                <Button
                  type="button"
                  variant={backupType === "dropbox" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBackupType("dropbox")}
                  className="flex items-center gap-1"
                >
                  <Cloud className="h-3 w-3" />
                  Dropbox
                </Button>
              </div>
            </div>

            {/* Campo de email para Gmail */}
            {backupType === "gmail" && (
              <div className="space-y-2">
                <Label>Email para envio</Label>
                <Input
                  type="email"
                  placeholder="seu-email@gmail.com"
                  value={backupEmail}
                  onChange={(e) => setBackupEmail(e.target.value)}
                />
              </div>
            )}

            {/* Botões de ação */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={gerarBackup}
              disabled={backupLoading}
            >
              {backupLoading ? (
                "Gerando Backup..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Fazer Backup Agora
                </>
              )}
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={restaurarBackup}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={restoreLoading}
              />
              <Button 
                variant="outline" 
                className="w-full"
                disabled={restoreLoading}
              >
                {restoreLoading ? (
                  "Restaurando..."
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Restaurar Backup
                  </>
                )}
              </Button>
            </div>

            <Button variant="destructive" className="w-full">
              Limpar Dados
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}