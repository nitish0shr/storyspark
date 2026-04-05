"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Menu, X, Sparkles, BookOpen } from "lucide-react";

interface NavbarUser {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}
interface NavbarProps {
  user?: NavbarUser | null;
}

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Themes", href: "#themes" },
  { label: "Pricing", href: "#pricing" },
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
    <nav className="sticky top-0 z-50 w-full bg-[#FFFBF0]/95 backdrop-blur-md border-b-[2.5px] border-[#1a1a2e]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#FFD166] border-2 border-[#1a1a2e] flex items-center justify-center shadow-[3px_3px_0px_#1a1a2e] group-hover:shadow-[1px_1px_0px_#1a1a2e] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all duration-150">
              <Sparkles className="h-4 w-4 text-[#1a1a2e]" />
            </div>
            <span className="font-heading text-xl font-bold text-[#1a1a2e]">
              Story<span className="text-[#7B2D8B]">Spark</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-body font-700 text-sm font-bold text-[#1a1a2e]/70 hover:text-[#7B2D8B] transition-colors"
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
                  <button className="flex items-center gap-2 font-body font-bold text-sm text-[#1a1a2e]/70 hover:text-[#7B2D8B] transition-colors px-3 py-2">
                    <BookOpen className="h-4 w-4" />
                    My Books
                  </button>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="font-body font-bold text-sm text-[#1a1a2e]/60 hover:text-coral-brand transition-colors px-3 py-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <button className="font-body font-bold text-sm text-[#1a1a2e]/70 hover:text-[#7B2D8B] transition-colors px-3 py-2">
                    Sign In
                  </button>
                </Link>
                <Link href="/create">
                  <button className="btn-chunky flex items-center gap-2 bg-[#FFD166] text-[#1a1a2e] font-heading font-bold text-sm px-5 py-2.5">
                    <Sparkles className="h-4 w-4" />
                    Create a Book
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl border-2 border-[#1a1a2e] bg-white shadow-[2px_2px_0px_#1a1a2e] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t-[2.5px] border-[#1a1a2e] bg-[#FFFBF0]">
          <div className="px-4 py-5 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl font-body font-bold text-sm text-[#1a1a2e] hover:bg-[#FFD166]/40 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t-2 border-dashed border-[#1a1a2e]/20 space-y-2">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block">
                    <button className="w-full btn-chunky bg-white text-[#1a1a2e] font-heading font-bold text-sm px-5 py-3">
                      My Books
                    </button>
                  </Link>
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2.5 font-body font-bold text-sm text-[#1a1a2e]/60">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="block">
                    <button className="w-full btn-chunky bg-white text-[#1a1a2e] font-heading font-bold text-sm px-5 py-3">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/create" onClick={() => setMobileOpen(false)} className="block">
                    <button className="w-full btn-chunky flex items-center justify-center gap-2 bg-[#FFD166] text-[#1a1a2e] font-heading font-bold text-sm px-5 py-3">
                      <Sparkles className="h-4 w-4" />
                      Create a Book
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
