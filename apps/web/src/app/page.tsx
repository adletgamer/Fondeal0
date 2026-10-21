import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Logo } from '@/components/logo';
import { PrivyAuthButton } from '@/components/privy-auth-button';
import { MarketingMotion } from '@/components/marketing-motion';
import styles from './marketing.module.css';

const pageTitle = 'Fondealo — Verifica tu empresa una vez y compártela con quien te financia';
const pageDescription =
  'Fondealo ayuda a las MYPEs del Perú a registrar y verificar su empresa una sola vez, y a decidir con qué financiadores compartir esa información. Versión de prueba: la verificación aún funciona en modo sandbox.';

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  openGraph: { title: pageTitle, description: pageDescription, url: 'https://www.fondealo.xyz/' },
  twitter: { card: 'summary_large_image', title: pageTitle, description: pageDescription },
};

const signals = [
  { number: '01', title: 'Identidad de la empresa', detail: 'Quién está detrás del negocio' },
  { number: '02', title: 'Actividad verificada', detail: 'Lo que la empresa ha hecho' },
  { number: '03', title: 'Historial de pagos', detail: 'Cómo cumplió sus compromisos' },
] as const;

const passportFields = [
  ['Identidad', 'Perfil de la empresa'],
  ['Verificación', 'Estado KYB'],
  ['Crédito', 'Registro de reputación'],
  ['Historial', 'Pagos registrados'],
] as const;

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return diagonal ? (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" width="18" height="18">
      <path d="M4 16 16 4M6 4h10v10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" width="18" height="18">
      <path d="M3 10h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SectionIndex({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <p className={styles.sectionIndex}>
      <span>{number}</span>
      <span>{children}</span>
    </p>
  );
}

function MarketingHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" aria-label="Fondealo, inicio" className={styles.headerLogo}>
          <Logo priority />
        </Link>
        <nav aria-label="Navegación principal" className={styles.headerNav}>
          <a href="#idea">La idea</a>
          <a href="#passport">Pasaporte</a>
          <a href="#reputation">Reputación</a>
          <a href="#status">Estado</a>
        </nav>
        <div className={styles.headerActions}>
          <span className={styles.loginControl}>
            <PrivyAuthButton enterAppOnLogin />
          </span>
          <Link href="/onboarding?intent=business" className={styles.headerCta}>
            <span className={styles.headerCtaLong}>Crear cuenta</span>
            <span className={styles.headerCtaShort}>Empezar</span>
            <Arrow diagonal />
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroObject() {
  return (
    <div
      className={styles.heroObject}
      role="img"
      aria-label="Pasaporte de empresa ilustrativo rodeado de señales verificadas del negocio"
      data-tilt-card
    >
      <div className={styles.heroOrbitBack} aria-hidden="true" />
      <div className={styles.heroOrbitFront} aria-hidden="true" />
      <div className={styles.heroHalo} aria-hidden="true" />
      <div className={styles.heroSignalTop} aria-hidden="true">
        <span className={styles.signalDot} />
        ACTIVIDAD VERIFICADA
      </div>
      <div className={styles.heroSignalBottom} aria-hidden="true">
        <span className={styles.signalDot} />
        IDENTIDAD PORTABLE
      </div>
      <div className={styles.heroPassport} aria-hidden="true">
        <div className={styles.passportSheen} aria-hidden="true" />
        <div className={styles.passportTopline}>
          <span>FONDEALO / PASAPORTE DE EMPRESA</span>
          <span>MUESTRA</span>
        </div>
        <div className={styles.passportEmblem}>
          <Image src="/orbital-badge.png" alt="" width={88} height={88} sizes="88px" priority />
        </div>
        <div className={styles.passportTitle}>Un expediente que va contigo.</div>
        <div className={styles.passportRule} />
        <div className={styles.passportGrid}>
          <div>
            <span>IDENTIDAD</span>
            <strong>Empresa</strong>
          </div>
          <div>
            <span>VERIFICACIÓN</span>
            <strong>KYB</strong>
          </div>
          <div>
            <span>REPUTACIÓN</span>
            <strong>Historial</strong>
          </div>
        </div>
        <div className={styles.passportFoot}>
          <span>Concepto ilustrativo</span>
          <span>01 / 01</span>
        </div>
      </div>
      <div className={styles.heroObjectCaption} aria-hidden="true">
        <span>FIG. 01</span>
        <span>UNA IDENTIDAD · MUCHAS OPORTUNIDADES</span>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className={styles.hero} id="top" data-hero>
      <div className={styles.heroGrid} aria-hidden="true" />
      <div className={styles.auroraLayer} aria-hidden="true">
        <span className={styles.auroraBlob1} />
        <span className={styles.auroraBlob2} />
        <span className={styles.auroraBlob3} />
      </div>
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span className={styles.liveDot} />
            PARA MYPES DEL PERÚ
          </p>
          <h1>
            Verifica tu empresa una vez. <span>Compártela con quien te financia.</span>
          </h1>
          <p className={styles.heroLead}>
            Registra tu empresa con su RUC, sigue el estado de tu verificación y decide qué
            financiadores pueden ver tu información. Gratis para empresas.
          </p>
          <div className={styles.heroActions}>
            <Link href="/onboarding?intent=business" className={styles.primaryButton}>
              Empezar con mi RUC <Arrow />
            </Link>
            <a href="#idea" className={styles.textLink}>
              Cómo funciona <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className={styles.heroTruth}>
            Versión de prueba <span>·</span> Verificación en modo sandbox <span>·</span> Verificar
            tu empresa no garantiza financiamiento
          </p>
        </div>
        <HeroObject />
      </div>
      <div className={styles.heroBottom}>
        <span>LA IDENTIDAD ES INFRAESTRUCTURA</span>
        <span>DESLIZA PARA SEGUIR EL EXPEDIENTE</span>
        <span>01 / 06</span>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className={styles.problem} id="idea" aria-labelledby="problem-title">
      <div className={styles.sectionShell}>
        <SectionIndex number="01 / EL PROBLEMA">Un expediente en pedazos</SectionIndex>
        <div className={styles.problemLayout}>
          <div className={styles.problemIntro} data-reveal>
            <h2 id="problem-title">
              El trabajo es real. <span>La información está dispersa.</span>
            </h2>
            <p>
              Una empresa puede demostrar quién es, qué ha hecho y cómo ha pagado. Pero esa
              información suele estar en lugares distintos, y cada nuevo financiador vuelve a pedir
              los mismos documentos.
            </p>
          </div>
          <div
            className={styles.fragmentField}
            aria-label="Tres señales que forman el expediente de una empresa"
          >
            {signals.map((signal, index) => (
              <div
                className={`${styles.fragment} ${styles[`fragment${index + 1}`]}`}
                key={signal.number}
                data-reveal
              >
                <span>{signal.number} / SEÑAL</span>
                <strong>{signal.title}</strong>
                <small>{signal.detail}</small>
              </div>
            ))}
            <div className={styles.fragmentAxis} aria-hidden="true" />
          </div>
        </div>
        <p className={styles.sectionEndnote}>
          <span>LA BRECHA</span>
          <span>La evidencia existe. La continuidad, no.</span>
        </p>
      </div>
    </section>
  );
}

