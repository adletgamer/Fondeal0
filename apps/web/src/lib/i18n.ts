/** Minimal bilingual (EN/ES) copy dictionary for the MVP shell. */
export type Locale = 'en' | 'es';

export const dictionary = {
  en: {
    tagline: 'Credit infrastructure for Latin American SMEs on Stellar',
    heroBody:
      'Fondealo gives every business a reusable, on-chain credit identity — the Business Passport — and a portable reputation score that grows with every repayment and survives across loans.',
    forBusinesses: 'For businesses',
    forInvestors: 'For investors',
    businessPitch:
      'Register, complete KYB, get your Business Passport, and request USDC financing.',
    investorPitch: 'Deposit USDC, fund vetted opportunities, and earn returns as businesses repay.',
    openBusiness: 'Business dashboard',
    openInvestor: 'Investor dashboard',
    connect: 'Connect wallet',
  },
  es: {
    tagline: 'Infraestructura de crédito para PyMEs latinoamericanas sobre Stellar',
    heroBody:
      'Fondealo le da a cada empresa una identidad crediticia on-chain reutilizable — el Business Passport — y un score de reputación portable que crece con cada repago y sobrevive entre préstamos.',
    forBusinesses: 'Para empresas',
    forInvestors: 'Para inversionistas',
    businessPitch:
      'Regístrate, completa KYB, obtén tu Business Passport y solicita financiamiento en USDC.',
    investorPitch:
      'Deposita USDC, financia oportunidades verificadas y recibe retornos cuando las empresas repagan.',
    openBusiness: 'Panel de empresa',
    openInvestor: 'Panel de inversionista',
    connect: 'Conectar wallet',
  },
} as const;

export type Dict = (typeof dictionary)[Locale];
