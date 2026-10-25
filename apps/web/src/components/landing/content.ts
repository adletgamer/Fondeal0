/**
 * Landing copy in Spanish (default, `/`) and English (`/en`). Kept apart from
 * layout so the banned-claims test reads every string in one place. Rules:
 * docs/strategy/2026-10-20-landing-refactor-plan.md §4 and the vocabulary in
 * docs/brand/identity.md §2 — Fondealo helps prepare and share; it never
 * presents, selects or recommends companies, and never offers investment,
 * returns or approval. Say "verificada" only where a named source checked it.
 */

export type Locale = 'es' | 'en';
export type LayerId = 'identity' | 'activity' | 'finance';
export type SignalState = 'verified' | 'declared' | 'pending';
export type RecipientId = 'fund' | 'lender' | 'accelerator';

interface Signal {
  name: string;
  source: string;
  state: SignalState;
}

export interface LandingContent {
  lang: string;
  skip: string;
  nav: { href: string; label: string }[];
  header: {
    home: string;
    haveAccount: string;
    join: string;
    switchLabel: string;
    switchHref: string;
    switchLang: Locale;
    switchAria: string;
    navAria: string;
    menu: string;
    menuClose: string;
  };
  hero: {
    eyebrow: string;
    lines: [string, string];
    lead: string;
    cta: string;
    secondary: string;
    disclaimer: string;
    sceneLabel: string;
    pause: string;
    play: string;
    layers: [string, string, string];
  };
  signals: {
    heading: string;
    lead: string;
    sample: string;
    company: string;
    passportTitle: string;
    layersAria: string;
    sourceLabel: string;
    states: Record<SignalState, string>;
    count: (withSource: number, total: number) => string;
    layers: {
      id: LayerId;
      label: string;
      icon: 'identity' | 'activity' | 'payments';
      items: Signal[];
    }[];
    rules: string[];
  };
  access: {
    heading: string;
    lead: string;
    sample: string;
    company: string;
    recipientsAria: string;
    layersAria: string;
    layerLabels: Record<LayerId, string>;
    recipients: {
      id: RecipientId;
      name: string;
      kind: string;
      icon: 'funder' | 'payments' | 'accelerator';
    }[];
    receives: (name: string, layers: string) => string;
    receivesNothing: (name: string) => string;
    revoke: string;
    revoked: (name: string) => string;
    hint: string;
    partners: string;
    network: string;
  };
  trust: {
    heading: string;
    todayTitle: string;
    today: { part: string; state: string; live: boolean }[];
    notTitle: string;
    notItems: string[];
    stellar: string;
    privacy: string;
  };
  faq: { heading: string; items: { q: string; a: string }[] };
  cta: { heading: [string, string]; text: string };
  footer: {
    what: string;
    aria: string;
    code: string;
    codeSr: string;
    haveAccount: string;
    rights: string;
  };
}

