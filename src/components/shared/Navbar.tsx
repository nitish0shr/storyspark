"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Menu, X, BookOpen, Star } from "lucide-react";

interface NavbarUser {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}
interface NavbarProps {
  user?: NavbarUser | null;
}

const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL || "https://starmeestories.com";

const navLinks = [
  { label: "How It Works", href: `${MARKETING_URL}/#how-it-works` },
  { label: "Themes", href: `${MARKETING_URL}/#themes` },
  { label: "Pricing", href: `${MARKETING_URL}/#pricing` },
];

export default function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#FDF5E7]/95 backdrop-blur-md border-b-[2.5px] border-[#262625]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo — links back to the marketing site */}
          <a href={MARKETING_URL} className="flex items-center">
            <img
              src="https://starmeestories.com/wp-content/uploads/2026/04/Starmee-Logo-Primary.png"
              alt="Starmee Stories"
              className="h-10 w-auto"
            />
          </a>

          {/* Desktop nav — points to marketing site sections */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-body font-bold text-sm text-[#262625]/70 hover:text-[#5E17EB] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <button className="flex items-center gap-2 font-body font-bold text-sm text-[#262625]/70 hover:text-[#5E17EB] transition-colors px-3 py-2">
                    <BookOpen className="h-4 w-4" />
                    My Books
                  </button>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="font-body font-bold text-sm text-[#262625]/60 hover:text-[#5E17EB] transition-colors px-3 py-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <button className="font-body font-bold text-sm text-[#262625]/70 hover:text-[#5E17EB] transition-colors px-3 py-2">
                    Sign In
                  </button>
                </Link>
                <Link href="/create">
                  <button className="btn-chunky flex items-center gap-2 bg-[#FFDE59] text-[#262625] font-heading font-bold text-sm px-5 py-2.5">
                    <Star className="h-4 w-4 fill-[#262625]" />
                    Create Their Book
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl border-2 border-[#262625] bg-white shadow-[2px_2px_0px_#262625] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t-[2.5px] border-[#262625] bg-[#FDF5E7]">
          <div className="px-4 py-5 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl font-body font-bold text-sm text-[#262625] hover:bg-[#FFDE59]/40 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t-2 border-dashed border-[#262625]/20 space-y-2">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block">
                    <button className="w-full btn-chunky bg-white text-[#262625] font-heading font-bold text-sm px-5 py-3">
                      My Books
                    </button>
                  </Link>
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2.5 font-body font-bold text-sm text-[#262625]/60">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="block">
                    <button className="w-full btn-chunky bg-white text-[#262625] font-heading font-bold text-sm px-5 py-3">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/create" onClick={() => setMobileOpen(false)} className="block">
                    <button className="w-full btn-chunky flex items-center justify-center gap-2 bg-[#FFDE59] text-[#262625] font-heading font-bold text-sm px-5 py-3">
                      <Star className="h-4 w-4 fill-[#262625]" />
                      Create Their Book
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
