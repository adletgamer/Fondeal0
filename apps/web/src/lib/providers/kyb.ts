/**
 * KYB (Know Your Business) verifier network — catalog and shared rules.
 *
 * Isomorphic on purpose: the wizard validates with the same rules the server
 * action enforces. Only the `sandbox` verifier is real today; the others are
 * placeholders for the network described in docs/strategy/verifier-network.md
 * and are shown as "planned", never as live partnerships.
 */

export interface KybCountry {
  code: string;
  /** Stored value (English) — keep stable; existing rows reference it. */
  name: string;
  /** Spanish display name. */
  label: string;
  taxIdLabel: string;
  taxIdHint: string;
  taxIdExample: string;
  pattern: RegExp;
}

/** Format-only checks (no checksum digits) — enough for a sandbox, not for production KYB. */
export const KYB_COUNTRIES: KybCountry[] = [
  {
    code: 'PE',
    name: 'Peru',
    label: 'Perú',
    taxIdLabel: 'RUC',
    taxIdHint: '11 dígitos',
    taxIdExample: '20123456781',
    pattern: /^\d{11}$/,
  },
  {
    code: 'CO',
    name: 'Colombia',
    label: 'Colombia',
    taxIdLabel: 'NIT',
    taxIdHint: '9–10 dígitos, sin guiones',
    taxIdExample: '900123456',
    pattern: /^\d{9,10}$/,
  },
  {
    code: 'MX',
    name: 'Mexico',
    label: 'México',
    taxIdLabel: 'RFC',
    taxIdHint: '12 caracteres',
    taxIdExample: 'ABC010101AB1',
    pattern: /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/,
  },
  {
    code: 'BR',
    name: 'Brazil',
    label: 'Brasil',
    taxIdLabel: 'CNPJ',
    taxIdHint: '14 dígitos',
    taxIdExample: '12345678000195',
    pattern: /^\d{14}$/,
  },
  {
    code: 'AR',
    name: 'Argentina',
    label: 'Argentina',
    taxIdLabel: 'CUIT',
    taxIdHint: '11 dígitos',
    taxIdExample: '30123456781',
    pattern: /^\d{11}$/,
  },
  {
    code: 'CL',
    name: 'Chile',
    label: 'Chile',
    taxIdLabel: 'RUT',
    taxIdHint: 'p. ej. 76123456-7',
    taxIdExample: '76123456-7',
    pattern: /^\d{7,8}-[\dK]$/,
  },
];

export function findCountry(name: string): KybCountry | undefined {
  return KYB_COUNTRIES.find((c) => c.name === name);
}

/** Uppercase and strip spaces/dots so users can paste "20.123.456.781". */
export function normalizeTaxId(raw: string): string {
  return raw.replace(/[\s.]/g, '').toUpperCase();
}

export const SECTORS = [
  'Retail',
  'Food & beverage',
  'Agriculture',
  'Manufacturing',
  'Logistics & transport',
  'Services',
  'Technology',
  'Construction',
  'Other',
] as const;

/** Spanish labels for the stored sector values. */
export const SECTOR_LABELS: Record<(typeof SECTORS)[number], string> = {
  Retail: 'Comercio minorista',
  'Food & beverage': 'Alimentos y bebidas',
  Agriculture: 'Agricultura',
  Manufacturing: 'Manufactura',
  'Logistics & transport': 'Logística y transporte',
  Services: 'Servicios',
  Technology: 'Tecnología',
  Construction: 'Construcción',
  Other: 'Otro',
};

export const REVENUE_BANDS = [
  'Under $5k / month',
  '$5k – $25k / month',
  '$25k – $100k / month',
  'Over $100k / month',
] as const;

/** Spanish labels for the stored revenue bands (amounts stay in USD). */
export const REVENUE_BAND_LABELS: Record<(typeof REVENUE_BANDS)[number], string> = {
  'Under $5k / month': 'Menos de US$ 5 mil al mes',
  '$5k – $25k / month': 'US$ 5 mil – 25 mil al mes',
  '$25k – $100k / month': 'US$ 25 mil – 100 mil al mes',
  'Over $100k / month': 'Más de US$ 100 mil al mes',
};

export const REPRESENTATIVE_RELATIONSHIPS = ['Owner', 'Director', 'Authorized agent'] as const;

export const RELATIONSHIP_LABELS: Record<(typeof REPRESENTATIVE_RELATIONSHIPS)[number], string> = {
  Owner: 'Dueño o socio',
  Director: 'Gerente o director',
  'Authorized agent': 'Apoderado',
};

export interface KybDocument {
  id: string;
  label: string;
  help: string;
}

/** What a real verifier would ask for. In the sandbox nothing is uploaded — the box only records intent. */
export const KYB_DOCUMENTS: KybDocument[] = [
  {
    id: 'registration',
    label: 'Constancia de inscripción de la empresa',
    help: 'Prueba de que la empresa existe legalmente (p. ej. partida registral).',
  },
  {
    id: 'tax-id',
    label: 'Documento tributario',
    help: 'Ficha RUC u otro registro tributario (NIT, RFC, CNPJ, CUIT, RUT).',
  },
  {
    id: 'ownership',
    label: 'Declaración de propietarios',
    help: 'Quién tiene 25 % o más de la empresa (beneficiario final).',
  },
  {
    id: 'address',
    label: 'Comprobante de domicilio',
    help: 'Recibo de servicios o contrato de alquiler de menos de 3 meses.',
  },
];

export interface KybVerifier {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'planned';
  turnaround: string;
}

export const KYB_VERIFIERS: KybVerifier[] = [
  {
    id: 'sandbox',
    name: 'Verificador de prueba de Fondealo',
    description:
      'Solo revisa el formato de los datos. No consulta registros, propietarios ni listas de sanciones; no aprueba KYB ni financiamiento.',
    status: 'available',
    turnaround: '~10 segundos',
  },
  {
    id: 'registry',
    name: 'KYB con registros de LatAm',
    description: 'Consultas directas a registros nacionales de empresas.',
    status: 'planned',
    turnaround: 'Minutos',
  },
  {
    id: 'global',
    name: 'Suite KYB global',
    description:
      'Datos registrales, beneficiarios finales y revisión de listas de sanciones en un solo flujo.',
    status: 'planned',
    turnaround: 'Minutos a horas',
  },
  {
    id: 'partners',
    name: 'Verificadores locales aliados',
    description:
      'Cámaras de comercio, contadores y fintechs que respaldan a una empresa con una garantía en juego.',
    status: 'planned',
    turnaround: '1–3 días',
  },
];

/** Starting score reserved for issuance after KYB and underwriting approval. */
export const INITIAL_SCORE_AFTER_KYB = 500;

/**
 * Deterministic sandbox decision so every path is testable:
 * a tax ID ending in `0000` is rejected; anything else is accepted.
 */
export function sandboxDecision(taxId: string): { accepted: boolean; reasons: string[] } {
  if (taxId.endsWith('0000')) {
    return {
      accepted: false,
      reasons: [
        'Regla de prueba: los números tributarios que terminan en 0000 se rechazan para probar el caso de error.',
      ],
    };
  }
  return {
    accepted: true,
    reasons: [
      'El formato del número tributario es válido para el país elegido.',
      'Modo de prueba: no se consultaron registros, propietarios ni listas de sanciones.',
    ],
  };
}
