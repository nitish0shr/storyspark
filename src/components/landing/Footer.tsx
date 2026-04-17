import Link from "next/link";
import { Sparkles, Mail, Star, Heart } from "lucide-react";

const footerLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

function StarBurst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 50 50" className={className} fill="currentColor">
      <polygon points="25,2 29,20 47,20 33,31 38,49 25,38 12,49 17,31 3,20 21,20" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer>
      {/* CTA section — purple wave background */}
      <div className="relative bg-[#C3B1E1] border-t-[2.5px] border-[#1a1a2e] overflow-hidden py-20 sm:py-28">
        {/* Decorative elements */}
        <div className="absolute top-8 left-8 animate-float opacity-70">
          <StarBurst className="w-10 h-10 text-[#7B2D8B]" />
        </div>
        <div className="absolute top-12 right-10 animate-float-reverse opacity-60" style={{ animationDelay: "1s" }}>
          <Heart className="w-8 h-8 text-[#FF6B6B] fill-[#FF6B6B]" />
        </div>
        <div className="absolute bottom-10 left-1/4 animate-float opacity-50" style={{ animationDelay: "2s" }}>
          <Star className="w-7 h-7 text-[#FFD166] fill-[#FFD166]" />
        </div>
        <div className="absolute bottom-8 right-1/4 animate-spin-slow opacity-40">
          <StarBurst className="w-8 h-8 text-[#FF9F1C]" />
        </div>

        {/* Polka dots */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #1a1a2e 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Stars */}
          <div className="flex justify-center gap-1.5 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-[#FF9F1C] fill-[#FF9F1C]" />
            ))}
          </div>

          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a1a2e] mb-5 leading-tight">
            Every kid deserves to be{" "}
            <span className="text-[#7B2D8B]">the hero</span>{" "}
            of their own story! 🌟
          </h2>

          <p className="font-body text-lg text-[#1a1a2e]/70 mb-10 max-w-lg mx-auto">
            Create a magical, personalized storybook your child will treasure
            forever. Free preview — no credit card needed!
          </p>

          <Link href="/create">
            <button className="btn-chunky inline-flex items-center gap-3 bg-[#FFD166] text-[#1a1a2e] font-heading font-bold text-xl px-10 py-5">
              <Sparkles className="h-6 w-6" />
              Make Their Book — Free Preview!
            </button>
          </Link>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {["⚡ Ready in 2 minutes", "🔒 Photo stays private", "💯 30-day guarantee"].map((item) => (
              <span key={item} className="font-body font-bold text-sm text-[#1a1a2e]/60">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#1a1a2e] border-t-[2.5px] border-[#1a1a2e]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#FFD166] border-2 border-[#FFD166]/40 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-[#1a1a2e]" />
              </div>
              <span className="font-heading text-xl font-bold text-white">
                Star<span className="text-[#FFD166]">mee</span>
              </span>
            </Link>

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-body text-sm text-white/50 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Email */}
            <a
              href="mailto:hello@starmee.com"
              className="flex items-center gap-2 font-body text-sm text-white/50 hover:text-white transition-colors"
            >
              <Mail className="h-4 w-4" />
              hello@starmee.com
            </a>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
            <p>&copy; {new Date().getFullYear()} Starmee. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              Made with <Heart className="h-3 w-3 text-[#FF6B6B] fill-[#FF6B6B]" /> for
              families everywhere
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
