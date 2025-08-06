import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const fetchContasPagar = async (userId: string) => {
  console.log('🔄 Buscando contas a pagar para usuário:', userId);
  
  const { data, error } = await supabase
    .from("contas_pagar")
    .select("*")
    .eq("user_id", userId)
    .order("data_vencimento", { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar contas a pagar:', error);
    throw new Error(error.message);
  }

  console.log('✅ Contas a pagar carregadas:', data?.length || 0);
  console.log('📋 Exemplo de conta a pagar:', data?.[0]);
  
  return data || [];
};

export const useContasPagar = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["contasPagar", user?.id],
    queryFn: () => fetchContasPagar(user!.id),
    enabled: !!user,
  });
}; 