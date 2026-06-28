import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { EstoqueService } from '../estoque/estoque.service';
import { EmpresaService } from '../ajustes/empresa/empresa.service';
import { CidadesService } from '../cadastros/cidades/cidades.service';
import {
  INovoAnuncioPayload,
  MarketingAdsService,
  Platform,
  PublicoConfig,
  RegiaoConfig,
} from './marketing-ads.service';
import {
  invalidateMarketingCampanhas,
} from './marketing.query-invalidation';
import MarketingVehicleSelection from './components/MarketingVehicleSelection';

type Step = 1 | 2 | 3 | 4 | 5 | 6;
type BudgetByPlatform = Record<Platform, number>;

interface CampanhaTemplate {
  key: string;
  label: string;
  descricao: string;
  badge: string;
  objetivo: string;
  resultado: string;
  regiaoTipo: RegiaoConfig['tipo'];
  ufs: string[];
  publico: string;
  interesses: string[];
  orcamento: number;
  duracao: number;
  plataformas: Platform[];
}

const PLATFORMS: { key: Platform; label: string; color: string; canais: string; icon: React.ReactNode }[] = [
  {
    key: 'FACEBOOK',
    label: 'Facebook',
    color: '#1877F2',
    canais: 'Feed, Reels, Marketplace e Messenger',
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
  },
  {
    key: 'INSTAGRAM',
    label: 'Instagram',
    color: '#E4405F',
    canais: 'Feed, Stories, Reels e Explore',
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4z" /></svg>,
  },
  {
    key: 'GOOGLE',
    label: 'Google',
    color: '#4285F4',
    canais: 'Pesquisa, Display, YouTube e Discovery',
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
  },
];

const OBJECTIVES = [
  { key: 'REACH', label: 'Alcance', descricao: 'Mostrar para o máximo de pessoas' },
  { key: 'ENGAGEMENT', label: 'Engajamento', descricao: 'Curtidas, comentários e compartilhamentos' },
  { key: 'TRAFFIC', label: 'Tráfego', descricao: 'Levar visitas ao site ou WhatsApp' },
  { key: 'LEADS', label: 'Leads', descricao: 'Capturar contatos interessados' },
];

const RESULTADOS = [
  { key: 'LEADS_WHATSAPP', label: 'Leads no WhatsApp', descricao: 'Conversas de compradores interessados' },
  { key: 'VISITAS_LOJA', label: 'Visitas à loja', descricao: 'Atrair pessoas da região para atendimento presencial' },
  { key: 'SIMULACOES', label: 'Simulações', descricao: 'Pedidos de financiamento, troca ou proposta' },
  { key: 'TRAFEGO_SITE', label: 'Tráfego no site', descricao: 'Levar visitantes para estoque público ou página do veículo' },
];

const PUBLICOS = [
  { key: 'COMPRADORES_INTENCAO', label: 'Compradores com intenção', descricao: 'Pessoas pesquisando troca, financiamento ou seminovos' },
  { key: 'FINANCIAMENTO', label: 'Financiamento', descricao: 'Público interessado em parcelas, crédito e aprovação' },
  { key: 'PREMIUM', label: 'Alto padrão', descricao: 'Busca por SUVs, sedãs, caminhonetes e veículos premium' },
  { key: 'RETARGETING', label: 'Remarketing', descricao: 'Quem já interagiu com site, Instagram ou WhatsApp' },
];

const INTERESSES_PADRAO = [
  'Carros usados',
  'Seminovos',
  'Financiamento de veículos',
  'Compra de automóveis',
  'Troca de carro',
  'SUV',
  'Picape',
  'Seguro auto',
];

const NORDESTE_UFS = [
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'MA', nome: 'Maranhão' },
];

const CIDADES_POR_UF: Record<string, string[]> = {
  SE: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão', 'Estância', 'Tobias Barreto', 'Simão Dias', 'Itabaianinha', 'Propriá'],
  AL: ['Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios', 'União dos Palmares', 'Penedo', 'São Miguel dos Campos', 'Coruripe', 'Delmiro Gouveia', 'Santana do Ipanema'],
  BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro', 'Lauro de Freitas', 'Itabuna', 'Ilhéus', 'Teixeira de Freitas', 'Barreiras'],
  PE: ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina', 'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns', 'Vitória de Santo Antão'],
  PB: ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux', 'Sousa', 'Cajazeiras', 'Cabedelo', 'Guarabira', 'Sapé'],
  RN: ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba', 'Ceará-Mirim', 'Caicó', 'Açu', 'Currais Novos', 'Nova Cruz'],
  CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá'],
  PI: ['Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano', 'Barras', 'Campo Maior', 'União', 'Altos', 'Pedro II'],
  MA: ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias', 'Codó', 'Paço do Lumiar', 'Açailândia', 'Bacabal', 'Balsas'],
};

