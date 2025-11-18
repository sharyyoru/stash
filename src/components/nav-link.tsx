"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  exact?: boolean;
};

export default function NavLink({ href, children, className = "", exact }: NavLinkProps) {
  const pathname = usePathname() || "/";
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const base = "transition-colors";
  const active = "stash-rainbow-text";
  const inactive = "hover:text-[#b08968]";

  const combined = `${base} ${isActive ? active : inactive} ${className}`.trim();

  return (
    <Link href={href} className={combined}>
      {children}
    </Link>
  );
}
