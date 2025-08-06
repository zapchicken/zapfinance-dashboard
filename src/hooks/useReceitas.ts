import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const fetchReceitas = async (userId: string) => {
  console.log('🔄 Buscando receitas para usuário:', userId);
  
  const { data, error } = await supabase
    .from("contas_receber")
    .select("*")
    .eq("user_id", userId)
    .order("data_vencimento", { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar receitas:', error);
    throw new Error(error.message);
  }

  console.log('✅ Receitas carregadas:', data?.length || 0);
  console.log('📋 Exemplo de receita:', data?.[0]);
  
  return data || [];
};

export const useReceitas = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["receitas", user?.id],
    queryFn: () => fetchReceitas(user!.id),
    enabled: !!user,
  });
};
