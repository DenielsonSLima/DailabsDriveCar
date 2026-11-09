import React, { useRef, useState } from 'react';
import { IParceiro, ParceiroSchema, PessoaTipo, TipoParceiro } from '../../parceiros/parceiros.types';
import ParceiroAddressForm from '../../parceiros/components/ParceiroAddressForm';
import { maskCEP, maskCNPJ, maskCPF, maskPhone } from '../../../utils/formatters';
import { ErrorMessage, Field, fieldClass, primaryClass, secondaryClass } from './LoteUi';

export default function LoteClienteCadastro({ onSave, onSaved, onClose, onBusyChange }: {
  onSave: (data: Partial<IParceiro>) => Promise<IParceiro>;
  onSaved: (cliente: IParceiro) => void;
  onClose: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  // A retry after a lost response updates the same client instead of creating another.
  const id = useRef(crypto.randomUUID());
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [data, setData] = useState<Partial<IParceiro>>({ pessoa_tipo: PessoaTipo.FISICA, tipo: TipoParceiro.CLIENTE, ativo: true, nome: '', documento: '', email: '', telefone: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '' });
  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    let formatted = name === 'email' ? value : value.toUpperCase();
    if (name === 'documento') formatted = data.pessoa_tipo === PessoaTipo.FISICA ? maskCPF(value) : maskCNPJ(value);
    if (name === 'cep') formatted = maskCEP(value);
    if (name === 'telefone') formatted = maskPhone(value);
    setData(current => ({ ...current, [name]: formatted }));
  };
  return <form className="space-y-5" onSubmit={async event => {
    event.preventDefault();
    if (saving.current) return;
    setError(undefined);
    const payload = { ...data, id: id.current, nome: data.nome?.trim(), email: data.email?.trim() };
    const validation = ParceiroSchema.safeParse(payload);
    if (!validation.success) { setError(new Error(validation.error.issues.map(issue => issue.message).join(' · '))); return; }
    const documentLength = data.documento?.replace(/\D/g, '').length || 0;
    if (documentLength && documentLength !== (data.pessoa_tipo === PessoaTipo.FISICA ? 11 : 14)) { setError(new Error('Confira os dígitos do CPF/CNPJ ou deixe o documento em branco.')); return; }
    saving.current = true; setBusy(true); onBusyChange(true);
    try { const saved = await onSave(validation.data); onSaved(saved); }
    catch (err) { setError(err); }
    finally { saving.current = false; setBusy(false); onBusyChange(false); }
  }}>
    <p className="text-sm text-slate-500">Cadastre o cliente aqui. Os dados da venda serão mantidos e o novo cliente ficará selecionado.</p>
    <fieldset disabled={busy} className="space-y-5">
      <Field label="Tipo de pessoa"><select className={fieldClass} value={data.pessoa_tipo} onChange={event => setData(current => ({ ...current, pessoa_tipo: event.target.value as PessoaTipo, documento: '' }))}><option value={PessoaTipo.FISICA}>Pessoa física</option><option value={PessoaTipo.JURIDICA}>Pessoa jurídica</option></select></Field>
      <Field label={data.pessoa_tipo === PessoaTipo.FISICA ? 'Nome completo' : 'Nome / Razão social'}><input autoFocus required maxLength={200} name="nome" className={fieldClass} value={data.nome || ''} onChange={change} /></Field>
      <Field label={data.pessoa_tipo === PessoaTipo.FISICA ? 'CPF (opcional)' : 'CNPJ (opcional)'}><input name="documento" inputMode="numeric" className={fieldClass} value={data.documento || ''} onChange={change} /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Telefone (opcional)"><input name="telefone" type="tel" className={fieldClass} value={data.telefone || ''} onChange={change} /></Field><Field label="E-mail (opcional)"><input name="email" type="email" className={fieldClass} value={data.email || ''} onChange={change} /></Field></div>
      <ParceiroAddressForm formData={data} onChange={change} />
    </fieldset>
    <ErrorMessage error={error} />
    <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" disabled={busy} className={secondaryClass} onClick={onClose}>Voltar à venda</button><button type="submit" disabled={busy} className={primaryClass}>{busy ? 'Salvando…' : 'Salvar e selecionar cliente'}</button></div>
  </form>;
}
