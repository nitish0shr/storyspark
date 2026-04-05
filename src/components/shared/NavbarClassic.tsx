"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sparkles, Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";

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

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email
      ? user.email[0].toUpperCase()
      : "U";

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#0D0720]/80 backdrop-blur-xl border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-white">
              StorySpark
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="cursor-pointer ring-2 ring-violet-100 hover:ring-violet-200 transition-all">
                    {user.avatarUrl && (
                      <AvatarImage src={user.avatarUrl} alt={user.name || "User"} />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-[#7C3AED] to-[#EC4899] text-white text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
                  <div className="px-2 py-1.5">
                    {user.name && (
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    )}
                    {user.email && (
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push("/dashboard")}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2 text-gray-500" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push("/dashboard")}
                  >
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className="text-sm font-medium text-white/70 hover:text-white hover:bg-white/10"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/create">
                  <Button className="rounded-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-400 hover:to-pink-400 text-white font-semibold text-sm px-5 shadow-lg shadow-violet-900/40 transition-all duration-200 border-0">
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    Create Your Book
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0D0720]">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                {link.label}
              </a>
            ))}

            <div className="pt-3 border-t border-white/10">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <Avatar size="sm">
                      {user.avatarUrl && (
                        <AvatarImage src={user.avatarUrl} alt={user.name || "User"} />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-[#7C3AED] to-[#EC4899] text-white text-xs font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      {user.name && (
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </p>
                      )}
                      {user.email && (
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#7C3AED] hover:bg-violet-50 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#7C3AED] hover:bg-violet-50 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Account
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="space-y-2 px-3">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full"
                  >
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-white/20 text-white/80 hover:bg-white/10 font-medium bg-transparent"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link
                    href="/create"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full"
                  >
                    <Button className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold shadow-lg border-0">
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      Create Your Book
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
