import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ExternalLink, RefreshCw, ShieldCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { MarketingAdsService, Platform } from '../marketing-ads.service';
import { EmpresaService } from '../../ajustes/empresa/empresa.service';
import { invalidateMarketingIntegracoes } from '../marketing.query-invalidation';

interface MarketingConnectModalProps {
  platform: Platform;
  isAuthorizing?: boolean;
  onClose: () => void;
  onAuthorize: () => void;
}

const providerCopy: Record<Platform, {
  title: string;
  subtitle: string;
  action: string;
  accent: string;
  panel: string;
}> = {
  FACEBOOK: {
    title: 'Conectar Meta Ads',
    subtitle: 'Facebook e Instagram usam a mesma conta de anúncios da Meta.',
    action: 'Entrar com Facebook',
    accent: 'from-[#1877F2] to-[#0d5dbf]',
    panel: 'bg-[#1877F2]/10 text-[#1877F2]',
  },
  INSTAGRAM: {
    title: 'Conectar Meta Ads',
    subtitle: 'Instagram Ads é vinculado pelo login do Facebook/Meta Business.',
    action: 'Entrar com Facebook',
    accent: 'from-[#E4405F] via-[#C13584] to-[#833AB4]',
    panel: 'bg-[#E4405F]/10 text-[#C13584]',
  },
  GOOGLE: {
    title: 'Conectar Google Ads',
    subtitle: 'A autorização do Google lista as contas de anúncio acessíveis.',
    action: 'Entrar com Google',
    accent: 'from-[#4285F4] to-[#1a73e8]',
    panel: 'bg-[#4285F4]/10 text-[#1a73e8]',
  },
};

const MarketingConnectModal: React.FC<MarketingConnectModalProps> = ({
  platform,
  isAuthorizing = false,
  onClose,
  onAuthorize,
}) => {
  const queryClient = useQueryClient();
  const copy = providerCopy[platform];
  const oauthConfig = MarketingAdsService.buildOAuthAuthorizationUrl(platform, false);

  const [connectionMode, setConnectionMode] = useState<'oauth' | 'manual'>('manual');
  const [accountName, setAccountName] = useState('');
  const [adAccountId, setAdAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [facebookPageId, setFacebookPageId] = useState('');
  const [instagramAccountId, setInstagramAccountId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim() || !adAccountId.trim() || !accessToken.trim()) {
      toast.error('Por favor, preencha os campos obrigatórios (Nome, ID da Conta e Token).');
      return;
    }

    setIsSaving(true);
    try {
      const empresa = await EmpresaService.getDadosEmpresa();
      if (!empresa || !empresa.organization_id) {
        throw new Error('Não foi possível recuperar a organização ativa do sistema.');
      }

      await MarketingAdsService.saveIntegracao({
        platform,
        account_name: accountName.trim(),
        ad_account_id: adAccountId.trim(),
        access_token: accessToken.trim(),
        facebook_page_id: facebookPageId.trim() || null,
        instagram_account_id: instagramAccountId.trim() || null,
        organization_id: empresa.organization_id,
        status: 'CONECTADO',
        moeda: 'BRL',
        saldo_disponivel: platform === 'GOOGLE' ? null : 0,
      });

      invalidateMarketingIntegracoes(queryClient);
      toast.success('Conexão com a conta configurada com sucesso!');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Ocorreu um erro ao salvar as credenciais manuais.');
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
      style={{ width: '100vw', height: '100dvh', minHeight: '100dvh' }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className={`h-2 bg-gradient-to-r ${copy.accent}`} />
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">{copy.title}</h2>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">{copy.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Connection Mode Tabs */}
          <div className="mb-5 flex gap-2 border-b border-slate-100 pb-2">
            <button
              type="button"
              onClick={() => setConnectionMode('manual')}
              className={`flex-1 pb-2 text-center text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                connectionMode === 'manual'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Configuração Manual (Recomendado)
            </button>
            <button
              type="button"
              onClick={() => setConnectionMode('oauth')}
              className={`flex-1 pb-2 text-center text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                connectionMode === 'oauth'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Conexão Automática (OAuth)
            </button>
          </div>

          {connectionMode === 'oauth' ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${copy.panel}`}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Autorização segura</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      O ERP redireciona para a plataforma oficial. E-mail, senha, conta de anúncios e permissões são tratados pela Meta ou Google.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${copy.panel}`}>
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Dados sincronizados</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Nome, ID da conta, saldo, moeda e gastos devem vir da API após o callback de integração, sem preenchimento manual.
                    </p>
                  </div>
                </div>
              </div>

              {oauthConfig.missingEnv.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-amber-900">Configuração pendente</p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                    Configure {oauthConfig.missingEnv.join(', ')} e o callback {oauthConfig.redirectUri} para liberar o redirecionamento real.
                  </p>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl bg-slate-100 py-3 text-xs font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onAuthorize}
                  disabled={isAuthorizing}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${copy.accent} py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-60`}
                >
                  {isAuthorizing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  {copy.action}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveManual} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Nome da Conta de Anúncios <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hidrocar Ads"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  {platform === 'GOOGLE' ? 'ID da Conta Google Ads' : 'ID da Conta de Anúncios (Ad Account ID)'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={platform === 'GOOGLE' ? 'Ex: 123-456-7890' : 'Ex: act_123456789012345'}
                  value={adAccountId}
                  onChange={e => setAdAccountId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Token de Acesso (Access Token) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Cole aqui o token de acesso de desenvolvedor ou usuário do sistema"
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {(platform === 'FACEBOOK' || platform === 'INSTAGRAM') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      ID da Página FB (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 1029384756"
                      value={facebookPageId}
                      onChange={e => setFacebookPageId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      ID Conta Instagram (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 5647382910"
                      value={instagramAccountId}
                      onChange={e => setInstagramAccountId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <p className="text-[9px] font-black text-indigo-950 uppercase tracking-widest mb-1">Como obter as credenciais?</p>
                <p className="text-[10px] text-indigo-800 leading-relaxed">
                  Você pode gerar o Token de Acesso permanente criando um Usuário de System em seu Gerenciador de Negócios (Business Manager) da Meta ou gerá-lo no portal <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="underline font-black text-indigo-950">developers.facebook.com</a>.
                </p>
              </div>

              <div className="mt-6 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl bg-slate-100 py-3 text-xs font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${copy.accent} py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-60`}
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Salvar Conexão
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default MarketingConnectModal;
