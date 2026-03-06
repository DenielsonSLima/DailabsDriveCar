/**
 * Formata um valor numérico para o padrão de moeda BRL (R$ 1.234,56).
 */
export const formatBRL = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

/**
 * Converte uma string de entrada (com máscara) de volta para um número.
 * Útil para processar o valor que será enviado ao backend.
 */
export const parseCurrencyToNumber = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/[^\d]/g, '');
    return parseInt(cleaned) / 100;
};

/**
 * Formatação em tempo real para inputs.
 * Recebe o valor bruto (apenas dígitos) e retorna a string formatada.
 */
export const maskCurrency = (value: string | number): string => {
    let digits = '';
    if (typeof value === 'number') {
        digits = Math.round(value * 100).toString();
    } else {
        digits = value.replace(/\D/g, '');
    }

    if (!digits) return '';

    const numericValue = parseInt(digits) / 100;
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numericValue);
};
