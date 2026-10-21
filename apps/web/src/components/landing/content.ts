/**
 * Landing copy in Spanish (default, `/`) and English (`/en`). Kept apart from
 * layout so the banned-claims test reads every string in one place. Rules:
 * docs/strategy/2026-10-20-landing-refactor-plan.md §4 — Fondealo helps
 * prepare and share; it never presents, selects or recommends companies, and
 * never offers investment, returns or approval.
 */

export type Locale = 'es' | 'en';
export type StageId = 'preseed' | 'seed' | 'revenue' | 'mype';

interface DossierItem {
  name: string;
  detail: string;
  ready: boolean;
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
  };
  hero: {
    lines: [string, string];
    lead: string;
    cta: string;
    secondary: string;
    disclaimer: string;
  };
  dossier: {
    aria: string;
    stageAria: string;
    sample: string;
    file: string;
    count: (ready: number, total: number) => string;
    sharedWith: string;
    stages: { id: StageId; label: string; company: string; items: DossierItem[] }[];
  };
  intro: { srHeading: string; lead: string; columns: { runIn: string; text: string }[] };
  steps: {
    heading: string;
    items: { title: string; text: string }[];
    panel: {
      formTitle: string;
      fields: [string, string][];
      pickTitle: string;
      picks: { name: string; on: boolean }[];
      shareTitle: string;
      shareTo: string;
      shareSees: string;
      shareButton: string;
      revoke: string;
    };
  };
  includes: {
    heading: string;
    searchLabel: string;
    placeholder: string;
    note: string;
    empty: string;
    status: { today: string; planned: string };
    items: { name: string; detail: string; status: 'today' | 'planned' }[];
  };
  privacy: {
    heading: string;
    statement: string;
    points: string[];
    panel: {
      title: string;
      rows: { who: string; sees: string; when: string; active: boolean }[];
      active: string;
      revoked: string;
    };
  };
  notDo: { heading: string; statement: string; items: string[] };
  today: { heading: string; note: string; rows: { part: string; state: string; live: boolean }[] };
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
    { href: '#como-funciona', label: 'Cómo funciona' },
    { href: '#que-incluye', label: 'Qué incluye' },
    { href: '#tus-datos', label: 'Tus datos' },
    { href: '#preguntas', label: 'Preguntas' },
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
  },
  hero: {
    lines: ['Un expediente.', 'Tú decides quién.'],
    lead: 'Para startups que preparan una ronda o buscan financiamiento sin ceder acciones, y para MYPE que piden crédito. Ordena una vez los datos de tu empresa y compártelos solo con quien tú elijas.',
    cta: 'Unirme a la lista de espera',
    secondary: 'Cómo funciona',
    disclaimer:
      'Acceso anticipado gratuito. Fondealo no presta, no invierte ni intermedia inversiones.',
  },
  dossier: {
    aria: 'Ejemplo de expediente según la etapa de la empresa',
    stageAria: 'Etapa de tu empresa',
    sample: 'Ejemplo',
    file: 'Expediente',
    count: (r, t) => `${r} de ${t} listos`,
    sharedWith: 'Aún no lo compartes',
    stages: [
      {
        id: 'preseed',
        label: 'Pre-seed',
        company: 'Kallpa Labs SAC',
        items: [
          { name: 'Constitución de la empresa', detail: 'Partida registral', ready: true },
          { name: 'Ficha RUC', detail: 'Activo · habido', ready: true },
          { name: 'Estructura de accionistas', detail: 'Cap table actual', ready: false },
          { name: 'Deck y métricas', detail: 'Usuarios, equipo, mercado', ready: true },
        ],
      },
      {
        id: 'seed',
        label: 'Seed',
        company: 'Kallpa Labs SAC',
        items: [
          { name: 'Constitución y poderes', detail: 'Vigencia del representante', ready: true },
          { name: 'Estructura de accionistas', detail: 'Incluye notas convertibles', ready: true },
          { name: 'Estados financieros', detail: 'Último año, firmados', ready: false },
          { name: 'Métricas mensuales', detail: 'Ingresos, retención, caja', ready: true },
          { name: 'Contratos clave', detail: 'Clientes y proveedores', ready: false },
        ],
      },
      {
        id: 'revenue',
        label: 'Con ingresos',
        company: 'Andes Logística SAC',
        items: [
          { name: 'Ficha RUC y situación tributaria', detail: 'Sin deudas exigibles', ready: true },
          { name: 'Ventas de los últimos 12 meses', detail: 'Facturas emitidas', ready: true },
          { name: 'Principales clientes', detail: 'Concentración de cartera', ready: false },
          { name: 'Estados financieros', detail: 'Último año', ready: true },
        ],
      },
      {
        id: 'mype',
        label: 'MYPE',
        company: 'Panadería San Blas EIRL',
        items: [
          { name: 'Ficha RUC', detail: 'Régimen MYPE tributario', ready: true },
          { name: 'Representante legal', detail: 'DNI y vigencia', ready: true },
          { name: 'Ventas mensuales', detail: 'Últimos 6 meses', ready: false },
        ],
      },
    ],
  },
  intro: {
    srHeading: 'Qué es Fondealo',
    lead: 'Cada fondo, aceleradora o financiador te pide lo mismo en otro formato: quién eres, quién manda, cuánto vendes y qué debes. Fondealo te ayuda a tenerlo ordenado una vez y a compartirlo con permiso.',
    columns: [
      {
        runIn: 'Para quién.',
        text: 'Startups que preparan una ronda pre-seed o seed, startups con ingresos que buscan financiamiento sin ceder acciones y MYPE.',
      },
      {
        runIn: 'Qué es.',
        text: 'Los datos y documentos de tu empresa en un solo lugar. Lo ordenas una vez y lo reutilizas cuando te lo pidan.',
      },
      {
        runIn: 'Qué no es.',
        text: 'No es un préstamo ni una vitrina de empresas. Quien decide financiarte es siempre quien financia.',
      },
      {
        runIn: 'Dónde está hoy.',
        text: 'En versión de prueba: la verificación aún es de prueba y todavía no se comparte con terceros.',
      },
    ],
  },
  steps: {
    heading: 'Cómo funciona',
    items: [
      {
        title: 'Registra tu empresa.',
        text: 'Con su RUC, su representante y los documentos que puedes presentar. Sin subir archivos todavía.',
      },
      {
        title: 'Elige qué compartir.',
        text: 'Tú decides qué partes del expediente ve cada fondo, aceleradora o financiador.',
      },
      {
        title: 'Compártelo cuando quieras.',
        text: 'Das acceso con un permiso que puedes retirar. Cada acceso queda registrado.',
      },
    ],
    panel: {
      formTitle: 'Tu empresa',
      fields: [
        ['Razón social', 'Kallpa Labs SAC'],
        ['RUC', '20612345678'],
        ['Representante', 'Ana Quispe · Gerente general'],
      ],
      pickTitle: 'Qué compartir',
      picks: [
        { name: 'Datos de la empresa', on: true },
        { name: 'Documentos declarados', on: true },
        { name: 'Estructura de accionistas', on: false },
        { name: 'Estados financieros', on: false },
      ],
      shareTitle: 'Dar acceso',
      shareTo: 'Fondo de ejemplo',
      shareSees: 'Ve: datos y documentos',
      shareButton: 'Dar acceso',
      revoke: 'Puedes retirarlo cuando quieras',
    },
  },
  includes: {
    heading: 'Qué incluirá tu expediente',
    searchLabel: 'Buscar en el expediente',
    placeholder: 'Busca un documento',
    note: 'Hoy: lo puedes declarar en modo de prueba. Planeado: aún no está disponible.',
    empty: 'Ningún documento coincide con tu búsqueda.',
    status: { today: 'Hoy', planned: 'Planeado' },
    items: [
      {
        name: 'Datos de la empresa y RUC',
        detail: 'Razón social, sector y año de fundación.',
        status: 'today',
      },
      {
        name: 'Representante legal',
        detail: 'Quién puede actuar en nombre de la empresa.',
        status: 'today',
      },
      {
        name: 'Documentos declarados',
        detail: 'Constitución, ficha RUC, propietarios y domicilio.',
        status: 'today',
      },
      {
        name: 'Estructura de accionistas',
        detail: 'Quién es dueño de qué parte de la empresa.',
        status: 'planned',
      },
      {
        name: 'Estados financieros',
        detail: 'Los del último año, con su fuente y fecha.',
        status: 'planned',
      },
      {
        name: 'Historial de pagos',
        detail: 'Solo lo que tú o tus financiadores reporten con tu permiso.',
        status: 'planned',
      },
    ],
  },
  privacy: {
    heading: 'Quién lo ve',
    statement: 'Nadie ve tu expediente hasta que tú lo compartes.',
    points: [
      'Tú eliges a quién darle acceso y qué partes ve.',
      'Puedes retirar el permiso cuando quieras.',
      'Tus datos personales y tributarios no se publican en ninguna red ni blockchain.',
      'Con tu cuenta, en "Mis datos", ves qué guardamos y puedes pedir que lo borremos.',
    ],
    panel: {
      title: 'Accesos a tu expediente',
      rows: [
        {
          who: 'Fondo de ejemplo',
          sees: 'Datos y documentos',
          when: 'Desde el 3 de octubre',
          active: true,
        },
        {
          who: 'Financiera de ejemplo',
          sees: 'Datos de la empresa',
          when: 'Retirado el 12 de octubre',
          active: false,
        },
      ],
      active: 'Con acceso',
      revoked: 'Retirado',
    },
  },
  notDo: {
    heading: 'Lo que Fondealo no hace',
    statement:
      'Te ayudamos a ordenar y compartir tu información. La decisión de financiarte siempre es de quien financia.',
    items: [
      'No presta dinero.',
      'No invierte ni intermedia inversiones.',
      'No garantiza que recibas financiamiento.',
      'No publica ni recomienda startups o MYPE.',
      'No vende tus datos.',
    ],
  },
  today: {
    heading: 'Lo que funciona hoy',
    note: 'Nada de esto mueve dinero real.',
    rows: [
      { part: 'Sitio y registro de cuenta', state: 'Disponible (versión de prueba)', live: true },
      { part: 'Solicitud de verificación', state: 'En modo de prueba', live: true },
      { part: 'Compartir el expediente con terceros', state: 'Planeado', live: false },
      { part: 'Historial de pagos', state: 'Planeado', live: false },
    ],
  },
  faq: {
    heading: 'Preguntas',
    items: [
      { q: '¿Cuánto cuesta?', a: 'El acceso anticipado es gratuito para startups y MYPE.' },
      {
        q: '¿Cuándo estará disponible?',
        a: 'Todavía no hay fecha. Te escribiremos cuando abramos el acceso para tu tipo de empresa.',
      },
      {
        q: '¿Mi startup queda verificada al registrarse?',
        a: 'No. Hoy la verificación funciona en modo de prueba y solo revisa el formato de los datos. Verificar tu empresa tampoco significa que recibirás financiamiento.',
      },
      {
        q: '¿Fondealo me consigue inversionistas?',
        a: 'No. Fondealo no presenta ni recomienda empresas. Tú decides con qué fondo, aceleradora o financiador compartes tu expediente.',
      },
      {
        q: '¿Necesito una billetera o criptomonedas?',
        a: 'No. Entras con tu correo y no necesitas billetera, extensión ni frase semilla.',
      },
      {
        q: 'Mi empresa está constituida fuera del Perú. ¿Me sirve?',
        a: 'Cuéntanoslo en la lista de espera. Hoy el registro acepta, en modo de prueba, números tributarios de Perú y de otros cinco países de la región.',
      },
      {
        q: 'Tengo una MYPE, no una startup.',
        a: 'También es para ti. Elige "MYPE" en la lista de espera y te avisaremos cuando abramos tu acceso.',
      },
    ],
  },
  cta: {
    heading: ['Únete a la', 'lista de espera.'],
    text: 'Te escribiremos cuando abramos el acceso para tu tipo de empresa. Sin spam: puedes salir cuando quieras.',
  },
  footer: {
    what: 'Fondealo · expediente para startups y MYPE',
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
    { href: '#como-funciona', label: 'How it works' },
    { href: '#que-incluye', label: 'What it holds' },
    { href: '#tus-datos', label: 'Your data' },
    { href: '#preguntas', label: 'Questions' },
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
  },
  hero: {
    lines: ['One company file.', 'You choose who.'],
    lead: 'For startups preparing a round or looking for financing without giving up equity, and for small businesses applying for credit. Organise your company’s information once and share it only with the people you choose.',
    cta: 'Join the waitlist',
    secondary: 'How it works',
    disclaimer: 'Free early access. Fondealo does not lend, invest or intermediate investments.',
  },
  dossier: {
    aria: 'Sample company file by stage',
    stageAria: 'Your company’s stage',
    sample: 'Sample',
    file: 'Company file',
    count: (r, t) => `${r} of ${t} ready`,
    sharedWith: 'Not shared yet',
    stages: [
      {
        id: 'preseed',
        label: 'Pre-seed',
        company: 'Kallpa Labs SAC',
        items: [
          { name: 'Articles of incorporation', detail: 'Public registry entry', ready: true },
          { name: 'Tax registration (RUC)', detail: 'Active · in good standing', ready: true },
          { name: 'Shareholder structure', detail: 'Current cap table', ready: false },
          { name: 'Deck and metrics', detail: 'Users, team, market', ready: true },
        ],
      },
      {
        id: 'seed',
        label: 'Seed',
        company: 'Kallpa Labs SAC',
        items: [
          { name: 'Incorporation and powers', detail: 'Representative’s authority', ready: true },
          { name: 'Shareholder structure', detail: 'Including convertible notes', ready: true },
          { name: 'Financial statements', detail: 'Last year, signed', ready: false },
          { name: 'Monthly metrics', detail: 'Revenue, retention, cash', ready: true },
          { name: 'Key contracts', detail: 'Customers and suppliers', ready: false },
        ],
      },
      {
        id: 'revenue',
        label: 'With revenue',
        company: 'Andes Logística SAC',
        items: [
          { name: 'Tax registration and status', detail: 'No overdue tax debt', ready: true },
          { name: 'Sales, last 12 months', detail: 'Invoices issued', ready: true },
          { name: 'Main customers', detail: 'Customer concentration', ready: false },
          { name: 'Financial statements', detail: 'Last year', ready: true },
        ],
      },
      {
        id: 'mype',
        label: 'Small business',
        company: 'Panadería San Blas EIRL',
        items: [
          { name: 'Tax registration (RUC)', detail: 'Small-business tax regime', ready: true },
          { name: 'Legal representative', detail: 'ID and authority', ready: true },
          { name: 'Monthly sales', detail: 'Last 6 months', ready: false },
        ],
      },
    ],
  },
  intro: {
    srHeading: 'What Fondealo is',
    lead: 'Every fund, accelerator or lender asks for the same things in a different format: who you are, who is in charge, what you sell and what you owe. Fondealo helps you keep it organised once and share it with permission.',
    columns: [
      {
        runIn: 'Who it is for.',
        text: 'Startups preparing a pre-seed or seed round, revenue-stage startups seeking financing without giving up equity, and small businesses.',
      },
      {
        runIn: 'What it is.',
        text: 'Your company’s information and documents in one place. Organise it once and reuse it whenever someone asks.',
      },
      {
        runIn: 'What it is not.',
        text: 'It is not a loan or a showcase of companies. The decision to finance you always belongs to whoever finances.',
      },
      {
        runIn: 'Where it stands.',
        text: 'In a test version: verification is still in test mode and nothing can be shared with third parties yet.',
      },
    ],
  },
  steps: {
    heading: 'How it works',
    items: [
      {
        title: 'Register your company.',
        text: 'With its tax number, its representative and the documents you can provide. No file uploads yet.',
      },
      {
        title: 'Choose what to share.',
        text: 'You decide which parts of the file each fund, accelerator or lender can see.',
      },
      {
        title: 'Share it when you are ready.',
        text: 'You grant access with a permission you can withdraw. Every access is logged.',
      },
    ],
    panel: {
      formTitle: 'Your company',
      fields: [
        ['Legal name', 'Kallpa Labs SAC'],
        ['Tax number (RUC)', '20612345678'],
        ['Representative', 'Ana Quispe · General manager'],
      ],
      pickTitle: 'What to share',
      picks: [
        { name: 'Company details', on: true },
        { name: 'Declared documents', on: true },
        { name: 'Shareholder structure', on: false },
        { name: 'Financial statements', on: false },
      ],
      shareTitle: 'Grant access',
      shareTo: 'Sample fund',
      shareSees: 'Sees: details and documents',
      shareButton: 'Grant access',
      revoke: 'You can withdraw it at any time',
    },
  },
  includes: {
    heading: 'What your file will hold',
    searchLabel: 'Search the file',
    placeholder: 'Search for a document',
    note: 'Today: you can declare it in test mode. Planned: not available yet.',
    empty: 'No document matches your search.',
    status: { today: 'Today', planned: 'Planned' },
    items: [
      {
        name: 'Company details and tax number',
        detail: 'Legal name, sector and founding year.',
        status: 'today',
      },
      {
        name: 'Legal representative',
        detail: 'Who can act on behalf of the company.',
        status: 'today',
      },
      {
        name: 'Declared documents',
        detail: 'Incorporation, tax record, owners and address.',
        status: 'today',
      },
      {
        name: 'Shareholder structure',
        detail: 'Who owns which part of the company.',
        status: 'planned',
      },
      {
        name: 'Financial statements',
        detail: 'Last year’s, with their source and date.',
        status: 'planned',
      },
      {
        name: 'Payment history',
        detail: 'Only what you or your lenders report, with your permission.',
        status: 'planned',
      },
    ],
  },
  privacy: {
    heading: 'Who sees it',
    statement: 'Nobody sees your file until you share it.',
    points: [
      'You choose who gets access and which parts they see.',
      'You can withdraw permission at any time.',
      'Your personal and tax data is never published on any network or blockchain.',
      'With your account, “My data” shows what we store and lets you ask us to delete it.',
    ],
    panel: {
      title: 'Access to your file',
      rows: [
        {
          who: 'Sample fund',
          sees: 'Details and documents',
          when: 'Since 3 October',
          active: true,
        },
        {
          who: 'Sample lender',
          sees: 'Company details',
          when: 'Withdrawn on 12 October',
          active: false,
        },
      ],
      active: 'Has access',
      revoked: 'Withdrawn',
    },
  },
  notDo: {
    heading: 'What Fondealo does not do',
    statement:
      'We help you organise and share your information. The decision to finance you always belongs to whoever finances.',
    items: [
      'It does not lend money.',
      'It does not invest or intermediate investments.',
      'It does not promise you will get financing.',
      'It does not publish or recommend companies.',
      'It does not sell your data.',
    ],
  },
  today: {
    heading: 'What works today',
    note: 'None of this moves real money.',
    rows: [
      { part: 'Website and account sign-up', state: 'Available (test version)', live: true },
      { part: 'Verification request', state: 'In test mode', live: true },
      { part: 'Sharing the file with third parties', state: 'Planned', live: false },
      { part: 'Payment history', state: 'Planned', live: false },
    ],
  },
  faq: {
    heading: 'Questions',
    items: [
      { q: 'How much does it cost?', a: 'Early access is free for startups and small businesses.' },
      {
        q: 'When will it be available?',
        a: 'There is no date yet. We will write to you when access opens for your type of company.',
      },
      {
        q: 'Is my startup verified when it signs up?',
        a: 'No. Verification is in test mode today and only checks the format of the data. Being verified would not mean you will get financing either.',
      },
      {
        q: 'Will Fondealo find me investors?',
        a: 'No. Fondealo does not present or recommend companies. You decide which fund, accelerator or lender you share your file with.',
      },
      {
        q: 'Do I need a wallet or crypto?',
        a: 'No. You sign in with your email; no wallet, extension or seed phrase.',
      },
      {
        q: 'My company is incorporated outside Peru. Can I use it?',
        a: 'Tell us on the waitlist. Today sign-up accepts, in test mode, tax numbers from Peru and five other countries in the region.',
      },
      {
        q: 'I run a small business, not a startup.',
        a: 'It is for you too. Choose “Small business” on the waitlist and we will let you know when your access opens.',
      },
    ],
  },
  cta: {
    heading: ['Join the', 'waitlist.'],
    text: 'We will write to you when access opens for your type of company. No spam: leave whenever you want.',
  },
  footer: {
    what: 'Fondealo · company files for startups and small businesses',
    aria: 'Footer links',
    code: 'Source code',
    codeSr: ' (GitHub, opens in a new tab)',
    haveAccount: 'I have an account',
    rights: '© 2026 Fondealo · Test version',
  },
};

export const content: Record<Locale, LandingContent> = { es, en };
