import { DASHBOARD_MESSAGES } from './app-messages';

export type AppLocale = 'es' | 'en';
export const APP_LOCALE_COOKIE = 'fondealo_locale';
export const intlLocale = (locale: AppLocale) => (locale === 'es' ? 'es-PE' : 'en-US');

/** Source text is a stable lookup key; user-authored business data is never translated. */
export const APP_MESSAGES: Record<string, readonly [string, string]> = {
  ...DASHBOARD_MESSAGES,
  'No pudimos guardar tu solicitud. Inténtalo de nuevo en un momento.': [
    'No pudimos guardar tu solicitud. Inténtalo de nuevo en un momento.',
    'We could not save your application. Please try again in a moment.',
  ],
  'Tu empresa ya tiene una verificación en curso.': [
    'Tu empresa ya tiene una verificación en curso.',
    'Your business already has an application under review.',
  ],
  'Esta referencia pertenece a otra solicitud.': [
    'Esta referencia pertenece a otra solicitud.',
    'This reference belongs to another application.',
  ],
  'Esta solicitud cambió. Actualiza su estado.': [
    'Esta solicitud cambió. Actualiza su estado.',
    'This application has changed. Refresh to see its status.',
  ],
  'En esta solicitud no se pueden subir documentos.': [
    'En esta solicitud no se pueden subir documentos.',
    'Documents cannot be uploaded in this application.',
  ],
  'La base de datos no está disponible. Tu solicitud no se guardó. Inténtalo de nuevo más tarde.': [
    'La base de datos no está disponible. Tu solicitud no se guardó. Inténtalo de nuevo más tarde.',
    'The database is unavailable. Your application was not saved. Please try again later.',
  ],
  'El registro de solicitudes no está disponible temporalmente. Tu solicitud no se guardó.': [
    'El registro de solicitudes no está disponible temporalmente. Tu solicitud no se guardó.',
    'Application registration is temporarily unavailable. Your application was not saved.',
  ],
  'Ingresa la razón social': ['Ingresa la razón social', 'Enter your legal business name'],
  'Selecciona un país': ['Selecciona un país', 'Select a country'],
  'Selecciona un sector': ['Selecciona un sector', 'Select a sector'],
  'Ingresa un año válido': ['Ingresa un año válido', 'Enter a valid year'],
  'El año de fundación no puede ser futuro': [
    'El año de fundación no puede ser futuro',
    'The founding year cannot be in the future',
  ],
  'Ingresa un correo de contacto válido': [
    'Ingresa un correo de contacto válido',
    'Enter a valid contact email',
  ],
  'Ingresa el nombre del representante': [
    'Ingresa el nombre del representante',
    'Enter the representative’s name',
  ],
  'Selecciona tu relación con la empresa': [
    'Selecciona tu relación con la empresa',
    'Select your relationship to the business',
  ],
  'Necesitamos tu consentimiento para tratar estos datos': [
    'Necesitamos tu consentimiento para tratar estos datos',
    'We need your consent to process this data',
  ],
  'Ya hay una solicitud en curso, o ese {p0} está registrado en otra cuenta.': [
    'Ya hay una solicitud en curso, o ese {p0} está registrado en otra cuenta.',
    'An application is already in progress, or this {p0} is registered to another account.',
  ],
  __locale: ['es-PE', 'en-US'],
  'Showing one scenario': ['Mostrando 1 escenario', 'Showing 1 scenario'],
  'Ya registramos tu solicitud el {date}.': [
    'Ya registramos tu solicitud el {date}.',
    'Your request was already recorded on {date}.',
  ],
  Access: ['Acceso', 'Access'],
  Availability: ['Disponibilidad', 'Availability'],
  'Select a country first': ['Primero elige un país', 'Select a country first'],
  'Switch to light theme': ['Cambiar a tema claro', 'Switch to light theme'],
  'Switch to dark theme': ['Cambiar a tema oscuro', 'Switch to dark theme'],
  B2B_RECEIVABLES: ['Facturación B2B con cobro posterior', 'B2B receivables'],
  RECURRING_REVENUE: ['Ingresos recurrentes', 'Recurring revenue'],
  OPERATING_REVENUE: ['Otros ingresos operativos', 'Other operating revenue'],
  PRE_REVENUE: ['Sin ingresos todavía', 'Pre-revenue'],
  INVOICE_ADVANCE: ['Adelantar facturas', 'Invoice advance'],
  WORKING_CAPITAL: ['Capital de trabajo', 'Working capital'],
  INVENTORY_OR_PO: ['Inventario / órdenes de compra', 'Inventory / purchase orders'],
  GROWTH_CAPITAL: ['Crecimiento sin ceder acciones', 'Growth without giving up equity'],
  OTHER: ['Otro', 'Other'],
  UP_TO_10K: ['Hasta US$ 10 mil', 'Up to US$10k'],
  FROM_10K_TO_50K: ['US$ 10 mil–50 mil', 'US$10k–50k'],
  FROM_50K_TO_100K: ['US$ 50 mil–100 mil', 'US$50k–100k'],
  OVER_100K: ['Más de US$ 100 mil', 'Over US$100k'],
  UP_TO_30_DAYS: ['Hasta 30 días', 'Up to 30 days'],
  DAYS_31_TO_90: ['31–90 días', '31–90 days'],
  DAYS_91_TO_180: ['91–180 días', '91–180 days'],
  OVER_180_DAYS: ['Más de 180 días', 'Over 180 days'],
  LESS_THAN_HALF: ['Menos de la mitad de ventas B2B', 'Less than half B2B sales'],
  HALF_OR_MORE: ['La mitad o más de ventas B2B', 'Half or more B2B sales'],
  ALL: ['Todas las ventas B2B', 'All sales B2B'],
  'Prepare evidence requirements; not a credit decision': [
    'Preparar la evidencia necesaria; no es una decisión de crédito',
    'Prepare evidence requirements; not a credit decision',
  ],
  'Continue as {role}': ['Continuar como {role}', 'Continue as {role}'],
  empresa: ['empresa', 'business'],
  'inversionista de prueba': ['inversionista de prueba', 'test investor'],
  business: ['empresa', 'business'],
  investor: ['inversionista', 'investor'],
  'Reset filters': ['Restablecer filtros', 'Reset filters'],
  'Showing {count} scenarios': ['Mostrando {count} escenarios', 'Showing {count} scenarios'],
  'Estimated totals follow the scenario terms; they are not recorded payouts.': [
    'Los totales estimados siguen los términos del escenario; no son pagos recibidos.',
    'Estimated totals follow the scenario terms; they are not recorded payouts.',
  ],
  'Active positions: {count}': ['Posiciones activas: {count}', 'Active positions: {count}'],
  'Past due positions: {count}': [
    'Posiciones en incumplimiento: {count}',
    'Past due positions: {count}',
  ],
  'Explore test market': ['Explorar mercado de prueba', 'Explore test market'],
  'Test portfolio': ['Portafolio de prueba', 'Test portfolio'],
  '{amount} test USDC added to your balance.': [
    'Se añadieron {amount} USDC de prueba a tu saldo.',
    '{amount} test USDC added to your balance.',
  ],
  'Only {amount} USDC is still open.': [
    'Solo quedan {amount} USDC disponibles para aportar.',
    'Only {amount} USDC is still open.',
  ],
  'Opportunity created — {amount} USDC collateral locked, now open for funding.': [
    'Solicitud de prueba creada; {amount} USDC de garantía registrados.',
    'Test request created; {amount} USDC collateral recorded.',
  ],
  "Amount exceeds what's left due ({amount} USDC).": [
    'El monto supera el saldo pendiente ({amount} USDC).',
    "Amount exceeds what's left due ({amount} USDC).",
  ],
  'The faucet gives at most {amount} USDC at a time': [
    'Puedes añadir hasta {amount} USDC de prueba a la vez.',
    'You can add up to {amount} test USDC at a time.',
  ],
  'Already recorded on {date}.': ['Ya registrado el {date}.', 'Already recorded on {date}.'],
  'We could not reach the database. Try again in a moment.': [
    'No pudimos conectar con la base de datos. Inténtalo en un momento.',
    'We could not reach the database. Try again in a moment.',
  ],
  'Business verification and underwriting approval are required before requesting financing.': [
    'Se requieren verificación de empresa y evaluación aprobadas antes de solicitar financiamiento.',
    'Business verification and underwriting approval are required before requesting financing.',
  ],
  'Only {role} accounts can do this.': [
    'Solo las cuentas de {role} pueden realizar esta acción.',
    'Only {role} accounts can do this.',
  ],
  'Choose an option': ['Elige una opción', 'Choose an option'],
  'Sign in with your business account to continue.': [
    'Inicia sesión con tu cuenta de empresa para continuar.',
    'Sign in with your business account to continue.',
  ],
  'Review your company details and complete the required ranges.': [
    'Revisa los datos de tu empresa y completa los rangos obligatorios.',
    'Review your company details and complete the required ranges.',
  ],
  'Company identity is already part of a verification request. Contact support to change it.': [
    'Los datos ya forman parte de una solicitud de verificación. Contacta a soporte para corregirlos.',
    'Company identity is already part of a verification request. Contact support to change it.',
  ],
  'We could not save your profile. Please try again; your account access is unchanged.': [
    'No pudimos guardar tu perfil. Inténtalo de nuevo; puedes seguir entrando a tu cuenta.',
    'We could not save your profile. Please try again; your account access is unchanged.',
  ],
  Home: ['Inicio', 'Home'],
  'Fondealo home': ['Fondealo, inicio', 'Fondealo home'],
  'Explore Fondealo': ['Explorar Fondealo', 'Explore Fondealo'],
  Business: ['Empresa', 'Business'],
  Investor: ['Inversionista', 'Investor'],
  None: ['Sin solicitud', 'No application'],
  Processing: ['En revisión', 'Under review'],
  Accepted: ['Aceptada', 'Accepted'],
  Rejected: ['Rechazada', 'Rejected'],
  months: ['meses', 'months'],
  'of principal': ['del capital', 'of principal'],
  'Regla de prueba: los números tributarios que terminan en 0000 se rechazan para probar el caso de error.':
    [
      'Regla de prueba: los números tributarios que terminan en 0000 se rechazan para probar el caso de error.',
      'Test rule: tax numbers ending in 0000 are rejected to exercise the error case.',
    ],
  'El formato del número tributario es válido para el país elegido.': [
    'El formato del número tributario es válido para el país elegido.',
    'The tax number format is valid for the selected country.',
  ],
  'Modo de prueba: no se consultaron registros, propietarios ni listas de sanciones.': [
    'Modo de prueba: no se consultaron registros, propietarios ni listas de sanciones.',
    'Test mode: no registries, owners or sanctions lists were queried.',
  ],
  'La revisión de prueba no estuvo disponible. Tu solicitud sigue pendiente de revisión.': [
    'La revisión de prueba no estuvo disponible. Tu solicitud sigue pendiente de revisión.',
    'The test check was unavailable. Your application remains pending review.',
  ],
  'Ingresa la razón social de tu empresa.': [
    'Ingresa la razón social de tu empresa.',
    'Enter your company’s legal name.',
  ],
  'Selecciona el país donde está registrada la empresa.': [
    'Selecciona el país donde está registrada la empresa.',
    'Select the country where the company is registered.',
  ],
  'Selecciona el sector de tu empresa.': [
    'Selecciona el sector de tu empresa.',
    'Select your company’s sector.',
  ],
  'Ingresa un año de fundación válido.': [
    'Ingresa un año de fundación válido.',
    'Enter a valid founding year.',
  ],
  'Selecciona tu rango de ventas mensuales.': [
    'Selecciona tu rango de ventas mensuales.',
    'Select your monthly revenue range.',
  ],
  'Ingresa un correo de contacto válido.': [
    'Ingresa un correo de contacto válido.',
    'Enter a valid contact email.',
  ],
  'Ingresa el nombre del representante.': [
    'Ingresa el nombre del representante.',
    'Enter the representative’s name.',
  ],
  'Selecciona tu relación con la empresa.': [
    'Selecciona tu relación con la empresa.',
    'Select your relationship to the company.',
  ],
  'Confirma que cuentas con la constancia de inscripción y el documento tributario.': [
    'Confirma que cuentas con la constancia de inscripción y el documento tributario.',
    'Confirm that you have the registration certificate and tax document.',
  ],
  'Acepta la declaración para continuar.': [
    'Acepta la declaración para continuar.',
    'Accept the declaration to continue.',
  ],
  'Necesitamos tu consentimiento para continuar.': [
    'Necesitamos tu consentimiento para continuar.',
    'Your consent is required to continue.',
  ],
  'Ingresa un {label} válido ({hint}).': [
    'Ingresa un {label} válido ({hint}).',
    'Enter a valid {label} ({hint}).',
  ],
  'Tu empresa': ['Tu empresa', 'Your company'],
  Revisión: ['Revisión', 'Review'],
  'Revisando el formato de tu número tributario': [
    'Revisando el formato de tu número tributario',
    'Checking the format of your tax number',
  ],
  'Registrando la revisión de prueba': [
    'Registrando la revisión de prueba',
    'Recording the test check',
  ],
  'Guardando tu solicitud para revisión': [
    'Guardando tu solicitud para revisión',
    'Saving your application for review',
  ],
  País: ['País', 'Country'],
  Fundación: ['Fundación', 'Year founded'],
  'Ventas mensuales': ['Ventas mensuales', 'Monthly revenue'],
  Contacto: ['Contacto', 'Contact'],
  Relación: ['Relación', 'Relationship'],
  Verificador: ['Verificador', 'Verifier'],
  'New request': ['Nueva solicitud', 'New request'],
  Passport: ['Pasaporte', 'Passport'],
  Verification: ['Verificación', 'Verification'],
  'My data': ['Mis datos', 'My data'],
  Market: ['Mercado', 'Market'],
  Positions: ['Posiciones', 'Positions'],
  'Financial profile': ['Perfil financiero', 'Financial profile'],
  'Skip to content': ['Saltar al contenido', 'Skip to content'],
  'Sign out': ['Salir', 'Sign out'],
  'Open navigation': ['Abrir navegación', 'Open navigation'],
  'Close navigation': ['Cerrar navegación', 'Close navigation'],
  'Could not sign out. Please try again.': [
    'No pudimos cerrar tu sesión. Inténtalo de nuevo.',
    'Could not sign out. Please try again.',
  ],
  'Could not change language. Please try again.': [
    'No pudimos cambiar el idioma. Inténtalo de nuevo.',
    'Could not change language. Please try again.',
  ],
  'Change language': ['Cambiar idioma', 'Change language'],
  'Business home': ['Inicio de empresa', 'Business home'],
  'Investor home': ['Inicio de inversionista', 'Investor home'],
  'Business navigation': ['Navegación de empresa', 'Business navigation'],
  'Investor navigation': ['Navegación de inversionista', 'Investor navigation'],
};

