/**
 * Staff session cookie. The `__Host-` prefix makes browsers require Secure,
 * Path=/ and no Domain, so a sibling subdomain cannot set or shadow it.
 */
export const STAFF_COOKIE_NAME =
  process.env.NODE_ENV === 'production' ? '__Host-fdo-staff' : 'fdo-staff';
