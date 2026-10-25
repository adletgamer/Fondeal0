import type { CaseView, CheckView, EvidenceView } from '../cases';
import type { CaseStatus } from '../kyb/types';

/**
 * Example data for the design preview. Every company, person and number here
 * is fictional; the tax numbers are not real contributors.
 */

const day = (now: Date, days: number, hour = 10) => {
  const d = new Date(now.getTime() - days * 86_400_000);
  d.setUTCHours(hour + 5, 0, 0, 0); // Lima is UTC-5.
  return d.toISOString();
};

const declared = (id: string, label: string, detail: string): EvidenceView => ({
  id,
  label,
  source: 'declared-only',
  state: 'Declared',
  detail,
});

const standardEvidence = (): EvidenceView[] => [
  declared('e1', 'Constitución de la empresa', 'Declarada por la empresa. Sin documento.'),
  declared('e2', 'Ficha RUC', 'Declarada por la empresa. Sin documento.'),
  declared('e3', 'Poder del representante', 'Declarado por la empresa. Sin documento.'),
  declared('e4', 'Estructura de accionistas', 'Declarada por la empresa. Sin documento.'),
];

const standardChecks = (): CheckView[] => [
  {
    id: 'c1',
    provider: 'sandbox',
    checkType: 'Formato del número tributario',
    result: 'Pasa (sintético)',
    detail: 'Solo valida el formato. No verifica a la empresa.',
  },
  {
    id: 'c2',
    provider: 'Registro de Perú',
    checkType: 'Existencia legal',
    result: 'No disponible',
    detail: 'La integración aún no está configurada.',
  },
];

interface Seed {
  id: string;
  legalName: string;
  taxId: string;
  sector: string;
  foundedYear: number;
  daysAgo: number;
  status: CaseStatus;
  assignedTo: string | null;
  rep: [string, string, string];
}

const SEEDS: Seed[] = [
  {
    id: 'case-ferreteria',
    legalName: 'Ferretería Los Pinos EIRL',
    taxId: '20999000011',
    sector: 'Comercio minorista',
    foundedYear: 2019,
    daysAgo: 0,
    status: 'Received',
    assignedTo: null,
    rep: ['Rosa Mendoza Huamán', 'Titular gerente', '4471'],
  },
  {
    id: 'case-kallpa',
    legalName: 'Kallpa Labs SAC',
    taxId: '20999000022',
    sector: 'Software',
    foundedYear: 2023,
    daysAgo: 1,
    status: 'Received',
    assignedTo: null,
    rep: ['Ana Quispe Flores', 'Gerente general', '2208'],
  },
  {
    id: 'case-andes',
    legalName: 'Andes Logística SAC',
    taxId: '20999000033',
    sector: 'Transporte y logística',
    foundedYear: 2016,
    daysAgo: 3,
    status: 'InReview',
    assignedTo: 'Vista previa',
    rep: ['Luis Paucar Ccori', 'Gerente general', '9053'],
  },
  {
    id: 'case-sanblas',
    legalName: 'Panadería San Blas EIRL',
    taxId: '20999000044',
    sector: 'Alimentos',
    foundedYear: 2014,
    daysAgo: 6,
    status: 'NeedsInformation',
    assignedTo: 'Vista previa',
    rep: ['Carmen Illanes Torres', 'Titular gerente', '1187'],
  },
  {
    id: 'case-qori',
    legalName: 'Textiles Qori EIRL',
    taxId: '20999000055',
    sector: 'Manufactura textil',
    foundedYear: 2012,
    daysAgo: 20,
    status: 'Approved',
    assignedTo: 'Vista previa',
    rep: ['Julia Cusi Mamani', 'Titular gerente', '6632'],
  },
  {
    id: 'case-yanapay',
    legalName: 'Agroexport Yanapay SAC',
    taxId: '20999000066',
    sector: 'Agroexportación',
    foundedYear: 2021,
    daysAgo: 9,
    status: 'Rejected',
    assignedTo: 'Vista previa',
    rep: ['Mario Challco Vera', 'Gerente general', '3375'],
  },
];

function build(seed: Seed, now: Date): CaseView {
  const submittedAt = day(now, seed.daysAgo);
  const timeline: CaseView['timeline'] = [
    { at: submittedAt, actor: 'Empresa', text: 'Solicitud recibida (versión de prueba).' },
  ];
  let evidence = standardEvidence();

  if (seed.status !== 'Received') {
    timeline.push({
      at: day(now, Math.max(0, seed.daysAgo - 1), 11),
      actor: 'Vista previa',
      text: 'Tomó el caso.',
    });
  }
  if (seed.status === 'NeedsInformation') {
    timeline.push({
      at: day(now, Math.max(0, seed.daysAgo - 2), 15),
      actor: 'Vista previa',
      text: 'Pidió información: falta la declaración de beneficiarios finales.',
    });
  }
  if (seed.status === 'Approved') {
    evidence = evidence.map((e, i) =>
      i < 3
        ? {
            ...e,
            source: 'reviewer-attested' as const,
            state: 'Verified' as const,
            detail: 'Revisión manual de una fuente pública. Ver nota del revisor.',
          }
        : e,
    );
    timeline.push({
      at: day(now, Math.max(0, seed.daysAgo - 3), 16),
      actor: 'Vista previa',
      text: 'Aprobó el KYB (política kyb-v1-draft). No es una aprobación de financiamiento.',
    });
  }
  if (seed.status === 'Rejected') {
    timeline.push({
      at: day(now, Math.max(0, seed.daysAgo - 4), 12),
      actor: 'Vista previa',
      text: 'Rechazó: la ficha tributaria no figura como activa.',
    });
  }

  return {
    id: seed.id,
    legalName: seed.legalName,
    country: 'Perú',
    taxIdLabel: 'RUC',
    taxId: seed.taxId,
    sector: seed.sector,
    foundedYear: seed.foundedYear,
    submittedAt,
    status: seed.status,
    assignedTo: seed.assignedTo,
    preparedBy: seed.assignedTo ? 'preview-approver' : null,
    representative: { name: seed.rep[0], role: seed.rep[1], documentTail: seed.rep[2] },
    consentVersion: 'waitlist-2026-10',
    evidence,
    checks: standardChecks(),
    timeline,
  };
}

export function fixtureCases(now: Date): CaseView[] {
  return SEEDS.map((s) => build(s, now));
}
