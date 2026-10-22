import { Badge } from '@fondealo/ui';
import { STATUS_LABEL } from '@/lib/kyb/states';
import type { CaseStatus } from '@/lib/kyb/types';

const VARIANT = {
  Received: 'neutral',
  InReview: 'info',
  NeedsInformation: 'gold',
  Approved: 'brand',
  Rejected: 'danger',
  ReviewDue: 'gold',
} as const satisfies Record<CaseStatus, 'neutral' | 'info' | 'gold' | 'brand' | 'danger'>;

export function StatusChip({ status }: { status: CaseStatus }) {
  return (
    <Badge variant={VARIANT[status]} dot="static">
      {STATUS_LABEL[status]}
    </Badge>
  );
}
