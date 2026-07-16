"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="mt-2 text-slate-500">{error.message}</p>
        <button onClick={reset} className="mt-4 rounded-xl bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600">
          Try again
        </button>
      </div>
    </div>
  );
}
