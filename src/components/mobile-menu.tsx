"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuLinks = [
  { href: "/just-landed", label: "New in" },
  { href: "/category/stickers", label: "Stickers" },
  { href: "/category/lifestyle", label: "Lifestyle" },
  { href: "/category/stationery", label: "Stationery" },
  { href: "/category/bundles", label: "Bundles" },
  { href: "/blog", label: "Blog" },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Hamburger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" />
          
          {/* Menu Panel */}
          <div
            className="absolute top-0 left-0 right-0 bg-white shadow-lg animate-in slide-in-from-top duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button at top */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <span className="text-sm font-semibold text-neutral-900">Menu</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700"
                aria-label="Close menu"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="px-4 py-4 space-y-1">
              {menuLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#f3b560]/20 text-[#b08968]"
                        : "text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {/* Secret Stash - Special rainbow link */}
              <Link
                href="/secret-stash"
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-2xl text-sm font-bold transition-opacity ${
                  pathname === "/secret-stash"
                    ? "bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100"
                    : "hover:bg-neutral-50 active:bg-neutral-100"
                } stash-rainbow-text`}
              >
                ✨ Secret Stash
              </Link>
              {/* Build - MOC Gallery */}
              <Link
                href="/build"
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-2xl text-sm font-bold transition-opacity ${
                  pathname === "/build" || pathname.startsWith("/build/")
                    ? "bg-amber-100 text-amber-700"
                    : "text-amber-600 hover:bg-neutral-50 active:bg-neutral-100"
                }`}
              >
                🧱 Build
              </Link>
            </nav>
            
            {/* Safe area padding for devices with notch */}
            <div className="h-4" />
          </div>
        </div>
      )}
    </>
  );
}
