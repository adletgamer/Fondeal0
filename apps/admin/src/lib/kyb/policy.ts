import type { AdminEnv, EvidenceSource } from './types';

/**
 * KYB policy v1 (DRAFT). The owner approves this file together with
 * docs/kyb/policy-v1.md; changing it means a new version string, never an edit
 * in place, because every decision records the version it was made under.
 */
export const POLICY_VERSION = 'kyb-v1-draft';

export interface PolicyItem {
  id: string;
  label: string;
  hint: string;
  required: boolean;
}

export const POLICY_ITEMS: readonly PolicyItem[] = [
  {
    id: 'legal-entity',
    label: 'Existencia legal',
    hint: 'La empresa está constituida y la razón social coincide.',
    required: true,
  },
  {
    id: 'tax-id-active',
    label: 'RUC activo y habido',
    hint: 'Contribuyente activo, domicilio habido, número coincide con la razón social.',
    required: true,
  },
  {
    id: 'representative-authority',
    label: 'Facultades del representante',
    hint: 'El poder está vigente y alcanza para actuar en nombre de la empresa.',
    required: true,
  },
  {
    id: 'representative-identity',
    label: 'Identidad del representante',
    hint: 'El documento corresponde a la persona que figura con poder.',
    required: true,
  },
  {
    id: 'beneficial-owners',
    label: 'Beneficiarios finales',
    hint: 'Hay una declaración de quién controla la empresa.',
    required: true,
  },
  {
    id: 'address',
    label: 'Domicilio fiscal',
    hint: 'El domicilio coincide con el que figura en la ficha RUC.',
    required: true,
  },
  {
    id: 'screening',
    label: 'Listas restrictivas y PEP',
    hint: 'Sin coincidencias. Pasa a ser obligatorio cuando haya un proveedor contratado.',
    required: false,
  },
];

export const REQUIRED_ITEM_IDS = POLICY_ITEMS.filter((i) => i.required).map((i) => i.id);

/** How long an approval stays valid before the case returns to review. Legal to confirm. */
export const APPROVAL_VALIDITY_DAYS = 365;

/** Window in which an approval can still be cancelled before anything is issued. */
export const COOLING_OFF_MINUTES = 10;

/** Minimum length for any free-text justification. */
export const MIN_NOTE_LENGTH = 20;

const SOURCES_BY_ENV: Record<AdminEnv, readonly EvidenceSource[]> = {
  // A reviewer who checks a public source by hand is legitimate on Testnet.
  // Production stays closed until the policy and Legal accept it (ADR-0011).
  testnet: ['official-registry', 'third-party', 'reviewer-attested'],
  production: ['official-registry', 'third-party'],
};

/** Sources that may confirm a policy item. `declared-only` and `synthetic` never do. */
export function acceptedSources(env: AdminEnv): readonly EvidenceSource[] {
  return SOURCES_BY_ENV[env];
}

export const SOURCE_LABEL: Record<EvidenceSource, string> = {
  'official-registry': 'Registro oficial',
  'third-party': 'Proveedor externo',
  'reviewer-attested': 'Revisión manual',
  'declared-only': 'Solo declarado',
  synthetic: 'Sintético (prueba)',
};
