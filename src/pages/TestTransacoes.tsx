import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toISODateLocal } from "@/utils/date";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Banco {
  id: string;
  nome: string;
}

export default function TestTransacoes() {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    banco_id: "",
    descricao: "",
    valor: "",
    tipo: "receita" as 'receita' | 'despesa' | 'transferencia',
    data_transacao: toISODateLocal(new Date()),
    status: "efetivada" as 'pendente' | 'efetivada' | 'cancelada',
    observacoes: ""
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchBancos();
    }
  }, [user]);

  const fetchBancos = async () => {
    const { data } = await supabase
      .from('bancos')
      .select('id, nome')
      .eq('ativo', true)
      .eq('user_id', user?.id)
      .order('nome');
    setBancos(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.banco_id || !formData.descricao || !formData.valor) {
      toast({
        title: "Aviso",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const valor = parseFloat(formData.valor);
    if (isNaN(valor)) {
      toast({
        title: "Aviso",
        description: "Valor deve ser um número válido",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('transacoes')
        .insert({
          user_id: user?.id,
          banco_id: formData.banco_id,
          descricao: formData.descricao,
          valor: valor,
          tipo: formData.tipo,
          data_transacao: formData.data_transacao,
          status: formData.status,
          observacoes: formData.observacoes || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transação criada com sucesso!",
      });

      // Limpar formulário
      setFormData({
        banco_id: "",
        descricao: "",
        valor: "",
        tipo: "receita",
        data_transacao: toISODateLocal(new Date()),
        status: "efetivada",
        observacoes: ""
      });
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar transação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Criar Transação de Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="banco">Banco *</Label>
              <Select value={formData.banco_id} onValueChange={(value) => 
                setFormData({...formData, banco_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um banco" />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map(banco => (
                    <SelectItem key={banco.id} value={banco.id}>
                      {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Ex: Venda de produtos"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({...formData, valor: e.target.value})}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value: 'receita' | 'despesa' | 'transferencia') => 
                  setFormData({...formData, tipo: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data_transacao}
                  onChange={(e) => setFormData({...formData, data_transacao: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value: 'pendente' | 'efetivada' | 'cancelada') => 
                  setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="efetivada">Efetivada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Criando..." : "Criar Transação"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
