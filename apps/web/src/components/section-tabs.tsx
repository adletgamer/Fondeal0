import Link from 'next/link';
import { Container } from '@fondealo/ui';

export function SectionTabs({
  tabs,
  active,
}: {
  tabs: { href: string; label: string }[];
  active: string;
}) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <Container>
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.href === active;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`shrink-0 border-b-2 px-4 py-3.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </Container>
    </div>
  );
}
