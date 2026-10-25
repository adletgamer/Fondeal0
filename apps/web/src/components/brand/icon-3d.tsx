import Image from 'next/image';
import type { Locale } from '@/components/landing/content';

/**
 * The 3D glass tier of the icon system (docs/brand/identity.md §7): raster
 * objects on a lit pedestal, cut from the "Visual System 01" sheet. For
 * landing, onboarding and empty states at 96px and up; the UI uses the line
 * icons in @fondealo/ui. Sources are about 300px square, so keep them at
 * 150 CSS px or less to stay sharp on 2x screens.
 */
export const ICONS_3D = {
  company: { es: 'Empresa', en: 'Company' },
  identity: { es: 'Identidad', en: 'Identity' },
  documents: { es: 'Documentos', en: 'Documents' },
  activity: { es: 'Actividad', en: 'Activity' },
  payments: { es: 'Pagos', en: 'Payments' },
  share: { es: 'Compartir', en: 'Share' },
  funder: { es: 'Fondo o inversionista', en: 'Investor or fund' },
  accelerator: { es: 'Aceleradora', en: 'Accelerator' },
  permissions: { es: 'Permisos', en: 'Permissions' },
  reputation: { es: 'Reputación', en: 'Reputation' },
  history: { es: 'Historial', en: 'History' },
  settings: { es: 'Ajustes', en: 'Settings' },
} as const satisfies Record<string, Record<Locale, string>>;

export type Icon3DName = keyof typeof ICONS_3D;

export const ICON_3D_MAX = 150;

export function icon3dSrc(name: Icon3DName) {
  return `/brand/3d/${name}.webp`;
}

/**
 * Decorative by default (`alt=""`), since a label always sits next to it.
 * Pass `label` when the icon stands alone and carries meaning.
 */
export function Icon3D({
  name,
  size = 96,
  label,
  className,
  priority = false,
}: {
  name: Icon3DName;
  size?: number;
  label?: string;
  className?: string;
  priority?: boolean;
}) {
  const s = Math.min(size, ICON_3D_MAX);
  return (
    <Image
      src={icon3dSrc(name)}
      alt={label ?? ''}
      width={s}
      height={s}
      priority={priority}
      className={className}
      draggable={false}
      // Already WebP at native size; the optimizer would re-encode to JPEG
      // (no alpha) for clients that don't advertise WebP.
      unoptimized
    />
  );
}

/** The hero form of the logo: the 3D glass badge (512px source). */
export function BrandBadge3D({
  size = 160,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/3d/badge.webp"
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={className}
      draggable={false}
      // Already WebP at native size; the optimizer would re-encode to JPEG
      // (no alpha) for clients that don't advertise WebP.
      unoptimized
    />
  );
}
