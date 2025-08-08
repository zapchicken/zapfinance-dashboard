import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase (substitua pelas suas credenciais)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function ajustarSaldoTONI() {
  try {
    console.log('🔍 Buscando banco TON I...');
    
    // Buscar o banco TON I
    const { data: bancos, error: bancosError } = await supabase
      .from('bancos')
      .select('*')
      .or('nome.ilike.%TON I%,nome.ilike.%TONI%')
      .eq('ativo', true);
    
    if (bancosError) {
      console.error('❌ Erro ao buscar bancos:', bancosError);
      return;
    }
    
    console.log('📊 Bancos encontrados:', bancos);
    
    if (!bancos || bancos.length === 0) {
      console.log('❌ Nenhum banco TON I encontrado');
      return;
    }
    
    const bancoTONI = bancos[0];
    console.log('✅ Banco TON I encontrado:', bancoTONI);
    
    const saldoAtual = bancoTONI.saldo_atual || 0;
    const saldoCorreto = 63226.57;
    const diferenca = saldoCorreto - saldoAtual;
    
    console.log('💰 Valores:', {
      saldo_atual: saldoAtual,
      saldo_correto: saldoCorreto,
      diferenca: diferenca
    });
    
    if (Math.abs(diferenca) < 0.01) {
      console.log('✅ Saldo já está correto!');
      return;
    }
    
    // Buscar o primeiro usuário para usar como user_id
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError || !users || users.length === 0) {
      console.log('⚠️ Não foi possível obter usuários, usando ID padrão');
      // Usar um ID padrão ou criar um ajuste sem user_id
      const { error: ajusteError } = await supabase
        .from('ajustes_saldo')
        .insert({
          banco_id: bancoTONI.id,
          saldo_anterior: saldoAtual,
          saldo_novo: saldoCorreto,
          diferenca: diferenca,
          motivo: 'Ajuste manual para corrigir saldo',
          observacoes: 'Ajuste realizado para corrigir discrepância no saldo do banco TON I',
          data_ajuste: new Date().toISOString()
        });
      
      if (ajusteError) {
        console.error('❌ Erro ao criar ajuste:', ajusteError);
        return;
      }
    } else {
      const userId = users[0].id;
      console.log('👤 Usando usuário:', userId);
      
      // Criar o ajuste de saldo
      const { error: ajusteError } = await supabase
        .from('ajustes_saldo')
        .insert({
          user_id: userId,
          banco_id: bancoTONI.id,
          saldo_anterior: saldoAtual,
          saldo_novo: saldoCorreto,
          diferenca: diferenca,
          motivo: 'Ajuste manual para corrigir saldo',
          observacoes: 'Ajuste realizado para corrigir discrepância no saldo do banco TON I',
          data_ajuste: new Date().toISOString()
        });
      
      if (ajusteError) {
        console.error('❌ Erro ao criar ajuste:', ajusteError);
        return;
      }
    }
    
    console.log('✅ Ajuste de saldo criado com sucesso!');
    console.log('💰 Saldo do banco TON I ajustado para R$ 63.226,57');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar o script
ajustarSaldoTONI(); 