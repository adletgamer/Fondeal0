'use client';

import { useMemo, useState } from 'react';
import { DEMO_CASES, type ReviewCase } from '@/lib/demo-cases';

type Filter = 'Todos' | 'Prioridad alta' | 'En cola' | 'Reciente';
const FILTERS: Filter[] = ['Todos', 'Prioridad alta', 'En cola', 'Reciente'];

function Icon({
  name,
}: {
  name:
    'inbox' | 'shield' | 'history' | 'search' | 'chevron' | 'close' | 'spark' | 'lock' | 'check';
}) {
  const paths = {
    inbox: (
      <>
        <path d="M4 4h16l2 10v5H2v-5L4 4Z" />
        <path d="M2 14h5l2 3h6l2-3h5" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    spark: (
      <>
        <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
        <path d="m19 17 .8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8L19 17Z" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    check: <path d="m5 12 4.2 4.2L19 6.5" />,
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function FondealoBrand() {
  return (
    <div className="brand-lockup">
      <img src="/fondealo-mark.svg" alt="" width="32" height="32" />
      <div>
        <strong>Fondealo</strong>
        <span>TRUST OPERATIONS</span>
      </div>
    </div>
  );
}

const ENGINE_STAGES = [
  { id: 'identity', name: 'Identidad y mandato', source: 'Declaración', state: 'ready' },
  { id: 'entity', name: 'Existencia legal', source: 'Registro autorizado', state: 'blocked' },
  {
    id: 'ownership',
    name: 'Beneficiarios finales',
    source: 'Evidencia verificada',
    state: 'blocked',
  },
  { id: 'risk', name: 'Riesgo y sanciones', source: 'Proveedor KYB', state: 'blocked' },
  { id: 'credit', name: 'Capacidad de pago', source: 'Política UW v1', state: 'blocked' },
] as const;

function TrustEngine({ record }: { record: ReviewCase }) {
  const [focusedStage, setFocusedStage] =
    useState<(typeof ENGINE_STAGES)[number]['id']>('identity');
  const stage = ENGINE_STAGES.find((item) => item.id === focusedStage) ?? ENGINE_STAGES[0];

  return (
    <div className="engine-view">
      <div className="engine-hero">
        <div className="engine-symbol">
          <Icon name="spark" />
        </div>
        <div>
          <p className="eyebrow">FONDEALO TRUST ENGINE</p>
          <h3>Evaluación asistida, decisión humana</h3>
          <p>
            El motor organiza señales y aplica guardas de política. No aprueba una empresa por sí
            solo.
          </p>
        </div>
      </div>

      <div className="engine-readout">
        <div className="risk-orb" aria-label="Estado de la evaluación: incompleta">
          <span>—</span>
          <small>sin score</small>
        </div>
        <div className="readout-copy">
          <span>Postura actual</span>
          <strong>Información insuficiente</strong>
          <p>Solo hay datos declarados y una comprobación de formato.</p>
        </div>
      </div>

      <div className="engine-rail" aria-label="Etapas de evaluación">
        {ENGINE_STAGES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`engine-stage ${item.id === focusedStage ? 'is-focused' : ''} ${item.state}`}
            onClick={() => setFocusedStage(item.id)}
          >
            <span className="stage-number">0{index + 1}</span>
            <span className="stage-node">
              {item.state === 'ready' ? <Icon name="check" /> : <Icon name="lock" />}
            </span>
            <span className="engine-stage-name">{item.name}</span>
          </button>
        ))}
      </div>

      <section className="engine-focus">
        <div className="engine-focus-head">
          <span>ETAPA SELECCIONADA</span>
          <strong>{stage.name}</strong>
        </div>
        <div className="engine-source">
          <span>Fuente requerida</span>
          <b>{stage.source}</b>
        </div>
        {stage.id === 'identity' ? (
          <div className="engine-evidence">
            <span className="evidence-check">
              <Icon name="check" />
            </span>
            <div>
              <strong>Representante declarado</strong>
              <p>
                {record.representative} · {record.relationship}
              </p>
            </div>
            <span className="signal-source">AUTODECLARADO</span>
          </div>
        ) : (
          <div className="engine-blocked">
            <Icon name="lock" />
            <p>
              Esta etapa se abre cuando haya una fuente autorizada y la evidencia correspondiente.
            </p>
          </div>
        )}
      </section>

      <div className="decision-gate">
        <div>
          <span className="gate-label">COMPUERTA DE DECISIÓN</span>
          <strong>
            <Icon name="lock" /> Bloqueada por política
          </strong>
        </div>
        <p>
          Faltan verificación externa, revisión de beneficiarios y evidencia financiera. La
          recomendación de underwriting no está disponible.
        </p>
      </div>
    </div>
  );
}

function CaseDetails({ record, onClose }: { record: ReviewCase; onClose: () => void }) {
  const [view, setView] = useState<'case' | 'engine' | 'audit'>('case');

  return (
    <aside className="detail-panel" aria-label={`Detalle de ${record.legalName}`}>
      <div className="detail-head">
        <div>
          <p className="eyebrow">EXPEDIENTE · {record.id}</p>
          <h2>Vista del caso</h2>
        </div>
        <button className="icon-button close-detail" onClick={onClose} aria-label="Cerrar detalle">
          <Icon name="close" />
        </button>
      </div>

      <div className="case-tabs" role="tablist" aria-label="Vistas del expediente">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'case'}
          className={view === 'case' ? 'selected' : ''}
          onClick={() => setView('case')}
        >
          Caso
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'engine'}
          className={view === 'engine' ? 'selected' : ''}
          onClick={() => setView('engine')}
        >
          Trust Engine
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'audit'}
          className={view === 'audit' ? 'selected' : ''}
          onClick={() => setView('audit')}
        >
          Auditoría
        </button>
      </div>

      {view === 'case' ? (
        <>
          <div className="company-card">
            <div className="company-avatar">{initials(record.legalName)}</div>
            <div className="company-name">
              <h3>{record.legalName}</h3>
              <p>
                {record.sector} <span>·</span> {record.country}
              </p>
            </div>
            <span className="stage-pill">{record.stage}</span>
          </div>

          <section className="detail-section">
            <div className="section-heading">
              <h3>Perfil declarado</h3>
              <span className="section-code">01</span>
            </div>
            <dl className="profile-grid">
              <div>
                <dt>Identificación tributaria</dt>
                <dd className="mono">{record.taxId}</dd>
              </div>
              <div>
                <dt>Representante</dt>
                <dd>{record.representative}</dd>
              </div>
              <div>
                <dt>Relación con la empresa</dt>
                <dd>{record.relationship}</dd>
              </div>
              <div>
                <dt>Sector</dt>
                <dd>{record.sector}</dd>
              </div>
            </dl>
          </section>

          <section className="detail-section">
            <div className="section-heading">
              <h3>Declaraciones de evidencia</h3>
              <span className="count-badge">{record.declared.length}</span>
            </div>
            <p className="section-caption">
              La empresa indicó que cuenta con estos documentos. No se cargaron archivos.
            </p>
            <ul className="evidence-list">
              {record.declared.map((item) => (
                <li key={item}>
                  <span className="evidence-check">✓</span>
                  {item}
                  <span className="declared-tag">Declarado</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="detail-section checks-section">
            <div className="section-heading">
              <h3>Comprobaciones</h3>
              <span className="sandbox-tag">
                <span /> SANDBOX
              </span>
            </div>
            {record.checks.map((check) => (
              <div className="check-row" key={check.label}>
                <span>{check.label}</span>
                <span>{check.result}</span>
              </div>
            ))}
            <div className="warning-note">
              <span>i</span>
              <p>
                Estas comprobaciones no consultan registros ni listas externas y no constituyen una
                verificación KYB.
              </p>
            </div>
          </section>

          <section className="detail-section note-section">
            <div className="section-heading">
              <h3>Nota de revisión</h3>
              <span className="readonly-chip">Solo lectura</span>
            </div>
            <p>{record.note}</p>
          </section>
        </>
      ) : null}

      {view === 'engine' ? <TrustEngine record={record} /> : null}

      {view === 'audit' ? (
        <div className="audit-view">
          <div className="audit-hero">
            <div className="audit-icon">
              <Icon name="history" />
            </div>
            <div>
              <p className="eyebrow">TRAZABILIDAD DEL CASO</p>
              <h3>Registro inmutable pendiente</h3>
              <p>
                En producción, cada lectura, nota y transición deberá registrar actor, momento,
                motivo y versión de política.
              </p>
            </div>
          </div>
          <ol className="audit-timeline">
            <li>
              <span className="timeline-dot mint-dot" />
              <div>
                <strong>Solicitud recibida</strong>
                <p>{record.submitted} · Caso sintético creado para esta demo</p>
              </div>
            </li>
            <li>
              <span className="timeline-dot violet-dot" />
              <div>
                <strong>Comprobación de formato</strong>
                <p>Sandbox · no consulta una fuente externa</p>
              </div>
            </li>
            <li>
              <span className="timeline-dot lock-dot" />
              <div>
                <strong>Revisión asignable</strong>
                <p>Requiere identidad de staff, permisos y bitácora persistente</p>
              </div>
            </li>
          </ol>
          <div className="audit-guard">
            <Icon name="lock" />
            <span>
              Las notas y decisiones quedan deshabilitadas hasta que exista control de acceso del
              equipo.
            </span>
          </div>
        </div>
      ) : null}

      <div className="detail-footer">
        <span className="footer-dot" /> Sin aprobación, underwriting ni emisión habilitados en este
        prototipo
      </div>
    </aside>
  );
}

export function ReviewConsole() {
  const [filter, setFilter] = useState<Filter>('Todos');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(DEMO_CASES[0]?.id ?? '');
  const [mobileDetail, setMobileDetail] = useState(false);

  const filteredCases = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    return DEMO_CASES.filter((item) => {
      const matchesFilter = filter === 'Todos' || item.urgency === filter;
      const matchesQuery =
        !normalized ||
        `${item.legalName} ${item.id} ${item.sector}`.toLocaleLowerCase('es').includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const selectedCase = filteredCases.find((item) => item.id === selectedId) ?? filteredCases[0];

  function selectCase(record: ReviewCase) {
    setSelectedId(record.id);
    setMobileDetail(true);
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <FondealoBrand />
        <div className="workspace-label">OPERACIONES</div>
        <nav className="side-nav" aria-label="Navegación interna">
          <a className="nav-link active" href="#queue">
            <Icon name="inbox" />
            <span>Expedientes KYB</span>
            <b>6</b>
          </a>
          <a
            className="nav-link disabled"
            href="#policy"
            aria-disabled="true"
            onClick={(event) => event.preventDefault()}
          >
            <Icon name="shield" />
            <span>Políticas</span>
            <em>Pronto</em>
          </a>
          <a
            className="nav-link disabled"
            href="#audit"
            aria-disabled="true"
            onClick={(event) => event.preventDefault()}
          >
            <Icon name="history" />
            <span>Registro de actividad</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="secure-mark">
            <span>⌑</span>
            <div>
              <strong>Entorno local</strong>
              <small>Solo datos sintéticos</small>
            </div>
          </div>
          <div className="build-label">KYB REVIEW · BUILD 0.1</div>
        </div>
      </aside>

      <main className="main-area" id="queue">
        <header className="topbar">
          <div className="crumbs">
            <span>Operaciones</span>
            <b>/</b>
            <strong>Expedientes KYB</strong>
          </div>
          <div className="topbar-right">
            <span className="local-pill">
              <span /> LOCAL
            </span>
            <div className="avatar-mini">OP</div>
            <div className="user-meta">
              <strong>Equipo de revisión</strong>
              <small>Acceso de demostración</small>
            </div>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                CENTRO DE REVISIÓN <span>·</span> MERIDIAN PROTOTYPE
              </p>
              <h1>Expedientes KYB</h1>
              <p className="page-subtitle">
                Una vista de operación para convertir evidencia en señales de confianza revisables.
              </p>
            </div>
            <div className="heading-side">
              <span className="live-indicator">
                <span /> DEMOSTRACIÓN CONTROLADA
              </span>
              <p>Datos sintéticos · sin conexión a servicios</p>
            </div>
          </div>

          <section className="demo-banner" aria-label="Aviso del prototipo local">
            <div className="demo-icon">!</div>
            <div>
              <strong>Prototipo local con información sintética</strong>
              <p>
                El Trust Engine ordena señales y guardas de política; no sustituye la revisión
                humana ni aprueba empresas.
              </p>
            </div>
            <span className="banner-label">SOLO LOCAL</span>
          </section>

          <section className="metrics-grid" aria-label="Resumen de la cola">
            <article className="metric-card">
              <div className="metric-label">
                En revisión <span className="metric-icon mint">◷</span>
              </div>
              <div className="metric-value">
                06 <span>expedientes</span>
              </div>
              <div className="metric-foot">
                <span className="metric-line" />
                Cola de demostración
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-label">
                Prioridad alta <span className="metric-icon amber">↗</span>
              </div>
              <div className="metric-value">
                02 <span>por revisar</span>
              </div>
              <div className="metric-foot">
                <span className="metric-pip amber-pip" />
                Ordenados por antigüedad
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-label">
                Tiempo de respuesta <span className="metric-icon blue">◴</span>
              </div>
              <div className="metric-value">
                1.4 <span>días promedio</span>
              </div>
              <div className="metric-foot">
                <span className="metric-pip blue-pip" />
                Métrica ilustrativa
              </div>
            </article>
            <article className="metric-card policy-card">
              <div className="metric-label">
                Trust Engine <span className="metric-icon violet">◇</span>
              </div>
              <div className="metric-value policy-value">Guardado</div>
              <div className="metric-foot">
                <span className="metric-pip violet-pip" />
                Política y fuente requeridas
              </div>
            </article>
          </section>

          <section className="queue-layout">
            <div className="queue-card">
              <div className="queue-top">
                <div>
                  <div className="queue-title-row">
                    <h2>Cola de revisión</h2>
                    <span className="queue-count">06</span>
                  </div>
                  <p>Solicitudes recibidas por Fondealo</p>
                </div>
                <button
                  className="export-button"
                  disabled
                  title="Disponible cuando exista una fuente de datos real"
                >
                  Exportar <span>↓</span>
                </button>
              </div>
              <div className="queue-controls">
                <div className="filter-tabs" role="tablist" aria-label="Filtrar expedientes">
                  {FILTERS.map((item) => (
                    <button
                      key={item}
                      role="tab"
                      aria-selected={filter === item}
                      className={filter === item ? 'selected' : ''}
                      onClick={() => setFilter(item)}
                    >
                      {item}
                      {item === 'Prioridad alta' && <span className="filter-number">2</span>}
                    </button>
                  ))}
                </div>
                <label className="search-box">
                  <Icon name="search" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar empresa o ID"
                    aria-label="Buscar empresa o expediente"
                  />
                  <kbd>⌘ K</kbd>
                </label>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>EMPRESA</th>
                      <th>RECIBIDO</th>
                      <th>ETAPA</th>
                      <th>PRIORIDAD</th>
                      <th aria-label="Abrir" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((record) => (
                      <tr
                        key={record.id}
                        className={selectedCase?.id === record.id ? 'row-selected' : ''}
                        onClick={() => selectCase(record)}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') selectCase(record);
                        }}
                      >
                        <td>
                          <div className="company-cell">
                            <span className="table-avatar">{initials(record.legalName)}</span>
                            <span>
                              <strong>{record.legalName}</strong>
                              <small>
                                {record.id} <i>·</i> {record.country}
                              </small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="received-time">{record.submitted}</span>
                          <small className="age-label">{record.age}</small>
                        </td>
                        <td>
                          <span
                            className={`stage-label ${record.stage === 'Pendiente de información' ? 'stage-waiting' : ''}`}
                          >
                            <span />
                            {record.stage}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`priority-label priority-${record.urgency === 'Prioridad alta' ? 'high' : record.urgency === 'En cola' ? 'normal' : 'low'}`}
                          >
                            <span />
                            {record.urgency}
                          </span>
                        </td>
                        <td>
                          <button className="row-open" aria-label={`Ver ${record.legalName}`}>
                            <Icon name="chevron" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCases.length === 0 && (
                  <div className="empty-state">
                    <span>⌕</span>
                    <strong>No encontramos expedientes</strong>
                    <p>Prueba con otro término o filtro.</p>
                  </div>
                )}
              </div>
              <div className="queue-footer">
                <span>
                  Mostrando <strong>{filteredCases.length}</strong> de 6 expedientes sintéticos
                </span>
                <div>
                  <button disabled aria-label="Página anterior">
                    ‹
                  </button>
                  <span>1</span>
                  <button disabled aria-label="Página siguiente">
                    ›
                  </button>
                </div>
              </div>
            </div>
            {selectedCase ? (
              <div className={`detail-wrap ${mobileDetail ? 'mobile-open' : ''}`}>
                <CaseDetails record={selectedCase} onClose={() => setMobileDetail(false)} />
              </div>
            ) : (
              <div className="detail-placeholder">
                <span>⌑</span>
                <strong>Selecciona un expediente</strong>
                <p>El detalle de revisión aparecerá aquí.</p>
              </div>
            )}
          </section>
          <footer className="page-footer">
            <span>FONDEALO INTERNAL TOOLS</span>
            <span>La decisión final de financiamiento corresponde al financiador.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
