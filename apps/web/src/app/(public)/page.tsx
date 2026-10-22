import { LandingPage, landingMetadata } from '@/components/landing/landing-page';

export const metadata = landingMetadata('es');

export default function Home() {
  return <LandingPage locale="es" />;
}
