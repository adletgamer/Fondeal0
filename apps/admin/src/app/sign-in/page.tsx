import { redirect } from 'next/navigation';
import { getStaffSession } from '@/lib/auth/staff';
import { CAPABILITIES } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * There is deliberately no form yet: a login screen that cannot log anyone in
 * is worse than none. Staff authentication arrives in the next increment.
 */
export default async function SignInPage() {
  if (await getStaffSession()) redirect('/');
  return (
    <main className="mx-auto grid min-h-screen max-w-md content-center gap-4 px-6">
      <p className="font-brand text-lg font-semibold tracking-tight">Fondealo</p>
      <h1 className="text-2xl font-semibold">Administración</h1>
      <p className="text-ink-muted">
        {CAPABILITIES.authenticatesStaff
          ? 'Inicia sesión con tu cuenta de personal.'
          : 'El acceso del personal aún no está configurado en este entorno. Nadie puede entrar todavía.'}
      </p>
    </main>
  );
}
