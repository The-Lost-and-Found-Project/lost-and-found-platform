import Link from "next/link";
import ResendConfirmationForm from "@/components/ResendConfirmationForm";

type ConfirmationPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function ConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const { status } = await searchParams;
  const missing = status === "missing";

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-24 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white/90 p-8 text-center shadow-xl backdrop-blur">
          <h1 className="text-2xl font-bold text-gray-900">
            {missing ? "Confirmation link incomplete" : "Confirmation link unavailable"}
          </h1>
          <p className="mt-4 text-gray-600">
            {missing
              ? "This confirmation link is missing information."
              : "This confirmation link is invalid, expired, or has already been used."}
          </p>
          <p className="mt-3 text-sm text-gray-600">
            If you already confirmed your address, you can sign in. Otherwise,
            request a fresh confirmation email below.
          </p>
          <ResendConfirmationForm />
          <Link
            href="/login"
            className="mt-6 inline-block min-h-11 py-3 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
