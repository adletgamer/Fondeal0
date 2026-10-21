import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card, Container } from '@fondealo/ui';
import { DeletionRequestForm } from '@/components/deletion-request-form';
import { getSession } from '@/lib/auth/session';
import { getLoginEmail, getMyData, type MyDataOverview } from '@/lib/data/my-data';
import { formatDateLima } from '@/lib/format';
import {
  KYB_DOCUMENTS,
  RELATIONSHIP_LABELS,
  REVENUE_BAND_LABELS,
  SECTOR_LABELS,
  findCountry,
} from '@/lib/providers/kyb';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Mis datos — Fondealo' };

const FONDEALO_DB = 'Base de datos de Fondealo (servicio en la nube; puede estar fuera del Perú)';
const ONLY_YOU = 'Tú y quienes administran Fondealo';

const label = (labels: Record<string, string>, value: string | null) =>
  value ? (labels[value] ?? value) : null;

interface Row {
  item: string;
  value: string | null;
  purpose: string;
  where: string;
  who: string;
}

function rows(data: MyDataOverview, address: string, loginEmail: string | null): Row[] {
  const b = data.business;
  const country = b ? findCountry(b.country) : undefined;
  const docs = data.declaredEvidence
    .map((kind) => KYB_DOCUMENTS.find((d) => d.id === kind)?.label ?? kind)
    .join(', ');
  return [
    {
      item: 'Razón social y país',
      value: b ? `${b.legalName} · ${country?.label ?? b.country}` : null,
      purpose: 'Identificar a tu empresa',
      where: FONDEALO_DB,
      who: ONLY_YOU,
    },
    {
      item: country?.taxIdLabel ?? 'Número tributario',
      value: b?.taxId ?? null,
      purpose: 'Identificar a tu empresa y evitar registros duplicados',
      where: FONDEALO_DB,
      who: ONLY_YOU,
    },
    {
      item: 'Sector, año de fundación y ventas',
      value: b
        ? [
            label(SECTOR_LABELS, b.sector),
            b.foundedYear ? String(b.foundedYear) : null,
            label(REVENUE_BAND_LABELS, b.revenueBand),
          ]
            .filter(Boolean)
            .join(' · ')
        : null,
      purpose: 'Describir tu empresa en la evaluación',
      where: FONDEALO_DB,
      who: ONLY_YOU,
    },
    {
      item: 'Correo de contacto',
      value: b?.email ?? null,
      purpose: 'Escribirte sobre tu solicitud',
      where: FONDEALO_DB,
      who: ONLY_YOU,
    },
    {
      item: 'Representante',
      value: data.representative?.name
        ? [data.representative.name, label(RELATIONSHIP_LABELS, data.representative.relationship)]
            .filter(Boolean)
            .join(' · ')
        : null,
      purpose: 'Saber quién actúa en nombre de la empresa',
      where: FONDEALO_DB,
      who: ONLY_YOU,
    },
    {
      item: 'Documentos declarados',
      value: docs || null,
      purpose: 'Saber qué evidencia podrás presentar (no subimos archivos)',
      where: FONDEALO_DB,
      who: ONLY_YOU,
    },
    {
      item: 'Correo de inicio de sesión',
      value: loginEmail,
      purpose: 'Que puedas entrar a tu cuenta',
      where: 'Privy, nuestro proveedor de inicio de sesión',
      who: 'Tú, Privy y quienes administran Fondealo',
    },
    {
      item: 'Dirección de tu cuenta Stellar',
      value: address,
      purpose: 'Identificar tu cuenta de forma segura',
      where: 'Privy y la red Stellar Testnet',
      who: 'La dirección es pública en Stellar; su relación con tu empresa no lo es',
    },
  ];
}

