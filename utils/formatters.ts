/**
 * Formata um CNPJ removendo caracteres não numéricos e aplicando a máscara 00.000.000/0001-00
 */
export const maskCNPJ = (cnpj: string | undefined): string => {
    if (!cnpj) return 'N/A';

    const cleanCNPJ = cnpj.replace(/\D/g, '');

    if (cleanCNPJ.length !== 14) return cleanCNPJ;

    return cleanCNPJ.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );
};
