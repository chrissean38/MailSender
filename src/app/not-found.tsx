import Link from 'next/link';

export default function NotFoundPage() {
    return (
        <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
            <p className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                404
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Page not found</h1>
            <p className="mt-2 text-slate-600">
                The page you are looking for does not exist or may have been moved.
            </p>
            <Link
                href="/"
                className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
                Back to dashboard
            </Link>
        </div>
    );
}
