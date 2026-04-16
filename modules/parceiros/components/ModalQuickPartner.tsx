
import React from 'react';
import ParceiroForm from './ParceiroForm';
import { IParceiro, TipoParceiro, PessoaTipo } from '../parceiros.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (parceiro: IParceiro) => void;
  defaultType?: TipoParceiro;
}

const ModalQuickPartner: React.FC<Props> = ({ isOpen, onClose, onSuccess, defaultType = TipoParceiro.CLIENTE }) => {
  if (!isOpen) return null;

  const initialValues: Partial<IParceiro> = {
    tipo: defaultType,
    pessoa_tipo: PessoaTipo.JURIDICA,
    ativo: true,
  };

  return (
    <ParceiroForm
      initialData={initialValues as IParceiro}
      onClose={onClose}
      onSubmit={(data) => {
        onSuccess(data as IParceiro);
        onClose();
      }}
    />
  );
};

export default ModalQuickPartner;