function Passport() {
  return (
    <section className={styles.passportSection} id="passport" aria-labelledby="passport-title">
      <div className={styles.sectionShell}>
        <SectionIndex number="02 / EL PRODUCTO">Una identidad que te acompaña</SectionIndex>
        <div className={styles.passportLayout}>
          <div className={styles.passportCopy} data-reveal>
            <h2 id="passport-title">
              Conoce el <span>Pasaporte de Empresa.</span>
            </h2>
            <p>
              Un expediente reutilizable de tu empresa, con su estado de verificación y su
              historial. Tú eliges cómo se ve; la evidencia y su origen se mantienen separados de la
              presentación.
            </p>
            <div className={styles.passportPrinciples}>
              <div>
                <span className={styles.principleNum}>A</span>
                <div>
                  <h3>Tu identidad</h3>
                  <p>Los datos de tu empresa y su presentación van juntos.</p>
                </div>
              </div>
              <div>
                <span className={styles.principleNum}>B</span>
                <div>
                  <h3>Lo que está verificado</h3>
                  <p>Cada dato verificado indicará quién lo revisó y cuándo.</p>
                </div>
              </div>
            </div>
            <Link href="/onboarding?intent=business" className={styles.inlineLink}>
              Ver cómo funciona el Pasaporte <Arrow />
            </Link>
          </div>
          <div className={styles.specimenWrap} data-reveal>
            <div className={styles.specimenShadow} aria-hidden="true" />
            <article
              className={styles.specimen}
              aria-label="Muestra ilustrativa del Pasaporte de Empresa"
            >
              <div className={styles.specimenHead}>
                <span>FONDEALO</span>
                <span>PASAPORTE DE EMPRESA / MUESTRA</span>
              </div>
              <div className={styles.specimenBody}>
                <div className={styles.specimenIdentity}>
                  <span className={styles.specimenMonogram} aria-hidden="true">
                    <Image src="/orbital-badge.png" alt="" width={52} height={52} sizes="52px" />
                  </span>
                  <div>
                    <span>IDENTIDAD PORTABLE DE EMPRESA</span>
                    <strong>Tu expediente, en contexto.</strong>
                  </div>
                </div>
                <dl>
                  {passportFields.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className={styles.specimenFoot}>
                <span>SIN DATOS DE CLIENTES</span>
                <span>MUESTRA DE DISEÑO</span>
              </div>
            </article>
            <p className={styles.specimenCaption}>
              Muestra visual basada en la estructura del producto. No representa datos de clientes,
              puntajes ni préstamos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Reputation() {
  return (
    <section
      className={styles.reputationTrack}
      id="reputation"
      data-sequence
      aria-labelledby="reputation-title"
    >
      <div className={styles.reputationSticky}>
        <div className={styles.sectionShell}>
          <SectionIndex number="03 / LA CONTINUIDAD">
            La reputación es una historia, no un titular
          </SectionIndex>
          <div className={styles.reputationLayout}>
            <div className={styles.reputationCopy}>
              <h2 id="reputation-title">
                Cada paso verificado merece <span>un lugar en la historia.</span>
              </h2>
              <p>
                El modelo de reputación de Fondealo conecta identidad, actividad y pagos. La lógica
                de los contratos está implementada y probada; la actualización continua en
                producción todavía está en construcción.
              </p>
              <p className={styles.reputationQualifier}>
                Ilustración de la visión del producto · no son datos reales de cuentas
              </p>
            </div>
            <div className={styles.sequenceScene} aria-hidden="true">
              <div className={styles.sequenceRing} />
              <div className={styles.sequenceSignal} data-sequence-signal="0">
                <span>01</span> IDENTIDAD
              </div>
              <div className={styles.sequenceSignal} data-sequence-signal="1">
                <span>02</span> ACTIVIDAD
              </div>
              <div className={styles.sequenceSignal} data-sequence-signal="2">
                <span>03</span> PAGOS
              </div>
              <div className={styles.sequenceCard} data-sequence-card>
                <div className={styles.sequenceCardHead}>PASAPORTE DE EMPRESA</div>
                <div className={styles.sequenceCardMark}>
                  <Image src="/orbital-badge.png" alt="" width={66} height={66} sizes="66px" />
                </div>
                <div className={styles.sequenceCardLines}>
                  <span />
                  <span />
                  <span />
                </div>
                <div className={styles.sequenceCardFoot}>UN EXPEDIENTE PORTABLE</div>
              </div>
              <div className={styles.sequenceGround} />
            </div>
          </div>
          <div className={styles.sequenceProgress} aria-hidden="true">
            <span data-sequence-progress />
          </div>
        </div>
      </div>
    </section>
  );
}

function Opportunity() {
  return (
    <section className={styles.opportunity} id="opportunity" aria-labelledby="opportunity-title">
      <div className={styles.sectionShell}>
        <SectionIndex number="04 / EL CAMINO">De la identidad a la oportunidad</SectionIndex>
        <div className={styles.opportunityHeading} data-reveal>
          <h2 id="opportunity-title">Un expediente claro abre una mejor conversación.</h2>
          <p>
            Tú decides qué financiador ve tu información. La decisión de financiarte siempre es del
            financiador, nunca de Fondealo.
          </p>
        </div>
        <div className={styles.pathways}>
          <article className={styles.pathway} data-reveal>
            <div className={styles.pathwayTop}>
              <span>01 / PARA EMPRESAS</span>
              <Arrow diagonal />
            </div>
            <h3>Registra tu empresa una sola vez.</h3>
            <p>
              Completa tu solicitud con tu RUC, revisa en qué estado está y conoce qué datos
              guardamos y por qué.
            </p>
            <Link href="/onboarding?intent=business" className={styles.pathwayLink}>
              Empezar mi solicitud <Arrow />
            </Link>
          </article>
          <article className={`${styles.pathway} ${styles.pathwayAlt}`} data-reveal>
            <div className={styles.pathwayTop}>
              <span>02 / PARA FINANCIADORES</span>
              <Arrow diagonal />
            </div>
            <h3>Recibe expedientes de empresas, con su permiso.</h3>
            <p>
              Estamos preparando un piloto con entidades autorizadas (factoring, cajas y fintechs).
              Fondealo no ofrece inversiones ni retornos al público.
            </p>
            <a
              href="https://github.com/adletgamer/Fondeal0"
              target="_blank"
              rel="noreferrer"
              className={styles.pathwayLink}
            >
              Ver el proyecto <Arrow diagonal />
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}

function Status() {
  return (
    <section className={styles.status} id="status" aria-labelledby="status-title">
      <div className={styles.sectionShell}>
        <SectionIndex number="05 / LO QUE FUNCIONA HOY">Construido a la vista</SectionIndex>
        <div className={styles.statusIntro} data-reveal>
          <h2 id="status-title">Lo que funciona hoy.</h2>
          <p>
            Fondealo está en desarrollo. La experiencia web ya está disponible; el despliegue de
            contratos y la actualización de reputación de punta a punta son etapas separadas.
          </p>
        </div>
        <div className={styles.statusTableWrap} data-reveal>
          <table className={styles.statusTable}>
            <caption>Estado actual de cada parte</caption>
            <thead>
              <tr>
                <th scope="col">Parte</th>
                <th scope="col">Entorno</th>
                <th scope="col">Estado actual</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">App web y registro</th>
                <td>Vercel</td>
                <td>
                  <span className={styles.statusLive}>MVP en línea</span>
                </td>
              </tr>
              <tr>
                <th scope="row">Verificación de empresas</th>
                <td>App web</td>
                <td>
                  <span className={styles.statusSandbox}>KYB en modo sandbox</span>
                </td>
              </tr>
              <tr>
                <th scope="row">Contratos de pasaporte, puntaje y escrow</th>
                <td>Soroban</td>
                <td>
                  <span className={styles.statusPending}>
                    Implementados; despliegue en Testnet pendiente
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">Actualización de puntaje tras un pago</th>
                <td>Flujo completo</td>
                <td>
                  <span className={styles.statusPlanned}>En progreso</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={styles.statusSource}>
          El estado sigue el{' '}
          <a href="https://github.com/adletgamer/Fondeal0#deployments">
            registro de despliegues del repositorio
          </a>
          . No implica ningún contrato en producción ni rentabilidad.
        </p>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <footer className={styles.closing}>
      <div className={styles.sectionShell}>
        <SectionIndex number="06 / EL SIGUIENTE CAPÍTULO">
          El futuro del crédito empresarial
        </SectionIndex>
        <div className={styles.closingMain} data-reveal>
          <h2>El buen trabajo debería dejar un historial que avance contigo.</h2>
          <div className={styles.closingAside}>
            <p>
              Registra tu empresa, sigue tu verificación y decide quién puede ver tu información.
            </p>
            <Link href="/onboarding?intent=business" className={styles.primaryButton}>
              Empezar con mi RUC <Arrow />
            </Link>
          </div>
        </div>
        <div className={styles.closingBottom}>
          <Link href="/" aria-label="Fondealo, inicio" className={styles.footerLogo}>
            <Logo />
          </Link>
          <span>
            Identidad crediticia para empresas de Latinoamérica, construida sobre Stellar.
          </span>
          <a href="https://github.com/adletgamer/Fondeal0" target="_blank" rel="noreferrer">
            Ver el código <Arrow diagonal />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className={styles.site} data-marketing-root>
      <div className={styles.scrollProgress} aria-hidden="true" data-scroll-progress />
      <a className={styles.skipLink} href="#main">
        Saltar al contenido
      </a>
      <MarketingHeader />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Problem />
        <Passport />
        <Reputation />
        <Opportunity />
        <Status />
      </main>
      <Closing />
      <MarketingMotion />
    </div>
  );
}
