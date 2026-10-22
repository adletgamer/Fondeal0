import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md content-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">No encontramos ese caso</h1>
      <Link href="/" className="font-medium underline underline-offset-4">
        Volver a la cola
      </Link>
    </main>
  );
}
