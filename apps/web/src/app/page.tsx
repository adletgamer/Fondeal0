import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Logo } from '@/components/logo';
import { PrivyAuthButton } from '@/components/privy-auth-button';
import { MarketingMotion } from '@/components/marketing-motion';
import styles from './marketing.module.css';

const pageTitle = 'Fondealo — A Business Passport for a portable financial identity';
const pageDescription =
  'Explore the Fondealo web MVP and Business Passport. KYB runs in a sandbox; Soroban contracts await Testnet deployment.';

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  openGraph: { title: pageTitle, description: pageDescription, url: 'https://www.fondealo.xyz/' },
  twitter: { card: 'summary_large_image', title: pageTitle, description: pageDescription },
};

const signals = [
  { number: '01', title: 'Business identity', detail: 'Who is behind the work' },
  { number: '02', title: 'Verified activity', detail: 'What the business has done' },
  { number: '03', title: 'Repayment history', detail: 'How commitments were met' },
] as const;

const passportFields = [
  ['Identity', 'Business profile'],
  ['Verification', 'KYB status'],
  ['Credit', 'Reputation record'],
  ['History', 'Repayment events'],
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
        <Link href="/" aria-label="Fondealo home" className={styles.headerLogo}>
          <Logo priority />
        </Link>
        <nav aria-label="Main navigation" className={styles.headerNav}>
          <a href="#idea">The idea</a>
          <a href="#passport">Passport</a>
          <a href="#reputation">Reputation</a>
          <a href="#status">Status</a>
        </nav>
        <div className={styles.headerActions}>
          <span className={styles.loginControl}>
            <PrivyAuthButton enterAppOnLogin />
          </span>
          <Link href="/onboarding?intent=business" className={styles.headerCta}>
            <span className={styles.headerCtaLong}>Create account</span>
            <span className={styles.headerCtaShort}>Sign up</span>
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
      aria-label="Illustrative Business Passport surrounded by verified business signals"
      data-tilt-card
    >
      <div className={styles.heroOrbitBack} aria-hidden="true" />
      <div className={styles.heroOrbitFront} aria-hidden="true" />
      <div className={styles.heroHalo} aria-hidden="true" />
      <div className={styles.heroSignalTop} aria-hidden="true">
        <span className={styles.signalDot} />
        VERIFIED ACTIVITY
      </div>
      <div className={styles.heroSignalBottom} aria-hidden="true">
        <span className={styles.signalDot} />
        PORTABLE IDENTITY
      </div>
      <div className={styles.heroPassport} aria-hidden="true">
        <div className={styles.passportSheen} aria-hidden="true" />
        <div className={styles.passportTopline}>
          <span>FONDEALO / BUSINESS PASSPORT</span>
          <span>SPECIMEN</span>
        </div>
        <div className={styles.passportEmblem}>
          <Image src="/orbital-badge.png" alt="" width={88} height={88} sizes="88px" priority />
        </div>
        <div className={styles.passportTitle}>A record that moves with you.</div>
        <div className={styles.passportRule} />
        <div className={styles.passportGrid}>
          <div>
            <span>IDENTITY</span>
            <strong>Business</strong>
          </div>
          <div>
            <span>VERIFICATION</span>
            <strong>KYB</strong>
          </div>
          <div>
            <span>REPUTATION</span>
            <strong>History</strong>
          </div>
        </div>
        <div className={styles.passportFoot}>
          <span>Illustrative product concept</span>
          <span>01 / 01</span>
        </div>
      </div>
      <div className={styles.heroObjectCaption} aria-hidden="true">
        <span>FIG. 01</span>
        <span>ONE IDENTITY · MANY OPPORTUNITIES</span>
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
            CREDIT IDENTITY, REIMAGINED
          </p>
          <h1>
            A business deserves a financial identity <span>that travels.</span>
          </h1>
          <p className={styles.heroLead}>
            Fondealo brings business identity and activity into a reusable Business Passport — a
            clearer way to build trust and approach funding on Stellar.
          </p>
          <div className={styles.heroActions}>
            <Link href="/onboarding?intent=business" className={styles.primaryButton}>
              Explore the web MVP <Arrow />
            </Link>
            <a href="#idea" className={styles.textLink}>
              See how it works <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className={styles.heroTruth}>
            Web MVP live <span>·</span> KYB sandbox <span>·</span> Soroban contracts awaiting
            Testnet deployment
          </p>
        </div>
        <HeroObject />
      </div>
      <div className={styles.heroBottom}>
        <span>IDENTITY IS INFRASTRUCTURE</span>
        <span>SCROLL TO FOLLOW THE RECORD</span>
        <span>01 / 06</span>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className={styles.problem} id="idea" aria-labelledby="problem-title">
      <div className={styles.sectionShell}>
        <SectionIndex number="01 / THE PROBLEM">A record in fragments</SectionIndex>
        <div className={styles.problemLayout}>
          <div className={styles.problemIntro} data-reveal>
            <h2 id="problem-title">
              The work is real. <span>The record is scattered.</span>
            </h2>
            <p>
              A business can prove who it is, show what it has done, and repay what it owes. Those
              signals often live in different places. A new funder has to start the story again.
            </p>
          </div>
          <div
            className={styles.fragmentField}
            aria-label="Three signals that form a business record"
          >
            {signals.map((signal, index) => (
              <div
                className={`${styles.fragment} ${styles[`fragment${index + 1}`]}`}
                key={signal.number}
                data-reveal
              >
                <span>{signal.number} / SIGNAL</span>
                <strong>{signal.title}</strong>
                <small>{signal.detail}</small>
              </div>
            ))}
            <div className={styles.fragmentAxis} aria-hidden="true" />
          </div>
        </div>
        <p className={styles.sectionEndnote}>
          <span>THE GAP</span>
          <span>Evidence exists. Continuity does not.</span>
        </p>
      </div>
    </section>
  );
}

