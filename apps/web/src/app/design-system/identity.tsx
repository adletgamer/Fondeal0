import type { ComponentType, ReactNode, SVGProps } from 'react';
import {
  ICONS,
  IconFinancialReputation,
  IconFinancingNetwork,
  IconPassport,
  IconPermissionedAccess,
  IconTrustSignals,
  IconVerifiedActivity,
} from '@fondealo/ui';
import { BrandBadge3D, ICONS_3D, Icon3D, type Icon3DName } from '@/components/brand/icon-3d';
import { FondealoLogo, FondealoMark } from '@/components/brand/mark';

/**
 * Sprint 1 identity specimen (docs/brand/identity.md): logo system, colour
 * roles, type and the icon vocabulary, each shown in Night and Day side by
 * side. Nested `data-theme` re-scopes the tokens, so both themes render
 * whatever the page theme is.
 */
export function IdentitySpecimen() {
  return (
    <section id="identidad" className="scroll-mt-20 space-y-10" data-testid="ds-identity">
      <div className="max-w-2xl">
        <h2 className="font-brand text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          Identidad Fondealo
        </h2>
        <p className="mt-3 text-lg text-ink">
          El pasaporte de la empresa es el objeto iluminado de una sala oscura. Una base oscura, una
          tinta clara y un solo acento.
        </p>
      </div>

      <Block title="Logo">
        <Themes>
          {() => (
            <div className="flex flex-col gap-8">
              <div className="flex flex-wrap items-end gap-8">
                <FondealoMark size={160} title="Fondealo" />
                <div className="flex flex-col gap-4">
                  <FondealoLogo size={40} />
                  <FondealoLogo size={24} />
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-5">
                {[16, 20, 24, 32, 48].map((s) => (
                  <span key={s} className="flex flex-col items-center gap-2">
                    <FondealoMark size={s} />
                    <span className="text-sm text-ink-muted">{s}px</span>
                  </span>
                ))}
                <span className="flex items-center gap-3 rounded-2xl bg-brand-fill p-4 text-on-brand">
                  <FondealoMark size={40} variant="mono" />
                  <span className="text-sm font-medium">Mono sobre acento</span>
                </span>
              </div>
            </div>
          )}
        </Themes>
      </Block>

      <Block title="Logo 3D e íconos 3D">
        <Themes>
          {() => (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-6">
                <BrandBadge3D size={128} />
                <p className="max-w-[36ch] text-ink">
                  La forma héroe del logo: hero, redes, lanzamientos. Desde 96px. Debajo de eso, el
                  logo vectorial.
                </p>
              </div>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
                {(Object.keys(ICONS_3D) as Icon3DName[]).map((n) => (
                  <li key={n} className="flex flex-col items-center gap-2 text-center">
                    <Icon3D name={n} size={112} />
                    <span className="text-sm font-medium text-ink">{ICONS_3D[n].es}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Themes>
      </Block>

      <Block title="Color">
        <Themes>
          {() => (
            <div className="grid gap-3 sm:grid-cols-2">
              {COLOURS.map((c) => (
                <div
                  key={c.token}
                  className="flex items-center gap-4 rounded-2xl bg-surface-200 p-3"
                >
                  <span className={`h-14 w-14 shrink-0 rounded-xl ${c.swatch}`} />
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">{c.role}</span>
                    <span className="block text-sm text-ink-muted">
                      {c.token} · {c.use}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Themes>
      </Block>

      <Block title="Tipografía">
        <Themes>
          {() => (
            <div className="space-y-6">
              <p className="font-brand text-[clamp(2rem,4.4vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-ink">
                Tu empresa ya tiene historia.
                <br />
                Hazla verificable.
              </p>
              <p className="max-w-[60ch] text-lg leading-relaxed text-ink">
                Onest para el texto: un pasaporte que reúne la identidad, la actividad y los pagos
                de tu empresa, y que compartes solo con quien tú decides. Ñandú, acción, señales:
                0123456789.
              </p>
              <dl className="grid gap-x-6 gap-y-2 text-sm text-ink-muted sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-ink">Unbounded 600 · marca y titulares</dt>
                  <dd>Sentence case, tracking −0.02em, interlineado 1.02</dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Onest 400/500/600 · texto y app</dt>
                  <dd>16–19px, interlineado 1.5–1.6</dd>
                </div>
              </dl>
            </div>
          )}
        </Themes>
      </Block>

      <Block title="Vocabulario">
        <Themes>
          {() => (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {VOCAB.map(({ Icon, es, en, rule }) => (
                <li key={es} className="rounded-2xl bg-surface-200 p-5">
                  <Icon width={28} height={28} className="text-brand-text" />
                  <p className="mt-4 font-brand text-lg font-semibold tracking-[-0.01em] text-ink">
                    {es}
                  </p>
                  <p className="text-sm text-ink-muted">{en}</p>
                  <p className="mt-2 text-sm text-ink">{rule}</p>
                </li>
              ))}
            </ul>
          )}
        </Themes>
      </Block>

      <Block title="Iconos">
        <Themes>
          {() => (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {Object.entries(ICONS).map(([name, Icon]) => (
                <li
                  key={name}
                  className="flex flex-col items-center gap-2 rounded-xl bg-surface-200 px-2 py-4 text-center"
                >
                  <Icon width={24} height={24} className="text-ink" />
                  <span className="text-[13px] leading-tight text-ink-muted">
                    {name.replace(/^Icon/, '')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Themes>
      </Block>
    </section>
  );
}

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;

const VOCAB: { Icon: IconCmp; es: string; en: string; rule: string }[] = [
  {
    Icon: IconPassport,
    es: 'Pasaporte de empresa',
    en: 'Company Passport',
    rule: 'El registro portátil de la empresa: identidad, actividad y pagos.',
  },
  {
    Icon: IconTrustSignals,
    es: 'Señales de confianza',
    en: 'Trust Signals',
    rule: 'Cada dato con su fuente a la vista.',
  },
  {
    Icon: IconVerifiedActivity,
    es: 'Actividad verificada',
    en: 'Verified Activity',
    rule: 'Solo si una fuente la confirmó; si no, «declarada».',
  },
  {
    Icon: IconFinancialReputation,
    es: 'Reputación financiera',
    en: 'Financial Reputation',
    rule: 'El historial de pagos. Nunca una promesa de crédito.',
  },
  {
    Icon: IconPermissionedAccess,
    es: 'Acceso con permiso',
    en: 'Permissioned Access',
    rule: 'Tú decides quién ve qué, y puedes revocarlo.',
  },
  {
    Icon: IconFinancingNetwork,
    es: 'Red de financiamiento',
    en: 'Financing Network',
    rule: 'Fondos, prestamistas y aceleradoras. Sin nombres hasta firmar.',
  },
];

const COLOURS = [
  {
    role: 'Base',
    token: 'surface-0',
    swatch: 'bg-surface-0 ring-1 ring-inset ring-line',
    use: 'la sala',
  },
  { role: 'Paneles', token: 'surface-200', swatch: 'bg-surface-300', use: 'separación por tono' },
  { role: 'Tinta', token: 'ink', swatch: 'bg-ink', use: 'todo el texto' },
  { role: 'Tinta secundaria', token: 'ink-muted', swatch: 'bg-ink-muted', use: 'notas' },
  { role: 'Acento', token: 'brand-fill', swatch: 'bg-brand-fill', use: 'la acción principal' },
  { role: 'Órbita', token: 'orbit', swatch: 'bg-orbit', use: 'logo y gráficos' },
  {
    role: 'Cuerpo del pasaporte',
    token: 'mark-body',
    swatch: 'bg-mark-body',
    use: 'logo y pasaporte',
  },
  { role: 'Estado', token: 'gold-fill', swatch: 'bg-gold-fill', use: 'pendiente, nunca marca' },
];

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}

/** Renders the same content in a Night and a Day panel. */
function Themes({ children }: { children: () => ReactNode }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {(['dark', 'light'] as const).map((t) => (
        <div key={t} data-theme={t} className="rounded-3xl bg-surface-0 p-6 text-ink sm:p-8">
          <p className="mb-6 text-sm font-medium text-ink-muted">
            {t === 'dark' ? 'Night' : 'Day'}
          </p>
          {children()}
        </div>
      ))}
    </div>
  );
}
