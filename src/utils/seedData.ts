import { supabase } from "@/integrations/supabase/client";

export const seedDefaultData = async (userId: string) => {
  try {
    console.log('Iniciando inserção de dados padrão para usuário:', userId);
    
    // Verificar se já existem bancos para o usuário
    const { data: existingBancos, error: bancosError } = await supabase
      .from('bancos')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (bancosError) {
      console.error('Erro ao verificar bancos existentes:', bancosError);
      return;
    }

    // Se não existem bancos, inserir os padrões
    if (!existingBancos || existingBancos.length === 0) {
      console.log('Inserindo bancos padrão...');
      const bancosPadrao = [
        { nome: 'INTER', tipo: 'conta_corrente', saldo_inicial: 0, saldo_atual: 0 },
        { nome: 'IFOOD', tipo: 'conta_corrente', saldo_inicial: 0, saldo_atual: 0 },
        { nome: 'CAIXA', tipo: 'conta_corrente', saldo_inicial: 0, saldo_atual: 0 }
      ];

      for (const banco of bancosPadrao) {
        try {
          const { error } = await supabase.from('bancos').insert({
            ...banco,
            user_id: userId,
            ativo: true
          });
          if (error) {
            console.error('Erro ao inserir banco:', banco.nome, error);
          } else {
            console.log('Banco inserido com sucesso:', banco.nome);
          }
        } catch (error) {
          console.error('Erro ao inserir banco:', banco.nome, error);
        }
      }
      console.log('Bancos padrão inseridos com sucesso!');
    } else {
      console.log('Bancos já existem para o usuário');
    }

    // Verificar se já existem modalidades para o usuário
    const { data: existingModalidades, error: modalidadesError } = await supabase
      .from('modalidades_receita')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (modalidadesError) {
      console.error('Erro ao verificar modalidades existentes:', modalidadesError);
      return;
    }

    // Se não existem modalidades, inserir as padrões
    if (!existingModalidades || existingModalidades.length === 0) {
      console.log('Inserindo modalidades padrão...');
      const modalidadesPadrao = [
        { nome: 'Crédito', taxa_percentual: 0 },
        { nome: 'Débito', taxa_percentual: 0 },
        { nome: 'Pix', taxa_percentual: 0 },
        { nome: 'Cortesia', taxa_percentual: 0 },
        { nome: 'Ifood', taxa_percentual: 0 },
        { nome: 'Ifood Voucher', taxa_percentual: 0 },
        { nome: 'Dinheiro', taxa_percentual: 0 }
      ];

      for (const modalidade of modalidadesPadrao) {
        try {
          const { error } = await supabase.from('modalidades_receita').insert({
            ...modalidade,
            user_id: userId,
            data_efetivacao: '2025-01-01',
            ativo: true
          });
          if (error) {
            console.error('Erro ao inserir modalidade:', modalidade.nome, error);
          } else {
            console.log('Modalidade inserida com sucesso:', modalidade.nome);
          }
        } catch (error) {
          console.error('Erro ao inserir modalidade:', modalidade.nome, error);
        }
      }
      console.log('Modalidades padrão inseridas com sucesso!');
    } else {
      console.log('Modalidades já existem para o usuário');
    }

    console.log('Dados padrão inseridos com sucesso!');
  } catch (error) {
    console.error('Erro ao inserir dados padrão:', error);
  }
}; 