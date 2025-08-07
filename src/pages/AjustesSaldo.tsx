import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Banco {
  id: string;
  nome: string;
  saldo_atual: number;
  saldo_inicial: number;
}

interface AjusteSaldo {
  id: string;
  banco_id: string;
  saldo_anterior: number;
  saldo_novo: number;
  diferenca: number;
  motivo: string;
  observacoes?: string;
  data_ajuste: string;
  banco: {
    nome: string;
  };
}

export default function AjustesSaldo() {
  console.log('🔄 Componente AjustesSaldo renderizado');
  
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [ajustes, setAjustes] = useState<AjusteSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBanco, setSelectedBanco] = useState<string>("");
  const [saldoAtual, setSaldoAtual] = useState<number>(0);
  const [saldoNovo, setSaldoNovo] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔄 useEffect executado, user:', user);
    if (!user) {
      console.log('❌ Usuário não autenticado');
      return;
    }
    console.log('✅ Usuário autenticado, chamando fetchData');
    fetchData();
  }, [user]);

  const fetchData = async () => {
    console.log('🔄 Iniciando fetchData...');
    setLoading(true);
    try {
      // Buscar bancos
      console.log('📊 Buscando bancos...');
      const { data: bancosData, error: bancosError } = await supabase
        .from('bancos')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      if (bancosError) {
        console.error('❌ Erro ao buscar bancos:', bancosError);
        throw bancosError;
      }
      
      console.log('✅ Bancos carregados:', bancosData);
      console.log('💰 Saldos dos bancos:', bancosData?.map(b => ({
        nome: b.nome,
        saldo_atual: b.saldo_atual,
        saldo_inicial: b.saldo_inicial
      })));
      console.log('📊 Dados completos dos bancos:', JSON.stringify(bancosData, null, 2));
      setBancos(bancosData || []);

      // Buscar ajustes
      console.log('📊 Buscando ajustes...');
      const { data: ajustesData, error: ajustesError } = await (supabase as any)
        .from('ajustes_saldo')
        .select(`
          *,
          banco: bancos(nome)
        `)
        .order('data_ajuste', { ascending: false });
      
      if (ajustesError) {
        console.error('❌ Erro ao buscar ajustes:', ajustesError);
        throw ajustesError;
      }
      
      console.log('✅ Ajustes carregados:', ajustesData);
      setAjustes(ajustesData || [] as any);
      
      console.log('✅ fetchData concluído com sucesso');
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBancoChange = (bancoId: string) => {
    setSelectedBanco(bancoId);
    const banco = bancos.find(b => b.id === bancoId);
    if (banco) {
      setSaldoAtual(banco.saldo_atual);
      setSaldoNovo(banco.saldo_atual.toString());
    }
  };

  const handleSubmit = async () => {
    if (!selectedBanco || !saldoNovo || !motivo) {
      toast({
        title: "Aviso",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const saldoNovoNum = parseFloat(saldoNovo);
    if (isNaN(saldoNovoNum)) {
      toast({
        title: "Aviso",
        description: "Saldo novo deve ser um número válido",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const diferenca = saldoNovoNum - saldoAtual;
      
      const { error } = await (supabase as any)
        .from('ajustes_saldo')
        .insert({
          user_id: user?.id,
          banco_id: selectedBanco,
          saldo_anterior: saldoAtual,
          saldo_novo: saldoNovoNum,
          diferenca: diferenca,
          motivo: motivo,
          observacoes: observacoes || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ajuste de saldo realizado com sucesso!",
      });

      // Limpar formulário
      setSelectedBanco("");
      setSaldoAtual(0);
      setSaldoNovo("");
      setMotivo("");
      setObservacoes("");
      setDialogOpen(false);

      // Recarregar dados
      await fetchData();
    } catch (error) {
      console.error('Erro ao realizar ajuste:', error);
      toast({
        title: "Erro",
        description: "Erro ao realizar ajuste de saldo",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ajustes de Saldo</h1>
          <p className="text-muted-foreground">Gerencie os saldos das contas bancárias</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Ajuste
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Ajuste de Saldo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="banco">Banco</Label>
                <Select value={selectedBanco} onValueChange={handleBancoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {bancos.map(banco => (
                      <SelectItem key={banco.id} value={banco.id}>
                        {banco.nome} - {formatCurrency(banco.saldo_atual)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBanco && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="saldo-atual">Saldo Atual</Label>
                    <Input
                      id="saldo-atual"
                      value={formatCurrency(saldoAtual)}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="saldo-novo">Novo Saldo</Label>
                    <Input
                      id="saldo-novo"
                      type="number"
                      step="0.01"
                      value={saldoNovo}
                      onChange={(e) => setSaldoNovo(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              )}

              {selectedBanco && saldoNovo && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Diferença: {formatCurrency(parseFloat(saldoNovo) - saldoAtual)}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="motivo">Motivo do Ajuste *</Label>
                <Select value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conciliacao">Conciliação Bancária</SelectItem>
                    <SelectItem value="erro_sistema">Erro do Sistema</SelectItem>
                    <SelectItem value="taxa_nao_registrada">Taxa Não Registrada</SelectItem>
                    <SelectItem value="transferencia_nao_registrada">Transferência Não Registrada</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Detalhes adicionais sobre o ajuste..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Salvando..." : "Confirmar Ajuste"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo dos Bancos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bancos.map(banco => (
          <Card key={banco.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                {banco.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Saldo Atual:</span>
                  <span className="font-bold">{formatCurrency(banco.saldo_atual)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Saldo Inicial:</span>
                  <span className="text-sm">{formatCurrency(banco.saldo_inicial)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Histórico de Ajustes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Ajustes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ajustes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum ajuste realizado ainda
              </div>
            ) : (
              ajustes.map(ajuste => (
                <div key={ajuste.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{ajuste.banco.nome}</div>
                      <div className="text-sm text-muted-foreground">
                        {ajuste.motivo} • {formatDate(ajuste.data_ajuste)}
                      </div>
                      {ajuste.observacoes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {ajuste.observacoes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {ajuste.diferenca > 0 ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          +{formatCurrency(ajuste.diferenca)}
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <TrendingDown className="h-4 w-4" />
                          {formatCurrency(ajuste.diferenca)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(ajuste.saldo_anterior)} → {formatCurrency(ajuste.saldo_novo)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 