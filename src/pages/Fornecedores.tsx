import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    cnpj_cpf: "",
    endereco: ""
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchFornecedores();
    getUser();
  }, []);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  };

  const fetchFornecedores = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('fornecedores').select('*').order('created_at', { ascending: false });
    if (!error) setFornecedores(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Você precisa estar logado para cadastrar fornecedores.");
      return;
    }
    if (editId) {
      // Edição
      const { error } = await supabase.from('fornecedores').update({
        user_id: user.id,
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email,
        cnpj_cpf: formData.cnpj_cpf,
        endereco: formData.endereco
      }).eq('id', editId);
      if (!error) {
        setIsDialogOpen(false);
        setFormData({ nome: "", telefone: "", email: "", cnpj_cpf: "", endereco: "" });
        setEditId(null);
        fetchFornecedores();
      } else {
        alert("Erro ao editar fornecedor: " + error.message);
      }
    } else {
      // Cadastro
      const { error } = await supabase.from('fornecedores').insert({
        user_id: user.id,
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email,
        cnpj_cpf: formData.cnpj_cpf,
        endereco: formData.endereco
      });
      if (!error) {
        setIsDialogOpen(false);
        setFormData({ nome: "", telefone: "", email: "", cnpj_cpf: "", endereco: "" });
        fetchFornecedores();
      } else {
        alert("Erro ao cadastrar fornecedor: " + error.message);
      }
    }
  };

  const handleEdit = (fornecedor: any) => {
    setFormData({
      nome: fornecedor.nome || "",
      telefone: fornecedor.telefone || "",
      email: fornecedor.email || "",
      cnpj_cpf: fornecedor.cnpj_cpf || "",
      endereco: fornecedor.endereco || ""
    });
    setEditId(fornecedor.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este fornecedor?")) return;
    const { error } = await supabase.from('fornecedores').delete().eq('id', id);
    if (!error) {
      fetchFornecedores();
    } else {
      alert("Erro ao excluir fornecedor: " + error.message);
    }
  };

  const filteredFornecedores = fornecedores.filter(fornecedor =>
    String(fornecedor.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(fornecedor.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(fornecedor.telefone || "").includes(searchTerm)
  );

  const formatWhatsApp = (telefone: string) => {
    const numbers = telefone.replace(/\D/g, '');
    if (numbers.length >= 10) {
      return `https://wa.me/55${numbers}`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie seus fornecedores e contatos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setFormData({ nome: "", telefone: "", email: "", cnpj_cpf: "", endereco: "" });
            setEditId(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              {editId ? "Editar Fornecedor" : "Novo Fornecedor"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Fornecedor" : "Cadastrar Novo Fornecedor"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="nomeFornecedor">Nome do Fornecedor</Label>
                <Input
                  id="nomeFornecedor"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Distribuidora ABC Ltda"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="exemplo@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj_cpf">CNPJ/CPF</Label>
                <Input
                  id="cnpj_cpf"
                  value={formData.cnpj_cpf}
                  onChange={e => setFormData({ ...formData, cnpj_cpf: e.target.value })}
                  placeholder="CNPJ ou CPF"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Endereço completo"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  {editId ? "Salvar Alterações" : "Salvar"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setIsDialogOpen(false); setEditId(null); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Card de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {fornecedores.length}
            </div>
            <p className="text-xs text-muted-foreground">fornecedores cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Com WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {fornecedores.filter(f => formatWhatsApp(f.telefone)).length}
            </div>
            <p className="text-xs text-muted-foreground">contatos diretos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Novos Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {fornecedores.filter(f => String(f.data_cadastro || "").includes("07/2025")).length}
            </div>
            <p className="text-xs text-muted-foreground">cadastrados em julho</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisar Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do fornecedor, contato ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Nome do Fornecedor</th>
                  <th className="text-left p-4 font-medium">Telefone</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">CNPJ/CPF</th>
                  <th className="text-left p-4 font-medium">Endereço</th>
                  <th className="text-center p-4 font-medium">Data do Cadastro</th>
                  <th className="text-center p-4 font-medium">WhatsApp</th>
                  <th className="text-center p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredFornecedores.map((fornecedor) => (
                  <tr key={fornecedor.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{fornecedor.nome}</td>
                    <td className="p-4">{fornecedor.telefone}</td>
                    <td className="p-4">{fornecedor.email}</td>
                    <td className="p-4">{fornecedor.cnpj_cpf}</td>
                    <td className="p-4">{fornecedor.endereco}</td>
                    <td className="p-4 text-center">{fornecedor.data_cadastro ? new Date(fornecedor.data_cadastro).toLocaleDateString('pt-BR') : "-"}</td>
                    <td className="p-4 text-center">
                      {formatWhatsApp(fornecedor.telefone) ? (
                        <a
                          href={formatWhatsApp(fornecedor.telefone)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2"
                        >
                          WhatsApp
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(fornecedor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(fornecedor.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredFornecedores.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum fornecedor encontrado com os critérios de busca.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}