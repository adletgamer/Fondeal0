import { ReviewConsole } from '@/components/review-console';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  if (process.env.NODE_ENV !== 'development') {
    return (
      <main className="locked-page">
        <div className="locked-card">
          <span className="brand-mark">f</span>
          <p className="eyebrow">FONDEALO · OPERACIONES</p>
          <h1>Prototipo disponible solo en desarrollo local</h1>
          <p>Esta consola usa casos sintéticos y no está habilitada para despliegue.</p>
        </div>
      </main>
    );
  }

  return <ReviewConsole />;
}