const messagePatterns = Object.keys(APP_MESSAGES)
  .filter((key) => /\{\w+\}/.test(key))
  .map((key) => {
    const names: string[] = [];
    const pattern = key
      .split(/(\{\w+\})/)
      .map((part) => {
        if (/^\{\w+\}$/.test(part)) {
          names.push(part.slice(1, -1));
          return '(.+?)';
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('');
    return { key, names, pattern: new RegExp(`^${pattern}$`) };
  });

export function appTranslator(locale: AppLocale) {
  const translate = (message: string, variables: Record<string, string | number> = {}): string => {
    let key = message;
    let values = variables;
    if (!APP_MESSAGES[key]) {
      for (const entry of messagePatterns) {
        const match = entry.pattern.exec(message);
        if (match) {
          key = entry.key;
          values = Object.fromEntries(entry.names.map((name, i) => [name, match[i + 1]!]));
          break;
        }
      }
    }
    const pair = APP_MESSAGES[key];
    const text = pair ? pair[locale === 'es' ? 0 : 1] : message;
    return text.replace(/\{(\w+)\}/g, (match, name: string) => {
      const value = values[name];
      if (value === undefined) return match;
      return APP_MESSAGES[String(value)]?.[locale === 'es' ? 0 : 1] ?? String(value);
    });
  };
  return Object.assign(translate, {
    error: (message: string): string =>
      APP_MESSAGES[message] || messagePatterns.some((entry) => entry.pattern.test(message))
        ? translate(message)
        : translate('Could not complete the operation. Please try again.'),
  });
}