function Passport() {
  return (
    <section className={styles.passportSection} id="passport" aria-labelledby="passport-title">
      <div className={styles.sectionShell}>
        <SectionIndex number="02 / THE PRODUCT">One identity to carry forward</SectionIndex>
        <div className={styles.passportLayout}>
          <div className={styles.passportCopy} data-reveal>
            <h2 id="passport-title">
              Meet the <span>Business Passport.</span>
            </h2>
            <p>
              A reusable view of a business, designed around verification status and a credit
              record. The business can shape how it presents itself. Evidence stays distinct from
              presentation.
            </p>
            <div className={styles.passportPrinciples}>
              <div>
                <span className={styles.principleNum}>A</span>
                <div>
                  <h3>Your identity</h3>
                  <p>Business details and presentation travel together.</p>
                </div>
              </div>
              <div>
                <span className={styles.principleNum}>B</span>
                <div>
                  <h3>Verified standing</h3>
                  <p>KYB status and repayment evidence have their own provenance.</p>
                </div>
              </div>
            </div>
            <Link href="/onboarding?intent=business" className={styles.inlineLink}>
              Explore the Business Passport <Arrow />
            </Link>
          </div>
          <div className={styles.specimenWrap} data-reveal>
            <div className={styles.specimenShadow} aria-hidden="true" />
            <article
              className={styles.specimen}
              aria-label="Illustrative Business Passport specimen"
            >
              <div className={styles.specimenHead}>
                <span>FONDEALO</span>
                <span>BUSINESS PASSPORT / SPECIMEN</span>
              </div>
              <div className={styles.specimenBody}>
                <div className={styles.specimenIdentity}>
                  <span className={styles.specimenMonogram} aria-hidden="true">
                    <Image src="/orbital-badge.png" alt="" width={52} height={52} sizes="52px" />
                  </span>
                  <div>
                    <span>PORTABLE BUSINESS IDENTITY</span>
                    <strong>Your record, in context.</strong>
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
                <span>NO CUSTOMER DATA SHOWN</span>
                <span>DESIGN SPECIMEN</span>
              </div>
            </article>
            <p className={styles.specimenCaption}>
              A visual specimen based on the product structure. No customer, score, or loan data is
              represented.
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
          <SectionIndex number="03 / THE CONTINUITY">
            Reputation is a history, not a headline
          </SectionIndex>
          <div className={styles.reputationLayout}>
            <div className={styles.reputationCopy}>
              <h2 id="reputation-title">
                Every verified step deserves <span>a place in the story.</span>
              </h2>
              <p>
                Fondealo&apos;s reputation model connects identity, activity, and repayment events.
                The contract logic is implemented and tested; the continuous production update flow
                is still being built.
              </p>
              <p className={styles.reputationQualifier}>
                Illustration of the product vision · not live account data
              </p>
            </div>
            <div className={styles.sequenceScene} aria-hidden="true">
              <div className={styles.sequenceRing} />
              <div className={styles.sequenceSignal} data-sequence-signal="0">
                <span>01</span> IDENTITY
              </div>
              <div className={styles.sequenceSignal} data-sequence-signal="1">
                <span>02</span> ACTIVITY
              </div>
              <div className={styles.sequenceSignal} data-sequence-signal="2">
                <span>03</span> REPAYMENT
              </div>
              <div className={styles.sequenceCard} data-sequence-card>
                <div className={styles.sequenceCardHead}>BUSINESS PASSPORT</div>
                <div className={styles.sequenceCardMark}>
                  <Image src="/orbital-badge.png" alt="" width={66} height={66} sizes="66px" />
                </div>
                <div className={styles.sequenceCardLines}>
                  <span />
                  <span />
                  <span />
                </div>
                <div className={styles.sequenceCardFoot}>ONE PORTABLE RECORD</div>
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
        <SectionIndex number="04 / THE PATH FORWARD">From identity to opportunity</SectionIndex>
        <div className={styles.opportunityHeading} data-reveal>
          <h2 id="opportunity-title">A clearer record can open a better conversation.</h2>
          <p>
            Businesses and funders see the same context, while ownership, authorization, and money
            movement stay governed by the product&apos;s actual flows.
          </p>
        </div>
        <div className={styles.pathways}>
          <article className={styles.pathway} data-reveal>
            <div className={styles.pathwayTop}>
              <span>01 / FOR BUSINESSES</span>
              <Arrow diagonal />
            </div>
            <h3>Bring your business into focus.</h3>
            <p>
              Complete the sandbox verification journey, view your Passport, and explore the
              opportunity flow.
            </p>
            <Link href="/onboarding?intent=business" className={styles.pathwayLink}>
              Explore the business flow <Arrow />
            </Link>
          </article>
          <article className={`${styles.pathway} ${styles.pathwayAlt}`} data-reveal>
            <div className={styles.pathwayTop}>
              <span>02 / FOR FUNDERS</span>
              <Arrow diagonal />
            </div>
            <h3>Read the context behind an opportunity.</h3>
            <p>
              Explore the investor experience. Funding and on-chain settlement remain subject to
              Testnet readiness.
            </p>
            <Link href="/onboarding?intent=invest" className={styles.pathwayLink}>
              Explore the investor flow <Arrow />
            </Link>
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
        <SectionIndex number="05 / PRODUCT TRUTH">Built in the open</SectionIndex>
        <div className={styles.statusIntro} data-reveal>
          <h2 id="status-title">Know what runs today.</h2>
          <p>
            Fondealo is an evolving dApp. The web experience is available now; contract deployment
            and end-to-end reputation updates are separate milestones.
          </p>
        </div>
        <div className={styles.statusTableWrap} data-reveal>
          <table className={styles.statusTable}>
            <caption>Current capability status</caption>
            <thead>
              <tr>
                <th scope="col">Capability</th>
                <th scope="col">Environment</th>
                <th scope="col">Current state</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Web app and onboarding</th>
                <td>Vercel</td>
                <td>
                  <span className={styles.statusLive}>Live MVP</span>
                </td>
              </tr>
              <tr>
                <th scope="row">Business verification</th>
                <td>Web app</td>
                <td>
                  <span className={styles.statusSandbox}>KYB sandbox</span>
                </td>
              </tr>
              <tr>
                <th scope="row">Passport, score, and escrow contracts</th>
                <td>Soroban</td>
                <td>
                  <span className={styles.statusPending}>
                    Implemented; Testnet deployment pending
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">Score update after repayment</th>
                <td>End-to-end flow</td>
                <td>
                  <span className={styles.statusPlanned}>In progress</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={styles.statusSource}>
          Status follows the repository&apos;s{' '}
          <a href="https://github.com/adletgamer/Fondeal0#deployments">deployment record</a>. No
          live contract address or production return is implied.
        </p>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <footer className={styles.closing}>
      <div className={styles.sectionShell}>
        <SectionIndex number="06 / THE NEXT CHAPTER">The future of business credit</SectionIndex>
        <div className={styles.closingMain} data-reveal>
          <h2>Good work should leave a record that can move forward.</h2>
          <div className={styles.closingAside}>
            <p>
              Start with the web MVP. See the Passport. Follow the infrastructure as it comes
              online.
            </p>
            <Link href="/onboarding?intent=business" className={styles.primaryButton}>
              Explore Fondealo <Arrow />
            </Link>
          </div>
        </div>
        <div className={styles.closingBottom}>
          <Link href="/" aria-label="Fondealo home" className={styles.footerLogo}>
            <Logo />
          </Link>
          <span>Credit identity for Latin American businesses, built on Stellar.</span>
          <a href="https://github.com/adletgamer/Fondeal0" target="_blank" rel="noreferrer">
            View the source <Arrow diagonal />
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
        Skip to content
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
