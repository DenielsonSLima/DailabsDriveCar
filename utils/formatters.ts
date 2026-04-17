/**
 * Formata um CNPJ removendo caracteres não numéricos e aplicando a máscara 00.000.000/0001-00
 */
export const maskCNPJ = (cnpj: string | undefined, fallback = ''): string => {
    if (!cnpj) return fallback;
    const v = cnpj.replace(/\D/g, '');
    return v
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
};

/**
 * Formata um CPF: 000.000.000-00
 */
export const maskCPF = (cpf: string | undefined): string => {
    if (!cpf) return '';
    const v = cpf.replace(/\D/g, '');
    return v
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

/**
 * Formata um CEP: 00000-000
 */
export const maskCEP = (cep: string | undefined): string => {
    if (!cep) return '';
    const v = cep.replace(/\D/g, '');
    return v
        .slice(0, 8)
        .replace(/(\d{5})(\d)/, '$1-$2');
};

/**
 * Formata um Telefone/WhatsApp: (00) 00000-0000 ou (00) 0000-0000
 */
export const maskPhone = (phone: string | undefined): string => {
    if (!phone) return '';
    const v = phone.replace(/\D/g, '');
    if (v.length <= 10) {
        return v
            .slice(0, 10)
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return v
        .slice(0, 11)
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
};