const CAMPANHA_TEMPLATES: CampanhaTemplate[] = [
  {
    key: 'vendas-sergipe',
    label: 'Vendas de carros - Sergipe',
    descricao: 'Modelo direto para captar compradores em Sergipe com foco em WhatsApp e estoque disponível.',
    badge: 'Mais usado',
    objetivo: 'LEADS',
    resultado: 'LEADS_WHATSAPP',
    regiaoTipo: 'ESTADO',
    ufs: ['SE'],
    publico: 'COMPRADORES_INTENCAO',
    interesses: ['Carros usados', 'Seminovos', 'Financiamento de veículos', 'Troca de carro', 'Compra de automóveis'],
    orcamento: 50,
    duracao: 7,
    plataformas: ['FACEBOOK', 'INSTAGRAM'],
  },
  {
    key: 'nordeste-expansao',
    label: 'Sergipe + Nordeste próximo',
    descricao: 'Campanha para alcançar compradores em Sergipe, Alagoas e Bahia, ideal para veículos de maior giro.',
    badge: 'Regional',
    objetivo: 'LEADS',
    resultado: 'SIMULACOES',
    regiaoTipo: 'ESTADO',
    ufs: ['SE', 'AL', 'BA'],
    publico: 'FINANCIAMENTO',
    interesses: ['Seminovos', 'Financiamento de veículos', 'Compra de automóveis', 'SUV', 'Picape'],
    orcamento: 90,
    duracao: 14,
    plataformas: ['FACEBOOK', 'INSTAGRAM', 'GOOGLE'],
  },
  {
    key: 'bahia-alagoas',
    label: 'Bahia e Alagoas',
    descricao: 'Template para buscar demanda de compradores de estados vizinhos com intenção de troca ou financiamento.',
    badge: 'Expansão',
    objetivo: 'TRAFFIC',
    resultado: 'TRAFEGO_SITE',
    regiaoTipo: 'ESTADO',
    ufs: ['BA', 'AL'],
    publico: 'COMPRADORES_INTENCAO',
    interesses: ['Carros usados', 'Seminovos', 'Financiamento de veículos', 'Compra de automóveis'],
    orcamento: 80,
    duracao: 10,
    plataformas: ['FACEBOOK', 'GOOGLE'],
  },
  {
    key: 'google-alta-intencao',
    label: 'Pesquisa de alta intenção',
    descricao: 'Para aparecer quando o comprador pesquisa por seminovos, financiamento ou modelo específico.',
    badge: 'Google',
    objetivo: 'TRAFFIC',
    resultado: 'TRAFEGO_SITE',
    regiaoTipo: 'ESTADO',
    ufs: ['SE'],
    publico: 'COMPRADORES_INTENCAO',
    interesses: ['Seminovos', 'Compra de automóveis', 'Financiamento de veículos'],
    orcamento: 80,
    duracao: 15,
    plataformas: ['GOOGLE'],
  },
  {
    key: 'queima-estoque',
    label: 'Queima de estoque parado',
    descricao: 'Comunicação agressiva para carros parados há mais tempo, com chamada para proposta rápida.',
    badge: 'Venda rápida',
    objetivo: 'LEADS',
    resultado: 'LEADS_WHATSAPP',
    regiaoTipo: 'CIDADE',
    ufs: ['SE'],
    publico: 'COMPRADORES_INTENCAO',
    interesses: ['Carros usados', 'Seminovos', 'Troca de carro', 'Compra de automóveis'],
    orcamento: 35,
    duracao: 5,
    plataformas: ['FACEBOOK', 'INSTAGRAM'],
  },
];

const emptyBudget = (): BudgetByPlatform => ({ FACEBOOK: 0, INSTAGRAM: 0, GOOGLE: 0 });

const getLabel = (items: { key: string; label: string }[], key: string) =>
  items.find(item => item.key === key)?.label || key;

const getPlatformLabel = (platform: Platform) =>
  PLATFORMS.find(item => item.key === platform)?.label || platform;

const formatCompact = (value: number) =>
  Math.round(value).toLocaleString('pt-BR');

const distribuirOrcamento = (total: number, platforms: Platform[]): BudgetByPlatform => {
  const next = emptyBudget();
  if (platforms.length === 0) return next;

  const cents = Math.round(total * 100);
  const base = Math.floor(cents / platforms.length);
  let remainder = cents - base * platforms.length;

  platforms.forEach(platform => {
    const extra = remainder > 0 ? 1 : 0;
    next[platform] = (base + extra) / 100;
    remainder -= extra;
  });

  return next;
};

const getCityValue = (cidade: string, uf: string) => `${cidade}/${uf}`;

const NovoAnuncioPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(1);
  const [selectedVeiculoId, setSelectedVeiculoId] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['FACEBOOK', 'INSTAGRAM']);
  const [orcamentoDiario, setOrcamentoDiario] = useState(60);
  const [platformBudgets, setPlatformBudgets] = useState<BudgetByPlatform>(() => distribuirOrcamento(60, ['FACEBOOK', 'INSTAGRAM']));
  const [rateioManual, setRateioManual] = useState(false);
  const [duracaoDias, setDuracaoDias] = useState(7);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('vendas-sergipe');
  const [objetivo, setObjetivo] = useState('LEADS');
  const [resultadoEsperado, setResultadoEsperado] = useState('LEADS_WHATSAPP');
  const [regiaoConfig, setRegiaoConfig] = useState<RegiaoConfig>({ tipo: 'ESTADO', estado: 'SE' });
  const [selectedUfs, setSelectedUfs] = useState<string[]>(['SE']);
  const [cidadesSelecionadas, setCidadesSelecionadas] = useState<string[]>([]);
  const [publicoPerfil, setPublicoPerfil] = useState('COMPRADORES_INTENCAO');
  const [idadeMin, setIdadeMin] = useState(24);
  const [idadeMax, setIdadeMax] = useState(60);
  const [interesses, setInteresses] = useState<string[]>(INTERESSES_PADRAO.slice(0, 5));
  const [novoInteresse, setNovoInteresse] = useState('');
  const [nomeCampanha, setNomeCampanha] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const selectedPlatformsKey = selectedPlatforms.join('|');

  const { data: estoque } = useQuery({
    queryKey: ['estoque_simples'],
    queryFn: () => EstoqueService.getAll({ limit: 200, page: 1, statusTab: 'DISPONIVEL' }),
  });

  const { data: veiculo } = useQuery({
    queryKey: ['veiculo_anuncio', selectedVeiculoId],
    queryFn: () => selectedVeiculoId ? EstoqueService.getById(selectedVeiculoId) : Promise.resolve(null),
    enabled: !!selectedVeiculoId,
  });

  const { data: empresa } = useQuery({
    queryKey: ['config_empresa_anuncio'],
    queryFn: () => EmpresaService.getDadosEmpresa(),
  });

  const { data: cidades = [] } = useQuery({
    queryKey: ['cidades_marketing'],
    queryFn: () => CidadesService.getAll(true),
  });

  const cidadesPorUf = useMemo(() => {
    const mapa: Record<string, string[]> = { ...CIDADES_POR_UF };

    if (empresa?.cidade && empresa?.uf && mapa[empresa.uf]) {
      mapa[empresa.uf] = [
        empresa.cidade,
        ...mapa[empresa.uf].filter(cidade => cidade.toLowerCase() !== empresa.cidade?.toLowerCase()),
      ].slice(0, 10);
    }

    cidades.forEach(cidade => {
      if (!mapa[cidade.uf]) return;
      if (mapa[cidade.uf].length >= 10) return;
      if (!mapa[cidade.uf].some(item => item.toLowerCase() === cidade.nome.toLowerCase())) {
        mapa[cidade.uf] = [...mapa[cidade.uf], cidade.nome].slice(0, 10);
      }
    });

    return mapa;
  }, [cidades, empresa?.cidade, empresa?.uf]);

  useEffect(() => {
    const uf = empresa?.uf?.toUpperCase();
    if (uf && CIDADES_POR_UF[uf] && selectedUfs.length === 1 && selectedUfs[0] === 'SE' && uf !== 'SE') {
      setSelectedUfs([uf]);
      setRegiaoConfig(prev => ({ ...prev, estado: uf }));
    }
  }, [empresa?.uf, selectedUfs]);

  useEffect(() => {
    if (!rateioManual) {
      setPlatformBudgets(distribuirOrcamento(orcamentoDiario, selectedPlatforms));
    }
  }, [orcamentoDiario, rateioManual, selectedPlatformsKey, selectedPlatforms]);

  useEffect(() => {
    if (cidadesSelecionadas.length === 0 && empresa?.cidade && empresa?.uf) {
      setCidadesSelecionadas([getCityValue(empresa.cidade, empresa.uf)]);
    }
  }, [cidadesSelecionadas.length, empresa?.cidade, empresa?.uf]);

  const selectedTemplate = CAMPANHA_TEMPLATES.find(template => template.key === selectedTemplateKey) ?? CAMPANHA_TEMPLATES[0];
  const rateioTotal = selectedPlatforms.reduce((sum, platform) => sum + (platformBudgets[platform] || 0), 0);
  const totalEstimado = rateioTotal * duracaoDias;
  const diferencaRateio = Number((rateioTotal - orcamentoDiario).toFixed(2));

  const estimativas = useMemo(() => {
    const objetivoFactor = objetivo === 'LEADS' ? 1.18 : objetivo === 'TRAFFIC' ? 1.05 : objetivo === 'REACH' ? 0.9 : 1;
    const resultadoFactor = resultadoEsperado === 'LEADS_WHATSAPP' ? 1.15 : resultadoEsperado === 'SIMULACOES' ? 0.95 : resultadoEsperado === 'TRAFEGO_SITE' ? 0.85 : 1;
    const regiaoFactor = regiaoConfig.tipo === 'NACIONAL' ? 1.35 : selectedUfs.length > 1 ? 1.12 : regiaoConfig.tipo === 'CIDADE' ? 0.86 : regiaoConfig.tipo === 'RAIO' ? 0.78 : 1;

    return selectedPlatforms.map(platform => {
      const total = (platformBudgets[platform] || 0) * duracaoDias;
      const cpm = platform === 'GOOGLE' ? 24 : platform === 'INSTAGRAM' ? 17 : 14;
      const cpl = platform === 'GOOGLE' ? 24 : platform === 'INSTAGRAM' ? 32 : 28;
      const alcanceBase = (total / cpm) * 1000 * regiaoFactor;
      const leadsBase = (total / cpl) * objetivoFactor * resultadoFactor;

      return {
        platform,
        investimento: total,
        alcanceMin: Math.max(0, alcanceBase * 0.72),
        alcanceMax: Math.max(0, alcanceBase * 1.28),
        leadsMin: Math.max(0, leadsBase * 0.65),
        leadsMax: Math.max(0, leadsBase * 1.35),
      };
    });
  }, [duracaoDias, objetivo, platformBudgets, regiaoConfig.tipo, resultadoEsperado, selectedPlatforms, selectedUfs.length]);

  const estimativaTotal = useMemo(() => estimativas.reduce((acc, item) => ({
    investimento: acc.investimento + item.investimento,
    alcanceMin: acc.alcanceMin + item.alcanceMin,
    alcanceMax: acc.alcanceMax + item.alcanceMax,
    leadsMin: acc.leadsMin + item.leadsMin,
    leadsMax: acc.leadsMax + item.leadsMax,
  }), { investimento: 0, alcanceMin: 0, alcanceMax: 0, leadsMin: 0, leadsMax: 0 }), [estimativas]);

  const criarMutation = useMutation({
    mutationFn: (payloads: INovoAnuncioPayload[]) => Promise.all(payloads.map(payload => MarketingAdsService.createCampanha(payload))),
    onSuccess: () => {
      invalidateMarketingCampanhas(queryClient);
      toast.success(selectedPlatforms.length > 1 ? 'Anúncios criados! Revise cada plataforma na aba Anúncios.' : 'Anúncio criado!');
      navigate('/marketing');
    },
    onError: () => toast.error('Erro ao criar anúncio.'),
  });

  const handleSelectTemplate = (template: CampanhaTemplate) => {
    setSelectedTemplateKey(template.key);
    setObjetivo(template.objetivo);
    setResultadoEsperado(template.resultado);
    setRegiaoConfig({ tipo: template.regiaoTipo, estado: template.ufs.join(',') });
    setSelectedUfs(template.ufs);
    setPublicoPerfil(template.publico);
    setInteresses(template.interesses);
    setDuracaoDias(template.duracao);
    setOrcamentoDiario(template.orcamento);
    setRateioManual(false);

    if (template.regiaoTipo === 'CIDADE') {
      const cidadesTemplate = template.ufs.flatMap(uf => (cidadesPorUf[uf] || []).slice(0, 4).map(cidade => getCityValue(cidade, uf)));
      setCidadesSelecionadas(cidadesTemplate);
    }
  };

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform) && prev.length === 1) return prev;
      const next = prev.includes(platform)
        ? prev.filter(item => item !== platform)
        : [...prev, platform];
      return next;
    });
    setRateioManual(false);
  };

  const toggleUf = (uf: string) => {
    setSelectedUfs(prev => {
      if (prev.includes(uf) && prev.length === 1) return prev;
      const next = prev.includes(uf) ? prev.filter(item => item !== uf) : [...prev, uf];
      setRegiaoConfig(current => ({ ...current, estado: next.join(',') }));
      setCidadesSelecionadas(current => current.filter(cidade => next.some(selectedUf => cidade.endsWith(`/${selectedUf}`))));
      return next;
    });
  };

  const toggleCidade = (cidade: string) => {
    setCidadesSelecionadas(prev =>
      prev.includes(cidade) ? prev.filter(item => item !== cidade) : [...prev, cidade]
    );
    setRegiaoConfig(prev => ({ ...prev, tipo: 'CIDADE', estado: selectedUfs.join(',') }));
  };

  const selecionarTopCidades = () => {
    const topCities = selectedUfs.flatMap(uf => (cidadesPorUf[uf] || []).map(cidade => getCityValue(cidade, uf)));
    setCidadesSelecionadas(topCities);
    setRegiaoConfig(prev => ({ ...prev, tipo: 'CIDADE', estado: selectedUfs.join(',') }));
  };

  const toggleInteresse = (interesse: string) => {
    setInteresses(prev =>
      prev.includes(interesse) ? prev.filter(item => item !== interesse) : [...prev, interesse]
    );
  };

  const addInteresse = () => {
    const value = novoInteresse.trim();
    if (!value) return;
    if (!interesses.some(item => item.toLowerCase() === value.toLowerCase())) {
      setInteresses(prev => [...prev, value]);
    }
    setNovoInteresse('');
  };

  const gerarNomeCampanha = () => {
    const partes = [];
    if (veiculo?.modelo?.nome) partes.push(veiculo.modelo.nome);
    if (veiculo?.ano_modelo) partes.push(String(veiculo.ano_modelo));
    partes.push(selectedPlatforms.length > 1 ? 'Multiplataforma' : getPlatformLabel(selectedPlatforms[0]));
    partes.push(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    return partes.join(' — ');
  };

  const getRegiaoPayload = (): RegiaoConfig => {
    if (regiaoConfig.tipo === 'CIDADE') {
      return { tipo: 'CIDADE', estado: selectedUfs.join(','), cidades: cidadesSelecionadas };
    }
    if (regiaoConfig.tipo === 'ESTADO') {
      return { tipo: 'ESTADO', estado: selectedUfs.join(',') || empresa?.uf || 'SE' };
    }
    if (regiaoConfig.tipo === 'RAIO') {
      return { tipo: 'RAIO', raio_km: regiaoConfig.raio_km ?? 30, estado: selectedUfs[0] || empresa?.uf || 'SE' };
    }
    return { tipo: regiaoConfig.tipo };
  };

  const getPublicoPayload = (): PublicoConfig => ({
    perfil: publicoPerfil,
    faixa_etaria_min: idadeMin,
    faixa_etaria_max: idadeMax,
    interesses,
    resultado_esperado: resultadoEsperado,
  });

  const getRegiaoResumo = () => {
    if (regiaoConfig.tipo === 'RAIO') return `${regiaoConfig.raio_km ?? 30}km da loja`;
    if (regiaoConfig.tipo === 'CIDADE') return cidadesSelecionadas.join(', ') || 'Cidades selecionadas';
    if (regiaoConfig.tipo === 'ESTADO') return selectedUfs.join(', ');
    if (regiaoConfig.tipo === 'NACIONAL') return 'Brasil';
    return 'Personalizado';
  };

  const getBriefingObservacoes = () => {
    const linhas = [
      '[PRE-CONFIGURACAO ANUNCIO]',
      `Template: ${selectedTemplate.label}`,
      `Plataformas: ${selectedPlatforms.map(getPlatformLabel).join(', ')}`,
      `Rateio diario: ${selectedPlatforms.map(platform => `${getPlatformLabel(platform)} ${MarketingAdsService.formatarMoeda(platformBudgets[platform] || 0)}/dia`).join(' | ')}`,
      `Resultado esperado: ${getLabel(RESULTADOS, resultadoEsperado)}`,
      `Publico: ${getLabel(PUBLICOS, publicoPerfil)}`,
      `Faixa etaria: ${idadeMin}-${idadeMax} anos`,
      `Interesses: ${interesses.join(', ') || 'Nao informado'}`,
      `Regiao: ${getRegiaoResumo()}`,
      `Estimativa de alcance: ${formatCompact(estimativaTotal.alcanceMin)} a ${formatCompact(estimativaTotal.alcanceMax)}`,
      `Estimativa de leads: ${formatCompact(estimativaTotal.leadsMin)} a ${formatCompact(estimativaTotal.leadsMax)}`,
      observacoes ? `Observacoes: ${observacoes}` : '',
    ].filter(Boolean);
    return linhas.join('\n');
  };

  const validateBudget = () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Selecione pelo menos uma plataforma.');
      return false;
    }
    if (!Number.isFinite(orcamentoDiario) || orcamentoDiario < 5) {
      toast.error('Informe uma verba diária total válida.');
      return false;
    }
    if (selectedPlatforms.some(platform => (platformBudgets[platform] || 0) < 5)) {
      toast.error('Cada plataforma selecionada precisa de pelo menos R$ 5,00 por dia.');
      return false;
    }
    if (Math.abs(diferencaRateio) > 0.01) {
      toast.error('A soma do rateio precisa fechar com a verba diária total.');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedVeiculoId) {
      toast.error('Selecione um veículo.');
      return;
    }
    if (step === 2 && !validateBudget()) return;
    if (step === 4 && regiaoConfig.tipo === 'CIDADE' && cidadesSelecionadas.length === 0) {
      toast.error('Selecione pelo menos uma cidade.');
      return;
    }
    if (step === 4 && idadeMin < 18 || step === 4 && idadeMax < idadeMin) {
      toast.error('Revise a faixa etária do público.');
      return;
    }
    if (step === 4 && interesses.length === 0) {
      toast.error('Selecione pelo menos um interesse.');
      return;
    }
    if (step === 5 && !nomeCampanha) {
      setNomeCampanha(gerarNomeCampanha());
    }
    setStep(s => Math.min(6, s + 1) as Step);
  };

  const handleSubmit = () => {
    if (!selectedVeiculoId) {
      toast.error('Selecione um veículo.');
      return;
    }
    if (!validateBudget()) return;
    if (!Number.isFinite(duracaoDias) || duracaoDias < 1) {
      toast.error('Informe uma duração válida.');
      return;
    }
    if (idadeMin < 18 || idadeMax < idadeMin) {
      toast.error('Revise a faixa etária do público.');
      return;
    }
    if (regiaoConfig.tipo === 'CIDADE' && cidadesSelecionadas.length === 0) {
      toast.error('Selecione pelo menos uma cidade.');
      return;
    }
    if (interesses.length === 0) {
      toast.error('Selecione pelo menos um interesse.');
      return;
    }

    const nomeBase = nomeCampanha || gerarNomeCampanha();
    const observacoesBriefing = getBriefingObservacoes();
    const payloads = selectedPlatforms.map(platform => ({
      veiculo_id: selectedVeiculoId || null,
      template_id: null,
      platform,
      nome: selectedPlatforms.length > 1 ? `${nomeBase} — ${getPlatformLabel(platform)}` : nomeBase,
      objetivo,
      orcamento_diario: platformBudgets[platform] || 0,
      duracao_dias: duracaoDias,
      regiao_config: getRegiaoPayload(),
      publico_config: getPublicoPayload(),
      resultado_esperado: resultadoEsperado,
      observacoes: observacoesBriefing,
    }));

    criarMutation.mutate(payloads);
  };

  const STEPS = [
    { num: 1, label: 'Veículo' },
    { num: 2, label: 'Verba' },
    { num: 3, label: 'Template' },
    { num: 4, label: 'Configurar' },
    { num: 5, label: 'Estimativa' },
    { num: 6, label: 'Revisar' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button
          onClick={() => step === 1 ? navigate('/marketing') : setStep(s => Math.max(1, s - 1) as Step)}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          title="Voltar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Novo Anúncio</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Tráfego Pago — Passo {step} de 6</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              step === s.num
                ? 'bg-indigo-600 text-white shadow-md'
                : step > s.num
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-400'
            }`}>
              {step > s.num ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span>{s.num}</span>
              )}
              <span className="hidden lg:block">{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${step > s.num ? 'bg-emerald-300' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        {step === 1 && (
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-1">Qual veículo deseja anunciar?</h2>
            <p className="text-xs text-slate-500 mb-4">Selecione um veículo do estoque disponível</p>
            <MarketingVehicleSelection
              veiculos={estoque?.data || []}
              selectedId={selectedVeiculoId}
              onSelect={setSelectedVeiculoId}
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-1">Defina verba e plataformas</h2>
            <p className="text-xs text-slate-500 mb-6">Escolha uma ou mais plataformas. O rateio começa automático e pode ser ajustado.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Verba diária total
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-bold text-sm">R$</span>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={orcamentoDiario}
                    onChange={e => {
                      setOrcamentoDiario(Number(e.target.value));
                      setRateioManual(false);
                    }}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[30, 60, 90, 150].map(value => (
                    <button
                      key={value}
                      onClick={() => {
                        setOrcamentoDiario(value);
                        setRateioManual(false);
                      }}
                      className={`py-1.5 rounded-lg text-[10px] font-black transition-all ${
                        orcamentoDiario === value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      R$ {value}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Plataformas
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  {PLATFORMS.map(platform => {
                    const isSelected = selectedPlatforms.includes(platform.key);
                    return (
                      <button
                        key={platform.key}
                        onClick={() => togglePlatform(platform.key)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-[#004691] bg-[#004691]/5 shadow-sm'
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow" style={{ backgroundColor: platform.color }}>
                            {platform.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-slate-900 text-sm">{platform.label}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{platform.canais}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'bg-[#004691] border-[#004691]' : 'border-slate-200'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="text-xs font-black text-slate-900">Rateio da verba diária</p>
                    <p className="text-[10px] text-slate-500">Ajuste manualmente se quiser priorizar uma plataforma.</p>
                  </div>
                  <button
                    onClick={() => setRateioManual(false)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-indigo-300"
                  >
                    Rateio automático
                  </button>
                </div>

                <div className="grid gap-3">
                  {selectedPlatforms.map(platform => (
                    <div key={platform} className="flex items-center gap-3">
                      <span className="w-24 text-xs font-black text-slate-700">{getPlatformLabel(platform)}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-bold">R$</span>
                        <input
                          type="number"
                          min={5}
                          step={1}
                          value={platformBudgets[platform] || 0}
                          onChange={e => {
                            setRateioManual(true);
                            setPlatformBudgets(prev => ({ ...prev, [platform]: Number(e.target.value) }));
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <span className="w-20 text-right text-[10px] font-bold text-slate-400">
                        {orcamentoDiario > 0 ? Math.round(((platformBudgets[platform] || 0) / orcamentoDiario) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Soma do rateio</span>
                  <span className={`text-xs font-black ${Math.abs(diferencaRateio) > 0.01 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {MarketingAdsService.formatarMoeda(rateioTotal)} / {MarketingAdsService.formatarMoeda(orcamentoDiario)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Duração
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={duracaoDias}
                    onChange={e => setDuracaoDias(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-sm font-black text-indigo-600 w-20 text-right">{duracaoDias} dias</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-400">Gasto total estimado:</span>
                  <span className="text-xs font-black text-emerald-600">{MarketingAdsService.formatarMoeda(totalEstimado)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-1">Escolha um template de campanha</h2>
            <p className="text-xs text-slate-500 mb-4">Modelos focados em vendas de carros para Sergipe, Nordeste, Bahia e Alagoas.</p>
            <div className="grid gap-3">
              {CAMPANHA_TEMPLATES.map(template => {
                const isSelected = selectedTemplateKey === template.key;
                return (
                  <button
                    key={template.key}
                    onClick={() => handleSelectTemplate(template)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-[#004691] bg-[#004691]/5 shadow-md'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{template.label}</span>
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-200">
                            {template.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{template.descricao}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-slate-500">
                          <span className="font-bold text-emerald-600">{MarketingAdsService.formatarMoeda(template.orcamento)}/dia</span>
                          <span>{template.duracao} dias</span>
                          <span>{template.ufs.join(', ')}</span>
                          <span>{template.plataformas.map(getPlatformLabel).join(' + ')}</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? 'bg-[#004691] border-[#004691]' : 'border-slate-200'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-1">Configure o anúncio</h2>
            <p className="text-xs text-slate-500 mb-6">Ajuste objetivo, região, público e interesses.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Objetivo da campanha
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {OBJECTIVES.map(obj => (
                    <button
                      key={obj.key}
                      onClick={() => setObjetivo(obj.key)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        objetivo === obj.key ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <p className="text-xs font-black text-slate-900">{obj.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{obj.descricao}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Resultado esperado
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {RESULTADOS.map(item => (
                    <button
                      key={item.key}
                      onClick={() => setResultadoEsperado(item.key)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        resultadoEsperado === item.key ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <p className="text-xs font-black text-slate-900">{item.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.descricao}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Região de exibição
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  {[
                    { tipo: 'RAIO' as const, label: 'Raio local' },
                    { tipo: 'CIDADE' as const, label: 'Cidades' },
                    { tipo: 'ESTADO' as const, label: 'Estadual' },
                    { tipo: 'NACIONAL' as const, label: 'Brasil' },
                  ].map(regiao => (
                    <button
                      key={regiao.tipo}
                      onClick={() => setRegiaoConfig({
                        tipo: regiao.tipo,
                        raio_km: regiao.tipo === 'RAIO' ? 30 : undefined,
                        estado: regiao.tipo === 'ESTADO' || regiao.tipo === 'CIDADE' ? selectedUfs.join(',') : undefined,
                        cidades: regiao.tipo === 'CIDADE' ? cidadesSelecionadas : undefined,
                      })}
                      className={`py-2 px-3 rounded-xl border-2 text-[11px] font-black transition-all ${
                        regiaoConfig.tipo === regiao.tipo
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      {regiao.label}
                    </button>
                  ))}
                </div>

                {(regiaoConfig.tipo === 'CIDADE' || regiaoConfig.tipo === 'ESTADO') && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">UFs</p>
                      <div className="flex flex-wrap gap-2">
                        {NORDESTE_UFS.map(item => (
                          <button
                            key={item.uf}
                            onClick={() => toggleUf(item.uf)}
                            className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                              selectedUfs.includes(item.uf)
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            {item.uf} · {item.nome}
                          </button>
                        ))}
                      </div>
                    </div>

                    {regiaoConfig.tipo === 'CIDADE' && (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cidades principais</p>
                          <button
                            onClick={selecionarTopCidades}
                            className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-200"
                          >
                            Selecionar top 10
                          </button>
                        </div>
                        <div className="space-y-3">
                          {selectedUfs.map(uf => (
                            <div key={uf}>
                              <p className="text-[10px] font-bold text-slate-400 mb-1">{uf}</p>
                              <div className="flex flex-wrap gap-2">
                                {(cidadesPorUf[uf] || []).slice(0, 10).map(cidade => {
                                  const value = getCityValue(cidade, uf);
                                  return (
                                    <button
                                      key={value}
                                      onClick={() => toggleCidade(value)}
                                      className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                        cidadesSelecionadas.includes(value)
                                          ? 'bg-indigo-600 text-white border-indigo-600'
                                          : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                                      }`}
                                    >
                                      {cidade}/{uf}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {regiaoConfig.tipo === 'RAIO' && (
                  <div className="flex items-center gap-3 mt-2">
                    <label className="text-xs text-slate-600 font-bold whitespace-nowrap">Raio (km):</label>
                    <input
                      type="range"
                      min={5}
                      max={200}
                      step={5}
                      value={regiaoConfig.raio_km ?? 30}
                      onChange={e => setRegiaoConfig({ ...regiaoConfig, raio_km: Number(e.target.value) })}
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="text-sm font-black text-indigo-600 w-16 text-right">{regiaoConfig.raio_km ?? 30} km</span>
                  </div>
                )}

                {empresa?.cidade && (
                  <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Centro: {empresa.cidade}{empresa.uf ? `, ${empresa.uf}` : ''}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Público para loja de carros
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {PUBLICOS.map(item => (
                    <button
                      key={item.key}
                      onClick={() => setPublicoPerfil(item.key)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        publicoPerfil === item.key ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <p className="text-xs font-black text-slate-900">{item.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.descricao}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Faixa etária
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Min</span>
                    <input
                      type="number"
                      min={18}
                      max={80}
                      value={idadeMin}
                      onChange={e => setIdadeMin(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Max</span>
                    <input
                      type="number"
                      min={18}
                      max={80}
                      value={idadeMax}
                      onChange={e => setIdadeMax(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Interesses
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERESSES_PADRAO.map(item => (
                    <button
                      key={item}
                      onClick={() => toggleInteresse(item)}
                      className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        interesses.includes(item)
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    value={novoInteresse}
                    onChange={e => setNovoInteresse(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addInteresse();
                      }
                    }}
                    placeholder="Adicionar interesse específico"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={addInteresse}
                    className="px-4 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Add
                  </button>
                </div>
                {interesses.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-2">
                    Selecionados: {interesses.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-1">Estimativa de resultado</h2>
            <p className="text-xs text-slate-500 mb-6">Previsão aproximada antes da revisão final, baseada em verba, região e objetivo.</p>

            <div className="grid md:grid-cols-3 gap-3 mb-5">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Investimento</p>
                <p className="text-xl font-black text-slate-900 mt-1">{MarketingAdsService.formatarMoeda(estimativaTotal.investimento)}</p>
                <p className="text-[10px] text-slate-400 mt-1">{duracaoDias} dias de campanha</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Alcance estimado</p>
                <p className="text-xl font-black text-blue-900 mt-1">
                  {formatCompact(estimativaTotal.alcanceMin)} - {formatCompact(estimativaTotal.alcanceMax)}
                </p>
                <p className="text-[10px] text-blue-500 mt-1">pessoas alcançadas</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Conversão de leads</p>
                <p className="text-xl font-black text-emerald-900 mt-1">
                  {formatCompact(estimativaTotal.leadsMin)} - {formatCompact(estimativaTotal.leadsMax)}
                </p>
                <p className="text-[10px] text-emerald-500 mt-1">contatos potenciais</p>
              </div>
            </div>

            <div className="grid gap-3">
              {estimativas.map(item => {
                const color = PLATFORMS.find(platform => platform.key === item.platform)?.color || '#004691';
                return (
                  <div key={item.platform} className="p-4 rounded-2xl border border-slate-100 bg-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: color }}>
                          {PLATFORMS.find(platform => platform.key === item.platform)?.icon}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{getPlatformLabel(item.platform)}</p>
                          <p className="text-[10px] text-slate-500">{MarketingAdsService.formatarMoeda(item.investimento)} no período</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:w-72">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Alcance</p>
                          <p className="text-xs font-black text-slate-800">{formatCompact(item.alcanceMin)} - {formatCompact(item.alcanceMax)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Leads</p>
                          <p className="text-xs font-black text-slate-800">{formatCompact(item.leadsMin)} - {formatCompact(item.leadsMax)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Estimativas servem para planejamento e podem variar conforme criativo, aprovação da plataforma, concorrência local e qualidade do atendimento dos leads.
              </p>
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-1">Revisar e criar</h2>
            <p className="text-xs text-slate-500 mb-6">Confirme as informações antes de criar os rascunhos.</p>

            <div className="mb-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Nome da campanha
              </label>
              <input
                type="text"
                value={nomeCampanha || gerarNomeCampanha()}
                onChange={e => setNomeCampanha(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-3 mb-4">
              {veiculo && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Veículo</span>
                  <span className="text-xs font-bold text-slate-800 text-right">
                    {veiculo.montadora?.nome} {veiculo.modelo?.nome} {veiculo.ano_modelo}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Template</span>
                <span className="text-xs font-bold text-slate-800 text-right">{selectedTemplate.label}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Plataformas</span>
                <span className="text-xs font-bold text-slate-800 text-right">
                  {selectedPlatforms.map(platform => `${getPlatformLabel(platform)} (${MarketingAdsService.formatarMoeda(platformBudgets[platform] || 0)}/dia)`).join(' · ')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Objetivo</span>
                <span className="text-xs font-bold text-slate-800">{getLabel(OBJECTIVES, objetivo)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Resultado</span>
                <span className="text-xs font-bold text-slate-800">{getLabel(RESULTADOS, resultadoEsperado)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Região</span>
                <span className="text-xs font-bold text-slate-800 text-right">{getRegiaoResumo()}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Público</span>
                <span className="text-xs font-bold text-slate-800 text-right">
                  {getLabel(PUBLICOS, publicoPerfil)} · {idadeMin}-{idadeMax} anos
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Interesses</span>
                <span className="text-xs font-bold text-slate-800 text-right">{interesses.join(', ')}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Investimento</span>
                  <p className="text-sm font-black text-emerald-600">
                    {MarketingAdsService.formatarMoeda(rateioTotal)}/dia × {duracaoDias} dias = {MarketingAdsService.formatarMoeda(totalEstimado)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estimativa</span>
                  <p className="text-sm font-black text-blue-700">
                    {formatCompact(estimativaTotal.alcanceMin)}-{formatCompact(estimativaTotal.alcanceMax)} alcance · {formatCompact(estimativaTotal.leadsMin)}-{formatCompact(estimativaTotal.leadsMax)} leads
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Observações (opcional)
              </label>
              <textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Adicione instruções ou notas para este anúncio..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Serão criados {selectedPlatforms.length} rascunho(s), um para cada plataforma selecionada. Depois, use "Impulsionar" no card correspondente para abrir a plataforma com o briefing.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep(s => Math.max(1, s - 1) as Step)}
            className="flex-1 py-3 px-6 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            Voltar
          </button>
        )}
        {step < 6 ? (
          <button
            onClick={handleNextStep}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            Próximo
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={criarMutation.isPending}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {criarMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Criar Anúncio
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default NovoAnuncioPage;
