export const COMPANY_TYPES = Object.freeze({ PURCHASE: 'PURCHASE', SALE: 'SALE', BOTH: 'BOTH' });

// Company types allowed in each business role.
export const PURCHASE_COMPANY_TYPES = Object.freeze([COMPANY_TYPES.PURCHASE, COMPANY_TYPES.BOTH]);
export const SALE_COMPANY_TYPES = Object.freeze([COMPANY_TYPES.SALE, COMPANY_TYPES.BOTH]);
