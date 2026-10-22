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
    sample: string;
    legend: { signal: string; passport: string; network: string };
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
    { href: '#senales', label: 'Señales' },
    { href: '#red', label: 'Acceso' },
    { href: '#estado', label: 'Estado' },
    { href: '#preguntas', label: 'Preguntas' },
  ],
  header: {
    home: 'Fondealo, inicio',
    haveAccount: 'Ya tengo cuenta',
    join: 'Reservar',
    switchLabel: 'EN',
    switchHref: '/en',
    switchLang: 'en',
    switchAria: 'Read this page in English',
    navAria: 'Navegación principal',
    menu: 'Abrir menú',
    menuClose: 'Cerrar menú',
  },
  hero: {
    eyebrow: 'Fondealo · Infraestructura de confianza',
    lines: ['Tu empresa ya tiene una historia.', 'Hazla verificable.'],
    lead: 'Crea un pasaporte portable de tu empresa con tu identidad, tu actividad y tu reputación financiera. Compártelo con quienes pueden financiar tu siguiente etapa.',
    cta: 'Reservar mi pasaporte',
    secondary: 'Ver la red',
    disclaimer:
      'Acceso anticipado gratuito. Fondealo no presta, no invierte ni intermedia inversiones.',
    sceneLabel:
      'Ilustración de ejemplo: un pasaporte de empresa rodeado de señales; algunas tienen fuente verificada y se comparten con la red.',
    pause: 'Pausar animación',
    play: 'Reanudar animación',
    sample: 'Ilustración de ejemplo',
    legend: {
      signal: 'Señales con fuente',
      passport: 'Pasaporte',
      network: 'Acceso con permiso',
    },
  },
  signals: {
    heading: 'Cada dato lleva su fuente.',
    lead: 'Hoy cada financiador te pide lo mismo en otro formato. Aquí cada dato es una señal con su origen y su fecha, y juntas forman tu pasaporte.',
    sample: 'Ejemplo',
    company: 'Kallpa Labs SAC',
    passportTitle: 'Pasaporte de empresa',
    layersAria: 'Capa del pasaporte',
    sourceLabel: 'Fuente',
    states: { verified: 'Verificada', declared: 'Declarada', pending: 'Pendiente' },
    count: (v, t) => `${v} de ${t} con fuente`,
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
        label: 'Actividad verificada',
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
            source: 'Quien te financia, con tu permiso',
            state: 'pending',
          },
          {
            name: 'Historial con financiadores',
            source: 'Quien te financia, con tu permiso',
            state: 'pending',
          },
          { name: 'Situación tributaria', source: 'Administración tributaria', state: 'verified' },
        ],
      },
    ],
    rules: [
      'Verificada: una fuente con nombre la confirmó.',
      'Declarada: la empresa lo afirma, sin fuente aún.',
      'Pendiente: todavía no hay dato.',
    ],
  },
  access: {
    heading: 'Tú decides quién ve qué.',
    lead: 'Cada financiador recibe solo las capas que le das. Retiras el acceso cuando quieras.',
    sample: 'Ejemplo',
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
    hint: 'Prueba: activa y desactiva capas, o retira el acceso.',
    partners: 'Fondos, financieras y aceleradoras de ejemplo. Aún no hay socios firmados.',
    network: 'Red de financiamiento',
  },
  trust: {
    heading: 'Qué es real hoy.',
    todayTitle: 'Hoy',
    today: [
      { part: 'Cuenta y registro de empresa', state: 'Versión de prueba', live: true },
      { part: 'Revisión de los datos', state: 'Solo revisa el formato', live: true },
      { part: 'Compartir con terceros y red de financiamiento', state: 'Planeado', live: false },
    ],
    notTitle: 'Lo que Fondealo no hace',
    notItems: [
      'No presta dinero.',
      'No invierte ni intermedia inversiones.',
      'No garantiza que recibas financiamiento.',
      'No publica ni recomienda empresas.',
      'No vende tus datos.',
    ],
    stellar: 'Construido sobre Stellar · piloto',
    privacy: 'Tus datos personales y tributarios no se publican en ninguna red ni blockchain.',
  },
  faq: {
    heading: 'Preguntas',
    items: [
      {
        q: '¿Cuánto cuesta y cuándo abre?',
        a: 'El acceso anticipado es gratuito. Todavía no hay fecha: te escribiremos cuando abramos el acceso para tu tipo de empresa.',
      },
      {
        q: '¿Mi empresa queda verificada al registrarse?',
        a: 'No. Hoy la verificación funciona en modo de prueba y solo revisa el formato de los datos. Verificar tu empresa tampoco significa que recibirás financiamiento.',
      },
      {
        q: '¿Fondealo me consigue financiamiento?',
        a: 'No. Fondealo no presta ni recomienda empresas. Tú eliges con quién compartes tu pasaporte; quien financia decide por su cuenta.',
      },
      {
        q: '¿Necesito una billetera o criptomonedas?',
        a: 'No. Entras con tu correo y no necesitas billetera, extensión ni frase semilla.',
      },
      {
        q: '¿Es para startups o para MYPE?',
        a: 'Para ambas. Elige tu perfil en la lista de espera. Hoy el registro acepta, en modo de prueba, números tributarios de Perú y de otros cinco países de la región.',
      },
    ],
  },
  cta: {
    heading: ['Reserva tu', 'pasaporte.'],
    text: 'Te escribiremos cuando abramos el acceso para tu tipo de empresa. Sin spam: puedes salir cuando quieras.',
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
    { href: '#senales', label: 'Signals' },
    { href: '#red', label: 'Access' },
    { href: '#estado', label: 'Status' },
    { href: '#preguntas', label: 'Questions' },
  ],
  header: {
    home: 'Fondealo, home',
    haveAccount: 'I have an account',
    join: 'Reserve',
    switchLabel: 'ES',
    switchHref: '/',
    switchLang: 'es',
    switchAria: 'Leer esta página en español',
    navAria: 'Main navigation',
    menu: 'Open menu',
    menuClose: 'Close menu',
  },
  hero: {
    eyebrow: 'Fondealo · Trust infrastructure',
    lines: ['Your company already has a story.', 'Make it verifiable.'],
    lead: 'Build a portable company passport from your identity, activity and financial reputation. Share it with the people who can fund your next stage.',
    cta: 'Reserve my passport',
    secondary: 'See the network',
    disclaimer: 'Free early access. Fondealo does not lend, invest or intermediate investments.',
    sceneLabel:
      'Sample illustration: a company passport surrounded by signals; some have a verified source and are shared with the network.',
    pause: 'Pause animation',
    play: 'Resume animation',
    sample: 'Sample illustration',
    legend: {
      signal: 'Signals with a source',
      passport: 'Passport',
      network: 'Permissioned access',
    },
  },
  signals: {
    heading: 'Every fact carries its source.',
    lead: 'Every funder asks for the same things in a different format. Here each fact is a signal with its origin and date, and together they form your passport.',
    sample: 'Sample',
    company: 'Kallpa Labs SAC',
    passportTitle: 'Company passport',
    layersAria: 'Passport layer',
    sourceLabel: 'Source',
    states: { verified: 'Verified', declared: 'Declared', pending: 'Pending' },
    count: (v, t) => `${v} of ${t} with a source`,
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
        label: 'Verified activity',
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
            source: 'Whoever finances you, with your permission',
            state: 'pending',
          },
          {
            name: 'History with lenders',
            source: 'Whoever finances you, with your permission',
            state: 'pending',
          },
          { name: 'Tax standing', source: 'Tax authority', state: 'verified' },
        ],
      },
    ],
    rules: [
      'Verified: a named source confirmed it.',
      'Declared: the company says so, with no source yet.',
      'Pending: there is no data yet.',
    ],
  },
  access: {
    heading: 'You decide who sees what.',
    lead: 'Each funder receives only the layers you give them. You can withdraw access at any time.',
    sample: 'Sample',
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
    hint: 'Try it: switch layers on and off, or withdraw access.',
    partners: 'Sample funds, lenders and accelerators. There are no signed partners yet.',
    network: 'Financing network',
  },
  trust: {
    heading: 'What is real today.',
    todayTitle: 'Today',
    today: [
      { part: 'Account and company sign-up', state: 'Test version', live: true },
      { part: 'Data review', state: 'Only checks the format', live: true },
      {
        part: 'Sharing with third parties and the financing network',
        state: 'Planned',
        live: false,
      },
    ],
    notTitle: 'What Fondealo does not do',
    notItems: [
      'It does not lend money.',
      'It does not invest or intermediate investments.',
      'It does not promise you will get financing.',
      'It does not publish or recommend companies.',
      'It does not sell your data.',
    ],
    stellar: 'Built on Stellar · pilot',
    privacy: 'Your personal and tax data is never published on any network or blockchain.',
  },
  faq: {
    heading: 'Questions',
    items: [
      {
        q: 'How much does it cost, and when does it open?',
        a: 'Early access is free. There is no date yet: we will write to you when access opens for your type of company.',
      },
      {
        q: 'Is my company verified when it signs up?',
        a: 'No. Verification is in test mode today and only checks the format of the data. Being verified would not mean you will get financing either.',
      },
      {
        q: 'Will Fondealo get me financing?',
        a: 'No. Fondealo does not lend or recommend companies. You choose who you share your passport with; whoever finances decides on their own.',
      },
      {
        q: 'Do I need a wallet or crypto?',
        a: 'No. You sign in with your email; no wallet, extension or seed phrase.',
      },
      {
        q: 'Is it for startups or small businesses?',
        a: 'For both. Pick your profile on the waitlist. Today sign-up accepts, in test mode, tax numbers from Peru and five other countries in the region.',
      },
    ],
  },
  cta: {
    heading: ['Reserve your', 'passport.'],
    text: 'We will write to you when access opens for your type of company. No spam: leave whenever you want.',
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