export default async function MyDataPage() {
  const session = await getSession();
  if (!session?.stellarAddress) redirect('/onboarding');
  if (session.role !== 'Business')
    redirect(session.role === 'Investor' ? '/invest' : '/onboarding');
  const [data, loginEmail] = await Promise.all([
    getMyData(session.stellarAddress, session.privyUserId),
    getLoginEmail(session.privyUserId),
  ]);

  return (
    <main className="bg-slate-50 pb-20">
      <Container className="py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-bold text-slate-900">Mis datos</h1>
          <p className="mt-1 text-slate-600">
            Qué información guardamos sobre tu empresa, para qué la usamos y quién puede verla.
          </p>

          {!data ? (
            <Card className="mt-6 border-amber-200 bg-amber-50 p-6">
              <h2 className="font-semibold text-slate-900">No pudimos cargar tus datos</h2>
              <p className="mt-1 text-sm text-slate-700">
                Vuelve a intentarlo en unos minutos. Tus datos no se perdieron.
              </p>
            </Card>
          ) : (
            <>
              <Card className="mt-6 p-6">
                <h2 className="text-lg font-semibold text-slate-900">Con quién compartimos</h2>
                <p className="mt-1 text-sm text-slate-700">
                  Hoy no compartimos tu información con ningún financiador. Cuando haya
                  financiadores aliados, te pediremos permiso para cada uno y podrás retirarlo
                  cuando quieras.
                </p>
                <p className="mt-3 text-sm text-slate-700">
                  No publicamos tus datos en blockchain. Como mucho, después de una verificación
                  revisada, publicaríamos un código (hash) que no permite reconstruir tus datos.
                </p>
              </Card>

              {data.business ? (
                <Card className="mt-6 overflow-hidden">
                  <h2 className="px-6 pt-6 text-lg font-semibold text-slate-900">
                    Lo que guardamos
                  </h2>
                  {/* Stacked definition list: readable at 375px without horizontal scroll. */}
                  <dl className="mt-3 divide-y divide-slate-100">
                    {rows(data, session.stellarAddress, loginEmail).map((r) => (
                      <div key={r.item} className="grid gap-1 px-6 py-4 sm:grid-cols-[200px_1fr]">
                        <dt className="text-sm font-semibold text-slate-900">{r.item}</dt>
                        <dd className="space-y-1 text-sm text-slate-700">
                          {r.value ? (
                            <p className="break-words font-medium text-slate-900">{r.value}</p>
                          ) : null}
                          <p>
                            <span className="text-slate-600">Para qué: </span>
                            {r.purpose}
                          </p>
                          <p>
                            <span className="text-slate-600">Dónde: </span>
                            {r.where}
                          </p>
                          <p>
                            <span className="text-slate-600">Quién lo ve: </span>
                            {r.who}
                          </p>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              ) : (
                <Card className="mt-6 p-6">
                  <h2 className="text-lg font-semibold text-slate-900">Aún no guardamos datos</h2>
                  <p className="mt-1 text-sm text-slate-700">
                    Solo tenemos tu correo de inicio de sesión (en Privy) y la dirección de tu
                    cuenta Stellar. Cuando envíes tu solicitud, verás aquí cada dato.
                  </p>
                  <a
                    href="/business/verify"
                    className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
                  >
                    Empezar mi solicitud
                  </a>
                </Card>
              )}

              {data.consent?.at ? (
                <Card className="mt-6 p-6">
                  <h2 className="text-lg font-semibold text-slate-900">Tu consentimiento</h2>
                  <p className="mt-1 text-sm text-slate-700">
                    Aceptaste la política de solicitud{' '}
                    <span className="font-mono">{data.consent.version ?? '—'}</span> el{' '}
                    {formatDateLima(data.consent.at, 'long')}.
                  </p>
                </Card>
              ) : null}

              {data.business ? (
                <Card className="mt-6 p-6">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Eliminar mis datos y retirar mi consentimiento
                  </h2>
                  <p className="mt-1 text-sm text-slate-700">
                    Registraremos tu solicitud. En esta versión de prueba la eliminación no es
                    automática: requiere una revisión manual, y algunos datos podrían conservarse si
                    la ley lo exige.
                  </p>
                  {data.deletionRequestedAt ? (
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      Solicitud registrada el {formatDateLima(data.deletionRequestedAt)}.
                    </p>
                  ) : null}
                  <DeletionRequestForm alreadyRequested={Boolean(data.deletionRequestedAt)} />
                </Card>
              ) : null}

              <p className="mt-6 text-xs text-slate-600">
                Esta página describe cómo funciona hoy la versión de prueba de Fondealo. El texto
                final está pendiente de revisión legal.
              </p>
            </>
          )}
        </div>
      </Container>
    </main>
  );
}
