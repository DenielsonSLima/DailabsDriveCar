/**
 * Calculates part of a total value based on a partner's percentage,
 * normalized by the total percentage of all partners in that set.
 * 
 * This prevents "broken" values when fractions don't align perfectly (e.g. 1/3 as 33.33%).
 * 
 * Case: Profit R$ 1.500,00 | 3 partners at 33.33% each.
 * Simple math: 1500 * 0.3333 = 499.95
 * Normalized: (1500 * 33.33) / (33.33 + 33.33 + 33.33) = (1500 * 33.33) / (99.99) = 500.00
 */
export function calculateNormalizedValue(
    totalAmount: number,
    partnerPercentage: number,
    allPartners: { porcentagem: number }[]
): number {
    if (totalAmount === 0) return 0;

    const totalPercentage = allPartners.reduce((acc, p) => acc + (p.porcentagem || 0), 0);

    if (totalPercentage === 0) return 0;

    // Use proportional rule to distribute the full amount
    return (totalAmount * partnerPercentage) / totalPercentage;
}
