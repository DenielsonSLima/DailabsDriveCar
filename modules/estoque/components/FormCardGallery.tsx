
import React from 'react';
import { IVeiculo } from '../estoque.types';
import PhotoUpload from './PhotoUpload';

interface Props {
  formData: Partial<IVeiculo>;
  onChange: (updates: Partial<IVeiculo>) => void;
  onNotification: (msg: string, type: any) => void;
}

const FormCardGallery: React.FC<Props> = ({ formData, onChange, onNotification }) => {
  return (
    <div className="dc-panel bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden animate-in slide-in-from-bottom-1">
      <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
      <PhotoUpload 
        fotos={formData.fotos || []} 
        onChange={(newFotos) => onChange({ fotos: newFotos })}
        onNotification={onNotification}
      />
    </div>
  );
};

export default FormCardGallery;
