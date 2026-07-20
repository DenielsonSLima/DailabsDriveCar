
import { supabase } from '../../../lib/supabase';
import { IEmpresa, IBrasilAPICNPJ } from './empresa.types';

const TABLE = 'config_empresa';

const normalizeOrgId = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
};

export const EmpresaService = {
  async getCurrentOrganizationId(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();

    const metadataOrgId = normalizeOrgId((session?.user as any)?.app_metadata?.organization_id);
    const userId = session?.user?.id;

    if (!userId) return null;

    const { data: members, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .not('organization_id', 'is', null);

    const memberOrgIds = (members || [])
      .map((m: any) => normalizeOrgId(m?.organization_id))
      .filter(Boolean) as string[];

    if (!memberError && metadataOrgId && memberOrgIds.includes(metadataOrgId)) {
      return metadataOrgId;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .limit(1)
      .maybeSingle();

    const profileOrgId = normalizeOrgId((profile as any)?.organization_id);

    if (!profileError && profileOrgId && metadataOrgId && profileOrgId === metadataOrgId) {
      return metadataOrgId;
    }

    if (profileOrgId) {
      return profileOrgId;
    }

    if (!memberError && memberOrgIds.length > 0) {
      return memberOrgIds[0];
    }

    if (metadataOrgId) {
      return metadataOrgId;
    }
  },

  /**
   * Busca o registro único da empresa.
   * Se não existir, retorna null (o formulário tratará como criação).
   */
  async getDadosEmpresa(organizationId?: string): Promise<IEmpresa | null> {
    const orgId = organizationId || await this.getCurrentOrganizationId();
    let query = supabase.from(TABLE).select('*');

    if (orgId) {
      query = query.eq('organization_id', orgId);
    } else {
      query = query.is('organization_id', null);
    }

    const { data, error } = await query
      .limit(1)
      .maybeSingle();


    if (error) {
      // Código PGRST116 significa que não encontrou linhas (normal para primeiro acesso)
      if (error.code !== 'PGRST116') {
        console.error('Erro ao buscar dados da empresa:', error);
      }
      return null;
    }
    
    return data as IEmpresa;
  },

  /**
   * Salva ou atualiza os dados da empresa.
   * Usa UPSERT para garantir registro único se passarmos o ID, 
   * ou INSERT se for novo.
   */
  async saveDadosEmpresa(payload: Partial<IEmpresa>): Promise<IEmpresa> {
    // Verificamos se já existe um registro para não duplicar se o payload vier sem ID
    let idToUpdate = payload.id;
    const resolvedOrgId = payload.organization_id || await this.getCurrentOrganizationId();
    
    if (!idToUpdate) {
      const existing = await this.getDadosEmpresa(resolvedOrgId || undefined);
      if (existing) {
        idToUpdate = existing.id;
      }
    }

    const dataToSave = {
      ...payload,
      id: idToUpdate, // Se undefined, o Supabase gera novo UUID (Insert), se tiver ID, faz Update
      organization_id: payload.organization_id || resolvedOrgId || undefined,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(dataToSave)
      .select()
      .single();

    if (error) throw error;
    return data as IEmpresa;
  },

  /**
   * Integração com BrasilAPI para autocompletar dados pelo CNPJ
   */
  async consultarCNPJ(cnpj: string): Promise<Partial<IEmpresa> | null> {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return null;

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (!response.ok) throw new Error('CNPJ não encontrado');
      
      const data: IBrasilAPICNPJ = await response.json();
      
      return {
        cnpj: data.cnpj,
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || data.razao_social,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cep: data.cep,
        uf: data.uf,
        cidade: data.municipio,
        email: data.email,
        telefone: data.ddd_telefone_1
      };
    } catch (error) {
      console.error('Erro na consulta de CNPJ:', error);
      return null;
    }
  },

  /**
   * Escuta mudanças em tempo real na tabela de configuração da empresa.
   */
  subscribe(onUpdate: () => void) {
    return supabase
      .channel('public:config_empresa_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE },
        () => onUpdate()
      )
      .subscribe();
  }
};
