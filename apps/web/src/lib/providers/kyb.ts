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
  name: string;
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
    taxIdLabel: 'RUC',
    taxIdHint: '11 digits',
    taxIdExample: '20123456781',
    pattern: /^\d{11}$/,
  },
  {
    code: 'CO',
    name: 'Colombia',
    taxIdLabel: 'NIT',
    taxIdHint: '9–10 digits, no dashes',
    taxIdExample: '900123456',
    pattern: /^\d{9,10}$/,
  },
  {
    code: 'MX',
    name: 'Mexico',
    taxIdLabel: 'RFC',
    taxIdHint: '12 characters',
    taxIdExample: 'ABC010101AB1',
    pattern: /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/,
  },
  {
    code: 'BR',
    name: 'Brazil',
    taxIdLabel: 'CNPJ',
    taxIdHint: '14 digits',
    taxIdExample: '12345678000195',
    pattern: /^\d{14}$/,
  },
  {
    code: 'AR',
    name: 'Argentina',
    taxIdLabel: 'CUIT',
    taxIdHint: '11 digits',
    taxIdExample: '30123456781',
    pattern: /^\d{11}$/,
  },
  {
    code: 'CL',
    name: 'Chile',
    taxIdLabel: 'RUT',
    taxIdHint: 'e.g. 76123456-7',
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

export const REVENUE_BANDS = [
  'Under $5k / month',
  '$5k – $25k / month',
  '$25k – $100k / month',
  'Over $100k / month',
] as const;

export interface KybDocument {
  id: string;
  label: string;
  help: string;
}

/** What a real verifier would ask for. In the sandbox nothing is uploaded — the box only records intent. */
export const KYB_DOCUMENTS: KybDocument[] = [
  {
    id: 'registration',
    label: 'Business registration certificate',
    help: 'Proof the company legally exists.',
  },
  { id: 'tax-id', label: 'Tax ID document', help: 'RUC / NIT / RFC / CNPJ / CUIT / RUT.' },
  {
    id: 'ownership',
    label: 'Ownership declaration',
    help: 'Who owns 25% or more (UBO).',
  },
  {
    id: 'address',
    label: 'Proof of business address',
    help: 'Utility bill or lease, under 3 months old.',
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
    name: 'Fondealo Sandbox Verifier',
    description:
      'Instant test verification. It checks the format only — no real registry, ownership or sanctions screening. Testnet only.',
    status: 'available',
    turnaround: '~10 seconds',
  },
  {
    id: 'registry',
    name: 'LatAm registry-based KYB',
    description: 'Direct queries to national business registries.',
    status: 'planned',
    turnaround: 'Minutes',
  },
  {
    id: 'global',
    name: 'Global KYB suite',
    description: 'Registry data, beneficial owners and AML/sanctions screening in one workflow.',
    status: 'planned',
    turnaround: 'Minutes to hours',
  },
  {
    id: 'partners',
    name: 'Local verifier partners',
    description:
      'Chambers of commerce, accountants and fintechs that vouch for a business with a bond at stake.',
    status: 'planned',
    turnaround: '1–3 days',
  },
];

/** Score a freshly verified business starts with (bottom of band C — see docs/score-spec.md). */
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
        'Sandbox rule: tax IDs ending in 0000 are rejected so you can test the failure path.',
      ],
    };
  }
  return {
    accepted: true,
    reasons: [
      'Tax ID format is valid for the selected country.',
      'Sandbox: no external registry, ownership or sanctions screening was performed.',
    ],
  };
}