const es: LandingContent = {
  lang: 'es-PE',
  skip: 'Saltar al contenido',
  nav: [
    { href: '#senales', label: 'El pasaporte' },
    { href: '#red', label: 'Cómo compartirlo' },
    { href: '#estado', label: 'Disponibilidad' },
    { href: '#preguntas', label: 'FAQ' },
  ],
  header: {
    home: 'Fondealo, inicio',
    haveAccount: 'Ya tengo cuenta',
    join: 'Unirme',
    switchLabel: 'EN',
    switchHref: '/en',
    switchLang: 'en',
    switchAria: 'Read this page in English',
    navAria: 'Navegación principal',
    menu: 'Abrir menú',
    menuClose: 'Cerrar menú',
  },
  hero: {
    eyebrow: 'Pasaporte de empresa · En desarrollo',
    lines: ['Presenta tu empresa.', 'Respalda su historia.'],
    lead: 'Estamos creando un pasaporte para reunir los datos de tu empresa y compartirlos con quienes tú elijas.',
    cta: 'Unirme a la lista de espera',
    secondary: 'Explorar el ejemplo',
    disclaimer: 'Te avisaremos cuando esté disponible. Unirte es gratis.',
    sceneLabel:
      'Ilustración de ejemplo: un pasaporte de empresa que se separa en sus capas (identidad, actividad y reputación financiera) y envía señales a la red.',
    pause: 'Pausar animación',
    play: 'Reanudar animación',
    layers: ['Identidad', 'Actividad', 'Reputación financiera'],
  },
  signals: {
    heading: 'Los datos que respaldan tu historia.',
    lead: 'El pasaporte reunirá identidad, actividad e historial financiero. Podrás distinguir qué está confirmado y qué falta por completar.',
    sample: 'Ejemplo ficticio',
    company: 'Empresa de ejemplo',
    passportTitle: 'Pasaporte de empresa',
    layersAria: 'Capa del pasaporte',
    sourceLabel: 'Fuente',
    states: { verified: 'Verificada', declared: 'Declarada', pending: 'Pendiente' },
    count: (v, t) => `${v} de ${t} verificadas`,
    layers: [
      {
        id: 'identity',
        label: 'Identidad',
        icon: 'identity',
        items: [
          { name: 'Constitución de la empresa', source: 'Registro público', state: 'verified' },
          { name: 'Ficha RUC', source: 'Administración tributaria', state: 'verified' },
          { name: 'Representante legal', source: 'Declarada por la empresa', state: 'declared' },
        ],
      },
      {
        id: 'activity',
        label: 'Actividad',
        icon: 'activity',
        items: [
          {
            name: 'Ventas de los últimos 12 meses',
            source: 'Facturas emitidas',
            state: 'verified',
          },
          { name: 'Clientes principales', source: 'Declarada por la empresa', state: 'declared' },
          { name: 'Métricas mensuales', source: 'Declarada por la empresa', state: 'declared' },
        ],
      },
      {
        id: 'finance',
        label: 'Reputación financiera',
        icon: 'payments',
        items: [
          {
            name: 'Pagos a proveedores',
            source: 'Por confirmar',
            state: 'pending',
          },
          {
            name: 'Historial con financiadores',
            source: 'Por confirmar',
            state: 'pending',
          },
          { name: 'Situación tributaria', source: 'Administración tributaria', state: 'verified' },
        ],
      },
    ],
    rules: [
      'Verificada: confirmada por una fuente.',
      'Declarada: aportada por la empresa.',
      'Pendiente: falta completar el dato.',
    ],
  },
  access: {
    heading: 'Tú decides quién ve qué.',
    lead: 'Así podrás elegir qué partes de tu pasaporte compartir y retirar el acceso cuando lo necesites.',
    sample: 'Ejemplo interactivo',
    company: 'Tu empresa',
    recipientsAria: 'A quién compartir',
    layersAria: 'Qué ve',
    layerLabels: { identity: 'Identidad', activity: 'Actividad', finance: 'Reputación financiera' },
    recipients: [
      { id: 'fund', name: 'Fondo de ejemplo', kind: 'Fondo', icon: 'funder' },
      { id: 'lender', name: 'Financiera de ejemplo', kind: 'Financiera', icon: 'payments' },
      {
        id: 'accelerator',
        name: 'Aceleradora de ejemplo',
        kind: 'Aceleradora',
        icon: 'accelerator',
      },
    ],
    receives: (name, layers) => `${name} recibe: ${layers}.`,
    receivesNothing: (name) => `${name} aún no recibe nada.`,
    revoke: 'Retirar todo el acceso',
    revoked: (name) => `Acceso retirado para ${name}.`,
    hint: 'Prueba los permisos en este ejemplo.',
    partners: 'Destinatarios ficticios. Aún no hay socios firmados.',
    network: 'Acceso con permiso · En desarrollo',
  },
  trust: {
    heading: 'Estamos construyendo tu pasaporte.',
    todayTitle: 'Disponibilidad',
    today: [
      { part: 'Registro de empresa', state: 'En prueba', live: true },
      { part: 'Verificación de datos', state: 'En desarrollo', live: false },
      { part: 'Compartir el pasaporte', state: 'En desarrollo', live: false },
    ],
    notTitle: 'Sobre el financiamiento',
    notItems: [
      'Fondealo no presta, no invierte ni intermedia inversiones.',
      'El pasaporte no garantiza financiamiento.',
    ],
    stellar: 'Construido sobre Stellar · piloto',
    privacy: 'Tus datos personales y tributarios se guardan fuera de blockchain.',
  },
  faq: {
    heading: 'FAQ',
    items: [
      {
        q: '¿Cuánto cuesta y cuándo abre?',
        a: 'Unirte a la lista es gratis. Aún no hay fecha de apertura; te avisaremos por correo.',
      },
      {
        q: '¿Mi empresa queda verificada al registrarse?',
        a: 'No. El registro de prueba recibe tus datos; la verificación todavía está en desarrollo.',
      },
      {
        q: '¿Fondealo me consigue financiamiento?',
        a: 'No. El pasaporte servirá para presentar tu empresa. Cada financiador decidirá por su cuenta.',
      },
      {
        q: '¿Es para startups o para MYPE?',
        a: 'Para ambas. Indica tu perfil y país en la lista para ayudarnos a preparar el acceso.',
      },
    ],
  },
  cta: {
    heading: ['Conoce cuándo', 'podrás usarlo.'],
    text: 'Únete a la lista de espera. Te avisaremos por correo cuando abramos el acceso.',
  },
  footer: {
    what: 'Fondealo · pasaporte de empresa para startups y MYPE',
    aria: 'Enlaces del pie',
    code: 'Código',
    codeSr: ' (GitHub, en inglés, abre en una pestaña nueva)',
    haveAccount: 'Ya tengo cuenta',
    rights: '© 2026 Fondealo · Versión de prueba',
  },
};

