import Link from "next/link";
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-indigo-500">404</h1>
        <p className="mt-4 text-xl text-slate-500">Page not found</p>
        <Link href="/dashboard" className="mt-6 inline-block rounded-xl bg-indigo-500 px-6 py-3 text-white hover:bg-indigo-600">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
