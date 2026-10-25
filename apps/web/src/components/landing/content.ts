/**
 * Landing copy in Spanish (default, `/`) and English (`/en`). Kept apart from
 * layout so the banned-claims test reads every string in one place. Rules:
 * docs/strategy/2026-10-20-landing-refactor-plan.md §4 — Fondealo helps
 * prepare and share; it never presents, selects or recommends companies, and
 * never offers investment, returns or approval.
 */

export type Locale = 'es' | 'en';
export type StageId = 'preseed' | 'seed' | 'revenue' | 'mype';
export type IntroIcon = 'audience' | 'file' | 'notLoan' | 'test';

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
    audience: {
      aria: string;
      startup: string;
      funder: string;
      startupCopy: string;
      funderCopy: string;
      startupCta: string;
      funderCta: string;
      startupNote: string;
      funderNote: string;
    };
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
  intro: {
    heading: string;
    sub: string;
    /** `text` may mark key phrases as **bold**. */
    cards: { icon: IntroIcon; title: string; text: string }[];
  };
  steps: {
    heading: string;
    sub: string;
    items: { title: string; text: string }[];
    play: string;
    pause: string;
    stepLabel: (n: number) => string;
    flow: {
      aria: string;
      company: string;
      file: string;
      layers: [string, string, string];
      shared: string;
      notShared: string;
      recipients: { kind: 'fund' | 'accelerator' | 'lender'; name: string; access: boolean }[];
      access: string;
      noAccess: string;
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
  notDo: { heading: string; statement: string };
  today: { heading: string; note: string; rows: { part: string; state: string; live: boolean }[] };
  qa: {
    heading: string;
    sub: string;
    tabsAria: string;
    topics: {
      id: 'startup' | 'mype' | 'data' | 'about';
      label: string;
      items: { q: string; a: string }[];
    }[];
    askTitle: string;
    askText: string;
    askCta: string;
  };
  cta: { heading: [string, string]; text: string };
  footer: {
    what: string;
    aria: string;
    code: string;
    codeSr: string;
    about: string;
    haveAccount: string;
    rights: string;
  };
}

const es: LandingContent = {
  lang: 'es-PE',
  skip: 'Saltar al contenido',
  nav: [
    { href: '#que-incluye', label: 'Producto' },
    { href: '#startups', label: 'Startups' },
    { href: '#financiadores', label: 'Financiadores' },
    { href: '#red-confianza', label: 'Red de confianza' },
    { href: '#desarrolladores', label: 'Desarrolladores' },
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
    audience: {
      aria: 'Elige tu perfil',
      startup: 'Soy startup',
      funder: 'Soy financiador',
      startupCopy: 'Prepara el pasaporte de tu empresa y organiza su información en un solo lugar.',
      funderCopy:
        'Explora el piloto de datos estructurados con acceso por permiso. La decisión de financiar siempre será tuya.',
      startupCta: 'Unirme a la lista de espera',
      funderCta: 'Ver estado del piloto',
      startupNote: 'Acceso anticipado gratuito. Fondealo no presta ni invierte.',
      funderNote:
        'El acceso para financiadores aún no está disponible. No hay datos reales ni decisiones de financiamiento en el piloto.',
    },
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
    heading: 'Cada fondo, aceleradora o financiador te pide lo mismo en otro formato.',
    sub: 'Fondealo te ayuda a tenerlo ordenado una vez y a compartirlo solo con permiso.',
    cards: [
      {
        icon: 'audience',
        title: 'Para startups y MYPE',
        text: 'Startups que preparan una **ronda pre-seed o seed**, startups con ingresos que buscan **financiamiento sin ceder acciones** y MYPE que piden crédito.',
      },
      {
        icon: 'file',
        title: 'Un solo expediente',
        text: 'Los **datos y documentos de tu empresa** en un solo lugar. Lo ordenas una vez y lo **reutilizas cada vez** que te lo pidan.',
      },
      {
        icon: 'notLoan',
        title: 'No es un préstamo',
        text: 'Tampoco una vitrina de empresas. **Quien decide financiarte es siempre quien financia**, nunca Fondealo.',
      },
      {
        icon: 'test',
        title: 'En versión de prueba',
        text: 'La verificación aún funciona **en modo de prueba** y todavía **no se comparte con terceros**. Por eso abrimos la lista.',
      },
    ],
  },
  steps: {
    heading: 'Cómo funciona',
    sub: 'Tu expediente queda contigo. Tú decides qué parte ve cada quien, y por cuánto tiempo.',
    items: [
      {
        title: 'Registra tu empresa',
        text: 'Con su RUC, su representante y los documentos que puedes presentar. Sin subir archivos todavía.',
      },
      {
        title: 'Elige qué compartir',
        text: 'Marca qué partes del expediente ve cada fondo, aceleradora o financiador.',
      },
      {
        title: 'Comparte con permiso',
        text: 'Das acceso con un permiso que puedes retirar. Cada acceso queda registrado.',
      },
    ],
    play: 'Reproducir animación',
    pause: 'Pausar animación',
    stepLabel: (n) => `Paso ${n}`,
    flow: {
      aria: 'Diagrama: tu expediente y con quién lo compartes',
      company: 'Kallpa Labs SAC',
      file: 'Expediente',
      layers: ['Datos y RUC', 'Documentos', 'Finanzas'],
      shared: 'Se comparte',
      notShared: 'Privado',
      recipients: [
        { kind: 'fund', name: 'Fondo de ejemplo', access: true },
        { kind: 'accelerator', name: 'Aceleradora de ejemplo', access: true },
        { kind: 'lender', name: 'Financiera de ejemplo', access: false },
      ],
      access: 'Con acceso',
      noAccess: 'Sin acceso',
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
      'Fondealo es infraestructura, no un prestamista. La decisión de financiar siempre queda en manos de cada proveedor de financiamiento.',
  },
  today: {
    heading: 'Estado del piloto y la red de confianza',
    note: 'Nada de esto mueve dinero real.',
    rows: [
      { part: 'Sitio y registro de cuenta', state: 'Disponible (versión de prueba)', live: true },
      { part: 'Solicitud de verificación', state: 'En modo de prueba', live: true },
      { part: 'Compartir el expediente con terceros', state: 'Planeado', live: false },
      { part: 'Historial de pagos', state: 'Planeado', live: false },
      { part: 'Contratos Stellar / Soroban', state: 'Construidos; no desplegados', live: false },
    ],
  },
  qa: {
    heading: 'Preguntas y respuestas',
    sub: 'Lo que más nos preguntan fundadores y dueños de MYPE.',
    tabsAria: 'Temas',
    topics: [
      {
        id: 'startup',
        label: 'Startups',
        items: [
          {
            q: '¿Fondealo me consigue inversionistas?',
            a: 'No. Fondealo no presenta ni recomienda empresas. Tú decides con qué fondo, aceleradora o financiador compartes tu expediente.',
          },
          {
            q: '¿Me sirve para un due diligence?',
            a: 'Esa es la idea: tener ordenado lo que suelen pedir en un due diligence (la revisión que hace un inversionista o financiador). Hoy puedes declararlo en modo de prueba; compartirlo llegará después.',
          },
          {
            q: 'Mi empresa está constituida fuera del Perú. ¿Me sirve?',
            a: 'Cuéntanoslo en la lista de espera. Hoy el registro acepta, en modo de prueba, números tributarios de Perú y de otros cinco países de la región.',
          },
        ],
      },
      {
        id: 'mype',
        label: 'MYPE',
        items: [
          {
            q: 'Tengo una MYPE, no una startup. ¿Es para mí?',
            a: 'Sí. Elige "MYPE" en la lista de espera y te avisaremos cuando abramos tu acceso.',
          },
          {
            q: '¿Verificar mi empresa me asegura un crédito?',
            a: 'No. Verificar tu empresa no significa que recibirás financiamiento. La decisión siempre es de quien financia.',
          },
          {
            q: '¿Cuánto cuesta?',
            a: 'El acceso anticipado es gratuito para startups y MYPE.',
          },
        ],
      },
      {
        id: 'data',
        label: 'Tus datos',
        items: [
          {
            q: '¿Quién ve mi información?',
            a: 'Nadie, hasta que tú la compartes. Eliges a quién y qué partes ve, y puedes retirar el permiso cuando quieras.',
          },
          {
            q: '¿Publican mis datos en blockchain?',
            a: 'No. Tus datos personales y tributarios no se publican en ninguna red ni blockchain.',
          },
          {
            q: '¿Puedo pedir que borren mis datos?',
            a: 'Sí. Con tu cuenta, en "Mis datos", ves qué guardamos y puedes pedir que lo borremos.',
          },
        ],
      },
      {
        id: 'about',
        label: 'Sobre Fondealo',
        items: [
          {
            q: '¿Cuándo estará disponible?',
            a: 'Todavía no hay fecha. Te escribiremos cuando abramos el acceso para tu tipo de empresa.',
          },
          {
            q: '¿Mi startup queda verificada al registrarse?',
            a: 'No. Hoy la verificación funciona en modo de prueba y solo revisa el formato de los datos.',
          },
          {
            q: '¿Necesito una billetera o criptomonedas?',
            a: 'No. Entras con tu correo y no necesitas billetera, extensión ni frase semilla.',
          },
        ],
      },
    ],
    askTitle: '¿Tienes otra pregunta?',
    askText:
      'Déjanos tu correo en la lista de espera y cuéntanos tu caso en la entrevista opcional.',
    askCta: 'Ir a la lista de espera',
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
    about: 'Sobre Fondealo',
    haveAccount: 'Ya tengo cuenta',
    rights: '© 2026 Fondealo · Versión de prueba',
  },
};

const en: LandingContent = {
  lang: 'en',
  skip: 'Skip to content',
  nav: [
    { href: '#que-incluye', label: 'Product' },
    { href: '#startups', label: 'Startups' },
    { href: '#financiadores', label: 'Funders' },
    { href: '#red-confianza', label: 'Trust network' },
    { href: '#desarrolladores', label: 'Developers' },
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
    audience: {
      aria: 'Choose your role',
      startup: 'I’m a startup',
      funder: 'I’m a funder',
      startupCopy: 'Prepare your company passport and organise its information in one place.',
      funderCopy:
        'Explore the structured-data pilot with permissioned access. Financing decisions always remain yours.',
      startupCta: 'Join the waitlist',
      funderCta: 'See pilot status',
      startupNote: 'Free early access. Fondealo does not lend or invest.',
      funderNote:
        'Funder access is not available yet. The pilot has no real company data or financing decisions.',
    },
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
    heading: 'Every fund, accelerator or lender asks for the same things in a different format.',
    sub: 'Fondealo helps you keep it organised once and share it only with permission.',
    cards: [
      {
        icon: 'audience',
        title: 'For startups and small businesses',
        text: 'Startups preparing a **pre-seed or seed round**, revenue-stage startups seeking **financing without giving up equity**, and small businesses applying for credit.',
      },
      {
        icon: 'file',
        title: 'One company file',
        text: 'Your **company’s information and documents** in one place. Organise it once and **reuse it every time** someone asks.',
      },
      {
        icon: 'notLoan',
        title: 'Not a loan',
        text: 'Nor a showcase of companies. **The decision to finance you belongs to whoever finances**, never to Fondealo.',
      },
      {
        icon: 'test',
        title: 'In a test version',
        text: 'Verification still runs **in test mode** and nothing is **shared with third parties yet**. That is why we opened the list.',
      },
    ],
  },
  steps: {
    heading: 'How it works',
    sub: 'Your file stays with you. You decide which part each party sees, and for how long.',
    items: [
      {
        title: 'Register your company',
        text: 'With its tax number, its representative and the documents you can provide. No file uploads yet.',
      },
      {
        title: 'Choose what to share',
        text: 'Pick which parts of the file each fund, accelerator or lender can see.',
      },
      {
        title: 'Share with permission',
        text: 'You grant access with a permission you can withdraw. Every access is logged.',
      },
    ],
    play: 'Play animation',
    pause: 'Pause animation',
    stepLabel: (n) => `Step ${n}`,
    flow: {
      aria: 'Diagram: your company file and who you share it with',
      company: 'Kallpa Labs SAC',
      file: 'Company file',
      layers: ['Details and tax ID', 'Documents', 'Financials'],
      shared: 'Shared',
      notShared: 'Private',
      recipients: [
        { kind: 'fund', name: 'Sample fund', access: true },
        { kind: 'accelerator', name: 'Sample accelerator', access: true },
        { kind: 'lender', name: 'Sample lender', access: false },
      ],
      access: 'Has access',
      noAccess: 'No access',
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
      'Fondealo is infrastructure, not a lender. Financing decisions always remain with each financing provider.',
  },
  today: {
    heading: 'Pilot and trust network status',
    note: 'None of this moves real money.',
    rows: [
      { part: 'Website and account sign-up', state: 'Available (test version)', live: true },
      { part: 'Verification request', state: 'In test mode', live: true },
      { part: 'Sharing the file with third parties', state: 'Planned', live: false },
      { part: 'Payment history', state: 'Planned', live: false },
      { part: 'Stellar / Soroban contracts', state: 'Built; not deployed', live: false },
    ],
  },
  qa: {
    heading: 'Questions and answers',
    sub: 'What founders and small-business owners ask us most.',
    tabsAria: 'Topics',
    topics: [
      {
        id: 'startup',
        label: 'Startups',
        items: [
          {
            q: 'Will Fondealo find me investors?',
            a: 'No. Fondealo does not present or recommend companies. You decide which fund, accelerator or lender you share your file with.',
          },
          {
            q: 'Does it help with due diligence?',
            a: 'That is the idea: keep ready what a due diligence usually asks for. Today you can declare it in test mode; sharing comes later.',
          },
          {
            q: 'My company is incorporated outside Peru. Can I use it?',
            a: 'Tell us on the waitlist. Today sign-up accepts, in test mode, tax numbers from Peru and five other countries in the region.',
          },
        ],
      },
      {
        id: 'mype',
        label: 'Small business',
        items: [
          {
            q: 'I run a small business, not a startup. Is it for me?',
            a: 'Yes. Choose “Small business” on the waitlist and we will let you know when your access opens.',
          },
          {
            q: 'Does verifying my company get me credit?',
            a: 'No. Being verified does not mean you will get financing. The decision always belongs to whoever finances.',
          },
          {
            q: 'How much does it cost?',
            a: 'Early access is free for startups and small businesses.',
          },
        ],
      },
      {
        id: 'data',
        label: 'Your data',
        items: [
          {
            q: 'Who sees my information?',
            a: 'Nobody, until you share it. You choose who and which parts they see, and you can withdraw permission at any time.',
          },
          {
            q: 'Is my data published on a blockchain?',
            a: 'No. Your personal and tax data is never published on any network or blockchain.',
          },
          {
            q: 'Can I ask you to delete my data?',
            a: 'Yes. With your account, “My data” shows what we store and lets you ask us to delete it.',
          },
        ],
      },
      {
        id: 'about',
        label: 'About Fondealo',
        items: [
          {
            q: 'When will it be available?',
            a: 'There is no date yet. We will write to you when access opens for your type of company.',
          },
          {
            q: 'Is my startup verified when it signs up?',
            a: 'No. Verification is in test mode today and only checks the format of the data.',
          },
          {
            q: 'Do I need a wallet or crypto?',
            a: 'No. You sign in with your email; no wallet, extension or seed phrase.',
          },
        ],
      },
    ],
    askTitle: 'Another question?',
    askText:
      'Leave your email on the waitlist and tell us about your case in the optional interview.',
    askCta: 'Go to the waitlist',
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
    about: 'About',
    haveAccount: 'I have an account',
    rights: '© 2026 Fondealo · Test version',
  },
};

export const content: Record<Locale, LandingContent> = { es, en };
