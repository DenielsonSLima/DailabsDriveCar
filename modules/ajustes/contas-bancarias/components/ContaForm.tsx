import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { IContaBancaria, TipoConta } from '../contas.types';

interface Props {
  initialData: IContaBancaria | null;
  onClose: () => void;
  onSubmit: (data: Partial<IContaBancaria>) => void;
}

const bancosPopulares = [
  { codigo: '001', nome: 'BANCO DO BRASIL', cor: '#fbbf24' }, // Amarelo BB
  { codigo: '237', nome: 'BRADESCO', cor: '#dc2626' },        // Vermelho Bradesco
  { codigo: '104', nome: 'CAIXA', cor: '#2563eb' },           // Azul Caixa
  { codigo: '341', nome: 'ITAÚ', cor: '#ea580c' },            // Laranja Itaú
  { codigo: '033', nome: 'SANTANDER', cor: '#ef4444' },       // Vermelho Santander
  { codigo: '260', nome: 'NUBANK', cor: '#8b5cf6' },          // Roxo Nu
  { codigo: '077', nome: 'INTER', cor: '#f97316' },           // Laranja Inter
  { codigo: '336', nome: 'C6 BANK', cor: '#1e293b' },         // Preto C6
  { codigo: '000', nome: 'DINHEIRO / COFRE', cor: '#10b981' },// Verde
];

const ContaForm: React.FC<Props> = ({ initialData, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<IContaBancaria>>(() => {
    const data = {
      banco_nome: '',
      titular: '',
      agencia: '',
      conta: '',
      tipo: 'CORRENTE' as TipoConta,
      cor_cartao: '#1e293b',
      permite_negativo: true,
      ativo: true,
      ...initialData
    };
    if (data.banco_nome) data.banco_nome = data.banco_nome.toUpperCase();
    if (data.titular) data.titular = data.titular.toUpperCase();
    return data;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleBancoSelect = (banco: typeof bancosPopulares[0]) => {
    setFormData(prev => ({
      ...prev,
      banco_codigo: banco.codigo,
      banco_nome: banco.nome.toUpperCase(),
      cor_cartao: banco.cor,
      tipo: banco.codigo === '000' ? 'CAIXA_FISICO' : 'CORRENTE'
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validação Explícita
    if (!formData.banco_nome || !formData.titular) {
      alert("Por favor, preencha os campos obrigatórios: Instituição e Titular.");
      return;
    }
    onSubmit({
      ...formData,
      banco_nome: formData.banco_nome.toUpperCase(),
      titular: formData.titular.toUpperCase()
    });
  };

  // Travar o scroll do corpo quando o modal estiver aberto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const content = (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              {initialData ? 'Editar Conta' : 'Nova Conta Bancária'}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Dados Bancários</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Switch Sugestão: Permite Negativo */}
            <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <span className={`text-[10px] font-black uppercase tracking-widest ${formData.permite_negativo ? 'text-indigo-600' : 'text-slate-400'}`}>
                {formData.permite_negativo ? 'Negativo OK' : 'Bloquear Negativo'}
              </span>
              <div className="relative">
                <input type="checkbox" name="permite_negativo" checked={formData.permite_negativo} onChange={handleChange} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
              </div>
            </label>

            {/* Switch Ativo */}
            <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <span className={`text-[10px] font-black uppercase tracking-widest ${formData.ativo ? 'text-emerald-600' : 'text-slate-400'}`}>
                {formData.ativo ? 'Ativa' : 'Inativa'}
              </span>
              <div className="relative">
                <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleChange} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </label>

            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">

            {/* 1. Instituição */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest ml-1">1. Selecione a Instituição *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {bancosPopulares.map(b => (
                  <button
                    key={b.codigo}
                    type="button"
                    onClick={() => handleBancoSelect(b)}
                    className={`flex items-center p-3 rounded-xl border transition-all ${formData.banco_codigo === b.codigo || (formData.banco_nome?.toUpperCase() === b.nome)
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                      }`}
                  >
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: b.cor }}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest truncate">{b.nome}</span>
                  </button>
                ))}
              </div>
              <input
                name="banco_nome"
                value={formData.banco_nome}
                onChange={(e) => { e.target.value = e.target.value.toUpperCase(); handleChange(e); }}
                className="mt-3 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 placeholder:font-normal"
                placeholder="Ou digite o nome da instituição..."
                required
              />
            </div>

            {/* 2. Titular */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">2. Titular da Conta *</label>
              <input
                name="titular"
                value={formData.titular}
                onChange={(e) => { e.target.value = e.target.value.toUpperCase(); handleChange(e); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase"
                placeholder="NOME DA EMPRESA OU SÓCIO"
                required
              />
            </div>

            {/* 3. Agência e Conta (Lado a Lado) */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">3. Agência (Opcional)</label>
                <input
                  name="agencia"
                  value={formData.agencia}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="0000"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">4. Conta (Opcional)</label>
                <input
                  name="conta"
                  value={formData.conta}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="00000-0"
                />
              </div>
            </div>

            {/* Pré-visualização do Cartão */}
            <div className="pt-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest ml-1">Pré-visualização</label>
              <div
                className={`relative w-full aspect-[1.586/1] max-w-[320px] mx-auto rounded-2xl shadow-xl overflow-hidden p-6 text-white flex flex-col justify-between transition-all ${!formData.ativo ? 'grayscale opacity-75' : ''}`}
                style={{ background: `linear-gradient(135deg, ${formData.cor_cartao} 0%, ${formData.cor_cartao}dd 100%)` }}
              >
                {/* Texture Overlay */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                <div className="relative z-10 flex justify-between items-start">
                  <span className="font-bold uppercase tracking-wider text-sm">{formData.banco_nome || 'BANCO'}</span>
                  <div className="w-8 h-5 bg-yellow-200/80 rounded-md"></div> {/* Fake Chip */}
                </div>

                <div className="relative z-10 font-mono text-lg tracking-widest">
                  **** **** **** {formData.conta ? formData.conta.slice(-4) : '0000'}
                </div>

                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <p className="text-[8px] uppercase opacity-70">Titular</p>
                    <p className="font-bold text-xs uppercase tracking-wider">{formData.titular || 'NOME DO TITULAR'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] uppercase opacity-70">Agência/Conta</p>
                    <p className="font-mono text-xs">{formData.agencia || '0000'} / {formData.conta || '00000-0'}</p>
                  </div>
                </div>
              </div>
              {!formData.ativo && <p className="text-center text-[10px] font-bold text-rose-500 mt-2 uppercase tracking-widest">Visualização de Conta Inativa</p>}
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end space-x-3 bg-white">
          <button type="button" onClick={onClose} className="px-6 py-3 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
          >
            Salvar Conta
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default ContaForm;
