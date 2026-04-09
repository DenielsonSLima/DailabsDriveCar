import { supabase } from '../../../lib/supabase';

export interface LogEntry {
  id: string;
  created_at: string;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  user_id: string | null;
  old_data: any;
  new_data: any;
  organization_id: string;
  profiles?: {
    nome: string;
    sobrenome?: string;
    email: string;
  };
  // Campos traduzidos para a UI
  translated_table?: string;
  translated_action?: string;
  summary?: string;
  user_display_name?: string;
}

const TABLE_LABELS: Record<string, string> = {
  fin_titulos: 'Contas a Pagar/Receber',
  est_veiculos: 'Estoque de Veículos',
  fin_contas_bancarias: 'Contas Bancárias',
  cmp_pedidos: 'Pedidos de Compra',
  fin_transacoes: 'Movimentação Financeira',
  venda_pedidos: 'Pedidos de Venda',
  fin_retiradas: 'Retiradas de Sócios',
  est_veiculos_despesas: 'Custo de Veículo (Despesa)',
  fin_transferencias: 'Transferência Bancária',
  profiles: 'Cadastro de Usuário',
  organization_members: 'Equipe'
};

const ACTION_LABELS: Record<string, string> = {
  INSERT: 'Criação',
  UPDATE: 'Alteração',
  DELETE: 'Exclusão'
};

function generateSummary(log: any): string {
  const table = TABLE_LABELS[log.table_name] || log.table_name;
  
  if (log.action === 'INSERT') return `Novo registro em ${table}`;
  if (log.action === 'DELETE') return `Remoção em ${table}`;
  
  // Resumos simplificados para UPDATE
  if (log.action === 'UPDATE' && log.new_data) {
    const keys = Object.keys(log.new_data);
    if (keys.includes('valor') || keys.includes('valor_total')) return `Alteração de valor em ${table}`;
    if (keys.includes('status') || keys.includes('situacao')) return `Mudança de status em ${table}`;
    if (keys.includes('data_pagamento') || keys.includes('data_baixa') || keys.includes('pago')) return `Lançamento de pagamento em ${table}`;
    if (keys.includes('km') || keys.includes('quilometragem')) return `Atualização de KM em ${table}`;
  }
  
  return `Atualização em ${table}`;
}

export const LogsService = {
  async fetchLogs(limit = 100): Promise<LogEntry[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, profiles(nome, sobrenome, email)')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;

    return (data || []).map(log => ({
      ...log,
      translated_table: TABLE_LABELS[log.table_name] || log.table_name,
      translated_action: ACTION_LABELS[log.action] || log.action,
      summary: generateSummary(log),
      user_display_name: log.profiles 
        ? `${log.profiles.nome} ${log.profiles.sobrenome || ''}`.trim()
        : 'Sistema (Automático)'
    })) as LogEntry[];
  }
};