const en: LandingContent = {
  lang: 'en',
  skip: 'Skip to content',
  nav: [
    { href: '#senales', label: 'The passport' },
    { href: '#red', label: 'How to share' },
    { href: '#estado', label: 'Availability' },
    { href: '#preguntas', label: 'FAQ' },
  ],
  header: {
    home: 'Fondealo, home',
    haveAccount: 'I have an account',
    join: 'Join',
    switchLabel: 'ES',
    switchHref: '/',
    switchLang: 'es',
    switchAria: 'Leer esta página en español',
    navAria: 'Main navigation',
    menu: 'Open menu',
    menuClose: 'Close menu',
  },
  hero: {
    eyebrow: 'Company passport · In development',
    lines: ['Present your company.', 'Back up its story.'],
    lead: 'We’re building a passport to bring your company’s data together and share it with the people you choose.',
    cta: 'Join the waitlist',
    secondary: 'Explore the example',
    disclaimer: 'We’ll let you know when it’s available. Joining is free.',
    sceneLabel:
      'Sample illustration: a company passport separating into its layers (identity, activity and financial reputation) and sending signals to the network.',
    pause: 'Pause animation',
    play: 'Resume animation',
    layers: ['Identity', 'Activity', 'Financial reputation'],
  },
  signals: {
    heading: 'The data behind your story.',
    lead: 'The passport will bring together identity, activity and financial history. You’ll see what’s confirmed and what still needs completing.',
    sample: 'Fictional sample',
    company: 'Sample company',
    passportTitle: 'Company passport',
    layersAria: 'Passport layer',
    sourceLabel: 'Source',
    states: { verified: 'Verified', declared: 'Declared', pending: 'Pending' },
    count: (v, t) => `${v} of ${t} verified`,
    layers: [
      {
        id: 'identity',
        label: 'Identity',
        icon: 'identity',
        items: [
          { name: 'Incorporation', source: 'Public registry', state: 'verified' },
          { name: 'Tax registration (RUC)', source: 'Tax authority', state: 'verified' },
          { name: 'Legal representative', source: 'Declared by the company', state: 'declared' },
        ],
      },
      {
        id: 'activity',
        label: 'Activity',
        icon: 'activity',
        items: [
          { name: 'Sales, last 12 months', source: 'Invoices issued', state: 'verified' },
          { name: 'Main customers', source: 'Declared by the company', state: 'declared' },
          { name: 'Monthly metrics', source: 'Declared by the company', state: 'declared' },
        ],
      },
      {
        id: 'finance',
        label: 'Financial reputation',
        icon: 'payments',
        items: [
          {
            name: 'Supplier payments',
            source: 'To be confirmed',
            state: 'pending',
          },
          {
            name: 'History with lenders',
            source: 'To be confirmed',
            state: 'pending',
          },
          { name: 'Tax standing', source: 'Tax authority', state: 'verified' },
        ],
      },
    ],
    rules: [
      'Verified: confirmed by a source.',
      'Declared: supplied by the company.',
      'Pending: data still needed.',
    ],
  },
  access: {
    heading: 'You decide who sees what.',
    lead: 'You’ll be able to choose which parts of your passport to share and withdraw access when you need to.',
    sample: 'Interactive sample',
    company: 'Your company',
    recipientsAria: 'Who to share with',
    layersAria: 'What they see',
    layerLabels: { identity: 'Identity', activity: 'Activity', finance: 'Financial reputation' },
    recipients: [
      { id: 'fund', name: 'Sample fund', kind: 'Fund', icon: 'funder' },
      { id: 'lender', name: 'Sample lender', kind: 'Lender', icon: 'payments' },
      { id: 'accelerator', name: 'Sample accelerator', kind: 'Accelerator', icon: 'accelerator' },
    ],
    receives: (name, layers) => `${name} receives: ${layers}.`,
    receivesNothing: (name) => `${name} receives nothing yet.`,
    revoke: 'Withdraw all access',
    revoked: (name) => `Access withdrawn for ${name}.`,
    hint: 'Try the permissions in this example.',
    partners: 'Fictional recipients. There are no signed partners yet.',
    network: 'Permissioned access · In development',
  },
  trust: {
    heading: 'We’re building your company passport.',
    todayTitle: 'Availability',
    today: [
      { part: 'Company registration', state: 'Test version', live: true },
      { part: 'Data verification', state: 'In development', live: false },
      { part: 'Sharing the passport', state: 'In development', live: false },
    ],
    notTitle: 'About financing',
    notItems: [
      'Fondealo does not lend, invest or intermediate investments.',
      'A passport does not guarantee financing.',
    ],
    stellar: 'Built on Stellar · pilot',
    privacy: 'Your personal and tax data is stored off the blockchain.',
  },
  faq: {
    heading: 'FAQ',
    items: [
      {
        q: 'How much does it cost, and when does it open?',
        a: 'Joining the list is free. There’s no launch date yet; we’ll let you know by email.',
      },
      {
        q: 'Is my company verified when it signs up?',
        a: 'No. The test registration collects your data; verification is still in development.',
      },
      {
        q: 'Will Fondealo get me financing?',
        a: 'No. The passport will help you present your company. Each funder will make their own decision.',
      },
      {
        q: 'Is it for startups or small businesses?',
        a: 'Both. Tell us your profile and country on the waitlist to help us prepare access.',
      },
    ],
  },
  cta: {
    heading: ['Find out when', 'you can use it.'],
    text: 'Join the waitlist. We’ll email you when access opens.',
  },
  footer: {
    what: 'Fondealo · company passport for startups and small businesses',
    aria: 'Footer links',
    code: 'Source code',
    codeSr: ' (GitHub, opens in a new tab)',
    haveAccount: 'I have an account',
    rights: '© 2026 Fondealo · Test version',
  },
};

export const content: Record<Locale, LandingContent> = { es, en };
