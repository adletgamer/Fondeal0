import { LandingPage, landingMetadata } from '@/components/landing/landing-page';

export const metadata = landingMetadata('en');

export default function HomeEn() {
  return <LandingPage locale="en" />;
}
