import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Monda } from "next/font/google";
import { getServerSession } from "next-auth";
import { sanityClient } from "../sanity/client";
import { latestProductsQuery } from "../sanity/queries";
import SearchButton from "../components/search-button";
import SignInButton from "../components/sign-in-button";
import NavLink from "../components/nav-link";
import { CartProvider } from "../components/cart-context";
import CartButton from "../components/cart-button";
import AuthSessionProvider from "../components/auth-session-provider";
import TrackOrderButton from "../components/track-order-button";
import { authOptions } from "./api/auth/[...nextauth]/route";
import "./globals.css";

const monda = Monda({
  variable: "--font-monda",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Stash | Stationery & Stickers",
  description:
    "Stash is a curated shop for stationery and stickers. Build a desk setup you actually want to sit at.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [searchData, session] = await Promise.all([
    sanityClient.fetch(latestProductsQuery).catch(() => []),
    getServerSession(authOptions),
  ]);
  const searchSuggestions = Array.isArray(searchData)
    ? searchData.slice(0, 4)
    : [];
  return (
    <html lang="en">
      <body
        className={`${monda.variable} antialiased bg-neutral-50 text-neutral-900`}
      >
        <AuthSessionProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col">
              <SiteHeader searchSuggestions={searchSuggestions} session={session} />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </CartProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

type SiteHeaderProps = {
  searchSuggestions: any[];
  session: any | null;
};

function SiteHeader({ searchSuggestions, session }: SiteHeaderProps) {
  const firstName =
    typeof session?.user?.name === "string"
      ? session.user.name.split(" ")[0]
      : undefined;
  const signInLabel = firstName ? "Profile" : "Sign in";
  const stashLabel = firstName ? `${firstName}'s Stash` : "My Stash";
  const avatarImage =
    typeof session?.user?.image === "string" ? session.user.image : undefined;
  const avatarInitial = firstName
    ? firstName.charAt(0).toUpperCase()
    : undefined;
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="bg-[#fff3c4] text-xs text-black">
        <div className="mx-auto flex h-9 max-w-6xl items-center justify-between px-4">
          <p className="hidden md:inline">
            Free UAE shipping over AED 200 · New desk drop live now.
          </p>
          <div className="flex flex-1 items-center justify-between gap-4 md:flex-none md:justify-end">
            <p className="md:hidden">Stash · Stationery &amp; Stickers</p>
            <div className="flex items-center gap-4 text-neutral-800">
              <TrackOrderButton />
              <Link
                href="#"
                className="transition-colors hover:text-[#b08968]"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="sr-only">Stash home</span>
            <Image
              src="/logo-stash.png"
              alt="Stash"
              width={140}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-700 md:flex">
            <NavLink href="/just-landed">New in</NavLink>
            <NavLink href="/category/stickers">Stickers</NavLink>
            <NavLink href="/category/stationery">Stationery</NavLink>
            <NavLink href="/category/bundles">Bundles</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <SearchButton suggestions={searchSuggestions} />
          <SignInButton
            label={signInLabel}
            isSignedIn={Boolean(session?.user)}
            avatarImage={avatarImage}
            avatarInitial={avatarInitial}
            className="inline-flex h-9 items-center rounded-full border border-neutral-200 bg-white px-4 text-xs font-medium text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
          />
          <CartButton label={stashLabel} />
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="relative mx-auto max-w-6xl px-4 py-10 overflow-hidden">
        <div
          className="pointer-events-none absolute top-0 right-0 h-40 w-40 rounded-full opacity-70 blur-2xl stash-footer-brown-accent"
          aria-hidden="true"
        />
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-stash.png"
              alt="Stash"
              width={420}
              height={120}
              className="h-20 w-auto"
            />
          </div>
          <p className="max-w-sm text-sm text-neutral-500">
            Stationery and stickers designed to make your desk the favourite
            corner of your day.
          </p>
        </div>

        <div className="mt-8 grid gap-10 md:grid-cols-3">
          <div className="space-y-3 text-sm">
            <p className="font-medium text-neutral-900">Shop</p>
            <ul className="space-y-1 text-neutral-500">
              <li>
                <NavLink href="/just-landed">New in</NavLink>
              </li>
              <li>
                <NavLink href="/category/stickers">Stickers</NavLink>
              </li>
              <li>
                <NavLink href="/category/stationery">Stationery</NavLink>
              </li>
              <li>
                <NavLink href="/category/bundles">Bundles</NavLink>
              </li>
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <p className="font-medium text-neutral-900">Support</p>
            <ul className="space-y-1 text-neutral-500">
              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-[#b08968]"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-[#b08968]"
                >
                  Shipping &amp; returns
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-[#b08968]"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-[#b08968]"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <p className="font-medium text-neutral-900">Socials</p>
            <ul className="space-y-1 text-neutral-500">
              <li>
                <Link
                  href="#"
                  className="flex items-center gap-2 transition-colors hover:text-[#b08968]"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="4" y="4" width="16" height="16" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17" cy="7" r="0.8" />
                  </svg>
                  <span>Instagram</span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="flex items-center gap-2 hover:text-neutral-900"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 8h3V6.2C12 4.4 13.1 3 15.7 3c1 0 1.8.1 2.1.1v2.6h-1.4c-1.1 0-1.4.5-1.4 1.3V8h2.8l-.4 2.8h-2.4V21h-3.1v-10H9V8z" />
                  </svg>
                  <span>Facebook</span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="flex items-center gap-2 hover:text-neutral-900"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M16.5 3h3v6.8c0 3.9-2.8 6.7-6.7 6.7-3.5 0-6.3-2.5-6.7-5.8l3-.4c.2 1.6 1.6 2.9 3.3 2.9 1.9 0 3.4-1.4 3.4-3.9V8.6c-.6.1-1.2 0-1.8-.2a4.3 4.3 0 0 1-1.4-.9A4 4 0 0 1 11 5.1V3.2h3v1.7c0 .6.3 1.2.7 1.6.4.4 1 .6 1.6.6h.2V3z" />
                  </svg>
                  <span>TikTok</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-dashed border-neutral-200 pt-4 text-xs text-neutral-500 md:flex-row">
          <p>© {new Date().getFullYear()} Stash. All rights reserved.</p>
          <p>Made for people who hoard nice paper.</p>
        </div>
      </div>
    </footer>
  );
}
