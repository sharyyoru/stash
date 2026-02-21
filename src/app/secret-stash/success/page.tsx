import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";

export default async function SecretStashSuccessPage({
  searchParams,
}: {
  searchParams?: { session_id?: string };
}) {
  const session = await getServerSession(authOptions);
  const firstName =
    typeof session?.user?.name === "string"
      ? session.user.name.split(" ")[0]
      : "friend";

  return (
    <div className="bg-[#fdf8f3] min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="space-y-6">
          {/* Success Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              Welcome to the Club! ✨
            </h1>
            <p className="text-lg text-neutral-600">
              Thank you for joining the Secret Stash Mail Club, {firstName}!
            </p>
          </div>

          {/* Info Box */}
          <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            <div className="space-y-4 text-sm text-neutral-700">
              <p>
                Your subscription is now active. You'll receive your first
                curated stationery package at the end of this month.
              </p>
              <p>
                We've sent a confirmation email to{" "}
                <strong>{session?.user?.email || "your inbox"}</strong> with all
                the details.
              </p>
              <div className="rounded-2xl bg-[#4eb8d5]/10 p-4">
                <p className="font-medium text-[#4eb8d5]">
                  What happens next?
                </p>
                <ul className="mt-2 space-y-1 text-neutral-600">
                  <li>• Your package will ship on the 30th of each month</li>
                  <li>• Expect surprises you won't find anywhere else</li>
                  <li>• Manage your subscription in your profile</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-3 pt-4">
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
            >
              View My Subscription
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
