'use client';
import { useAppTranslation } from './app-locale-provider';

import { useActionState } from 'react';
import { Button } from '@fondealo/ui';
import { requestDataDeletion, type DataRightsResult } from '@/lib/actions/data-rights';

const initialState: DataRightsResult | null = null;

export function DeletionRequestForm({ alreadyRequested }: { alreadyRequested: boolean }) {
  const t = useAppTranslation();
  const [state, formAction, pending] = useActionState(requestDataDeletion, initialState);
  const done = alreadyRequested || state?.ok === true;

  return (
    <form action={formAction} className="mt-4">
      <Button type="submit" variant="secondary" disabled={pending || done}>
        {pending
          ? t('Registrando…')
          : done
            ? t('Solicitud registrada')
            : t('Solicitar la eliminación de mis datos')}
      </Button>
      <p role="status" aria-live="polite" className="mt-2 text-sm">
        {state?.ok === true ? <span className="text-slate-700">{t(state.message)}</span> : null}
        {state?.ok === false ? <span className="text-red-600">{t.error(state.error)}</span> : null}
      </p>
    </form>
  );
}
