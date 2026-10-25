export type ReviewCase = {
  id: string;
  legalName: string;
  country: string;
  sector: string;
  submitted: string;
  age: string;
  urgency: 'Prioridad alta' | 'En cola' | 'Reciente';
  stage: 'Revisión inicial' | 'Validación de datos' | 'Pendiente de información';
  taxId: string;
  representative: string;
  relationship: string;
  declared: string[];
  checks: { label: string; result: string }[];
  note: string;
};

// Synthetic examples only. Do not replace these fixtures with database reads
// until staff identity, authorization and the isolated Development target exist.
export const DEMO_CASES: ReviewCase[] = [
  {
    id: 'FDO-DEMO-1048',
    legalName: 'Andes Verde Comercial S.A.C.',
    country: 'Perú',
    sector: 'Agricultura',
    submitted: 'Hoy, 09:42',
    age: 'Hace 3 h',
    urgency: 'Prioridad alta',
    stage: 'Validación de datos',
    taxId: '20•••••••41',
    representative: 'Camila Rojas',
    relationship: 'Gerente general',
    declared: ['Inscripción de empresa', 'Documento tributario', 'Propietarios'],
    checks: [
      { label: 'Formato tributario', result: 'Formato válido · sandbox' },
      { label: 'Registro comercial', result: 'No consultado' },
      { label: 'Lista de sanciones', result: 'No consultada' },
    ],
    note: 'Revisar la consistencia entre la razón social y la declaración de propietarios.',
  },
  {
    id: 'FDO-DEMO-1047',
    legalName: 'Taller Norte Logística E.I.R.L.',
    country: 'Perú',
    sector: 'Logística y transporte',
    submitted: 'Hoy, 08:18',
    age: 'Hace 4 h',
    urgency: 'Prioridad alta',
    stage: 'Pendiente de información',
    taxId: '20•••••••09',
    representative: 'Diego Salazar',
    relationship: 'Apoderado',
    declared: ['Inscripción de empresa', 'Documento tributario'],
    checks: [
      { label: 'Formato tributario', result: 'Formato válido · sandbox' },
      { label: 'Registro comercial', result: 'No consultado' },
      { label: 'Lista de sanciones', result: 'No consultada' },
    ],
    note: 'El expediente indica que falta declarar a los beneficiarios finales.',
  },
  {
    id: 'FDO-DEMO-1046',
    legalName: 'Mercado Claro Digital S.A.C.',
    country: 'Perú',
    sector: 'Comercio minorista',
    submitted: 'Ayer, 16:05',
    age: 'Hace 21 h',
    urgency: 'En cola',
    stage: 'Revisión inicial',
    taxId: '20•••••••72',
    representative: 'Lucía Paredes',
    relationship: 'Dueña o socia',
    declared: ['Inscripción de empresa', 'Documento tributario', 'Domicilio'],
    checks: [
      { label: 'Formato tributario', result: 'Formato válido · sandbox' },
      { label: 'Registro comercial', result: 'No consultado' },
      { label: 'Lista de sanciones', result: 'No consultada' },
    ],
    note: 'Sin notas para este caso.',
  },
  {
    id: 'FDO-DEMO-1045',
    legalName: 'Pacífico Alimentos S.R.L.',
    country: 'Perú',
    sector: 'Alimentos y bebidas',
    submitted: 'Ayer, 12:31',
    age: 'Hace 1 día',
    urgency: 'En cola',
    stage: 'Revisión inicial',
    taxId: '20•••••••36',
    representative: 'Mateo Ibarra',
    relationship: 'Director',
    declared: ['Inscripción de empresa', 'Documento tributario', 'Propietarios', 'Domicilio'],
    checks: [
      { label: 'Formato tributario', result: 'Formato válido · sandbox' },
      { label: 'Registro comercial', result: 'No consultado' },
      { label: 'Lista de sanciones', result: 'No consultada' },
    ],
    note: 'Sin notas para este caso.',
  },
  {
    id: 'FDO-DEMO-1044',
    legalName: 'Cobre Azul Tecnología S.A.C.',
    country: 'Perú',
    sector: 'Tecnología',
    submitted: '23 oct, 17:22',
    age: 'Hace 2 días',
    urgency: 'Reciente',
    stage: 'Validación de datos',
    taxId: '20•••••••58',
    representative: 'Alma Torres',
    relationship: 'Gerente general',
    declared: ['Inscripción de empresa', 'Documento tributario', 'Propietarios'],
    checks: [
      { label: 'Formato tributario', result: 'Formato válido · sandbox' },
      { label: 'Registro comercial', result: 'No consultado' },
      { label: 'Lista de sanciones', result: 'No consultada' },
    ],
    note: 'Sin notas para este caso.',
  },
  {
    id: 'FDO-DEMO-1043',
    legalName: 'Ruta Sur Servicios Integrados S.A.C.',
    country: 'Perú',
    sector: 'Servicios',
    submitted: '22 oct, 11:10',
    age: 'Hace 3 días',
    urgency: 'Reciente',
    stage: 'Revisión inicial',
    taxId: '20•••••••13',
    representative: 'Nicolás Vega',
    relationship: 'Dueño o socio',
    declared: ['Inscripción de empresa', 'Documento tributario'],
    checks: [
      { label: 'Formato tributario', result: 'Formato válido · sandbox' },
      { label: 'Registro comercial', result: 'No consultado' },
      { label: 'Lista de sanciones', result: 'No consultada' },
    ],
    note: 'Sin notas para este caso.',
  },
];
