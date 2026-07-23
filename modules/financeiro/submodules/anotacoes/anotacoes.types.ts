export interface IAnotacao {
  id: string;
  organization_id: string;
  data: string; // DATE format: YYYY-MM-DD
  descricao: string;
  valor: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IAnotacaoForm {
  data: string;
  descricao: string;
  valor: string; // string no formulário para aceitar vazio
}
