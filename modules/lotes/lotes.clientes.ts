import type { ILoteCatalogos } from './lotes.types';

export function filtrarClientesLote(clientes: ILoteCatalogos['parceiros'], busca: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const query = normalize(busca.trim());
  const digits = busca.replace(/\D/g, '');
  return clientes.filter(cliente => normalize(cliente.nome).includes(query)
    || (!!digits && (cliente.documento || '').replace(/\D/g, '').includes(digits)));
}
